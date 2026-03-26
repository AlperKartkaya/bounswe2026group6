const {
  findActiveUserById,
  findVolunteerByUserId,
  createVolunteer,
  updateVolunteerByUserId,
  createAvailabilityRecord,
  findLatestAvailabilityRecord,
  findActiveAssignmentByVolunteerId,
  listAssignableHelpRequests,
  createAssignment,
  markHelpRequestAssigned,
  setAssignmentCancelled,
  markHelpRequestPending,
  markHelpRequestResolved,
} = require('./repository');

function mapAvailability(volunteer, latestRecord) {
  if (!volunteer) {
    return {
      volunteerId: null,
      userId: null,
      isAvailable: false,
      skills: [],
      needTypes: [],
      lastKnownLatitude: null,
      lastKnownLongitude: null,
      locationUpdatedAt: null,
      syncStatus: 'SYNCED',
      storedLocally: false,
    };
  }

  return {
    volunteerId: volunteer.volunteer_id,
    userId: volunteer.user_id,
    isAvailable: volunteer.is_available,
    skills: volunteer.skills || [],
    needTypes: volunteer.need_types || [],
    lastKnownLatitude: volunteer.last_known_latitude,
    lastKnownLongitude: volunteer.last_known_longitude,
    locationUpdatedAt: volunteer.location_updated_at,
    syncStatus: latestRecord && latestRecord.stored_locally ? 'PENDING_SYNC' : 'SYNCED',
    storedLocally: latestRecord ? latestRecord.stored_locally : false,
  };
}

function mapSnapshot(volunteer, latestRecord, assignment) {
  return {
    availability: mapAvailability(volunteer, latestRecord),
    assignment,
  };
}

function computeDistance(volunteer, candidate) {
  if (
    volunteer.last_known_latitude == null ||
    volunteer.last_known_longitude == null ||
    candidate.latitude == null ||
    candidate.longitude == null
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const latDiff = volunteer.last_known_latitude - candidate.latitude;
  const lonDiff = volunteer.last_known_longitude - candidate.longitude;
  return Math.sqrt((latDiff * latDiff) + (lonDiff * lonDiff));
}

function chooseRequestCandidate(volunteer, candidates) {
  const needTypes = volunteer.need_types || [];

  const sortedCandidates = [...candidates].sort((left, right) => {
    const leftMatches = needTypes.length === 0 || needTypes.includes(left.need_type);
    const rightMatches = needTypes.length === 0 || needTypes.includes(right.need_type);

    if (leftMatches !== rightMatches) {
      return leftMatches ? -1 : 1;
    }

    const distanceDifference = computeDistance(volunteer, left) - computeDistance(volunteer, right);
    if (distanceDifference !== 0) {
      return distanceDifference;
    }

    return new Date(left.created_at) - new Date(right.created_at);
  });

  return sortedCandidates[0] || null;
}

async function ensureActiveUser(userId) {
  const user = await findActiveUserById(userId);

  if (!user) {
    const error = new Error('USER_NOT_FOUND');
    throw error;
  }
}

function buildVolunteerState(existingVolunteer, input) {
  const hasCoordinatePatch = Object.prototype.hasOwnProperty.call(input, 'lastKnownLatitude');
  const nextLocationUpdatedAt = hasCoordinatePatch && input.lastKnownLatitude !== null
    ? new Date()
    : hasCoordinatePatch
      ? null
      : existingVolunteer?.location_updated_at || null;

  return {
    isAvailable: input.isAvailable,
    skills: input.skills !== undefined ? input.skills : (existingVolunteer?.skills || []),
    needTypes: input.needTypes !== undefined ? input.needTypes : (existingVolunteer?.need_types || []),
    lastKnownLatitude: hasCoordinatePatch ? input.lastKnownLatitude : (existingVolunteer?.last_known_latitude ?? null),
    lastKnownLongitude: hasCoordinatePatch ? input.lastKnownLongitude : (existingVolunteer?.last_known_longitude ?? null),
    locationUpdatedAt: nextLocationUpdatedAt,
  };
}

async function getMyAvailability(userId) {
  await ensureActiveUser(userId);

  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    return mapSnapshot(null, null, null);
  }

  const [latestRecord, assignment] = await Promise.all([
    findLatestAvailabilityRecord(volunteer.volunteer_id),
    findActiveAssignmentByVolunteerId(volunteer.volunteer_id),
  ]);

  return mapSnapshot(volunteer, latestRecord, assignment);
}

async function upsertVolunteerState(userId, input) {
  const existingVolunteer = await findVolunteerByUserId(userId);
  const nextState = buildVolunteerState(existingVolunteer, input);

  if (!existingVolunteer) {
    return createVolunteer(userId, nextState);
  }

  return updateVolunteerByUserId(userId, nextState);
}

async function tryAutoAssign(volunteer) {
  const currentAssignment = await findActiveAssignmentByVolunteerId(volunteer.volunteer_id);

  if (currentAssignment) {
    return currentAssignment;
  }

  const candidates = await listAssignableHelpRequests();
  const selectedCandidate = chooseRequestCandidate(volunteer, candidates);

  if (!selectedCandidate) {
    return null;
  }

  await createAssignment(volunteer.volunteer_id, selectedCandidate.request_id);
  await markHelpRequestAssigned(selectedCandidate.request_id);

  return findActiveAssignmentByVolunteerId(volunteer.volunteer_id);
}

async function patchMyAvailability(userId, input) {
  await ensureActiveUser(userId);

  const volunteer = await upsertVolunteerState(userId, input);
  await createAvailabilityRecord(volunteer.volunteer_id, {
    isAvailable: volunteer.is_available,
    storedLocally: input.storedLocally,
  });

  if (volunteer.is_available && !input.storedLocally) {
    await tryAutoAssign(volunteer);
  }

  return getMyAvailability(userId);
}

async function cancelMyAssignment(userId, assignmentId) {
  await ensureActiveUser(userId);

  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    const error = new Error('VOLUNTEER_NOT_FOUND');
    throw error;
  }

  const assignment = await setAssignmentCancelled(assignmentId, volunteer.volunteer_id);
  if (!assignment) {
    return null;
  }

  await markHelpRequestPending(assignment.request_id);
  const updatedVolunteer = await updateVolunteerByUserId(userId, {
    isAvailable: false,
    skills: volunteer.skills || [],
    needTypes: volunteer.need_types || [],
    lastKnownLatitude: volunteer.last_known_latitude,
    lastKnownLongitude: volunteer.last_known_longitude,
    locationUpdatedAt: volunteer.location_updated_at,
  });
  await createAvailabilityRecord(updatedVolunteer.volunteer_id, {
    isAvailable: false,
    storedLocally: false,
  });

  return getMyAvailability(userId);
}

async function resolveMyAssignment(userId, assignmentId) {
  await ensureActiveUser(userId);

  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) {
    const error = new Error('VOLUNTEER_NOT_FOUND');
    throw error;
  }

  const assignment = await findActiveAssignmentByVolunteerId(volunteer.volunteer_id);
  if (!assignment || assignment.assignmentId !== assignmentId) {
    return null;
  }

  await markHelpRequestResolved(assignment.request.id);
  const updatedVolunteer = await updateVolunteerByUserId(userId, {
    isAvailable: false,
    skills: volunteer.skills || [],
    needTypes: volunteer.need_types || [],
    lastKnownLatitude: volunteer.last_known_latitude,
    lastKnownLongitude: volunteer.last_known_longitude,
    locationUpdatedAt: volunteer.location_updated_at,
  });
  await createAvailabilityRecord(updatedVolunteer.volunteer_id, {
    isAvailable: false,
    storedLocally: false,
  });

  return getMyAvailability(userId);
}

module.exports = {
  getMyAvailability,
  patchMyAvailability,
  cancelMyAssignment,
  resolveMyAssignment,
};
