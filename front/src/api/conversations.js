import { apiRequest } from './client.js';

// Lista mojih razgovora (MyChatDTO[]):
// conversationId, otherUserId, username, profileImageUrl, lastMessage, lastMessageTime
export function getMyChats() {
  return apiRequest('/api/conversation');
}

// Otvara razgovor sa korisnikom. Ako vec postoji, backend vraca postojeci.
// Odgovor nosi samo conversationId — username i avatar front vec ima
// iz rezultata pretrage.
export function openConversation(otherUserId) {
  return apiRequest('/api/conversation', {
    method: 'POST',
    body: { otherUserId },
  });
}
