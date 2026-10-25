const request = require('supertest');
const app = require('../src/app');
const { createTables } = require('../src/db/schema');
const { seed } = require('../src/db/seed');

beforeAll(() => {
  createTables();
  seed();
});

describe('GET /api/v1/courses', () => {
  it('should return 200 with an array of courses', async () => {
    const res = await request(app).get('/api/v1/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should have expected course properties', async () => {
    const res = await request(app).get('/api/v1/courses');
    const course = res.body[0];
    expect(course).toHaveProperty('id');
    expect(course).toHaveProperty('title');
    expect(course).toHaveProperty('description');
    expect(course).toHaveProperty('category');
    expect(course).toHaveProperty('tags');
    expect(Array.isArray(course.tags)).toBe(true);
  });

  it('should filter by category', async () => {
    const res = await request(app).get('/api/v1/courses?category=sql');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(course => {
      expect(course.category.toLowerCase()).toBe('sql');
    });
  });

  it('should return all courses for category=all', async () => {
    const allRes = await request(app).get('/api/v1/courses');
    const filteredRes = await request(app).get('/api/v1/courses?category=all');
    expect(filteredRes.body.length).toBe(allRes.body.length);
  });
});

describe('GET /api/v1/courses/:id', () => {
  it('should return a single course by ID', async () => {
    const listRes = await request(app).get('/api/v1/courses');
    const firstCourse = listRes.body[0];
    const res = await request(app).get(`/api/v1/courses/${firstCourse.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body.id).toBe(String(firstCourse.id));
  });

  it('should return 404 for non-existent course', async () => {
    const res = await request(app).get('/api/v1/courses/non-existent-course-id-999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
