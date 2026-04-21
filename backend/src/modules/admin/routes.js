const express = require('express');
const { requireAuth, requireAdmin } = require('../auth/middleware');
const {
  getAdminUsers,
  getAdminHelpRequests,
  getAdminAnnouncements,
  getAdminStats,
  getAdminEmergencyOverview,
} = require('./controller');

const adminRouter = express.Router();

adminRouter.get('/users', requireAuth, requireAdmin, getAdminUsers);
adminRouter.get('/help-requests', requireAuth, requireAdmin, getAdminHelpRequests);
adminRouter.get('/announcements', requireAuth, requireAdmin, getAdminAnnouncements);
adminRouter.get('/stats', requireAuth, requireAdmin, getAdminStats);
adminRouter.get('/emergency-overview', requireAuth, requireAdmin, getAdminEmergencyOverview);

module.exports = {
  adminRouter,
};
