const request = require('supertest');
const app = require('../src/server');

describe('Profile Routes', () => {
  test('GET /profile should return 200', async () => {
    const res = await request(app).get('/profile');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({});
  });

  test('GET /profile/echo-score should return echoScore', async () => {
    const res = await request(app).get('/profile/echo-score');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('echoScore');
  });
});
