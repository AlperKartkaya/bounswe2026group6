const express = require('express');

const helpRequestsRouter = express.Router();

helpRequestsRouter.get('/', (_request, response) => {
  response.status(200).json({
    module: 'help-requests',
    scope: ['offline draft sync', 'request creation', 'request tracking'],
    status: 'ready for implementation',
  });
});

module.exports = {
  helpRequestsRouter,
};
