'use strict';

jest.mock('../../../../src/modules/admin/repository');
jest.mock('../../../../src/modules/help-requests/repository', () => ({
  listHelpRequestsByUserId: jest.fn(),
  markHelpRequestAsCancelled: jest.fn(),
}));
jest.mock('../../../../src/modules/availability/service', () => ({
  cancelAssignmentByRequestId: jest.fn(),
  cancelAssignmentsForBannedVolunteer: jest.fn(),
}));

const {
  getUsersForAdmin,
  banUserForAdmin,
  getHelpRequestsForAdmin,
  getAnnouncementsForAdmin,
  getStatsForAdmin,
  getEmergencyOverviewForAdmin,
  getEmergencyHistoryForAdmin,
} = require('../../../../src/modules/admin/service');

const {
  listUsers,
  banUserById,
  listHelpRequests,
  listAnnouncements,
  getBasicStats,
  getEmergencyOverview,
  getEmergencyHistory,
} = require('../../../../src/modules/admin/repository');
const {
  listHelpRequestsByUserId,
  markHelpRequestAsCancelled,
} = require('../../../../src/modules/help-requests/repository');
const {
  cancelAssignmentByRequestId,
  cancelAssignmentsForBannedVolunteer,
} = require('../../../../src/modules/availability/service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('admin service', () => {
  test('getUsersForAdmin delegates to repository', async () => {
    listUsers.mockResolvedValue({
      users: [
        {
          user_id: 'u1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          is_email_verified: true,
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          created_at: '2026-05-01T10:00:00.000Z',
          admin_id: null,
          admin_role: null,
        },
      ],
      total: 1,
    });

    const result = await getUsersForAdmin();

    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      users: [
        {
          userId: 'u1',
          username: 'John Doe',
          email: 'john@example.com',
          isEmailVerified: true,
          isBanned: false,
          banReason: null,
          bannedAt: null,
          createdAt: '2026-05-01T10:00:00.000Z',
          isAdmin: false,
          adminRole: null,
        },
      ],
      total: 1,
    });
  });

  test('banUserForAdmin bans user and applies requester/volunteer cleanup', async () => {
    banUserById.mockResolvedValue({
      user_id: 'u1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      is_email_verified: true,
      is_banned: true,
      ban_reason: 'Abuse',
      banned_at: '2026-05-01T11:00:00.000Z',
      created_at: '2026-05-01T10:00:00.000Z',
      admin_id: null,
      admin_role: null,
    });
    listHelpRequestsByUserId.mockResolvedValue([
      { id: 'req-open-1', internalStatus: 'PENDING' },
      { id: 'req-open-2', internalStatus: 'ASSIGNED' },
      { id: 'req-closed', internalStatus: 'RESOLVED' },
    ]);
    markHelpRequestAsCancelled.mockResolvedValue({});
    cancelAssignmentByRequestId.mockResolvedValue();
    cancelAssignmentsForBannedVolunteer.mockResolvedValue({});

    const result = await banUserForAdmin({ userId: 'u1', reason: 'Abuse' });

    expect(banUserById).toHaveBeenCalledWith('u1', 'Abuse');
    expect(listHelpRequestsByUserId).toHaveBeenCalledWith('u1');
    expect(markHelpRequestAsCancelled).toHaveBeenCalledTimes(2);
    expect(markHelpRequestAsCancelled).toHaveBeenNthCalledWith(1, 'u1', 'req-open-1');
    expect(markHelpRequestAsCancelled).toHaveBeenNthCalledWith(2, 'u1', 'req-open-2');
    expect(cancelAssignmentByRequestId).toHaveBeenCalledTimes(2);
    expect(cancelAssignmentByRequestId).toHaveBeenNthCalledWith(1, 'req-open-1');
    expect(cancelAssignmentByRequestId).toHaveBeenNthCalledWith(2, 'req-open-2');
    expect(cancelAssignmentsForBannedVolunteer).toHaveBeenCalledWith('u1');
    expect(result).toEqual(
      expect.objectContaining({
        userId: 'u1',
        isBanned: true,
        banReason: 'Abuse',
      }),
    );
  });

  test('banUserForAdmin returns null for missing user without side effects', async () => {
    banUserById.mockResolvedValue(null);

    const result = await banUserForAdmin({ userId: 'missing', reason: null });

    expect(result).toBeNull();
    expect(listHelpRequestsByUserId).not.toHaveBeenCalled();
    expect(markHelpRequestAsCancelled).not.toHaveBeenCalled();
    expect(cancelAssignmentByRequestId).not.toHaveBeenCalled();
    expect(cancelAssignmentsForBannedVolunteer).not.toHaveBeenCalled();
  });

  test('getHelpRequestsForAdmin delegates to repository', async () => {
    listHelpRequests.mockResolvedValue([{ request_id: 'r1' }]);

    const result = await getHelpRequestsForAdmin();

    expect(listHelpRequests).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ request_id: 'r1' }]);
  });

  test('getAnnouncementsForAdmin delegates to repository', async () => {
    listAnnouncements.mockResolvedValue([{ announcement_id: 'a1' }]);

    const result = await getAnnouncementsForAdmin();

    expect(listAnnouncements).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ announcement_id: 'a1' }]);
  });

  test('getStatsForAdmin delegates to repository', async () => {
    getBasicStats.mockResolvedValue({ totalUsers: 1 });

    const result = await getStatsForAdmin();

    expect(getBasicStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalUsers: 1 });
  });

  test('getEmergencyOverviewForAdmin delegates to repository', async () => {
    getEmergencyOverview.mockResolvedValue({ totals: { totalEmergencies: 3 } });

    const result = await getEmergencyOverviewForAdmin({ includeRegionSummary: true });

    expect(getEmergencyOverview).toHaveBeenCalledTimes(1);
    expect(getEmergencyOverview).toHaveBeenCalledWith({ includeRegionSummary: true });
    expect(result).toEqual({ totals: { totalEmergencies: 3 } });
  });

  test('getEmergencyHistoryForAdmin delegates to repository', async () => {
    getEmergencyHistory.mockResolvedValue({ history: [], total: 0 });

    const result = await getEmergencyHistoryForAdmin({
      statuses: ['RESOLVED'],
      cities: ['ankara'],
      needTypes: ['water'],
      urgencies: ['HIGH'],
      limit: 20,
    });

    expect(getEmergencyHistory).toHaveBeenCalledTimes(1);
    expect(getEmergencyHistory).toHaveBeenCalledWith({
      statuses: ['RESOLVED'],
      cities: ['ankara'],
      needTypes: ['water'],
      urgencies: ['HIGH'],
      limit: 20,
    });
    expect(result).toEqual({ history: [], total: 0 });
  });
});
