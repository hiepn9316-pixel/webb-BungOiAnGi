export function resolveApiBaseUrl() {
  const configured = String(import.meta.env?.VITE_API_URL ?? '').trim();
  return configured ? configured.replace(/\/$/, '') : 'http://127.0.0.1:3000';
}

const API_BASE_URL = resolveApiBaseUrl();
const AUTH_STORAGE_KEY = 'bung_auth_session';

function readSession() {
  try {
    const storage = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : null;
    const raw = storage?.getItem(AUTH_STORAGE_KEY)
      ?? globalThis.__bungoiangi_store__?.[AUTH_STORAGE_KEY];
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function requestApi(path, { method = 'GET', body, auth = true, signal } = {}) {
  const guardedPath = auth && path.startsWith('/api/') ? `/660${path}` : path;
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  const token = readSession()?.token;
  if (auth && token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${guardedPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) return null;

  const responseText = await response.text();
  let result = null;
  try {
    result = responseText ? JSON.parse(responseText) : null;
  } catch {
    result = responseText;
  }

  if (!response.ok) {
    const message = typeof result === 'string' ? result : result?.message;
    throw new Error(message || `Yêu cầu thất bại (${response.status}).`);
  }

  return result;
}

export function uploadImageToCloudinary(file, { signal } = {}) {
  const cloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Chưa cấu hình Cloudinary. Hãy khai báo cloud name và unsigned upload preset trong .env.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  return fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body: formData,
    signal,
  }).then(async response => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Tải ảnh lên Cloudinary thất bại.');
    return result.secure_url;
  });
}
