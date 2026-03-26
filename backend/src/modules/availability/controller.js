const {
  getMyAvailability,
  patchMyAvailability,
  cancelMyAssignment,
  resolveMyAssignment,
} = require('./service');
const { readUserId, validateAvailabilityPatch } = require('./validators');

function sendError(response, status, code, message) {
  return response.status(status).json({ code, message });
}

function sendAuthError(response) {
  return sendError(response, 401, 'UNAUTHORIZED', 'Authentication required');
}

function mapServiceError(response, error) {
  if (error.message === 'USER_NOT_FOUND' || error.message === 'VOLUNTEER_NOT_FOUND') {
    return sendError(response, 404, 'NOT_FOUND', 'Volunteer record not found');
  }

  console.error('availability.controller failed', error);
  return sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected server error');
}

async function getMe(request, response) {
  const userId = readUserId(request);
  if (!userId) {
    return sendAuthError(response);
  }

  try {
    const snapshot = await getMyAvailability(userId);
    return response.status(200).json(snapshot);
  } catch (error) {
    return mapServiceError(response, error);
  }
}

async function patchMe(request, response) {
  const userId = readUserId(request);
  if (!userId) {
    return sendAuthError(response);
  }

  const validation = validateAvailabilityPatch(request.body);
  if (!validation.ok) {
    return sendError(response, 400, validation.code, validation.message);
  }

  try {
    const snapshot = await patchMyAvailability(userId, validation.data);
    return response.status(200).json({
      message: 'Availability updated',
      ...snapshot,
    });
  } catch (error) {
    return mapServiceError(response, error);
  }
}

async function cancelAssignment(request, response) {
  const userId = readUserId(request);
  if (!userId) {
    return sendAuthError(response);
  }

  try {
    const snapshot = await cancelMyAssignment(userId, request.params.assignmentId);

    if (!snapshot) {
      return sendError(response, 404, 'NOT_FOUND', 'Assignment not found');
    }

    return response.status(200).json({
      message: 'Assignment cancelled',
      ...snapshot,
    });
  } catch (error) {
    return mapServiceError(response, error);
  }
}

async function resolveAssignment(request, response) {
  const userId = readUserId(request);
  if (!userId) {
    return sendAuthError(response);
  }

  try {
    const snapshot = await resolveMyAssignment(userId, request.params.assignmentId);

    if (!snapshot) {
      return sendError(response, 404, 'NOT_FOUND', 'Assignment not found');
    }

    return response.status(200).json({
      message: 'Assignment resolved',
      ...snapshot,
    });
  } catch (error) {
    return mapServiceError(response, error);
  }
}

module.exports = {
  getMe,
  patchMe,
  cancelAssignment,
  resolveAssignment,
};
