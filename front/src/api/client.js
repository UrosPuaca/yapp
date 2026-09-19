
export const API_URL = 'http://localhost:8090';


const TOKEN_KEY = 'buddy_token';

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Izvlaci moj userId iz JWT tokena (srednji deo tokena je Base64 JSON).
// Backend stavlja userId u "sub" polje; pokrivamo i par alternativa.
export function getUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const id = json.sub ?? json.userId ?? json.id;
    return id != null ? Number(id) : null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'string' && data
        ? data
        : data?.message || data?.error || `Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

// Upload fajla (multipart) — za slike/fajlove. Ne stavljamo Content-Type rucno,
// browser ga sam postavi zajedno sa granicom (boundary) za multipart.
export async function apiUpload(path, file) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: form,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'string' && data
        ? data
        : data?.message || data?.error || `Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}
