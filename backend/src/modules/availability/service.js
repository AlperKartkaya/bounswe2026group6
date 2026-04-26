const {
  findVolunteerByUserId,
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
      await runAssignmentCycle();
      assignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    } else {
      assignment = existingAssignment;
    }
  } else {
    // If volunteer just became unavailable, cancel their active assignments
    const activeAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
    if (activeAssignment) {
      await cancelAssignment(activeAssignment.assignment_id);
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
    await runAssignmentCycle();
    currentAssignment = await getAssignmentByVolunteerId(volunteer.volunteer_id);
  } else if (!updatedVolunteer.is_available && currentAssignment) {
    // If volunteer is now unavailable, cancel their active assignment
    await cancelAssignment(currentAssignment.assignment_id);
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

  await cancelAssignment(assignmentId);
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
