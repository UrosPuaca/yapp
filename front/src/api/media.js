import { apiUpload } from './client.js';

// Upload fajla na cloud — backend vraca URL slike (cist tekst)
export function uploadMedia(file) {
  return apiUpload('/api/media/upload', file);
}
