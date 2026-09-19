import { apiRequest } from './client.js';

// Trenutni status jednog korisnika — koristi se za pocetni snapshot,
// jer /topic/online javlja samo promene od trenutka pretplate.
export function getPresence(userId) {
  return apiRequest(`/api/presence/status/${userId}`);
}
