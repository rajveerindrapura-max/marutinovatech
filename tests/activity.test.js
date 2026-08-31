const request = require('supertest');
const app = require('../src/app');
const { createTables } = require('../src/db/schema');
const { seed } = require('../src/db/seed');

beforeAll(() => {
  createTables();
  seed();
});

describe('POST /api/v1/activity', () => {
  it('should accept valid activity payload', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'rahul-sharma',
        addedSeconds: 60,
        labType: 'sqlLab',
        lastTopic: 'SQL Joins',
        lastTopicUrl: 'sql.html',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student).toBeDefined();
  });

  it('should reject negative addedSeconds', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'rahul-sharma',
        addedSeconds: -1,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should reject excessively large addedSeconds (> 86400)', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'rahul-sharma',
        addedSeconds: 999999,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should reject missing id field', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        addedSeconds: 30,
      });
    expect(res.status).toBe(400);
  });

  it('should reject invalid labType', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'rahul-sharma',
        addedSeconds: 30,
        labType: 'hackerLab',
      });
    expect(res.status).toBe(400);
  });

  it('should reject non-integer addedSeconds', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'rahul-sharma',
        addedSeconds: 30.5,
      });
    expect(res.status).toBe(400);
  });

  it('should create student if not found', async () => {
    const res = await request(app)
      .post('/api/v1/activity')
      .send({
        id: 'new-test-student',
        name: 'Test Student',
        email: 'test-new@example.com',
        addedSeconds: 120,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should return JWT for valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@marutinova.com',
        password: 'admin123',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@marutinova.com',
        password: 'wrongpassword',
      });
    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'admin123',
      });
    expect(res.status).toBe(401);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'admin123',
      });
    expect(res.status).toBe(400);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@marutinova.com',
        password: '123',
      });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/signup', () => {
  it('should register a new student user and return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'rajveer.new@example.com',
        password: 'password123',
        fullName: 'Rajveer Singh',
        course: 'Data & Cloud Engineering',
        cohort: 'Cohort 14',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.id).toBe('rajveer-new');
  });

  it('should reject duplicate email signup', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'rajveer.new@example.com',
        password: 'anotherpassword',
        fullName: 'Rajveer Duplicate',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already exists');
  });
});

