const {
  getUsersForAdmin,
  getHelpRequestsForAdmin,
  getAnnouncementsForAdmin,
  getStatsForAdmin,
  getEmergencyOverviewForAdmin,
} = require('./service');

async function getAdminUsers(_req, res) {
  try {
    const users = await getUsersForAdmin();

    return res.status(200).json({ users });
  } catch (_error) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}

async function getAdminHelpRequests(_req, res) {
  try {
    const helpRequests = await getHelpRequestsForAdmin();

    return res.status(200).json({ helpRequests });
  } catch (_error) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}

async function getAdminAnnouncements(_req, res) {
  try {
    const announcements = await getAnnouncementsForAdmin();

    return res.status(200).json({ announcements });
  } catch (_error) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}

async function getAdminStats(_req, res) {
  try {
    const stats = await getStatsForAdmin();

    return res.status(200).json({ stats });
  } catch (_error) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}

async function getAdminEmergencyOverview(_req, res) {
  try {
    const overview = await getEmergencyOverviewForAdmin();

    return res.status(200).json({ overview });
  } catch (_error) {
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  }
}

module.exports = {
  getAdminUsers,
  getAdminHelpRequests,
  getAdminAnnouncements,
  getAdminStats,
  getAdminEmergencyOverview,
};
