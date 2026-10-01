import { AUTH_SESSION_EXPIRED_EVENT } from './apiClient.js';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { loadSupabaseProfile, updateSupabaseProfileName } from './supabaseData.js';

const AUTH_KEY = 'bung_auth_session';
const DEFAULT_SESSION_DURATION = 1000 * 60 * 60;
let sessionExpiryTimer = null;

export { AUTH_SESSION_EXPIRED_EVENT };

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

function sanitizeUser(user, profile = null) {
  if (!user) return null;
  return {
    id: user.id,
    name: profile?.name || user.user_metadata?.name || user.name || '',
    email: user.email,
    role: profile?.role || 'customer',
    createdAt: profile?.created_at || user.created_at || user.createdAt || new Date().toISOString(),
  };
}

function tokenExpiry(token) {
  const payload = String(token || '').split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const expiry = JSON.parse(decoded).exp;
    return Number.isFinite(expiry) ? expiry * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleSessionExpiry(expiresAt, token) {
  if (sessionExpiryTimer !== null) clearTimeout(sessionExpiryTimer);
  const delay = expiresAt - Date.now();

  if (delay <= 0) {
    clearAuthSession();
    globalThis.window?.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    return;
  }

  sessionExpiryTimer = setTimeout(() => {
    const storage = getStorage();
    const session = safeJsonParse(storage.getItem(AUTH_KEY), null);
    if (!session || session.token !== token) return;

    if (session.expiresAt > Date.now()) {
      scheduleSessionExpiry(session.expiresAt, token);
      return;
    }

    clearAuthSession();
    globalThis.window?.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }, delay);
  sessionExpiryTimer.unref?.();
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

export function setAuthSession(user, token, profile = null) {
  const expiresAt = tokenExpiry(token) || Date.now() + DEFAULT_SESSION_DURATION;
  const storage = getStorage();
  storage.setItem(AUTH_KEY, JSON.stringify({
    user: sanitizeUser(user, profile),
    token,
    expiresAt,
    provider: 'supabase',
  }));
  scheduleSessionExpiry(expiresAt, token);
}

async function syncSupabaseSession(session) {
  if (!session?.access_token || !session.user) {
    clearAuthSession();
    return;
  }
  setAuthSession(session.user, session.access_token);
  try {
    const profile = await loadSupabaseProfile(session.user.id);
    if (getAuthSession()?.token === session.access_token) {
      setAuthSession(session.user, session.access_token, profile);
    }
  } catch (error) {
    console.error('Không thể tải hồ sơ Supabase:', error.message);
  }
}

export async function initializeAuth() {
  if (!isSupabaseConfigured || !supabase) {
    clearAuthSession();
    throw new Error('Chưa cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) {
    const profile = await loadSupabaseProfile(data.session.user.id);
    setAuthSession(data.session.user, data.session.access_token, profile);
  } else {
    clearAuthSession();
  }
  return Boolean(data.session);
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => { void syncSupabaseSession(session); });
  });
}

export function clearAuthSession() {
  if (sessionExpiryTimer !== null) clearTimeout(sessionExpiryTimer);
  sessionExpiryTimer = null;
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

function getRequestFailureMessage(error, fallback = 'Thao tác không thành công. Vui lòng thử lại.') {
  const message = String(error?.message || '').trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (/already registered|already exists|email.*đã được đăng ký|email.*đã tồn tại/i.test(message)) {
    return 'Email này đã được đăng ký.';
  }

  if (/invalid login credentials|invalid credentials/i.test(lower)) {
    return 'Email hoặc mật khẩu không đúng.';
  }

  if (/failed to fetch|network|load failed|fetch failed|connection|timeout|api.*unavailable|not connected/i.test(lower)) {
    return 'Không thể kết nối Supabase. Hãy kiểm tra cấu hình dự án và kết nối mạng.';
  }

  return message;
}

export async function apiRegister({ name, email, password }) {
  const error = validateAuthInput({ name, email, password });
  if (error) {
    return { ok: false, message: error };
  }

  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Chưa cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { name: String(name).trim() } },
    });
    if (signUpError) throw signUpError;

    const user = data.user ? sanitizeUser(data.user) : null;
    if (data.session) {
      const profile = await loadSupabaseProfile(data.user.id);
      setAuthSession(data.user, data.session.access_token, profile);
      const authenticatedUser = sanitizeUser(data.user, profile);
      return { ok: true, token: data.session.access_token, user: authenticatedUser, message: 'Đăng ký thành công! Bạn đã được đăng nhập tự động.' };
    }
    return {
      ok: true,
      requiresEmailConfirmation: true,
      user,
      message: 'Đăng ký thành công. Hãy xác nhận email rồi đăng nhập.',
    };
  } catch (requestError) {
    return { ok: false, message: getRequestFailureMessage(requestError, 'Đăng ký thất bại. Vui lòng thử lại.') };
  }
}

export async function apiLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { ok: false, message: 'Vui lòng nhập email và mật khẩu.' };
  }

  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Chưa cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (signInError) throw signInError;

    const profile = await loadSupabaseProfile(data.user.id);
    const user = sanitizeUser(data.user, profile);
    setAuthSession(data.user, data.session.access_token, profile);
    return { ok: true, token: data.session.access_token, user, message: 'Đăng nhập thành công.' };
  } catch (requestError) {
    const message = getRequestFailureMessage(requestError, 'Email hoặc mật khẩu không đúng.');
    return { ok: false, message };
  }
}

export async function apiForgotPassword() {
  return {
    ok: false,
    message: 'Đặt lại mật khẩu cần luồng xác minh email. Vui lòng liên hệ quản trị viên.',
  };
}

export async function updateProfileName(name) {
  const normalizedName = String(name || '').trim();
  if (normalizedName.length < 2) throw new Error('Tên người dùng phải có ít nhất 2 ký tự.');

  const user = await updateSupabaseProfileName(normalizedName);
  const session = getAuthSession();
  if (session?.token) setAuthSession(session.user, session.token, user);
  return user;
}

export async function logout() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  clearAuthSession();
  return { ok: true, message: 'Bạn đã đăng xuất.' };
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.token);
}
