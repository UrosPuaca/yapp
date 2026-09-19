import { useLayoutEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import './MessageThread.css';

// Koliko piksela od vrha okida dovlacenje starijih poruka
const TOP_TRIGGER = 60;

export default function MessageThread({
  contactId,
  thread,
  hasMore,
  onLoadOlder,
  contactName,
  onReply,
  reactions,
  myUserId,
  onReact,
}) {
  const threadRef = useRef(null);
  // Visina sadrzaja u trenutku kad smo trazili starije poruke
  const heightBeforeRef = useRef(0);
  const prevFirstIdRef = useRef(undefined);
  const prevContactRef = useRef(contactId);

  /* Klik na citat: skoci na original ako je ucitan. Ako nije (stara poruka
     van paginacije), ne radi nista — ne dovlacimo je. */
  const jumpTo = (id) => {
    const el = threadRef.current?.querySelector(`[data-msg-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('msgRow-flash');
    setTimeout(() => el.classList.remove('msgRow-flash'), 2700);
  };

  /* Skrol do vrha -> trazi stariju stranu. App sam odbija duple pozive. */
  const handleScroll = () => {
    const el = threadRef.current;
    if (!el || !hasMore || !onLoadOlder) return;
    if (el.scrollTop > TOP_TRIGGER) return;
    heightBeforeRef.current = el.scrollHeight; // zapamti pre nego sto lista naraste
    onLoadOlder();
  };

  /* useLayoutEffect, ne useEffect: izvrsava se PRE nego sto browser iscrta,
     pa korisnik ne vidi trzaj liste. */
  useLayoutEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const firstId = thread[0]?.id;

    // 1. Prelazak na drugi razgovor -> uvek na dno
    if (prevContactRef.current !== contactId) {
      prevContactRef.current = contactId;
      prevFirstIdRef.current = firstId;
      el.scrollTop = el.scrollHeight;
      return;
    }

    // 2. Prva poruka je druga nego pre -> starije su ubacene NA VRH.
    //    Pomeri scroll za tacno onoliko koliko je lista narasla, pa poruka
    //    koju je korisnik gledao ostaje na istom mestu na ekranu.
    if (firstId !== undefined && prevFirstIdRef.current !== undefined && firstId !== prevFirstIdRef.current) {
      prevFirstIdRef.current = firstId;
      el.scrollTop = el.scrollHeight - heightBeforeRef.current;
      return;
    }

    // 3. Nova poruka na dnu -> prati je
    prevFirstIdRef.current = firstId;
    el.scrollTop = el.scrollHeight;
  }, [contactId, thread.length]);

  return (
    <div className="thread" ref={threadRef} onScroll={handleScroll}>
      {thread.map((message, i) => (
        // Kljuc mora biti id: kod ubacivanja na vrh bi indeks pomerio
        // sve poruke i React bi mesao komponente medjusobno.
        <MessageBubble
          key={message.id ?? `local-${i}`}
          message={message}
          contactName={contactName}
          onReply={onReply}
          onJumpTo={jumpTo}
          reactions={reactions?.[message.id]}
          myUserId={myUserId}
          onReact={onReact}
        />
      ))}
    </div>
  );
}
