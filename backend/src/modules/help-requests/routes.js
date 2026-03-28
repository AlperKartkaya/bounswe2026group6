const express = require('express');
const {
  createHelpRequest,
  listHelpRequests,
  getHelpRequest,
  patchHelpRequestStatus,
} = require('./controller');

const helpRequestsRouter = express.Router();

helpRequestsRouter.post('/', createHelpRequest);
helpRequestsRouter.get('/', listHelpRequests);
helpRequestsRouter.get('/:requestId', getHelpRequest);
helpRequestsRouter.patch('/:requestId/status', patchHelpRequestStatus);

module.exports = {
  helpRequestsRouter,
};
