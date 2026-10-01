import { requestApi } from './apiClient.js';

const AUTH_KEY = 'bung_auth_session';

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;

  const globalStore = globalThis.__bungoiangi_store__ ??= Object.create(null);
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(globalStore, key) ? globalStore[key] : null; },
    setItem(key, value) { globalStore[key] = String(value); },
    removeItem(key) { delete globalStore[key]; },
  };
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'customer',
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

export function getAuthSession() {
  const storage = getStorage();
  const session = safeJsonParse(storage.getItem(AUTH_KEY), null);
  if (!session) return null;

  if (session.expiresAt && Date.now() > session.expiresAt) {
    storage.removeItem(AUTH_KEY);
    return null;
  }

  return session;
}

export function setAuthSession(user, token) {
  const storage = getStorage();
  storage.setItem(AUTH_KEY, JSON.stringify({
    user: sanitizeUser(user),
    token,
    expiresAt: Date.now() + 1000 * 60 * 60,
  }));
}

export function clearAuthSession() {
  const storage = getStorage();
  storage.removeItem(AUTH_KEY);
}

export function validateAuthInput({ name, email, password, newPassword }) {
  if (name !== undefined && String(name).trim().length < 2) {
    return 'Tên người dùng phải có ít nhất 2 ký tự.';
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Email không hợp lệ.';
  }

  const finalPassword = String(password || newPassword || '').trim();
  if (!finalPassword || finalPassword.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }

  return '';
}

export async function registerUser(data) {
  return apiRegister(data);
}

export async function loginUser(data) {
  return apiLogin(data);
}

export async function forgotPassword(data) {
  return apiForgotPassword(data);
}

export async function apiRegister({ name, email, password }) {
  const error = validateAuthInput({ name, email, password });
  if (error) {
    return { ok: false, message: error };
  }

  try {
    const result = await requestApi('/register', {
      method: 'POST',
      auth: false,
      body: { name: String(name).trim(), email: normalizeEmail(email), password },
    });
    const user = sanitizeUser(result.user);
    setAuthSession(user, result.accessToken);
    return { ok: true, token: result.accessToken, user, message: 'Đăng ký thành công! Bạn đã được đăng nhập tự động.' };
  } catch (requestError) {
    const message = /already exists/i.test(requestError.message)
      ? 'Email này đã được đăng ký.'
      : requestError.message;
    return { ok: false, message };
  }
}

export async function apiLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { ok: false, message: 'Vui lòng nhập email và mật khẩu.' };
  }

  try {
    const result = await requestApi('/login', {
      method: 'POST',
      auth: false,
      body: { email: normalizedEmail, password },
    });
    const user = sanitizeUser(result.user);
    setAuthSession(user, result.accessToken);
    return { ok: true, token: result.accessToken, user, message: 'Đăng nhập thành công.' };
  } catch {
    return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
  }
}

export async function apiForgotPassword() {
  return {
    ok: false,
    message: 'Đặt lại mật khẩu cần dịch vụ xác minh email. Vui lòng liên hệ quản trị viên.',
  };
}

export function logout() {
  clearAuthSession();
  return { ok: true, message: 'Bạn đã đăng xuất.' };
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.token);
}
