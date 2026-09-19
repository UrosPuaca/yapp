import { useEffect, useState } from 'react';
import Avatar from '../Avatar/Avatar.jsx';
import StatusDot from '../StatusDot/StatusDot.jsx';
import ContactItem from './ContactItem.jsx';
import { searchUsers } from '../../api/users.js';
import { getUserId } from '../../api/client.js';
import './Sidebar.css';

// Koliko se ceka posle poslednjeg pritiska tastera pre nego sto se pita backend
const SEARCH_DEBOUNCE_MS = 300;

/* Rezultat pretrage -> oblik koji koriste nase komponente.
   Backend moze zvati polje userId ili id, pa citamo oba. */
function mapFoundUser(dto) {
  const userId = dto.userId ?? dto.id;
  return {
    // Prefiks jer ovo NIJE conversationId — razgovor jos ne postoji.
    // `pending` cuva App da ne gadja backend nepostojecim razgovorom.
    id: `new-${userId}`,
    pending: true,
    otherUserId: userId,
    name: dto.username,
    avatar: dto.profileImageUrl || null,
    status: 'offline',
  };
}

// Kako izgleda URL slike ako backend posalje link umesto reci "image"
const IMG_URL = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i;

/* Tekst ispod imena u listi. Slika/fajl/voice nemaju tekst, pa umesto
   praznog reda (ili sirove reci "image") ide oznaka tipa. */
function previewOf(last, contact) {
  // Live poruka iz ove sesije — ona ima .type, pa je najpouzdanija
  if (last) {
    if (last.text) return last.text; // slika sa opisom -> prikazi opis
    if (last.type === 'image') return '[IMAGE]';
    if (last.type === 'file') return '[FILE]';
    if (last.type === 'voice') return '[VOICE]';
    return '';
  }

  // lastMessage sa backenda je samo string, bez tipa
  const raw = (contact.lastMessage || '').trim();
  if (!raw) return 'no messages yet';
  if (raw.toLowerCase() === 'image' || IMG_URL.test(raw)) return '[IMAGE]';
  return raw;
}

export default function Sidebar({
  contacts,
  messages,
  unread,
  activeId,
  onSelect,
  onAddContact,
  user,
  onOpenProfile,
}) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState([]);
  const q = query.trim().toLowerCase();

  const filtered = q
    ? contacts.filter((c) => c.name.toLowerCase().includes(q))
    : contacts;

  /* Pretraga korisnika na backendu. Debounce: ceka se pauza u kucanju, da se
     ne salje zahtev na svako slovo. Cleanup gasi i tajmer i zakasneli odgovor. */
  useEffect(() => {
    if (!q) {
      setFound([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(query.trim())
        .then((list) => {
          if (!cancelled) setFound((list || []).map(mapFoundUser));
        })
        .catch(() => {
          if (!cancelled) setFound([]);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true; // odgovor za stari upit ne sme da pregazi novi
      clearTimeout(timer);
    };
  }, [q, query]);

  /* Iz rezultata izbaci sebe i one sa kojima vec imam razgovor */
  const myUserId = getUserId();
  const newPeople = found.filter(
    (p) =>
      p.otherUserId != null &&
      p.otherUserId !== myUserId &&
      !contacts.some((c) => c.otherUserId === p.otherUserId)
  );

  const handleAdd = (person) => {
    onAddContact(person);
    setQuery('');
  };

  return (
    <div className="sidebar">
      <div className="sideHead">CONTACTS</div>

      <div className="sideSearch">
        <input
          className="sideSearchInput"
          placeholder="search_user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="sideList">
        {filtered.map((contact) => {
          const thread = messages[contact.id] ?? [];
          const last = thread[thread.length - 1];
          // Prvo lokalna poruka iz ove sesije, pa lastMessage sa backenda
          const preview = previewOf(last, contact);
          const time = last ? last.time : contact.lastTime || '';
          return (
            <ContactItem
              key={contact.id}
              contact={contact}
              preview={preview}
              time={time}
              unread={unread?.[contact.id] ?? 0}
              isActive={contact.id === activeId}
              onClick={() => onSelect(contact.id)}
            />
          );
        })}

        {newPeople.length > 0 && (
          <>
            <div className="sideNewHead">ON_NETWORK</div>
            {newPeople.map((person) => (
              <div key={person.id} className="newUserItem" onClick={() => handleAdd(person)}>
                <Avatar name={person.name} src={person.avatar} />
                <div className="newUserText">
                  <div className="convName">{person.name}</div>
                  <div className="newUserStatus">
                    <StatusDot status={person.status} />
                    {person.status.toUpperCase()}
                  </div>
                </div>
                <span className="newUserAdd">[+]</span>
              </div>
            ))}
          </>
        )}

        {q && filtered.length === 0 && newPeople.length === 0 && (
          <div className="sideEmpty">no results :(</div>
        )}
      </div>

      <div className="sideFoot" onClick={onOpenProfile}>
        <Avatar name={user.username} src={user.avatar} />
        <div className="sideFootName">{user.username}</div>
        <span className="sideFootLink">PROFILE</span>
      </div>
    </div>
  );
}
