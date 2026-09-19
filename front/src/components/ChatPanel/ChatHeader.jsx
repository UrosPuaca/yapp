import { useEffect, useState } from 'react';
import Avatar from '../Avatar/Avatar.jsx';
import StatusDot from '../StatusDot/StatusDot.jsx';
import { getPresence } from '../../api/presence.js';
import './ChatHeader.css';

/* "2026-09-08T14:32:11.123" -> "today at 14:32" / "yesterday at 14:32"
   / "12.08. at 09:15" / "12.08.2025."
   LocalDateTime je bez zone, pa ga new Date() cita kao lokalno vreme. */
function formatLastSeen(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d)) return null;

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  // Poredimo pocetke dana, ne same trenutke — inace bi "pre 20h" ispalo "juce"
  // ili "danas" u zavisnosti od sata, a ne od kalendara.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((today - then) / 86400000);

  if (days <= 0) return `today at ${time}`; // <=0 pokriva i sat koji zuri
  if (days === 1) return `yesterday at ${time}`;

  const dd = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  if (d.getFullYear() === now.getFullYear()) return `${dd}.${MM}. at ${time}`;
  return `${dd}.${MM}.${d.getFullYear()}.`;
}

export default function ChatHeader({ contact, onOpenProfile }) {
  const [lastSeen, setLastSeen] = useState(null);
  const offline = contact.status === 'offline';

  /* Za online korisnika ne pitamo server — status vec imamo iz /topic/online.
     Efekat se ponovo izvrsi i kad sagovornik uzivo predje u offline. */
  useEffect(() => {
    setLastSeen(null); // ocisti da se ne vidi vreme prethodnog kontakta
    if (!offline || contact.otherUserId == null) return;

    let cancelled = false;
    getPresence(contact.otherUserId)
      .then((res) => {
        if (!cancelled) setLastSeen(formatLastSeen(res?.lastSeen));
      })
      .catch(() => {}); // ne uspe -> ostaje obicno OFFLINE

    return () => {
      cancelled = true; // odgovor za stari kontakt ne sme da pregazi novi
    };
  }, [contact.otherUserId, offline]);

  const label = lastSeen ? `LAST SEEN ${lastSeen}` : contact.status.toUpperCase();

  return (
    <div className="chatHeader">
      <div className="chatHeaderUser" onClick={onOpenProfile} title="view profile">
        <Avatar name={contact.name} src={contact.avatar} />
        <div className="chatHeaderText">
          <div className="chatName">{contact.name}</div>
          <div className="chatStatus">
            <StatusDot status={contact.status} />
            <span>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
