const {
  createHelpRequest,
  listHelpRequestsByUserId,
  findHelpRequestByIdForUser,
  markHelpRequestAsSynced,
  markHelpRequestAsResolved,
} = require('./repository');

async function createMyHelpRequest(userId, input) {
  try {
    return await createHelpRequest({
      ...input,
      userId,
    });
  } catch (error) {
    if (error.code === '23503') {
      const wrappedError = new Error('INVALID_USER');
      throw wrappedError;
    }

    throw error;
  }
}

async function listMyHelpRequests(userId) {
  return listHelpRequestsByUserId(userId);
}

async function getMyHelpRequest(userId, requestId) {
  return findHelpRequestByIdForUser(userId, requestId);
}

function buildInvalidTransitionError(message) {
  const error = new Error(message);
  error.code = 'INVALID_STATUS_TRANSITION';
  return error;
}

async function updateMyHelpRequestStatus(userId, requestId, nextStatus) {
  const currentRequest = await findHelpRequestByIdForUser(userId, requestId);

  if (!currentRequest) {
    return null;
  }

  if (nextStatus === 'SYNCED') {
    if (currentRequest.internalStatus === 'RESOLVED') {
      throw buildInvalidTransitionError('A resolved request cannot be moved back to synced.');
    }

    return markHelpRequestAsSynced(userId, requestId);
  }

  if (nextStatus === 'RESOLVED') {
    if (currentRequest.internalStatus === 'RESOLVED') {
      return currentRequest;
    }

    return markHelpRequestAsResolved(userId, requestId);
  }

  throw buildInvalidTransitionError('This status update is not supported.');
}

module.exports = {
  createMyHelpRequest,
  listMyHelpRequests,
  getMyHelpRequest,
  updateMyHelpRequestStatus,
};
