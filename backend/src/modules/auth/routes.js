const express = require('express');

const authRouter = express.Router();

authRouter.get('/', (_request, response) => {
  response.status(200).json({
    module: 'auth',
    scope: ['register', 'login', 'email verification'],
    status: 'ready for implementation',
  });
});

module.exports = {
  authRouter,
};
