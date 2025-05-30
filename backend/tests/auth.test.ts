import request from 'supertest';
import app from '../dist/server';

describe('POST /api/auth/register', () => {
  it('should return 400 for invalid request body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid',
      username: 'u',
      password: '123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
