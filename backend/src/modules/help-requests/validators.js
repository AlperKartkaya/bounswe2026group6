function readUserId(request) {
  if (request.user && request.user.userId) {
    return request.user.userId;
  }

  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateCreateHelpRequest(body) {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Payload must be an object',
    };
  }

  const warnings = [];
  const requestedNeedType = typeof body.needType === 'string' ? body.needType.trim() : '';
  const needType = requestedNeedType || 'general';

  if (!requestedNeedType) {
    warnings.push('Need type was not provided; defaulting to `general`.');
  }

  let description = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'description must be a string or null',
      };
    }

    const trimmedDescription = body.description.trim();
    description = trimmedDescription || null;
  }

  let isSavedLocally = false;
  if (body.isSavedLocally !== undefined) {
    if (typeof body.isSavedLocally !== 'boolean') {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'isSavedLocally must be a boolean',
      };
    }

    isSavedLocally = body.isSavedLocally;
  }

  let location = null;
  if (body.location === undefined || body.location === null) {
    warnings.push('Location was not provided; the request was created without request coordinates.');
  } else if (!isPlainObject(body.location)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'location must be an object when provided',
    };
  } else {
    const { latitude, longitude, isGpsLocation, isLastKnown } = body.location;

    if (!isFiniteNumber(latitude) || latitude < -90 || latitude > 90) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'location.latitude must be between -90 and 90',
      };
    }

    if (!isFiniteNumber(longitude) || longitude < -180 || longitude > 180) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'location.longitude must be between -180 and 180',
      };
    }

    if (isGpsLocation !== undefined && typeof isGpsLocation !== 'boolean') {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'location.isGpsLocation must be a boolean',
      };
    }

    if (isLastKnown !== undefined && typeof isLastKnown !== 'boolean') {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'location.isLastKnown must be a boolean',
      };
    }

    location = {
      latitude,
      longitude,
      isGpsLocation: Boolean(isGpsLocation),
      isLastKnown: Boolean(isLastKnown),
    };
  }

  return {
    ok: true,
    data: {
      needType,
      description,
      isSavedLocally,
      location,
    },
    warnings,
  };
}

function validateHelpRequestStatusUpdate(body) {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Payload must be an object',
    };
  }

  if (typeof body.status !== 'string') {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'status must be provided',
    };
  }

  const status = body.status.trim().toUpperCase();
  const allowedStatuses = new Set(['SYNCED', 'RESOLVED']);

  if (!allowedStatuses.has(status)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'status must be one of SYNCED or RESOLVED',
    };
  }

  return {
    ok: true,
    data: { status },
  };
}

module.exports = {
  readUserId,
  validateCreateHelpRequest,
  validateHelpRequestStatusUpdate,
};
