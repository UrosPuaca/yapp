import { apiRequest } from './client.js';

export function register({ username, email, password, name, surname }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { username, email, password, name, surname },
  });
}

// Login ide preko email-a; backend vraca token kao cist tekst
export function login({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}
