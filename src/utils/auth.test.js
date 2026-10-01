import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from './apiClient.js';
import { registerUser, loginUser, forgotPassword, setAuthSession } from './auth.js';
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession, getAuthSession, isAuthenticated } from './auth.js';
import { requestApi } from './apiClient.js';

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

test('remote devices use the same-origin proxy instead of a loopback API URL', () => {
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:3000', '192.168.1.25'), '');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:3000', 'localhost'), 'http://127.0.0.1:3000');
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

test('expired server token automatically clears the session and emits a logout event', async t => {
  const originalWindow = globalThis.window;
  const eventTarget = new EventTarget();
  globalThis.window = eventTarget;
  clearAuthSession();
  t.after(() => {
    clearAuthSession();
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  let expiryEvent;
  eventTarget.addEventListener(AUTH_SESSION_EXPIRED_EVENT, event => { expiryEvent = event; });
  const expiry = Math.ceil(Date.now() / 1000) + 1;
  const payload = btoa(JSON.stringify({ exp: expiry })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  setAuthSession({ id: 1, name: 'Khách', email: 'a@example.com' }, `header.${payload}.signature`);

  assert.equal(isAuthenticated(), true);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Session expiry event was not emitted.')), 3000);
    eventTarget.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });

  assert.equal(getAuthSession(), null);
  assert.equal(expiryEvent.type, AUTH_SESSION_EXPIRED_EVENT);
});

test('a 401 from an authenticated API clears the current session', async t => {
  const originalFetch = globalThis.fetch;
  clearAuthSession();
  setAuthSession({ id: 1, name: 'Khách', email: 'a@example.com' }, 'server.jwt.customer');
  globalThis.fetch = async () => createJsonResponse({ message: 'Token hết hạn.' }, 401);
  t.after(() => {
    globalThis.fetch = originalFetch;
    clearAuthSession();
  });

  await assert.rejects(requestApi('/api/admin/stats'), /Token hết hạn/);
  assert.equal(getAuthSession(), null);
});
