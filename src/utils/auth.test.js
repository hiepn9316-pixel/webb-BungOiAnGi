import test from 'node:test';
import assert from 'node:assert/strict';
import { registerUser, loginUser, forgotPassword } from './auth.js';

test('registerUser should create a user and token', async () => {
  const result = await registerUser({
    name: 'Nguyễn A',
    email: 'a@example.com',
    password: '123456',
  });

  assert.equal(result.ok, true);
  assert.ok(result.token);
  assert.equal(result.user.email, 'a@example.com');
});

test('loginUser should authenticate valid user', async () => {
  const result = await loginUser({ email: 'a@example.com', password: '123456' });

  assert.equal(result.ok, true);
  assert.ok(result.token);
});

test('forgotPassword should reset password', async () => {
  const result = await forgotPassword({
    email: 'a@example.com',
    newPassword: '654321',
  });

  assert.equal(result.ok, true);
  const loginResult = await loginUser({ email: 'a@example.com', password: '654321' });
  assert.equal(loginResult.ok, true);
});
