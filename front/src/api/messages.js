import { apiRequest } from './client.js';

// Koliko poruka backend vrati po strani (mora da se poklapa sa backendom)
export const PAGE_SIZE = 20;

// Istorija poruka jednog razgovora (Message[]):
// id, conversationId, senderId, text, imageUrl, createdAt, status
//
// `before` je id NAJSTARIJE poruke koju vec imamo — backend vrati 20 starijih
// od nje. Bez njega vrati poslednjih 20.
export function getMessages(conversationId, before) {
  const qs = before != null ? `?before=${before}` : '';
  return apiRequest(`/api/message/${conversationId}${qs}`);
}
