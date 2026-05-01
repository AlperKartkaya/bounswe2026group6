const {
  listUsers,
  banUserById,
  unbanUserById,
  listHelpRequests,
  listAnnouncements,
  getBasicStats,
  getEmergencyOverview,
  getEmergencyHistory,
  getEmergencyAnalytics,
  getDeploymentMonitoring,
} = require('./repository');

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

async function banUserForAdmin({ userId, reason = null }) {
  const updated = await banUserById(userId, reason);
  return updated ? mapAdminUserRow(updated) : null;
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
