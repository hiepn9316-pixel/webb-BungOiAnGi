import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from './apiClient.js';
import { registerUser, loginUser, forgotPassword, setAuthSession } from './auth.js';
import { AUTH_SESSION_EXPIRED_EVENT, clearAuthSession, getAuthSession, isAuthenticated, validateAuthInput } from './auth.js';
import { requestApi } from './apiClient.js';

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('register and login use the local JSON Server auth endpoints', async t => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  clearAuthSession();
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    const isRegister = new URL(url, 'http://localhost').pathname === '/register';
    return createJsonResponse({
      accessToken: `token-${isRegister ? 'register' : 'login'}`,
      user: { id: isRegister ? 2 : 1, name: 'Nguyễn A', email: 'a@example.com', role: 'customer' },
    }, isRegister ? 201 : 200);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    clearAuthSession();
  });

  const registered = await registerUser({ name: ' Nguyễn A ', email: 'A@Example.com', password: '123456' });
  assert.equal(registered.ok, true);
  assert.equal(registered.user.email, 'a@example.com');
  assert.equal(Object.hasOwn(getAuthSession(), 'provider'), false);

  const loggedIn = await loginUser({ email: 'A@Example.com', password: '123456' });
  assert.equal(loggedIn.ok, true);
  assert.equal(loggedIn.token, 'token-login');
  assert.deepEqual(requests.map(request => new URL(request.url, 'http://localhost').pathname), ['/register', '/login']);
  assert.deepEqual(requests[0].body, { name: 'Nguyễn A', email: 'a@example.com', password: '123456' });
  assert.deepEqual(requests[1].body, { email: 'a@example.com', password: '123456' });
});

test('auth validation keeps the submitted password unchanged', () => {
  assert.equal(validateAuthInput({ email: 'a@example.com', password: ' Customer123! ' }), '');
  assert.notEqual(validateAuthInput({ email: 'a@example.com', password: '     ' }), '');
});

test('default API requests use the same-origin proxy', () => {
  assert.equal(resolveApiBaseUrl(), '');
});

test('configured loopback API URL uses the same-origin proxy on local and remote devices', () => {
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:3000', '192.168.1.25'), '');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:3000', 'localhost'), '');
});

test('configured non-loopback API URL is used directly', () => {
  assert.equal(resolveApiBaseUrl('https://api.example.com', 'localhost'), 'https://api.example.com');
});

test('password reset remains disabled until its email verification flow is implemented', async () => {
  const result = await forgotPassword({ email: 'a@example.com', newPassword: '654321' });
  assert.equal(result.ok, false);
  assert.match(result.message, /xác minh email/i);
});

test('expired auth token automatically clears the session and emits a logout event', async t => {
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

test('a 401 from API clears the expired local session', async t => {
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
