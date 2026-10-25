const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const { createTables } = require('../src/db/schema');
const { seed } = require('../src/db/seed');

let adminToken;

beforeAll(() => {
  createTables();
  seed();
  // Generate a valid admin JWT for testing
  adminToken = jwt.sign(
    { id: 1, email: config.admin.email, role: 'admin' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
});

describe('GET /api/v1/students (protected)', () => {
  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/students');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });

  it('should return 403 with non-admin token', async () => {
    const studentToken = jwt.sign(
      { id: 2, email: 'student@test.com', role: 'student' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('should return student array with valid admin token', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return enriched student metrics', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const student = res.body[0];
    expect(student).toHaveProperty('totalQuestions');
    expect(student).toHaveProperty('solvedQuestions');
    expect(student).toHaveProperty('remainingQuestions');
    expect(student).toHaveProperty('progressPercent');
  });
});

describe('GET /api/v1/students/:id (protected)', () => {
  it('should return a student by ID', async () => {
    const listRes = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const targetStudent = listRes.body[0];
    const res = await request(app)
      .get(`/api/v1/students/${targetStudent.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(targetStudent.id);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  it('should return 404 for non-existent student', async () => {
    const res = await request(app)
      .get('/api/v1/students/does-not-exist')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/students/me (authenticated student)', () => {
  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/students/me');
    expect(res.status).toBe(401);
  });

  it('should return own student record with student token', async () => {
    const listRes = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const targetStudent = listRes.body[0];

    const studentToken = jwt.sign(
      { id: 2, email: targetStudent.email, role: 'student' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/v1/students/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(targetStudent.email);
  });
});

describe('PATCH /api/v1/students/:id/progress', () => {
  it('should update completedQuestions for authenticated student', async () => {
    const listRes = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const targetStudent = listRes.body[0];

    const studentToken = jwt.sign(
      { id: 2, email: targetStudent.email, role: 'student' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .patch(`/api/v1/students/${targetStudent.id}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        completedQuestions: ['q01', 'q02', 'q03'],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.completedQuestions).toEqual(['q01', 'q02', 'q03']);
    expect(res.body.student.solvedQuestions).toBe(3);
  });

  it('should reject non-admin student attempting to patch another student record', async () => {
    const listRes = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const targetStudent = listRes.body[0];

    const otherStudentToken = jwt.sign(
      { id: 3, email: 'other@example.com', role: 'student' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .patch(`/api/v1/students/${targetStudent.id}/progress`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        completedQuestions: ['q01'],
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('should return 404 for non-existent student', async () => {
    const res = await request(app)
      .patch('/api/v1/students/does-not-exist/progress')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        completedQuestions: ['q01'],
      });
    expect(res.status).toBe(404);
  });
});


