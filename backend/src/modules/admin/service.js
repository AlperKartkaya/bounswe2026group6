const {
  listUsers,
  banUserById,
  findBanTargetByUserId,
  unbanUserById,
  listHelpRequests,
  listAnnouncements,
  getBasicStats,
  getEmergencyOverview,
  getEmergencyHistory,
  getEmergencyAnalytics,
  getDeploymentMonitoring,
} = require('./repository');
const {
  listHelpRequestsByUserId,
  markHelpRequestAsCancelled,
} = require('../help-requests/repository');
const {
  cancelAssignmentByRequestId,
  cancelAssignmentsForBannedVolunteer,
} = require('../availability/service');

const OPEN_REQUEST_STATUSES = new Set(['PENDING', 'ASSIGNED', 'IN_PROGRESS']);

async function getUsersForAdmin(options = {}) {
  const { users, total } = await listUsers(options);

  return {
    users: users.map((row) => mapAdminUserRow(row)),
    total,
  };
}

function mapAdminUserRow(row) {
  const firstName = row.first_name ? String(row.first_name).trim() : '';
  const lastName = row.last_name ? String(row.last_name).trim() : '';
  const username = [firstName, lastName].filter(Boolean).join(' ');

  return {
    userId: row.user_id,
    username: username || null,
    email: row.email,
    isEmailVerified: Boolean(row.is_email_verified),
    isBanned: Boolean(row.is_banned),
    banReason: row.ban_reason || null,
    bannedAt: row.banned_at || null,
    createdAt: row.created_at,
    isAdmin: Boolean(row.admin_id),
    adminRole: row.admin_role || null,
  };
}

function buildModerationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function banUserForAdmin({ actorUserId = null, userId, reason = null }) {
  if (actorUserId && actorUserId === userId) {
    throw buildModerationError('SELF_BAN_FORBIDDEN', 'Admins cannot ban their own account.');
  }

  const target = await findBanTargetByUserId(userId);
  if (!target) {
    return null;
  }

  if (target.is_admin) {
    throw buildModerationError('ADMIN_BAN_FORBIDDEN', 'Admin accounts cannot be banned.');
  }

  const updated = await banUserById(userId, reason);

  if (!updated) {
    return null;
  }

  try {
    await cancelOpenRequestsForBannedRequester(userId);
    await cancelAssignmentsForBannedVolunteer(userId);
  } catch (error) {
    // Keep moderation state consistent when downstream cleanup fails.
    await unbanUserById(userId);
    throw error;
  }

  return mapAdminUserRow(updated);
}

async function unbanUserForAdmin({ userId }) {
  const updated = await unbanUserById(userId);
  return updated ? mapAdminUserRow(updated) : null;
}

async function getHelpRequestsForAdmin() {
  return listHelpRequests();
}

async function getAnnouncementsForAdmin() {
  return listAnnouncements();
}

async function getStatsForAdmin() {
  return getBasicStats();
}

async function getEmergencyOverviewForAdmin(options = {}) {
  return getEmergencyOverview(options);
}

async function getEmergencyHistoryForAdmin(options = {}) {
  return getEmergencyHistory(options);
}

async function getEmergencyAnalyticsForAdmin(options = {}) {
  return getEmergencyAnalytics(options);
}

async function getDeploymentMonitoringForAdmin(options = {}) {
  return getDeploymentMonitoring(options);
}

async function cancelOpenRequestsForBannedRequester(userId) {
  const requesterRequests = await listHelpRequestsByUserId(userId);
  const openRequests = requesterRequests.filter((request) => OPEN_REQUEST_STATUSES.has(request.internalStatus));

  for (const request of openRequests) {
    await markHelpRequestAsCancelled(userId, request.id);
    await cancelAssignmentByRequestId(request.id);
  }
}

module.exports = {
  getUsersForAdmin,
  banUserForAdmin,
  unbanUserForAdmin,
  getHelpRequestsForAdmin,
  getAnnouncementsForAdmin,
  getStatsForAdmin,
  getEmergencyOverviewForAdmin,
  getEmergencyHistoryForAdmin,
  getEmergencyAnalyticsForAdmin,
  getDeploymentMonitoringForAdmin,
};
