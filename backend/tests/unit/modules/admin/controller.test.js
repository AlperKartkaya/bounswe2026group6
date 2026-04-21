'use strict';

jest.mock('../../../../src/modules/admin/service');

const {
  getAdminEmergencyOverview,
} = require('../../../../src/modules/admin/controller');

const {
  getEmergencyOverviewForAdmin,
} = require('../../../../src/modules/admin/service');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAdminEmergencyOverview', () => {
  test('200 - success', async () => {
    getEmergencyOverviewForAdmin.mockResolvedValue({
      totals: {
        totalEmergencies: 0,
        activeEmergencies: 0,
        resolvedEmergencies: 0,
        closedEmergencies: 0,
      },
      statusBreakdown: {
        pending: 0,
        inProgress: 0,
        resolved: 0,
        cancelled: 0,
      },
      urgencyBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
      },
      recentActivity: {
        createdLast24Hours: 0,
        createdLast7Days: 0,
        resolvedLast24Hours: 0,
        resolvedLast7Days: 0,
        cancelledLast24Hours: 0,
        cancelledLast7Days: 0,
      },
      regionSummary: [],
    });

    const req = {};
    const res = mockRes();

    await getAdminEmergencyOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        overview: expect.any(Object),
      }),
    );
  });

  test('500 - internal error', async () => {
    getEmergencyOverviewForAdmin.mockRejectedValue(new Error('unexpected'));

    const req = {};
    const res = mockRes();

    await getAdminEmergencyOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
      }),
    );
  });
});
