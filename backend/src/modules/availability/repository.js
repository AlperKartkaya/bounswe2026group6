const { v4: uuidv4 } = require('uuid');

const { pool, query } = require('../../db/pool');

function makeAvailabilityRecordId() {
  return `avr_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

function mapRequestStatus(row) {
  if (row.request_status === 'RESOLVED') {
    return 'RESOLVED';
  }

  if (row.request_status === 'ASSIGNED' || row.request_status === 'IN_PROGRESS') {
    return 'MATCHED';
  }

  if (row.request_is_saved_locally) {
    return 'PENDING_SYNC';
  }

  return 'SYNCED';
}

function mapAssignment(row) {
  if (!row || !row.assignment_id) {
    return null;
  }

  return {
    assignmentId: row.assignment_id,
    assignedAt: row.assigned_at,
    isCancelled: row.is_cancelled,
    request: {
      id: row.request_id,
      userId: row.request_user_id,
      needType: row.need_type,
      description: row.request_description,
      status: mapRequestStatus(row),
      internalStatus: row.request_status,
      createdAt: row.request_created_at,
      resolvedAt: row.request_resolved_at,
      isSavedLocally: row.request_is_saved_locally,
      location: row.location_id
        ? {
            id: row.location_id,
            latitude: row.latitude,
            longitude: row.longitude,
            isGpsLocation: row.is_gps_location,
            isLastKnown: row.is_last_known,
            capturedAt: row.captured_at,
          }
        : null,
    },
  };
}

async function findActiveUserById(userId) {
  const result = await query(
    `
      SELECT user_id
      FROM users
      WHERE user_id = $1 AND is_deleted = FALSE
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function findVolunteerByUserId(userId) {
  const result = await query(
    `
      SELECT
        volunteer_id,
        user_id,
        is_available,
        skills,
        need_types,
        last_known_latitude,
        last_known_longitude,
        location_updated_at
      FROM volunteers
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function createVolunteer(userId, state) {
  const result = await query(
    `
      INSERT INTO volunteers (
        volunteer_id,
        user_id,
        is_available,
        skills,
        need_types,
        last_known_latitude,
        last_known_longitude,
        location_updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        volunteer_id,
        user_id,
        is_available,
        skills,
        need_types,
        last_known_latitude,
        last_known_longitude,
        location_updated_at
    `,
    [
      uuidv4(),
      userId,
      state.isAvailable,
      state.skills,
      state.needTypes,
      state.lastKnownLatitude,
      state.lastKnownLongitude,
      state.locationUpdatedAt,
    ],
  );

  return result.rows[0];
}

async function updateVolunteerByUserId(userId, state) {
  const result = await query(
    `
      UPDATE volunteers
      SET is_available = $2,
          skills = $3,
          need_types = $4,
          last_known_latitude = $5,
          last_known_longitude = $6,
          location_updated_at = $7
      WHERE user_id = $1
      RETURNING
        volunteer_id,
        user_id,
        is_available,
        skills,
        need_types,
        last_known_latitude,
        last_known_longitude,
        location_updated_at
    `,
    [
      userId,
      state.isAvailable,
      state.skills,
      state.needTypes,
      state.lastKnownLatitude,
      state.lastKnownLongitude,
      state.locationUpdatedAt,
    ],
  );

  return result.rows[0] || null;
}

async function createAvailabilityRecord(volunteerId, state) {
  const result = await query(
    `
      INSERT INTO availability_records (
        availability_id,
        volunteer_id,
        is_available,
        stored_locally,
        synced_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        availability_id,
        volunteer_id,
        is_available,
        stored_locally,
        synced_at
    `,
    [
      makeAvailabilityRecordId(),
      volunteerId,
      state.isAvailable,
      state.storedLocally,
      state.storedLocally ? null : new Date(),
    ],
  );

  return result.rows[0];
}

async function findLatestAvailabilityRecord(volunteerId) {
  const result = await query(
    `
      SELECT
        availability_id,
        volunteer_id,
        is_available,
        stored_locally,
        synced_at
      FROM availability_records
      WHERE volunteer_id = $1
      ORDER BY availability_id DESC
      LIMIT 1
    `,
    [volunteerId],
  );

  return result.rows[0] || null;
}

async function findActiveAssignmentByVolunteerId(volunteerId) {
  const result = await query(
    `
      SELECT
        a.assignment_id,
        a.assigned_at,
        a.is_cancelled,
        hr.request_id,
        hr.user_id AS request_user_id,
        hr.need_type,
        hr.description AS request_description,
        hr.status AS request_status,
        hr.created_at AS request_created_at,
        hr.resolved_at AS request_resolved_at,
        hr.is_saved_locally AS request_is_saved_locally,
        rl.location_id,
        rl.latitude,
        rl.longitude,
        rl.is_gps_location,
        rl.is_last_known,
        rl.captured_at
      FROM assignments a
      JOIN help_requests hr ON hr.request_id = a.request_id
      LEFT JOIN request_locations rl ON rl.request_id = hr.request_id
      WHERE a.volunteer_id = $1
        AND a.is_cancelled = FALSE
        AND hr.status IN ('ASSIGNED', 'IN_PROGRESS')
      ORDER BY a.assigned_at DESC
      LIMIT 1
    `,
    [volunteerId],
  );

  return mapAssignment(result.rows[0] || null);
}

async function listAssignableHelpRequests() {
  const result = await query(
    `
      SELECT
        hr.request_id,
        hr.user_id,
        hr.need_type,
        hr.description,
        hr.status,
        hr.created_at,
        hr.resolved_at,
        hr.is_saved_locally,
        rl.location_id,
        rl.latitude,
        rl.longitude,
        rl.is_gps_location,
        rl.is_last_known,
        rl.captured_at
      FROM help_requests hr
      LEFT JOIN request_locations rl ON rl.request_id = hr.request_id
      LEFT JOIN assignments a ON a.request_id = hr.request_id AND a.is_cancelled = FALSE
      WHERE hr.status = 'PENDING'
        AND hr.is_saved_locally = FALSE
        AND a.assignment_id IS NULL
      ORDER BY hr.created_at ASC
    `,
  );

  return result.rows;
}

async function createAssignment(volunteerId, requestId) {
  const result = await query(
    `
      INSERT INTO assignments (
        assignment_id,
        volunteer_id,
        request_id
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (request_id) DO UPDATE
      SET volunteer_id = EXCLUDED.volunteer_id,
          assigned_at = CURRENT_TIMESTAMP,
          is_cancelled = FALSE
      WHERE assignments.is_cancelled = TRUE
      RETURNING assignment_id
    `,
    [uuidv4(), volunteerId, requestId],
  );

  return result.rows[0];
}

async function markHelpRequestAssigned(requestId) {
  await query(
    `
      UPDATE help_requests
      SET status = 'ASSIGNED',
          is_saved_locally = FALSE
      WHERE request_id = $1
    `,
    [requestId],
  );
}

async function setAssignmentCancelled(assignmentId, volunteerId) {
  const result = await query(
    `
      UPDATE assignments
      SET is_cancelled = TRUE
      WHERE assignment_id = $1
        AND volunteer_id = $2
        AND is_cancelled = FALSE
      RETURNING assignment_id, request_id
    `,
    [assignmentId, volunteerId],
  );

  return result.rows[0] || null;
}

async function markHelpRequestPending(requestId) {
  await query(
    `
      UPDATE help_requests
      SET status = 'PENDING',
          resolved_at = NULL
      WHERE request_id = $1
    `,
    [requestId],
  );
}

async function markHelpRequestResolved(requestId) {
  await query(
    `
      UPDATE help_requests
      SET status = 'RESOLVED',
          resolved_at = CURRENT_TIMESTAMP,
          is_saved_locally = FALSE
      WHERE request_id = $1
    `,
    [requestId],
  );
}

module.exports = {
  findActiveUserById,
  findVolunteerByUserId,
  createVolunteer,
  updateVolunteerByUserId,
  createAvailabilityRecord,
  findLatestAvailabilityRecord,
  findActiveAssignmentByVolunteerId,
  listAssignableHelpRequests,
  createAssignment,
  markHelpRequestAssigned,
  setAssignmentCancelled,
  markHelpRequestPending,
  markHelpRequestResolved,
};
