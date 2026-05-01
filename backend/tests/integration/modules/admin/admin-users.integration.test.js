'use strict';

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { query } = require('../../../../src/db/pool');
const { apiRouter } = require('../../../../src/routes');

jest.mock('uuid', () => ({
  v4: () => require('crypto').randomBytes(16).toString('hex'),
}));

jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  return app;
}

function buildAuthToken({ userId, isAdmin }) {
  return jwt.sign(
    {
      userId,
      email: `${userId}@example.com`,
      isAdmin,
      adminRole: isAdmin ? 'COORDINATOR' : null,
    },
    process.env.JWT_SECRET || 'dev-secret-123',
    { expiresIn: '1h' },
  );
}

async function seedUsers() {
  await query(
    `
      INSERT INTO users (
        user_id, email, password_hash, is_email_verified, is_deleted, accepted_terms,
        is_banned, ban_reason, banned_at, created_at
      )
      VALUES
        ('admin_user',     'admin@example.com',     'hash', TRUE,  FALSE, TRUE, FALSE, NULL, NULL, NOW() - INTERVAL '5 days'),
        ('user_alice',     'alice@example.com',     'hash', TRUE,  FALSE, TRUE, FALSE, NULL, NULL, NOW() - INTERVAL '4 days'),
        ('user_bob',       'bob@example.com',       'hash', FALSE, FALSE, TRUE, FALSE, NULL, NULL, NOW() - INTERVAL '3 days'),
        ('user_carol',     'carol@example.com',     'hash', TRUE,  FALSE, TRUE, TRUE,  'Abusive content', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        ('user_dave',      'dave@example.com',      'hash', FALSE, FALSE, TRUE, TRUE,  NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 days'),
        ('user_deleted',   'deleted@example.com',   'hash', TRUE,  TRUE,  TRUE, FALSE, NULL, NULL, NOW() - INTERVAL '6 days')
    `,
  );

  await query(
    `
      INSERT INTO admins (admin_id, user_id, role)
      VALUES ('admin_record_1', 'admin_user', 'COORDINATOR')
    `,
  );

  await query(
    `
      INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, phone_number)
      VALUES
        ('p_alice', 'user_alice', 'Alice',  'Anderson', '+905551110001'),
        ('p_bob',   'user_bob',   'Bob',    'Brown',    '+905551110002'),
        ('p_carol', 'user_carol', 'Carol',  'Clark',    '+905551110003')
    `,
  );
}

beforeEach(async () => {
  await query(`
    TRUNCATE TABLE
      messages,
      assignments,
      availability_records,
      resources,
      volunteers,
      request_locations,
      help_requests,
      news_announcements,
      reports,
      expertise,
      privacy_settings,
      location_profiles,
      health_info,
      physical_info,
      user_profiles,
      admins,
      users
    RESTART IDENTITY CASCADE;
  `);
});

describe('GET /api/admin/users', () => {
  test('returns 401 without token', async () => {
    const app = createTestApp();
    const response = await request(app).get('/api/admin/users');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  test('returns 403 for non-admin users', async () => {
    await seedUsers();
    const app = createTestApp();
    const userToken = buildAuthToken({ userId: 'user_alice', isAdmin: false });

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  test('returns paginated users with required fields for admin', async () => {
    await seedUsers();

    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        users: expect.any(Array),
        total: expect.any(Number),
        filters: expect.objectContaining({
          email: null,
          isEmailVerified: null,
          isBanned: null,
          limit: 50,
          offset: 0,
        }),
      }),
    );

    // is_deleted users excluded.
    expect(response.body.total).toBe(5);
    expect(response.body.users).toHaveLength(5);

    const aliceRow = response.body.users.find((row) => row.userId === 'user_alice');
    expect(aliceRow).toEqual(
      expect.objectContaining({
        userId: 'user_alice',
        email: 'alice@example.com',
        username: 'Alice Anderson',
        isEmailVerified: true,
        isBanned: false,
        banReason: null,
        bannedAt: null,
        isAdmin: false,
      }),
    );
    expect(aliceRow.createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(aliceRow.createdAt))).toBe(false);

    // Admin user should be flagged as such.
    const adminRow = response.body.users.find((row) => row.userId === 'admin_user');
    expect(adminRow).toEqual(
      expect.objectContaining({
        isAdmin: true,
        adminRole: 'COORDINATOR',
        username: null,
      }),
    );

    // Newest first.
    const orderedIds = response.body.users.map((row) => row.userId);
    expect(orderedIds).toEqual([
      'user_dave',
      'user_carol',
      'user_bob',
      'user_alice',
      'admin_user',
    ]);
  });

  test('filters by isEmailVerified', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const verifiedResponse = await request(app)
      .get('/api/admin/users?isEmailVerified=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifiedResponse.status).toBe(200);
    expect(verifiedResponse.body.total).toBe(3);
    verifiedResponse.body.users.forEach((row) => {
      expect(row.isEmailVerified).toBe(true);
    });

    const unverifiedResponse = await request(app)
      .get('/api/admin/users?isEmailVerified=false')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(unverifiedResponse.status).toBe(200);
    expect(unverifiedResponse.body.total).toBe(2);
    unverifiedResponse.body.users.forEach((row) => {
      expect(row.isEmailVerified).toBe(false);
    });
  });

  test('filters by isBanned', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const bannedResponse = await request(app)
      .get('/api/admin/users?isBanned=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(bannedResponse.status).toBe(200);
    expect(bannedResponse.body.total).toBe(2);
    expect(bannedResponse.body.users.map((row) => row.userId).sort()).toEqual(
      ['user_carol', 'user_dave'],
    );
  });

  test('filters by email contains (case-insensitive)', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .get('/api/admin/users?email=ALICE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.users[0].userId).toBe('user_alice');
  });

  test('supports limit and offset pagination', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const firstPage = await request(app)
      .get('/api/admin/users?limit=2&offset=0')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.total).toBe(5);
    expect(firstPage.body.users).toHaveLength(2);
    expect(firstPage.body.users.map((row) => row.userId)).toEqual(['user_dave', 'user_carol']);

    const secondPage = await request(app)
      .get('/api/admin/users?limit=2&offset=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.users).toHaveLength(2);
    expect(secondPage.body.users.map((row) => row.userId)).toEqual(['user_bob', 'user_alice']);
  });

  test('returns 400 for invalid limit', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .get('/api/admin/users?limit=0')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns 400 for invalid isBanned value', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .get('/api/admin/users?isBanned=maybe')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/admin/users/:userId/ban and /unban', () => {
  test('ban endpoint returns 401 without token', async () => {
    await seedUsers();
    const app = createTestApp();

    const response = await request(app)
      .patch('/api/admin/users/user_alice/ban')
      .send({ reason: 'Abusive behavior' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  test('ban endpoint returns 403 for non-admin token', async () => {
    await seedUsers();
    const app = createTestApp();
    const userToken = buildAuthToken({ userId: 'user_alice', isAdmin: false });

    const response = await request(app)
      .patch('/api/admin/users/user_bob/ban')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Spam' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  test('ban endpoint updates ban state with optional reason', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .patch('/api/admin/users/user_bob/ban')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Repeated abuse' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        userId: 'user_bob',
        isBanned: true,
        banReason: 'Repeated abuse',
      }),
    );
    expect(response.body.user.bannedAt).toEqual(expect.any(String));

    const dbResult = await query(
      `
        SELECT is_banned, ban_reason, banned_at
        FROM users
        WHERE user_id = 'user_bob'
      `,
    );

    expect(dbResult.rows[0].is_banned).toBe(true);
    expect(dbResult.rows[0].ban_reason).toBe('Repeated abuse');
    expect(dbResult.rows[0].banned_at).toBeTruthy();
  });

  test('ban endpoint accepts empty reason and stores null', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .patch('/api/admin/users/user_bob/ban')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '   ' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        userId: 'user_bob',
        isBanned: true,
        banReason: null,
      }),
    );
  });

  test('unban endpoint clears ban fields and restores active state', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .patch('/api/admin/users/user_carol/unban')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        userId: 'user_carol',
        isBanned: false,
        banReason: null,
        bannedAt: null,
      }),
    );

    const dbResult = await query(
      `
        SELECT is_banned, ban_reason, banned_at
        FROM users
        WHERE user_id = 'user_carol'
      `,
    );

    expect(dbResult.rows[0].is_banned).toBe(false);
    expect(dbResult.rows[0].ban_reason).toBeNull();
    expect(dbResult.rows[0].banned_at).toBeNull();
  });

  test('ban endpoint returns 404 for missing user', async () => {
    await seedUsers();
    const app = createTestApp();
    const adminToken = buildAuthToken({ userId: 'admin_user', isAdmin: true });

    const response = await request(app)
      .patch('/api/admin/users/missing_user/ban')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Abuse' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
});
