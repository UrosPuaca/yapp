import { apiRequest } from './client.js';

// Moj profil (UserResponseDTO): name, surname, email, username, profileImageUrl
export function getMe() {
  return apiRequest('/api/user/me');
}

// Javni profil drugog korisnika (PublicUserResponseDTO):
// name, surname, username, profileImageUrl
export function getUser(userId) {
  return apiRequest(`/api/user/${userId}`);
}

// Postavljanje profilne slike — saljemo URL dobijen od media servisa
export function updateAvatar(url) {
  return apiRequest('/api/user/me/avatar', {
    method: 'PUT',
    body: { url },
  });
}

// Pretraga korisnika po delu imena/username-a. Vraca listu javnih profila.
export function searchUsers(query) {
  return apiRequest(`/api/user/search?query=${encodeURIComponent(query)}`);
}
