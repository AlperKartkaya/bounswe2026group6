const {
  listUsers,
  listHelpRequests,
  listAnnouncements,
  getBasicStats,
  getEmergencyOverview,
} = require('./repository');

async function getUsersForAdmin() {
  return listUsers();
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

async function getEmergencyOverviewForAdmin() {
  return getEmergencyOverview();
}

module.exports = {
  getUsersForAdmin,
  getHelpRequestsForAdmin,
  getAnnouncementsForAdmin,
  getStatsForAdmin,
  getEmergencyOverviewForAdmin,
};
