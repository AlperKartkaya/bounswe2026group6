function readUserId(request) {
  if (request.user && request.user.userId) {
    return request.user.userId;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (
    isDevelopment
    && typeof request.headers['x-user-id'] === 'string'
    && request.headers['x-user-id'].trim() !== ''
  ) {
    return request.headers['x-user-id'].trim();
  }

  return null;
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getNormalizedNeedType(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function validateCreateHelpRequest(payload) {
  const errors = [];
  const warnings = [];

  const requestedNeedType = getNormalizedNeedType(payload.needType);
  const needType = requestedNeedType || 'general';

  if (!requestedNeedType) {
    warnings.push('Need type was not provided; defaulting to `general`.');
  }

  if (requestedNeedType.length > 200) {
    errors.push('`needType` must be 200 characters or fewer.');
  }

  let description = null;

  if (typeof payload.description === 'string') {
    const trimmedDescription = payload.description.trim();

    if (trimmedDescription) {
      description = trimmedDescription;
    }
  }

  const isSavedLocally = isBoolean(payload.isSavedLocally)
    ? payload.isSavedLocally
    : false;

  let location = null;

  if (payload.location == null) {
    warnings.push('Location was not provided; the request was created without request coordinates.');
  } else if (typeof payload.location !== 'object' || Array.isArray(payload.location)) {
    errors.push('`location` must be an object when provided.');
  } else {
    const { latitude, longitude, isGpsLocation, isLastKnown } = payload.location;

    if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
      errors.push('`location.latitude` must be a number between -90 and 90.');
    }

    if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
      errors.push('`location.longitude` must be a number between -180 and 180.');
    }

    if (errors.length === 0) {
      location = {
        latitude,
        longitude,
        isGpsLocation: isBoolean(isGpsLocation) ? isGpsLocation : false,
        isLastKnown: isBoolean(isLastKnown) ? isLastKnown : false,
      };
    }
  }

  return {
    errors,
    warnings,
    value: {
      needType,
      description,
      isSavedLocally,
      location,
    },
  };
}

function validateHelpRequestStatusUpdate(payload) {
  const errors = [];
  const status = typeof payload.status === 'string' ? payload.status.trim().toUpperCase() : '';
  const allowedStatuses = ['SYNCED', 'RESOLVED'];

  if (!allowedStatuses.includes(status)) {
    errors.push('`status` must be one of: SYNCED, RESOLVED.');
  }

  return {
    errors,
    value: {
      status,
    },
  };
}

module.exports = {
  readUserId,
  validateCreateHelpRequest,
  validateHelpRequestStatusUpdate,
};
