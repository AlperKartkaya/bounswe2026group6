const express = require('express');
const { requireAuth } = require('../auth/middleware');

const {
  listHelpRequests,
  createHelpRequest,
  getHelpRequest,
  patchHelpRequestStatus,
} = require('./controller');

const helpRequestsRouter = express.Router();

helpRequestsRouter.get('/', requireAuth, listHelpRequests);
helpRequestsRouter.post('/', requireAuth, createHelpRequest);
helpRequestsRouter.get('/:requestId', requireAuth, getHelpRequest);
helpRequestsRouter.patch('/:requestId/status', requireAuth, patchHelpRequestStatus);

module.exports = {
  helpRequestsRouter,
};
