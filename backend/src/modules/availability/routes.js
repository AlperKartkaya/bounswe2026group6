const express = require('express');

const availabilityRouter = express.Router();

availabilityRouter.get('/', (_request, response) => {
  response.status(200).json({
    module: 'availability',
    scope: ['volunteer availability', 'matching', 'assignment flow'],
    status: 'ready for implementation',
  });
});

module.exports = {
  availabilityRouter,
};
