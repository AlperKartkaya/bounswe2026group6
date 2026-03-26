function readUserId(request) {
  if (request.user && request.user.userId) {
    return request.user.userId;
  }

  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: `${fieldName} must be an array of strings`,
    };
  }

  return {
    ok: true,
    data: value.map((item) => item.trim()).filter(Boolean),
  };
}

function validateAvailabilityPatch(body) {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Payload must be an object',
    };
  }

  if (typeof body.isAvailable !== 'boolean') {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'isAvailable must be provided as a boolean',
    };
  }

  const data = {
    isAvailable: body.isAvailable,
    storedLocally: false,
  };

  if (body.storedLocally !== undefined) {
    if (typeof body.storedLocally !== 'boolean') {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'storedLocally must be a boolean',
      };
    }

    data.storedLocally = body.storedLocally;
  }

  if (body.skills !== undefined) {
    const validation = validateStringArray(body.skills, 'skills');
    if (!validation.ok) {
      return validation;
    }

    data.skills = validation.data;
  }

  if (body.needTypes !== undefined) {
    const validation = validateStringArray(body.needTypes, 'needTypes');
    if (!validation.ok) {
      return validation;
    }

    data.needTypes = validation.data;
  }

  const latitudeProvided = Object.prototype.hasOwnProperty.call(body, 'lastKnownLatitude');
  const longitudeProvided = Object.prototype.hasOwnProperty.call(body, 'lastKnownLongitude');

  if (latitudeProvided !== longitudeProvided) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'lastKnownLatitude and lastKnownLongitude must be provided together',
    };
  }

  if (latitudeProvided) {
    const latitude = body.lastKnownLatitude;
    const longitude = body.lastKnownLongitude;

    if (latitude !== null && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'lastKnownLatitude must be between -90 and 90',
      };
    }

    if (longitude !== null && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'lastKnownLongitude must be between -180 and 180',
      };
    }

    data.lastKnownLatitude = latitude;
    data.lastKnownLongitude = longitude;
  }

  return {
    ok: true,
    data,
  };
}

module.exports = {
  readUserId,
  validateAvailabilityPatch,
};
