import { useState, useEffect, useRef } from 'react';
import Window from './components/Window/Window.jsx';
import TitleBar from './components/TitleBar/TitleBar.jsx';
import Skyline from './components/Skyline/Skyline.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import ChatPanel from './components/ChatPanel/ChatPanel.jsx';
import LoginForm from './components/Auth/LoginForm.jsx';
import RegisterForm from './components/Auth/RegisterForm.jsx';
import ProfileModal from './components/Profile/ProfileModal.jsx';
import ContactProfileModal from './components/Profile/ContactProfileModal.jsx';
import { THEMES } from './data/themes.js';
import { setToken, getUserId } from './api/client.js';
import { getMyChats, openConversation } from './api/conversations.js';
import { getMe } from './api/users.js';
import { getMessages, PAGE_SIZE } from './api/messages.js';
import { uploadMedia } from './api/media.js';
import { getPresence } from './api/presence.js';
import { connectSocket, disconnectSocket, subscribe, sendSocket } from './api/socket.js';
import './App.css';

const TITLES = {
  login: 'LOGIN.EXE',
  register: 'REGISTER.EXE',
};

/* Datum sa backenda -> "HH:MM" (tolerantno: prima ISO string i broj) */
function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* MessageStatus ide samo napred: SENT -> DELIVERED -> SEEN.
   Ako zakasneli broadcast donese nizi status, ignorisemo ga. */
const STATUS_RANK = { SENT: 1, DELIVERED: 2, SEEN: 3 };

// Posle prvog "kucam" cutimo ovoliko, ma koliko korisnik lupao po tastaturi
const TYPING_THROTTLE_MS = 1500;
// Sam gasi tackice ako sagovorniku pukne veza pa "prestao sam" nikad ne stigne.
// MORA biti veci od throttle-a, inace tackice trepnu izmedju dva "kucam" eventa.
const TYPING_TIMEOUT_MS = 2500;

/* Backend moze vratiti stranu poruka u bilo kom redosledu (ASC ili DESC).
   Sortiramo sami po createdAt, pa nam je svejedno kako stigne. */
function byTime(list) {
  return [...(list || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/* Backend moze vratiti "online", { status: 'online' } ili true —
   svedi sve na dve vrednosti koje UI ume da nacrta. */
function normalizeStatus(value) {
  const raw =
    typeof value === 'object' && value !== null
      ? value.status ?? value.online
      : value;
  return raw === true || String(raw).toLowerCase() === 'online' ? 'online' : 'offline';
}

/* MyChatDTO[] -> { conversationId: brojNeprocitanih }.
   Cita se iz sirovog DTO-a, ne sa kontakta — bedz ima jedan izvor istine
   (`unread` state), pa ne moze da se razidje sa live brojanjem. */
function unreadFrom(chats) {
  const out = {};
  (chats || []).forEach((dto) => {
    const n = dto.unreadCount ?? 0;
    if (n > 0) out[dto.conversationId] = n;
  });
  return out;
}

/* MyChatDTO sa backenda -> oblik koji koriste nase komponente */
function mapChat(dto) {
  return {
    id: dto.conversationId,
    otherUserId: dto.otherUserId,
    name: dto.username,
    avatar: dto.profileImageUrl || null,
    lastMessage: dto.lastMessage || '',
    lastTime: formatTime(dto.lastMessageTime),
    status: 'offline', // backend jos ne salje status
  };
}

/* Message sa backenda (REST istorija i live broadcast su istog oblika) ->
   nas oblik. "Moja" poruka = senderId je moj userId. */
function mapMessage(m, myUserId) {
  return {
    id: m.id,
    from: m.senderId === myUserId ? 'me' : 'them',
    text: m.text,
    time: formatTime(m.createdAt),
    status: m.status, // SENT | DELIVERED | SEEN
    // Odgovor na drugu poruku; replyToMessageId je null za obicnu poruku
    replyToMessageId: m.replyToMessageId ?? null,
    replyToText: m.replyToText ?? null,
    // Original je bio moj ili tudj — isto pravilo kao za `from`
    replyFrom:
      m.replyToSenderId == null ? null : m.replyToSenderId === myUserId ? 'me' : 'them',
    ...(m.imageUrl ? { type: 'image', src: m.imageUrl } : {}),
  };
}

export default function App() {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'chat'
  const [user, setUser] = useState(null); // { username, email, avatar }
  const [profileOpen, setProfileOpen] = useState(false);
  const [contactProfileOpen, setContactProfileOpen] = useState(false);
  const [theme, setTheme] = useState('buddy');

  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState({});
  const [draft, setDraft] = useState('');
  // Poruka na koju se odgovara, null kad se pise obicna poruka
  const [replyTo, setReplyTo] = useState(null);
  // Reakcije: { messageId: { userId: 'LIKE' } }. Jedan korisnik = jedna
  // reakcija po poruci, pa je vrednost jedan tip, ne lista.
  const [reactions, setReactions] = useState({});
  const [socketReady, setSocketReady] = useState(false);

  // Ima li jos starijih poruka, po konverzaciji: { convId: true/false }
  const [hasMore, setHasMore] = useState({});

  // Konverzacije cija je istorija vec povucena sa REST-a
  const loadedHistoryRef = useRef(new Set());
  // Konverzacije za koje bas sad tece dovlacenje starijih poruka
  const loadingOlderRef = useRef(new Set());
  // Aktivne STOMP pretplate po conversationId
  const subsRef = useRef(new Map());
  // Ko trenutno kuca: { convId: true }
  const [typingIn, setTypingIn] = useState({});
  // Tajmeri koji sami gase tackice, po konverzaciji
  const typingTimersRef = useRef(new Map());
  // Stanje MOG kucanja: u kom razgovoru i kad sam poslednji put javio
  const myTypingRef = useRef({ convId: null, lastSent: 0 });

  // Broj neprocitanih po konverzaciji: { convId: 3 }
  const [unread, setUnread] = useState({});

  // Uvek drzi AKTUELNI active id. Callback pretplate se pravi jednom, pa bi
  // obicna `active` promenljiva u njemu zauvek ostala zamrznuta.
  const activeRef = useRef(null);

  // Pretplate na /topic/conversation/{id}/status
  const statusSubsRef = useRef(new Map());
  // Pretplate na /topic/conversation/{id}/typing
  const typingSubsRef = useRef(new Map());
  // Pretplate na /topic/conversation/{id}/reaction
  const reactionSubsRef = useRef(new Map());
  // Pretplata na /topic/online — jedna za celu aplikaciju
  const presenceSubRef = useRef(null);

  const activeContact = contacts.find((c) => c.id === active);
  const myUserId = getUserId();

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /* Istorija poruka jednog razgovora sa backenda (REST). */
  const loadMessages = async (convId) => {
    loadedHistoryRef.current.add(convId);
    try {
      const list = await getMessages(convId);
      const myUserId = getUserId();
      const history = byTime(list).map((m) => mapMessage(m, myUserId));
      seedReactions(list);
      // Puna strana (20) znaci da verovatno ima jos starijih poruka
      setHasMore((prev) => ({ ...prev, [convId]: (list?.length ?? 0) === PAGE_SIZE }));
      setMessages((prev) => {
        // Sacuvaj eventualne live poruke koje su stigle pre istorije
        const live = prev[convId] ?? [];
        const ids = new Set(history.map((x) => x.id));
        const extras = live.filter((x) => !ids.has(x.id));
        return { ...prev, [convId]: [...history, ...extras] };
      });
    } catch (err) {
      console.error('Ucitavanje poruka nije uspelo:', err);
    }
  };

  /* Dovlacenje starije strane poruka (skrol do vrha).
     Salje se id najstarije poruke koju vec imamo kao ?before= */
  const loadOlderMessages = async (convId) => {
    if (loadingOlderRef.current.has(convId)) return; // vec tece
    if (hasMore[convId] === false) return;           // nema vise
    const oldest = (messages[convId] ?? [])[0];
    if (!oldest) return;

    loadingOlderRef.current.add(convId);
    try {
      const list = await getMessages(convId, oldest.id);
      const myUserId = getUserId();
      const older = byTime(list).map((m) => mapMessage(m, myUserId));
      seedReactions(list);

      setHasMore((prev) => ({ ...prev, [convId]: (list?.length ?? 0) === PAGE_SIZE }));
      if (older.length === 0) return;

      setMessages((prev) => {
        const existing = prev[convId] ?? [];
        const ids = new Set(existing.map((x) => x.id));
        const fresh = older.filter((x) => !ids.has(x.id)); // bez duplikata
        if (fresh.length === 0) return prev;
        return { ...prev, [convId]: [...fresh, ...existing] }; // starije IDU NA VRH
      });
    } catch (err) {
      console.error('Ucitavanje starijih poruka nije uspelo:', err);
    } finally {
      loadingOlderRef.current.delete(convId);
    }
  };

  /* Klik na razgovor: otvori ga, i ako istorija jos nije povucena — povuci je */
  const selectConversation = (id) => {
    stopTyping(); // napustam stari razgovor
    setReplyTo(null);
    setActive(id);
    const conv = contacts.find((c) => c.id === id);
    if (conv?.otherUserId && !conv.pending && !loadedHistoryRef.current.has(id)) {
      loadMessages(id);
    }
  };

  /* Pocetni snapshot statusa: za svaki kontakt pitaj backend ko je sad online.
     Topic javlja samo promene od trenutka pretplate, pa bez ovoga ne bismo
     znali stanje onih koji su vec bili online. */
  const loadPresence = async (list) => {
    const pairs = await Promise.all(
      list
        .filter((c) => c.otherUserId)
        .map(async (c) => {
          try {
            return [c.id, normalizeStatus(await getPresence(c.otherUserId))];
          } catch {
            return [c.id, 'offline']; // ako pukne, ostaje offline
          }
        })
    );
    const byId = new Map(pairs);
    setContacts((prev) =>
      prev.map((c) => (byId.has(c.id) ? { ...c, status: byId.get(c.id) } : c))
    );
  };

  /* Posle logina: povuci moje razgovore sa backenda */
  const loadConversations = async () => {
    try {
      const chats = await getMyChats();
      const mapped = (chats || []).map(mapChat);
      setContacts(mapped);
      setUnread(unreadFrom(chats)); // bedz sad dolazi iz baze, ne iz memorije
      loadPresence(mapped);
      if (mapped.length > 0) {
        setActive(mapped[0].id);
        loadMessages(mapped[0].id);
      } else {
        setActive(null);
      }
    } catch (err) {
      console.error('Ucitavanje razgovora nije uspelo:', err);
      setContacts([]);
      setActive(null);
    }
  };

  /* Javi da sam poceo/prestao da kucam. userId ne saljemo — server ga uzima
     iz sesije i prepisuje sve sto posaljemo. */
  const notifyTyping = (convId, typing) => {
    sendSocket('/app/message/typing', { conversationId: convId, typing });
  };

  /* Prestao sam da kucam — salje se samo ako sam pre toga javio da kucam. */
  const stopTyping = () => {
    const { convId } = myTypingRef.current;
    if (convId == null) return;
    myTypingRef.current = { convId: null, lastSent: 0 };
    notifyTyping(convId, false);
  };

  /* Svaki pritisak tastera prolazi ovuda. Zato throttle: prvi karakter salje
     odmah, pa se cuti TYPING_THROTTLE_MS ma koliko se kucalo. */
  const handleDraftChange = (value) => {
    setDraft(value);
    if (active == null || !activeContact?.otherUserId || activeContact.pending) return;

    if (value.trim() === '') {
      stopTyping(); // obrisao sve -> odmah prestao
      return;
    }

    const { convId, lastSent } = myTypingRef.current;
    const now = Date.now();
    if (convId !== active || now - lastSent >= TYPING_THROTTLE_MS) {
      myTypingRef.current = { convId: active, lastSent: now };
      notifyTyping(active, true);
    }
  };

  /* Stigao typing event. Svoje evente odbacujemo — broadcast ide i meni. */
  const applyTyping = (convId, dto, myUserId) => {
    const uid = dto?.userId ?? dto?.senderId;
    if (uid != null && Number(uid) === myUserId) return;

    const timers = typingTimersRef.current;
    clearTimeout(timers.get(convId)); // svaki event resetuje tajmer
    timers.delete(convId);

    if (!dto?.typing) {
      setTypingIn((prev) => (prev[convId] ? { ...prev, [convId]: false } : prev));
      return;
    }

    setTypingIn((prev) => (prev[convId] ? prev : { ...prev, [convId]: true }));
    timers.set(
      convId,
      setTimeout(() => {
        typingTimersRef.current.delete(convId);
        setTypingIn((prev) => ({ ...prev, [convId]: false }));
      }, TYPING_TIMEOUT_MS)
    );
  };

  /* Javi backendu da su poruke ovog razgovora procitane i skloni bedz. */
  const markSeen = (convId) => {
    if (convId == null) return;
    sendSocket('/app/message/seen', { conversationId: convId });
    setUnread((prev) => {
      if (!prev[convId]) return prev;
      const next = { ...prev };
      delete next[convId];
      return next;
    });
  };

  /* Otvoren razgovor = procitan. Zavisi i od socketReady jer se pri loginu
     prvi razgovor otvori pre nego sto veza postoji, pa bi poruka propala. */
  useEffect(() => {
    if (!socketReady || active == null || activeContact?.pending) return;
    markSeen(active);
  }, [socketReady, active]);

  /* MessageStatusDTO: { conversationId, messagesIds, status }.
     Postavlja novi status na sve poruke cije su id-jeve stigli. */
  const applyStatus = (dto) => {
    const convId = dto?.conversationId;
    const status = dto?.status;
    if (convId == null || !status) return;
    const ids = new Set(dto.messagesIds ?? []);
    if (ids.size === 0) return;

    setMessages((prev) => {
      const existing = prev[convId];
      if (!existing) return prev; // razgovor jos nije otvaran

      let changed = false;
      const next = existing.map((m) => {
        if (!ids.has(m.id)) return m;
        // samo napred: zakasneli DELIVERED ne sme da pregazi SEEN
        if ((STATUS_RANK[status] ?? 0) <= (STATUS_RANK[m.status] ?? 0)) return m;
        changed = true;
        return { ...m, status };
      });
      return changed ? { ...prev, [convId]: next } : prev;
    });
  };

  /* Kad je socket spreman, pretplati se na topic svake konverzacije.
     Nova poruka (i tudja i moj echo) stize ovde i dodaje se u thread. */
  useEffect(() => {
    if (!socketReady) return;
    const myUserId = getUserId();
    contacts.forEach((c) => {
      if (c.pending || !c.otherUserId) return; // razgovor jos ne postoji na backendu
      if (subsRef.current.has(c.id)) return; // vec pretplaceno
      const sub = subscribe(`/topic/conversation/${c.id}`, (raw) => {
        const msg = mapMessage(raw, myUserId);
        seedReactions([raw]);
        setMessages((prev) => {
          const existing = prev[c.id] ?? [];
          if (existing.some((x) => x.id === msg.id)) return prev; // bez duplikata
          return { ...prev, [c.id]: [...existing, msg] };
        });

        // Razgovor sa novom porukom ide na vrh liste — i za tudje i za moje,
        // jer mi se sopstvena poruka vraca broadcast-om kroz isti kanal.
        setContacts((prev) => {
          const i = prev.findIndex((x) => x.id === c.id);
          if (i <= 0) return prev; // nema ga u listi, ili je vec prvi
          const next = [...prev];
          const [moved] = next.splice(i, 1);
          return [moved, ...next];
        });

        if (msg.from === 'me') return; // za svoje poruke ne saljem seen
        if (activeRef.current === c.id) {
          markSeen(c.id); // razgovor je otvoren -> odmah procitano
        } else {
          setUnread((prev) => ({ ...prev, [c.id]: (prev[c.id] ?? 0) + 1 }));
        }
      });
      // Isti razgovor ima i kanal za promene statusa poruka
      const statusSub = subscribe(`/topic/conversation/${c.id}/status`, applyStatus);
      // ...i kanal za "kuca"
      const typingSub = subscribe(`/topic/conversation/${c.id}/typing`, (dto) =>
        applyTyping(c.id, dto, myUserId)
      );
      if (typingSub) typingSubsRef.current.set(c.id, typingSub);
      // ...i kanal za reakcije
      const reactionSub = subscribe(
        `/topic/conversation/${c.id}/reaction`,
        applyReaction
      );
      if (reactionSub) reactionSubsRef.current.set(c.id, reactionSub);
      if (sub) subsRef.current.set(c.id, sub);
      if (statusSub) statusSubsRef.current.set(c.id, statusSub);
    });
  }, [socketReady, contacts]);

  /* Presence uzivo: jedna pretplata na globalni kanal.
     Poruka je cist tekst oblika "userId:status", npr. "5:online". */
  useEffect(() => {
    if (!socketReady) return;
    if (presenceSubRef.current) return; // vec pretplaceno
    const sub = subscribe('/topic/online', (body) => {
      const [rawId, rawStatus] = String(body).split(':');
      const userId = Number(rawId);
      if (!userId) return;
      const status = normalizeStatus(rawStatus);
      // Funkcionalni update — radi nad AKTUELNOM listom, pa nema zastarelog
      // snimka kontakata u closure-u. Ako userId nije moj kontakt, vrati
      // prev nepromenjen (bez toga bi svaka tudja promena izazvala render).
      setContacts((prev) =>
        prev.some((c) => c.otherUserId === userId)
          ? prev.map((c) => (c.otherUserId === userId ? { ...c, status } : c))
          : prev
      );
    });
    if (sub) presenceSubRef.current = sub;
  }, [socketReady]);

  const handleAuth = (username, email = '') => {
    setUser({ username, email, avatar: null });
    setView('chat');
    loadConversations();
    loadMe(); // povuci profilnu sliku i ostale podatke sa backenda
    connectSocket({ onConnect: () => setSocketReady(true) });
  };

  /* Moj profil sa backenda -> popuni avatar (i email) za prikaz u sidebaru */
  const loadMe = async () => {
    try {
      const me = await getMe();
      setUser((prev) => ({
        ...prev,
        username: me.username ?? prev?.username,
        email: me.email ?? prev?.email,
        avatar: me.profileImageUrl || prev?.avatar || null,
      }));
    } catch (err) {
      console.error('Ucitavanje profila nije uspelo:', err);
    }
  };

  /* Posle uspesne registracije — na login da se prijavi. */
  const handleRegistered = () => {
    setView('login');
  };

  const handleLogout = () => {
    disconnectSocket();
    subsRef.current.clear();
    statusSubsRef.current.clear();
    typingSubsRef.current.clear();
    reactionSubsRef.current.clear();
    typingTimersRef.current.forEach(clearTimeout);
    typingTimersRef.current.clear();
    myTypingRef.current = { convId: null, lastSent: 0 };
    setTypingIn({});
    presenceSubRef.current = null;
    loadedHistoryRef.current.clear();
    loadingOlderRef.current.clear();
    setHasMore({});
    setSocketReady(false);
    setToken(null);
    setUser(null);
    setProfileOpen(false);
    setContactProfileOpen(false);
    setContacts([]);
    setMessages({});
    setUnread({});
    setReplyTo(null);
    setReactions({});
    setActive(null);
    setView('login');
  };

  const setAvatar = (avatar) => {
    setUser((prev) => ({ ...prev, avatar }));
  };

  /* Dodavanje novog kontakta iz pretrage imenika — otvara prazan razgovor */
  const addContact = async (person) => {
    // Vec pricam sa njim -> samo otvori postojeci razgovor
    const existing = contacts.find((c) => c.otherUserId === person.otherUserId);
    if (existing) {
      selectConversation(existing.id);
      return;
    }

    try {
      const res = await openConversation(person.otherUserId);
      // Backend moze vratiti { conversationId }, { id } ili goli broj
      const convId = res?.conversationId ?? res?.id ?? res;
      if (convId == null) throw new Error('NO CONVERSATION ID IN RESPONSE');

      // Ime i avatar uzimamo iz rezultata pretrage — odgovor ih ne nosi
      const contact = {
        id: convId,
        otherUserId: person.otherUserId,
        name: person.name,
        avatar: person.avatar,
        lastMessage: '',
        lastTime: '',
        status: 'offline',
      };

      setContacts((prev) =>
        prev.some((c) => c.id === convId) ? prev : [contact, ...prev]
      );
      setActive(convId);
      loadMessages(convId); // prazan razgovor -> vrati [], ali postavi hasMore
      loadPresence([contact]); // da tackica ne ostane lazno offline
    } catch (err) {
      console.error('Otvaranje razgovora nije uspelo:', err);
    }
  };

  /* Poruke iz istorije nose `reactions` niz istog oblika kao live event.
     Ubacujemo ih u istu centralnu mapu, u jednom setState-u umesto po jedan. */
  const seedReactions = (list) => {
    const incoming = {};
    (list || []).forEach((m) => {
      (m.reactions || []).forEach((r) => {
        if (r?.messageId == null || r?.userId == null || !r.reactionType) return;
        if (!incoming[r.messageId]) incoming[r.messageId] = {};
        incoming[r.messageId][r.userId] = r.reactionType;
      });
    });
    if (Object.keys(incoming).length === 0) return;

    setReactions((prev) => {
      const next = { ...prev };
      Object.entries(incoming).forEach(([messageId, byUser]) => {
        // Postojece ide POSLE: live event koji je stigao dok je istorija bila
        // u letu je noviji od nje, pa ne sme da bude pregazen.
        next[messageId] = { ...byUser, ...(next[messageId] ?? {}) };
      });
      return next;
    });
  };

  /* ReactionDTO: { messageId, reactionType, userId }.
     reactionType === null znaci da je taj korisnik sklonio reakciju. */
  const applyReaction = (dto) => {
    const messageId = dto?.messageId;
    const userId = dto?.userId;
    if (messageId == null || userId == null) return;

    setReactions((prev) => {
      const forMsg = { ...(prev[messageId] ?? {}) };
      if (dto.reactionType == null) delete forMsg[userId];
      else forMsg[userId] = dto.reactionType;

      // Poslednja reakcija sklonjena -> izbaci i ceo unos, da mapa ne raste
      if (Object.keys(forMsg).length === 0) {
        if (prev[messageId] === undefined) return prev;
        const next = { ...prev };
        delete next[messageId];
        return next;
      }
      return { ...prev, [messageId]: forMsg };
    });
  };

  /* Reakcija na poruku. userId ne saljemo — server ga uzima iz sesije.
     Isti tip ponovo backend tumaci kao sklanjanje i vrati prazno. */
  const reactToMessage = (messageId, reactionType) => {
    sendSocket('/app/message/reaction', { messageId, reactionType });
    // Optimisticki, da dugme ne kasni za klikom; broadcast posle potvrdi
    const mine = reactions[messageId]?.[myUserId];
    applyReaction({
      messageId,
      userId: myUserId,
      reactionType: mine === reactionType ? null : reactionType,
    });
  };

  /* Slanje tekst poruke preko websocketa. Ne dodajemo lokalno —
     backend broadcast-uje nazad na /topic pa se poruka pojavi svima (i meni). */
  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeContact?.otherUserId || activeContact.pending) return;
    sendSocket('/app/message', {
      conversationId: activeContact.id,
      text,
      imageUrl: null,
      // Backend sam ucita original iz baze — tekst citata se ne salje
      replyToMessageId: replyTo?.id ?? null,
    });
    setReplyTo(null);
    setDraft('');
    stopTyping(); // poslao sam -> polje je prazno, vise ne kucam
  };

  /* Slanje slike: prvo upload na media servis -> URL, pa poruka preko socketa */
  const sendImage = async (file) => {
    if (!activeContact?.otherUserId || activeContact.pending) return;
    try {
      const url = await uploadMedia(file);
      sendSocket('/app/message', {
        conversationId: activeContact.id,
        text: null,
        imageUrl: url,
      });
    } catch (err) {
      console.error('Slanje slike nije uspelo:', err);
    }
  };

  /* Fajl / voice — backend jos ne podrzava, ostaje lokalno u ovoj sesiji */
  const sendRich = (payload) => {
    if (active == null) return;
    setMessages((prev) => ({
      ...prev,
      [active]: [...(prev[active] ?? []), { from: 'me', time: formatTime(Date.now()), ...payload }],
    }));
  };

  const chatTitle = `${THEMES.find((t) => t.id === theme).label}.EXE`;

  return (
    <Window theme={theme}>
      <TitleBar
        title={view === 'chat' ? chatTitle : TITLES[view]}
        tag="トーキョー"
        action={
          view === 'chat' && (
            <button className="titleAction" onClick={handleLogout}>
              [{user.username}: EXIT]
            </button>
          )
        }
      />
      <Skyline />

      {view === 'login' && (
        <LoginForm onLogin={handleAuth} onGoRegister={() => setView('register')} />
      )}

      {view === 'register' && (
        <RegisterForm onRegister={handleRegistered} onGoLogin={() => setView('login')} />
      )}

      {view === 'chat' && (
        <div className="appBody">
          <Sidebar
            contacts={contacts}
            messages={messages}
            unread={unread}
            activeId={active}
            onSelect={selectConversation}
            onAddContact={addContact}
            user={user}
            onOpenProfile={() => setProfileOpen(true)}
          />
          {activeContact ? (
            <ChatPanel
              contact={activeContact}
              thread={messages[active] ?? []}
              hasMore={hasMore[active] !== false}
              onLoadOlder={() => loadOlderMessages(active)}
              draft={draft}
              onDraftChange={handleDraftChange}
              typing={typingIn[active] === true}
              replyTo={replyTo}
              onReply={setReplyTo}
              onCancelReply={() => setReplyTo(null)}
              reactions={reactions}
              myUserId={myUserId}
              onReact={reactToMessage}
              onSend={sendMessage}
              onSendImage={sendImage}
              onSendRich={sendRich}
              onOpenContactProfile={() => setContactProfileOpen(true)}
            />
          ) : (
            <div className="chatEmpty">NO_CONVERSATIONS.YET</div>
          )}
        </div>
      )}

      {profileOpen && user && (
        <ProfileModal
          user={user}
          onAvatarChange={setAvatar}
          onClose={() => setProfileOpen(false)}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      {contactProfileOpen && activeContact && (
        <ContactProfileModal
          contact={activeContact}
          onClose={() => setContactProfileOpen(false)}
        />
      )}
    </Window>
  );
}
