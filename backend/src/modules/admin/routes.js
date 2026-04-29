const express = require('express');
const { requireAuth, requireAdmin } = require('../auth/middleware');
const { adminAnnouncementsRouter } = require('../announcements/routes');
const {
  getAdminUsers,
  getAdminHelpRequests,
  getAdminStats,
  getAdminEmergencyOverview,
  getAdminEmergencyHistory,
  getAdminEmergencyAnalytics,
  getAdminDeploymentMonitoring,
} = require('./controller');

const adminRouter = express.Router();

adminRouter.get('/users', requireAuth, requireAdmin, getAdminUsers);
adminRouter.get('/help-requests', requireAuth, requireAdmin, getAdminHelpRequests);
adminRouter.use('/announcements', adminAnnouncementsRouter);
adminRouter.get('/stats', requireAuth, requireAdmin, getAdminStats);
adminRouter.get('/emergency-overview', requireAuth, requireAdmin, getAdminEmergencyOverview);
adminRouter.get('/emergency-history', requireAuth, requireAdmin, getAdminEmergencyHistory);
adminRouter.get('/emergency-analytics', requireAuth, requireAdmin, getAdminEmergencyAnalytics);
adminRouter.get('/deployment-monitoring', requireAuth, requireAdmin, getAdminDeploymentMonitoring);

module.exports = {
  adminRouter,
};
