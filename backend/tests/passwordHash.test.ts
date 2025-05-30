import bcrypt from 'bcrypt';

describe('Password hashing using bcrypt', () => {
  it('should hash and verify a password', async () => {
    const password = 'secret123';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    const matches = await bcrypt.compare(password, hash);
    expect(matches).toBe(true);
  });
});
