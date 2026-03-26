const {
  createMyHelpRequest,
  listMyHelpRequests,
  getMyHelpRequest,
  updateMyHelpRequestStatus,
} = require('./service');
const {
  readUserId,
  validateCreateHelpRequest,
  validateHelpRequestStatusUpdate,
} = require('./validators');

function sendError(response, status, code, message, details) {
  const payload = { code, message };

  if (details) {
    payload.details = details;
  }

  return response.status(status).json(payload);
}

async function listHelpRequests(request, response) {
  const userId = readUserId(request);

  if (!userId) {
    return sendError(response, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const requests = await listMyHelpRequests(userId);
    return response.status(200).json({ requests });
  } catch (error) {
    console.error('helpRequests.listHelpRequests failed', error);
    return sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

async function createHelpRequest(request, response) {
  const userId = readUserId(request);

  if (!userId) {
    return sendError(response, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const validation = validateCreateHelpRequest(request.body);
  if (!validation.ok) {
    return sendError(response, 400, validation.code, validation.message);
  }

  try {
    const helpRequest = await createMyHelpRequest(userId, validation.data);
    return response.status(201).json({ request: helpRequest, warnings: validation.warnings });
  } catch (error) {
    if (error.message === 'INVALID_USER') {
      return sendError(response, 404, 'NOT_FOUND', 'User not found');
    }

    console.error('helpRequests.createHelpRequest failed', error);
    return sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

async function getHelpRequest(request, response) {
  const userId = readUserId(request);

  if (!userId) {
    return sendError(response, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const helpRequest = await getMyHelpRequest(userId, request.params.requestId);

    if (!helpRequest) {
      return sendError(response, 404, 'NOT_FOUND', 'Help request not found');
    }

    return response.status(200).json({ request: helpRequest });
  } catch (error) {
    console.error('helpRequests.getHelpRequest failed', error);
    return sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

async function patchHelpRequestStatus(request, response) {
  const userId = readUserId(request);

  if (!userId) {
    return sendError(response, 401, 'UNAUTHORIZED', 'Authentication required');
  }

  const validation = validateHelpRequestStatusUpdate(request.body);
  if (!validation.ok) {
    return sendError(response, 400, validation.code, validation.message);
  }

  try {
    const helpRequest = await updateMyHelpRequestStatus(
      userId,
      request.params.requestId,
      validation.data.status,
    );

    if (!helpRequest) {
      return sendError(response, 404, 'NOT_FOUND', 'Help request not found');
    }

    return response.status(200).json({ request: helpRequest });
  } catch (error) {
    if (error.code === 'INVALID_STATUS_TRANSITION') {
      return sendError(response, 409, error.code, error.message);
    }

    console.error('helpRequests.patchHelpRequestStatus failed', error);
    return sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

module.exports = {
  listHelpRequests,
  createHelpRequest,
  getHelpRequest,
  patchHelpRequestStatus,
};
