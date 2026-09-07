# Yapp — Message Status (SENT / DELIVERED / SEEN)

Ovaj fajl je kontekst za rad na sledećem feature-u: **status poruke**.
Trenutno stanje projekta je opisano tačno onako kako jeste u kodu (grana `master`).

---

## 1. Kontekst projekta

**Yapp** — chat aplikacija, Spring Boot mikroservisi, Java + Maven, monorepo.

| Servis | Port | Baza / Storage | Uloga |
|---|---|---|---|
| `gateway` | 8090 | — | Spring Cloud Gateway, JWT filter, CORS, rutiranje |
| `auth` | 8080 | Postgres 5433 | registracija/login, JWT, user profil, avatar upload |
| `message` | 8081 | Postgres 5434 | konverzacije, poruke, WebSocket/STOMP |
| `media` | 8082 | Postgres 5435 | media fajlovi |
| `presence` | 8083 | Redis 6379 | online/offline status, lastSeen |

**Rute na gateway-u** (`gateway/config/RouteConfig.java`):
- `/api/auth/**`, `/api/user/**` → 8080
- `/api/message/**`, `/api/conversation/**` → 8081
- `/end-point/**` (WebSocket) → 8081
- `/api/media/**` → 8082
- `/api/presence/**` → 8083

Gateway `JwtFilter` validira token i prosleđuje `X-User-Id` header ka servisima.
REST kontroleri u `message` servisu čitaju `@RequestHeader("X-User-Id")`.

---

## 2. Trenutno stanje `message` servisa

Paket: `com.yapp.message`

### Model

`Message` (tabela `messages`):
```
id, conversationId, senderId, text (TEXT, nullable), imageUrl (nullable),
createdAt (@CreationTimestamp), status (enum STRING, NOT NULL)
```

`Conversation` (tabela `conversations`):
```
id, user1Id, user2Id, createdAt
```
Konverzacija je **1-na-1**. `user1Id` je uvek manji ID, `user2Id` veći
(normalizuje se u `ConversationService.findOrCreateConversation`).

`MessageStatus` enum — **već postoji**: `SENT`, `DELIVERED`, `SEEN`.
Trenutno se koristi samo `SENT` pri kreiranju poruke; `DELIVERED` i `SEEN`
se nigde ne postavljaju.

### WebSocket / STOMP (`MessageConfig`)
- endpoint: `/end-point` (SockJS, allowedOriginPatterns `*`)
- app prefix: `/app`
- broker: `enableSimpleBroker("/topic")` — **in-memory simple broker**
- `AuthChannelInterceptor` na CONNECT-u zove `auth` servis
  (`GET /api/auth/validate`) i setuje `StompPrincipal(userId)`

### Postojeći kanali
- slanje: `@MessageMapping("/message")` → klijent šalje na `/app/message`
- emitovanje: `/topic/conversation/{conversationId}` — puni `Message` entitet
- presence: `/topic/online` — Redis Pub/Sub kanal `presence-channel`,
  payload string oblika `"{userId}:online"` / `"{userId}:offline"`

### REST endpointi
- `GET /api/message/{conversationId}` — sve poruke, ASC po `createdAt`
- `GET /api/message/media/{conversationId}` — samo poruke sa `imageUrl`, DESC
- `ConversationController` — `/api/conversation/**` (find-or-create, moji chatovi)

### Servisi
- `MessageService.handleMessage(dto, senderId)` — snimi poruku sa `SENT`,
  pa `convertAndSend` na `/topic/conversation/{id}`
- `MessageService.checkParticipant(conversationId, userId)` — privatna provera,
  baca `ConversationNotFoundException` / `NotParticipantException`
- `ConversationService.loadMyChats(userId)` — vraća `MyChatDTO`
  (conversationId, otherUserId, username, profileImageUrl, lastMessage, lastMessageTime),
  profil dovlači REST pozivom ka `auth` servisu

### Repozitorijum
```java
List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
List<Message> findByConversationIdAndImageUrlIsNotNullOrderByCreatedAtDesc(Long conversationId);
Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
```

### Exception handling
`GlobalExceptionHandler` sa `@RestControllerAdvice` već postoji u `message` servisu.

---

## 3. Cilj feature-a

Poruka treba da prolazi kroz životni ciklus:

```
SENT  ──────────►  DELIVERED  ──────────►  SEEN
(snimljena u bazi) (primalac je online /   (primalac je otvorio
                    dobio poruku)           konverzaciju)
```

Pošiljalac u realnom vremenu treba da vidi promenu statusa (jedna/dve kvačice).

---

## 4. Pitanja koja treba razrešiti pre implementacije

1. **Kada je poruka DELIVERED?**
   - Opcija A: server proveri kod `presence` servisa da li je primalac online
     u trenutku slanja i odmah upiše `DELIVERED`.
   - Opcija B: klijent primaoca pošalje ACK preko STOMP-a
     (npr. `/app/message/delivered`) kad primi poruku.
   - Opcija C: kombinacija — A kao optimizacija, B kao izvor istine.

2. **Šta sa porukama poslatim dok je primalac offline?**
   Kada se primalac konektuje (`SessionConnectedEvent` u `PresenceEventListener`,
   ili Redis `presence-channel` event `"{id}:online"`), treba li batch-om
   prebaciti sve njegove `SENT` poruke u `DELIVERED` i obavestiti pošiljaoce?

3. **Kada je SEEN?**
   Klijent eksplicitno javlja da je otvorio/skrolovao konverzaciju —
   preko STOMP-a (`/app/message/seen`) ili REST-om (`POST /api/message/seen/{conversationId}`).
   Da li se markira **cela konverzacija do određenog messageId**, ili pojedinačne poruke?
   (Za 1-na-1 chat prirodnije je „sve do ovog ID-a".)

4. **Kako se status vraća pošiljaocu?**
   - Postojeći topic `/topic/conversation/{id}` sa novim tipom event-a
     (npr. wrapper `{type: "MESSAGE" | "STATUS_UPDATE", payload: ...}`), ili
   - Novi topic `/topic/conversation/{id}/status`, ili
   - `convertAndSendToUser` (zahteva `enableSimpleBroker("/topic", "/queue")`
     i `setUserDestinationPrefix`).

5. **Unread count** — da li ide zajedno sa ovim feature-om?
   `MyChatDTO` bi dobio `unreadCount` (broj poruka gde
   `senderId != userId AND status != SEEN`). Logično je uz status, ali može i posle.

6. **Broker limit** — `SimpleBroker` je in-memory i radi samo za jednu instancu
   `message` servisa. Za sada je to OK; napomena za kasnije skaliranje.

7. **Migracija podataka** — `ddl-auto=update` je uključen. Postojeće poruke već imaju
   `status = SENT`; da li treba backfill ili se ostavlja kako jeste?

---

## 5. Šta bi implementacija verovatno dodirnula

- `MessageStatus` — enum već postoji, verovatno ostaje isti
- `Message` — možda `deliveredAt` / `seenAt` timestampi (ako trebaju)
- `MessageRepository` — upiti/`@Modifying` update za batch promenu statusa
- `MessageService` — logika prelaza statusa + emitovanje event-a
- `MessageController` (STOMP) — nova `@MessageMapping` mapiranja za ack/seen
- `MessageRestController` — eventualno REST varijanta za seen
- novi DTO — npr. `MessageStatusUpdateDTO` (messageId / lastSeenMessageId, conversationId, status, userId)
- `PresenceEventListener` ili `PresenceSubscriber` — okidač za „primalac je došao online"
- `ConversationService.loadMyChats` — ako se dodaje `unreadCount`

---

## 6. Napomena za rad

Ne pisati kod dok se eksplicitno ne zatraži — prvo dogovor oko odluka iz sekcije 4.
