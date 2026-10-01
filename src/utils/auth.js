import defaultUsers from '../data/users.json' with { type: 'json' };

const USERS_KEY = 'bung_users';
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
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

export function loadUsers() {
  const storage = getStorage();
  const raw = storage.getItem(USERS_KEY);

  if (!raw) {
    storage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }

  return safeJsonParse(raw, [...defaultUsers]);
}

export function saveUsers(users) {
  const storage = getStorage();
  storage.setItem(USERS_KEY, JSON.stringify(users));
}

export function createToken(payload) {
  const encodeBase64 = (value) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value);

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(text, 'utf8').toString('base64url');
    }

    const encoded = btoa(unescape(encodeURIComponent(text)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  const header = encodeBase64({ alg: 'HS256', typ: 'JWT' });
  const body = encodeBase64({ ...payload, iat: Date.now() });
  const signature = encodeBase64({ secret: 'bungoiangi-demo-token' });
  return `${header}.${body}.${signature}`;
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
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
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
  await new Promise(resolve => setTimeout(resolve, 250));

  const error = validateAuthInput({ name, email, password });
  if (error) {
    return { ok: false, message: error };
  }

  const users = loadUsers();
  const normalizedEmail = normalizeEmail(email);
  const existed = users.some(user => normalizeEmail(user.email) === normalizedEmail);

  if (existed) {
    return { ok: false, message: 'Email này đã được đăng ký.' };
  }

  const newUser = {
    id: Date.now(),
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password).trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const token = createToken({ id: newUser.id, email: newUser.email, name: newUser.name });
  setAuthSession(newUser, token);

  return {
    ok: true,
    token,
    user: sanitizeUser(newUser),
    message: 'Đăng ký thành công! Bạn đã được đăng nhập tự động.',
  };
}

export async function apiLogin({ email, password }) {
  await new Promise(resolve => setTimeout(resolve, 250));

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { ok: false, message: 'Vui lòng nhập email và mật khẩu.' };
  }

  const users = loadUsers();
  const user = users.find(item => normalizeEmail(item.email) === normalizedEmail && String(item.password) === String(password));

  if (!user) {
    return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
  }

  const token = createToken({ id: user.id, email: user.email, name: user.name });
  setAuthSession(user, token);

  return {
    ok: true,
    token,
    user: sanitizeUser(user),
    message: 'Đăng nhập thành công.',
  };
}

export async function apiForgotPassword({ email, newPassword }) {
  await new Promise(resolve => setTimeout(resolve, 250));

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { ok: false, message: 'Vui lòng nhập email.' };
  }

  const error = validateAuthInput({ email: normalizedEmail, newPassword });
  if (error) {
    return { ok: false, message: error };
  }

  const users = loadUsers();
  const index = users.findIndex(user => normalizeEmail(user.email) === normalizedEmail);

  if (index === -1) {
    return { ok: false, message: 'Email chưa được đăng ký trong hệ thống.' };
  }

  users[index].password = String(newPassword).trim();
  saveUsers(users);

  return {
    ok: true,
    message: 'Mật khẩu mới đã được cập nhật. Vui lòng đăng nhập lại.',
  };
}

export function logout() {
  clearAuthSession();
  return { ok: true, message: 'Bạn đã đăng xuất.' };
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.token);
}
