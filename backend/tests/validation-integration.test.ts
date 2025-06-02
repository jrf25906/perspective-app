import request from 'supertest';
import app from '../src/server';
import db from '../src/db';
import { createTestUser, generateAuthToken, cleanupTestData } from './test-helpers';

describe('Validation Middleware Integration Tests', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Create test user and get auth token
    const testUser = await createTestUser();
    userId = testUser.id;
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await db.destroy();
  });

  describe('Auth Routes Validation', () => {
    describe('POST /api/auth/register', () => {
      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            username: 'testuser',
            password: 'Test123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'body.email',
            code: 'INVALID_EMAIL'
          })
        );
      });

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            username: 'testuser',
            password: 'weak'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'body.password',
            code: 'STRING_TOO_SHORT'
          })
        );
      });

      it('should reject missing required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test123!'
            // Missing username
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'body.username',
            code: 'FIELD_REQUIRED'
          })
        );
      });

      it('should accept valid registration data', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'newuser@example.com',
            username: 'newuser123',
            password: 'Test123!',
            firstName: 'John',
            lastName: 'Doe'
          });

        // Might fail if user exists, but validates correctly
        expect([200, 201, 409]).toContain(response.status);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should validate login fields', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email'
            // Missing password
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toHaveLength(2);
      });
    });
  });

  describe('Profile Routes Validation', () => {
    describe('PUT /api/profile', () => {
      it('should validate profile update fields', async () => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: 'invalid-email',
            bio: 'a'.repeat(1001) // Too long
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'body.email',
            code: 'INVALID_EMAIL'
          })
        );
      });

      it('should accept valid profile updates', async () => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            bio: 'Updated bio',
            preferences: {
              language: 'en',
              notifications: {
                email: true,
                push: false
              }
            }
          });

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/profile/echo-score/history', () => {
      it('should validate query parameters', async () => {
        const response = await request(app)
          .get('/api/profile/echo-score/history')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ days: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'query.days',
            code: 'MUST_BE_INTEGER'
          })
        );
      });

      it('should validate date range constraints', async () => {
        const response = await request(app)
          .get('/api/profile/echo-score/history')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ 
            startDate: '2024-01-01',
            endDate: '2023-12-31' // Before start date
          });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Challenge Routes Validation', () => {
    describe('POST /api/challenge/:id/submit', () => {
      it('should validate challenge ID parameter', async () => {
        const response = await request(app)
          .post('/api/challenge/invalid-id/submit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            answer: 'test',
            timeSpentSeconds: 30
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'params.id',
            code: 'MUST_BE_INTEGER'
          })
        );
      });

      it('should validate answer types', async () => {
        const response = await request(app)
          .post('/api/challenge/1/submit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            answer: { nested: { too: { deep: 'value' } } },
            timeSpentSeconds: -5 // Negative time
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'body.timeSpentSeconds',
            code: 'NUMBER_TOO_SMALL'
          })
        );
      });

      it('should accept valid challenge submission', async () => {
        const response = await request(app)
          .post('/api/challenge/1/submit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            answer: 'Option A',
            timeSpentSeconds: 45,
            metadata: {
              deviceType: 'ios',
              appVersion: '1.0.0',
              confidence: 80
            }
          });

        // Might fail if challenge doesn't exist, but validates correctly
        expect([200, 404]).toContain(response.status);
      });
    });

    describe('GET /api/challenge/leaderboard', () => {
      it('should validate leaderboard query params', async () => {
        const response = await request(app)
          .get('/api/challenge/leaderboard')
          .query({
            timeframe: 'invalid',
            limit: 200 // Too high
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toHaveLength(2);
      });
    });
  });

  describe('Content Routes Validation', () => {
    describe('GET /api/content/search', () => {
      it('should require search query', async () => {
        const response = await request(app)
          .get('/api/content/search');

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'query.q',
            code: 'FIELD_REQUIRED'
          })
        );
      });

      it('should validate query length', async () => {
        const response = await request(app)
          .get('/api/content/search')
          .query({ q: 'a' }); // Too short

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'query.q',
            message: expect.stringContaining('at least 2 characters')
          })
        );
      });

      it('should validate bias filter values', async () => {
        const response = await request(app)
          .get('/api/content/search')
          .query({
            q: 'climate change',
            bias: ['invalid-bias', 'another-invalid']
          });

        expect(response.status).toBe(400);
      });

      it('should accept valid search with filters', async () => {
        const response = await request(app)
          .get('/api/content/search')
          .query({
            q: 'climate change',
            bias: ['left', 'center', 'right'],
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
            page: 1,
            limit: 20
          });

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/content/recommendations', () => {
      it('should require topic for recommendations', async () => {
        const response = await request(app)
          .get('/api/content/recommendations')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'query.topic',
            code: 'FIELD_REQUIRED'
          })
        );
      });
    });
  });

  describe('Echo Score Routes Validation', () => {
    describe('GET /api/echo-score/progress', () => {
      it('should validate period parameter', async () => {
        const response = await request(app)
          .get('/api/echo-score/progress')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ period: 'monthly' }); // Invalid

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'query.period',
            message: expect.stringContaining('must be one of')
          })
        );
      });

      it('should accept valid period', async () => {
        const response = await request(app)
          .get('/api/echo-score/progress')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ period: 'weekly' });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Admin Routes Validation', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Create admin user
      const adminUser = await createTestUser({ id: 1, role: 'admin' });
      adminToken = generateAuthToken(adminUser);
    });

    describe('POST /api/admin/sources', () => {
      it('should validate source creation', async () => {
        const response = await request(app)
          .post('/api/admin/sources')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Source',
            domain: 'invalid-domain',
            bias_rating: 'invalid-bias'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toHaveLength(2);
      });

      it('should accept valid source', async () => {
        const response = await request(app)
          .post('/api/admin/sources')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test News Source',
            domain: 'test-news.com',
            bias_rating: 'center',
            credibility_score: 75,
            description: 'Test news source'
          });

        expect([201, 409]).toContain(response.status);
      });
    });

    describe('POST /api/admin/curate/topic', () => {
      it('should validate curation parameters', async () => {
        const response = await request(app)
          .post('/api/admin/curate/topic')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            topic: '',
            minBiasVariety: 10, // Too high
            maxAge: 100 // Too high
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toHaveLength(3);
      });
    });
  });

  describe('Network Diagnostic Routes Validation', () => {
    describe('GET /api/diagnostics/client/:identifier', () => {
      it('should validate client identifier format', async () => {
        const response = await request(app)
          .get('/api/diagnostics/client/invalid@identifier');

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toContainEqual(
          expect.objectContaining({
            field: 'params.identifier',
            message: expect.stringContaining('pattern')
          })
        );
      });

      it('should accept valid identifier', async () => {
        const response = await request(app)
          .get('/api/diagnostics/client/device_12345');

        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /api/diagnostics/clear', () => {
      it('should validate clear options', async () => {
        const response = await request(app)
          .delete('/api/diagnostics/clear')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'invalid-type',
            olderThan: 'not-a-date'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.validationErrors).toHaveLength(2);
      });
    });
  });

  describe('Error Format Consistency', () => {
    it('should have consistent error format across all routes', async () => {
      const routes = [
        { method: 'post', path: '/api/auth/register', data: {} },
        { method: 'put', path: '/api/profile', data: { email: 'bad' }, auth: true },
        { method: 'post', path: '/api/challenge/abc/submit', data: {}, auth: true },
        { method: 'get', path: '/api/content/search', query: {} }
      ];

      for (const route of routes) {
        const req = request(app)[route.method](route.path);
        
        if (route.auth) {
          req.set('Authorization', `Bearer ${authToken}`);
        }
        
        if (route.data) {
          req.send(route.data);
        }
        
        if (route.query) {
          req.query(route.query);
        }

        const response = await req;

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error).toHaveProperty('validationErrors');
        expect(Array.isArray(response.body.error.validationErrors)).toBe(true);
        
        if (response.body.error.validationErrors.length > 0) {
          const error = response.body.error.validationErrors[0];
          expect(error).toHaveProperty('field');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('code');
        }
      }
    });
  });
}); 