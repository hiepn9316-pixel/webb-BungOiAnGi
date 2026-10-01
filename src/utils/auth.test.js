import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from './apiClient.js';
import { registerUser, loginUser, forgotPassword } from './auth.js';
import { clearAuthSession, getAuthSession } from './auth.js';

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installAuthApiMock() {
  const users = [];
  let id = 1;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    const path = new URL(url, 'http://localhost').pathname;
    const body = options.body ? JSON.parse(options.body) : {};

    if (path === '/register') {
      if (users.some(user => user.email === body.email)) return createJsonResponse('Email already exists', 400);
      const user = { id: id++, name: body.name, email: body.email, role: 'customer' };
      users.push({ ...user, password: body.password });
      return createJsonResponse({ user, accessToken: 'server.jwt.customer' }, 201);
    }

    if (path === '/login') {
      const user = users.find(item => item.email === body.email && item.password === body.password);
      if (!user) return createJsonResponse('Incorrect password', 400);
      const { password, ...publicUser } = user;
      return createJsonResponse({ user: publicUser, accessToken: 'server.jwt.customer' });
    }

    return createJsonResponse({ message: 'Not found' }, 404);
  };

  return () => { globalThis.fetch = originalFetch; };
}

test('register and login use server-issued JWT and customer role', async t => {
  const restoreFetch = installAuthApiMock();
  t.after(() => {
    clearAuthSession();
    restoreFetch();
  });

  const registered = await registerUser({ name: 'Nguyễn A', email: 'a@example.com', password: '123456' });
  assert.equal(registered.ok, true);
  assert.equal(registered.user.role, 'customer');
  assert.equal(getAuthSession().token, 'server.jwt.customer');

  const loggedIn = await loginUser({ email: 'a@example.com', password: '123456' });
  assert.equal(loggedIn.ok, true);
  assert.equal(loggedIn.user.email, 'a@example.com');

  const duplicate = await registerUser({ name: 'Nguyễn A', email: 'a@example.com', password: '123456' });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.message, /đã được đăng ký/i);
});

test('default API base URL points to the local JSON Server backend', () => {
  assert.equal(resolveApiBaseUrl(), 'http://127.0.0.1:3000');
});

test('password reset stays disabled without email verification', async () => {
  const result = await forgotPassword({ email: 'a@example.com', newPassword: '654321' });
  assert.equal(result.ok, false);
  assert.match(result.message, /xác minh email/i);
});

test('login surfaces backend connection errors clearly', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Failed to fetch');
  };

  try {
    const result = await loginUser({ email: 'a@example.com', password: '123456' });
    assert.equal(result.ok, false);
    assert.match(result.message, /không thể kết nối|máy chủ|API/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
