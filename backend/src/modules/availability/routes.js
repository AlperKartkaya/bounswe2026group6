const express = require('express');
const { requireAuth } = require('../auth/middleware');

const {
  getMe,
  patchMe,
  cancelAssignment,
  resolveAssignment,
} = require('./controller');

const availabilityRouter = express.Router();

availabilityRouter.get('/', requireAuth, getMe);
availabilityRouter.get('/me', requireAuth, getMe);
availabilityRouter.patch('/', requireAuth, patchMe);
availabilityRouter.patch('/me', requireAuth, patchMe);
availabilityRouter.patch('/assignments/:assignmentId/cancel', requireAuth, cancelAssignment);
availabilityRouter.patch('/assignments/:assignmentId/resolve', requireAuth, resolveAssignment);

module.exports = {
  availabilityRouter,
};
