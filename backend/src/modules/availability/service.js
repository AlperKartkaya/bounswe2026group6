const {
  findVolunteerByUserId,
  findVolunteerById,
  createVolunteer,
  updateVolunteerAvailability,
  createAvailabilityRecord,
  findAvailableVolunteersForMatching,
  findMatchingRequestForVolunteer,
  findMatchingVolunteerForRequest,
  createAssignment,
  markRequestAssignedIfPending,
  syncRequestStatusPreservingInProgress,
  getAssignmentByVolunteerId,
  getAssignmentById,
  findActiveAssignmentsByRequestId,
  cancelAssignment,
} = require('./repository');
const { createNotification } = require('../notifications/service');

async function notifyRequestStatusIfUserOwned(requestRow, actorUserId) {
  if (!requestRow || !requestRow.user_id) {
    return;
  }

  const status = (requestRow.status || '').toUpperCase();
  if (!['ASSIGNED', 'RESOLVED', 'PENDING', 'CANCELLED'].includes(status)) {
    return;
  }

  let body = `Your request status is now ${status}.`;
  if (status === 'ASSIGNED') {
    body = 'A volunteer has been assigned to your help request.';
  } else if (status === 'RESOLVED') {
    body = 'Your help request has been marked as resolved.';
  } else if (status === 'PENDING') {
    body = 'Your help request is pending reassignment.';
  }

  try {
    await createNotification({
      recipientUserId: requestRow.user_id,
      actorUserId: actorUserId || null,
      type: 'HELP_REQUEST_STATUS_CHANGED',
      title: 'Help request status updated',
      body,
      entity: {
        type: 'HELP_REQUEST',
        id: requestRow.request_id,
      },
      data: {
        screen: 'my-help-requests',
        requestId: requestRow.request_id,
        internalStatus: status,
      },
    });
  } catch (error) {
    console.error('availability.notifyRequestStatusIfUserOwned failed', error);
  }
}

async function notifyVolunteerTaskAssigned(volunteerUserId, requestId, actorUserId) {
  if (!volunteerUserId || !requestId) {
    return;
  }

  try {
    await createNotification({
      recipientUserId: volunteerUserId,
      actorUserId: actorUserId || null,
      type: 'TASK_ASSIGNED',
      title: 'New help request assigned',
      body: 'A help request has been matched to you.',
      entity: {
        type: 'HELP_REQUEST',
        id: requestId,
      },
      data: {
        screen: 'assignment',
        requestId,
        kind: 'helper_assignment',
      },
    });
  } catch (error) {
    console.error('availability.notifyVolunteerTaskAssigned failed', error);
  }
}

async function notifyVolunteerTaskUpdated(volunteerUserId, requestId, actorUserId, reason) {
  if (!volunteerUserId || !requestId) {
    return;
  }

  try {
    await createNotification({
      recipientUserId: volunteerUserId,
      actorUserId: actorUserId || null,
      type: 'TASK_UPDATED',
      title: 'Assigned request updated',
      body: 'An assigned help request has changed status.',
      entity: {
        type: 'HELP_REQUEST',
        id: requestId,
      },
      data: {
        screen: 'assignment',
        requestId,
        kind: 'helper_assignment_update',
        reason: reason || 'updated',
      },
    });
  } catch (error) {
    console.error('availability.notifyVolunteerTaskUpdated failed', error);
  }
}

async function runAssignmentCycle() {
  const availableVolunteers = await findAvailableVolunteersForMatching();
  const sortedVolunteers = [...availableVolunteers].sort((leftVolunteer, rightVolunteer) => {
    if (leftVolunteer.is_first_aid_capable !== rightVolunteer.is_first_aid_capable) {
      return leftVolunteer.is_first_aid_capable ? -1 : 1;
    }

    const leftUpdatedAt = leftVolunteer.location_updated_at
      ? new Date(leftVolunteer.location_updated_at).getTime()
      : null;
    const rightUpdatedAt = rightVolunteer.location_updated_at
      ? new Date(rightVolunteer.location_updated_at).getTime()
      : null;

    if (leftUpdatedAt === null && rightUpdatedAt !== null) {
      return 1;
    }

    if (leftUpdatedAt !== null && rightUpdatedAt === null) {
      return -1;
    }

    if (leftUpdatedAt !== rightUpdatedAt) {
      return (rightUpdatedAt || 0) - (leftUpdatedAt || 0);
    }

    return leftVolunteer.volunteer_id.localeCompare(rightVolunteer.volunteer_id);
  });
  const createdAssignments = [];

  for (const volunteer of sortedVolunteers) {
    const matchingRequest = await findMatchingRequestForVolunteer(volunteer.volunteer_id);

    if (!matchingRequest) {
      continue;
    }

    const assignment = await createAssignment(volunteer.volunteer_id, matchingRequest.request_id);
    if (!assignment) {
      continue;
    }

    await markRequestAssignedIfPending(matchingRequest.request_id);
    createdAssignments.push(assignment);
  }

  return createdAssignments;
}

async function syncRequestStatusFromAssignments(requestId) {
  await syncRequestStatusPreservingInProgress(requestId);
  return findActiveAssignmentsByRequestId(requestId);
}

async function setAvailability(userId, { isAvailable, latitude, longitude }) {
  let volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    volunteer = await createVolunteer(userId);
  }

  const updatedVolunteer = await updateVolunteerAvailability(
    volunteer.volunteer_id,
    isAvailable,
    latitude,
    longitude
  );

  // Log to availability_records
  await createAvailabilityRecord(volunteer.volunteer_id, isAvailable, false);

  let assignment = null;
  // If volunteer just became available, try to match them with a request
  if (isAvailable) {
    const existingAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    if (!existingAssignment) {
      const matchingRequest = await findMatchingRequestForVolunteer(volunteer.volunteer_id);
      if (matchingRequest) {
        assignment = await createAssignment(volunteer.volunteer_id, matchingRequest.request_id);
        const updatedRequest = await updateRequestStatus(matchingRequest.request_id, 'ASSIGNED');
        await notifyRequestStatusIfUserOwned(updatedRequest, userId);
        await notifyVolunteerTaskAssigned(volunteer.user_id, matchingRequest.request_id, userId);
        // Refresh assignment with full data
        assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
      }
      await runAssignmentCycle();
      assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    } else {
      assignment = existingAssignment;
    }
  } else {
    // If volunteer just became unavailable, cancel their active assignments
    const activeAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    if (activeAssignment) {
      await notifyVolunteerTaskUpdated(volunteer.user_id, activeAssignment.request_id, userId, 'volunteer_unavailable');
      await cancelAssignment(activeAssignment.assignment_id);
      const updatedRequest = await updateRequestStatus(activeAssignment.request_id, 'PENDING');
      await notifyRequestStatusIfUserOwned(updatedRequest, userId);
      await syncRequestStatusFromAssignments(activeAssignment.request_id);
      await runAssignmentCycle();
    }
  }

  return {
    volunteer: updatedVolunteer,
    assignment,
  };
}

async function syncAvailability(userId, { records }) {
  let volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    volunteer = await createVolunteer(userId);
  }

  // For MVP, we just store the sync records and set the latest status
  if (records.length > 0) {
    // Sort by timestamp to find the latest
    const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = sortedRecords[0];

    await updateVolunteerAvailability(
      volunteer.volunteer_id,
      latest.isAvailable,
      null,
      null
    );

    for (const record of records) {
      await createAvailabilityRecord(volunteer.volunteer_id, record.isAvailable, true);
    }
  }

  const updatedVolunteer = await findVolunteerByUserId(userId);
  let currentAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);

  // If volunteer is now available and has no assignment, try to match
  if (updatedVolunteer.is_available && !currentAssignment) {
    const matchingRequest = await findMatchingRequestForVolunteer(volunteer.volunteer_id);
    if (matchingRequest) {
      await createAssignment(volunteer.volunteer_id, matchingRequest.request_id);
      const updatedRequest = await updateRequestStatus(matchingRequest.request_id, 'ASSIGNED');
      await notifyRequestStatusIfUserOwned(updatedRequest, userId);
      await notifyVolunteerTaskAssigned(volunteer.user_id, matchingRequest.request_id, userId);
      currentAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    }
    await runAssignmentCycle();
    currentAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  } else if (!updatedVolunteer.is_available && currentAssignment) {
    // If volunteer is now unavailable, cancel their active assignment
    await notifyVolunteerTaskUpdated(volunteer.user_id, currentAssignment.request_id, userId, 'sync_marked_unavailable');
    await cancelAssignment(currentAssignment.assignment_id);
    const updatedRequest = await updateRequestStatus(currentAssignment.request_id, 'PENDING');
    await notifyRequestStatusIfUserOwned(updatedRequest, userId);
    await syncRequestStatusFromAssignments(currentAssignment.request_id);
    await runAssignmentCycle();
    currentAssignment = null;
  }

  return {
    volunteer: updatedVolunteer,
    assignment: currentAssignment,
  };
}

async function getMyAssignment(userId) {
  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    const error = new Error('Volunteer record not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  return { assignment };
}

async function cancelMyAssignment(userId, { assignmentId }) {
  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    const error = new Error('Volunteer record not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment || assignment.volunteer_id !== volunteer.volunteer_id) {
    const error = new Error('Assignment not found or not owned by user');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await notifyVolunteerTaskUpdated(userId, assignment.request_id, userId, 'volunteer_cancelled_assignment');
  await cancelAssignment(assignmentId);
  const updatedRequest = await updateRequestStatus(assignment.request_id, 'PENDING'); // Put it back to pending for re-assignment
  await notifyRequestStatusIfUserOwned(updatedRequest, userId);
  await syncRequestStatusFromAssignments(assignment.request_id);

  // Volunteer becomes unavailable
  await updateVolunteerAvailability(volunteer.volunteer_id, false, volunteer.last_known_latitude, volunteer.last_known_longitude);
  await createAvailabilityRecord(volunteer.volunteer_id, false, false);

  // Auto-assign the request to someone else if possible
  await runAssignmentCycle();

  return { 
    message: 'Assignment cancelled, you are now unavailable, and matching has been refreshed',
    volunteerStatus: 'UNAVAILABLE'
  };
}

async function cancelAssignmentByRequestId(requestId) {
  const assignment = await findAssignmentByRequestId(requestId);
  if (assignment) {
    const assignedVolunteer = await findVolunteerById(assignment.volunteer_id);
    await notifyVolunteerTaskUpdated(
      assignedVolunteer ? assignedVolunteer.user_id : null,
      requestId,
      null,
      'assignment_cancelled_by_request_update',
    );
    await cancelAssignment(assignment.assignment_id);
    // Volunteer remains available, and they are now free for new assignments
    // We could try to assign them a new request immediately
    const newRequest = await findMatchingRequestForVolunteer(assignment.volunteer_id);
    if (newRequest) {
      await createAssignment(assignment.volunteer_id, newRequest.request_id);
      const updatedRequest = await updateRequestStatus(newRequest.request_id, 'ASSIGNED');
      await notifyRequestStatusIfUserOwned(updatedRequest, null);
      await notifyVolunteerTaskAssigned(
        assignedVolunteer ? assignedVolunteer.user_id : null,
        newRequest.request_id,
        null,
      );
    }
  const assignments = await findActiveAssignmentsByRequestId(requestId);

  for (const assignment of assignments) {
    await cancelAssignment(assignment.assignment_id);
  }

  if (assignments.length > 0) {
    await runAssignmentCycle();
  }
}

async function resolveMyAssignment(userId, { requestId }) {
  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    const error = new Error('Volunteer record not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  if (!assignment || assignment.request_id !== requestId) {
    const error = new Error('Active assignment for this request not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const updatedRequest = await updateRequestStatus(requestId, 'RESOLVED');
  await notifyRequestStatusIfUserOwned(updatedRequest, userId);
  await notifyVolunteerTaskUpdated(userId, requestId, userId, 'volunteer_resolved_assignment');

  // Try to find a NEW assignment for this volunteer
  const newAssignment = await findMatchingRequestForVolunteer(volunteer.volunteer_id);
  let assignmentResult = null;
  if (newAssignment) {
    await createAssignment(volunteer.volunteer_id, newAssignment.request_id);
    const reassignedRequest = await updateRequestStatus(newAssignment.request_id, 'ASSIGNED');
    await notifyRequestStatusIfUserOwned(reassignedRequest, userId);
    assignmentResult = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  }
  await cancelAssignment(assignment.assignment_id);
  await syncRequestStatusFromAssignments(requestId);

  await updateVolunteerAvailability(
    volunteer.volunteer_id,
    false,
    volunteer.last_known_latitude,
    volunteer.last_known_longitude,
  );
  await createAvailabilityRecord(volunteer.volunteer_id, false, false);

  await runAssignmentCycle();

  return { 
    message: 'Assignment resolved for this volunteer, you are now unavailable, and matching has been refreshed',
    newAssignment: null
  };
}

async function getAvailabilityStatus(userId) {
  let volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    // If volunteer record doesn't exist, they are not available by default
    // We could create one, but it's cleaner to just return false if it doesn't exist yet
    return {
      isAvailable: false,
      volunteer: null,
      assignment: null
    };
  }

  const assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  
  return {
    isAvailable: volunteer.is_available,
    volunteer,
    assignment
  };
}

async function tryToAssignRequest(requestId) {
  const matchingVolunteer = await findMatchingVolunteerForRequest(requestId);
  if (matchingVolunteer) {
    await createAssignment(matchingVolunteer.volunteer_id, requestId);
    const updatedRequest = await updateRequestStatus(requestId, 'ASSIGNED');
    await notifyRequestStatusIfUserOwned(updatedRequest, matchingVolunteer.user_id);
    await notifyVolunteerTaskAssigned(matchingVolunteer.user_id, requestId, matchingVolunteer.user_id);
    return true;
  while (true) {
    const volunteer = await findMatchingVolunteerForRequest(requestId);

    if (!volunteer) {
      break;
    }

    const assignment = await createAssignment(volunteer.volunteer_id, requestId);

    if (!assignment) {
      break;
    }

    await markRequestAssignedIfPending(requestId);
  }

  const activeAssignments = await findActiveAssignmentsByRequestId(requestId);
  return activeAssignments.length > 0;
}

module.exports = {
  setAvailability,
  syncAvailability,
  getMyAssignment,
  cancelMyAssignment,
  resolveMyAssignment,
  getAvailabilityStatus,
  tryToAssignRequest,
  cancelAssignmentByRequestId,
};
