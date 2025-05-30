const request = require('supertest');
const { createTestApp } = require('../src/app');

describe('Server', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  test('Health check endpoint should return 200', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
  });

  test('Non-existent route should return 404', async () => {
    const response = await request(app).get('/non-existent-route');
    
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('Route not found');
  });
});
