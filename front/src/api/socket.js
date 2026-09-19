import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_URL, getToken } from './client.js';

// STOMP klijent — jedna zajednicka websocket veza za celu aplikaciju
let client = null;

/**
 * Otvara websocket vezu ka backendu (SockJS + STOMP).
 * Token se salje kao STOMP header u CONNECT frame-u.
 */
export function connectSocket({ onConnect } = {}) {
  disconnectSocket();

  const token = getToken();
  if (!token) {
    console.warn('[WS] nema tokena — ne otvaram vezu');
    return;
  }

  client = new Client({
    webSocketFactory: () => new SockJS(`${API_URL}/end-point`),
    reconnectDelay: 5000, // ako veza pukne, sam pokusava ponovo na 5s
    // Cita se pred SVAKI pokusaj konekcije (i pred svaki reconnect),
    // pa uvek ide aktuelan token iz localStorage.
    beforeConnect: () => {
      client.connectHeaders = { Authorization: `Bearer ${getToken()}` };
    },
    onConnect: () => {
      console.log('[WS] povezan');
      onConnect?.();
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP greska:', frame.headers['message']);
    },
    onWebSocketClose: () => {
      console.log('[WS] veza zatvorena');
    },
  });

  client.activate();
}

export function disconnectSocket() {
  if (client) {
    client.deactivate();
    client = null;
  }
}


export function subscribe(destination, callback) {
  if (!client || !client.connected) return null;
  return client.subscribe(destination, (msg) => {
    // Vecina kanala salje JSON, ali presence salje cist tekst ("5:online").
    // Ako parsiranje ne uspe, prosledi sirov string.
    let data;
    try {
      data = JSON.parse(msg.body);
    } catch {
      data = msg.body;
    }
    callback(data);
  });
}

/** Slanje na kanal */
export function sendSocket(destination, payload) {
  if (!client || !client.connected) return;
  client.publish({ destination, body: JSON.stringify(payload) });
}
