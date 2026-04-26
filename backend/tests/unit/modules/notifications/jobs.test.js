'use strict';

jest.mock('../../../../src/modules/notifications/service', () => ({
  createNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }),
}));

jest.mock('../../../../src/modules/notifications/repository', () => ({
  listAvailabilityReminderCandidates: jest.fn(),
  expireStalePendingHelpRequests: jest.fn(),
}));

const { createNotification } = require('../../../../src/modules/notifications/service');
const {
  listAvailabilityReminderCandidates,
  expireStalePendingHelpRequests,
} = require('../../../../src/modules/notifications/repository');
const { runNotificationJobsOnce } = require('../../../../src/modules/notifications/jobs');

describe('notification jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listAvailabilityReminderCandidates.mockResolvedValue([]);
    expireStalePendingHelpRequests.mockResolvedValue([]);
  });

  test('creates availability reminder notifications for candidates', async () => {
    listAvailabilityReminderCandidates.mockResolvedValue(['user_a', 'user_b']);

    await runNotificationJobsOnce();

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipientUserId: 'user_a',
      type: 'TASK_UPDATED',
      data: expect.objectContaining({ kind: 'availability_reminder' }),
    }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipientUserId: 'user_b',
      type: 'TASK_UPDATED',
      data: expect.objectContaining({ kind: 'availability_reminder' }),
    }));
  });

  test('expires stale requests and notifies owners', async () => {
    expireStalePendingHelpRequests.mockResolvedValue([
      { request_id: 'req_1', user_id: 'owner_1' },
      { request_id: 'req_2', user_id: null },
    ]);

    await runNotificationJobsOnce();

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipientUserId: 'owner_1',
      type: 'HELP_REQUEST_STATUS_CHANGED',
      entity: { type: 'HELP_REQUEST', id: 'req_1' },
      data: expect.objectContaining({ reason: 'ttl_expired' }),
    }));
  });
});
