import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

describe('Password hashing using bcrypt', () => {
  it('should hash and verify a password', async () => {
    const password = 'secret123';
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    expect(hash).not.toBe(password);
    const matches = await bcrypt.compare(password, hash);
    expect(matches).toBe(true);
  });
});
