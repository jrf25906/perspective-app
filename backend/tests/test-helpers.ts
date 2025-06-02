import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../src/db';

interface TestUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role?: string;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password_hash: await bcrypt.hash('Test123!', 10),
    role: 'user',
    ...overrides
  };

  const [user] = await db('users')
    .insert({
      email: defaultUser.email,
      username: defaultUser.username,
      password_hash: defaultUser.password_hash,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning(['id', 'email', 'username', 'password_hash']);

  return user;
}

/**
 * Generate a valid JWT token for testing
 */
export function generateAuthToken(user: Pick<TestUser, 'id' | 'email'>): string {
  const payload = {
    id: user.id,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData(): Promise<void> {
  // Clean up in reverse order of foreign key dependencies
  await db('user_challenge_submissions').whereRaw("created_at > NOW() - INTERVAL '1 day'").delete();
  await db('user_challenge_stats').whereRaw("created_at > NOW() - INTERVAL '1 day'").delete();
  await db('echo_scores').whereRaw("created_at > NOW() - INTERVAL '1 day'").delete();
  await db('user_sessions').whereRaw("created_at > NOW() - INTERVAL '1 day'").delete();
  
  // Delete test users (those created in tests)
  await db('users').where('email', 'like', 'test%@example.com').delete();
}

/**
 * Create test challenge data
 */
export async function createTestChallenge(overrides?: any) {
  const defaultChallenge = {
    type: 'multiple_choice',
    prompt: 'Test challenge prompt',
    options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
    correct_answer: JSON.stringify('Option A'),
    explanation: 'Test explanation',
    difficulty: 'intermediate',
    topic: 'test-topic',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };

  const [challenge] = await db('challenges')
    .insert(defaultChallenge)
    .returning('*');

  return challenge;
}

/**
 * Create test content/article
 */
export async function createTestContent(sourceId: number, overrides?: any) {
  const defaultContent = {
    source_id: sourceId,
    title: 'Test Article Title',
    url: 'https://test.com/article',
    bias_rating: 'center',
    published_at: new Date(),
    topics: JSON.stringify(['test-topic']),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };

  const [content] = await db('content')
    .insert(defaultContent)
    .returning('*');

  return content;
}

/**
 * Create test news source
 */
export async function createTestNewsSource(overrides?: any) {
  const defaultSource = {
    name: `Test Source ${Date.now()}`,
    domain: `test${Date.now()}.com`,
    bias_rating: 'center',
    credibility_score: 75,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };

  const [source] = await db('news_sources')
    .insert(defaultSource)
    .returning('*');

  return source;
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock external API calls
 */
export function mockExternalAPIs() {
  // Mock news API responses
  jest.mock('../src/integrations/newsIntegration', () => ({
    searchArticles: jest.fn().mockResolvedValue([
      {
        title: 'Mock Article',
        url: 'https://mock.com/article',
        publishedAt: new Date(),
        source: { name: 'Mock Source' }
      }
    ])
  }));
} 