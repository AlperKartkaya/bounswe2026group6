const {
  createNotification,
} = require('./service');
const {
  listAvailabilityReminderCandidates,
  expireStalePendingHelpRequests,
} = require('./repository');
const { env } = require('../../config/env');

let intervalHandle = null;
let running = false;

async function runAvailabilityReminderCycle() {
  const userIds = await listAvailabilityReminderCandidates({
    minMinutesSinceLocationUpdate: env.notifications.availabilityReminderMinutes,
    reminderCooldownMinutes: env.notifications.availabilityReminderCooldownMinutes,
    limit: env.notifications.jobBatchSize,
  });

  for (const userId of userIds) {
    await createNotification({
      recipientUserId: userId,
      actorUserId: null,
      type: 'TASK_UPDATED',
      title: 'Availability reminder',
      body: 'You are marked as available. Please confirm if you can still take requests.',
      entity: null,
      data: {
        screen: 'availability',
        kind: 'availability_reminder',
      },
    });
  }
}

async function runHelpRequestExpirationCycle() {
  const expiredRows = await expireStalePendingHelpRequests({
    ttlHours: env.notifications.pendingRequestTtlHours,
    limit: env.notifications.jobBatchSize,
  });

  for (const row of expiredRows) {
    if (!row.user_id) {
      continue;
    }

    await createNotification({
      recipientUserId: row.user_id,
      actorUserId: null,
      type: 'HELP_REQUEST_STATUS_CHANGED',
      title: 'Help request expired',
      body: 'Your help request expired due to inactivity and was cancelled.',
      entity: {
        type: 'HELP_REQUEST',
        id: row.request_id,
      },
      data: {
        screen: 'my-help-requests',
        requestId: row.request_id,
        status: 'CANCELLED',
        reason: 'ttl_expired',
      },
    });
  }
}

async function runNotificationJobsOnce() {
  if (running) {
    return;
  }

  running = true;
  try {
    await runAvailabilityReminderCycle();
    await runHelpRequestExpirationCycle();
  } catch (error) {
    console.error('notifications.jobs.runNotificationJobsOnce failed', error);
  } finally {
    running = false;
  }
}

function startNotificationJobs() {
  if (env.nodeEnv === 'test' || !env.notifications.jobsEnabled) {
    return;
  }

  if (intervalHandle) {
    return;
  }

  intervalHandle = setInterval(runNotificationJobsOnce, env.notifications.jobIntervalMs);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  setTimeout(runNotificationJobsOnce, 5000);
}

function stopNotificationJobs() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}

module.exports = {
  startNotificationJobs,
  stopNotificationJobs,
  runNotificationJobsOnce,
};
