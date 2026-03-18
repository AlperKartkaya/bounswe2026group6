const express = require('express');

const profilesRouter = express.Router();

profilesRouter.get('/', (_request, response) => {
  response.status(200).json({
    module: 'profiles',
    scope: ['profile', 'privacy', 'health', 'location'],
    status: 'ready for implementation',
  });
});

module.exports = {
  profilesRouter,
};
