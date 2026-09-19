import { useRef, useState } from 'react';
import QuoteBlock from '../Reply/QuoteBlock.jsx';
import ReactionIcon, { REACTIONS } from '../Reactions/ReactionIcon.jsx';
import ReactionPicker from '../Reactions/ReactionPicker.jsx';
import './MessageBubble.css';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Voice poruka: play/pauza + trajanje. */
function VoiceContent({ message }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  };

  return (
    <div className="voiceMsg">
      <button className="voiceBtn" onClick={toggle}>
        {playing ? '||' : '▶'}
      </button>
      <span className="voiceBars">||||||||||</span>
      <span className="voiceDur">{formatDuration(message.duration)}</span>
      <audio
        ref={audioRef}
        src={message.src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}


/* Status MOJE poruke kao loptice. Tudje poruke nemaju sta da prikazu.
   SENT = jedna siva, DELIVERED = dve sive, SEEN = dve plave.
   Uvek se renderuju obe; kod SENT je druga sakrivena ali zauzima mesto,
   da vreme ne poskakuje kad status napreduje. */
function StatusDots({ status }) {
  if (!status) return null;
  return (
    <span className={`msgDots msgDots-${status.toLowerCase()}`} title={status}>
      <span className="msgDot" />
      <span className="msgDot" />
    </span>
  );
}

// Priblizna visina panela sa reakcijama + razmak. Ako toliko nema ispod
// poruke do dna threada, panel se okrece na gore.
const PICKER_SPACE = 48;

export default function MessageBubble({
  message,
  contactName,
  onReply,
  onJumpTo,
  reactions,
  myUserId,
  onReact,
}) {
  const mine = message.from === 'me';
  const wrapRef = useRef(null);
  // Panel ide na gore kad je poruka prislonjena uz dno threada
  const [flipUp, setFlipUp] = useState(false);

  /* Mera se radi na ulazak misa, ne pri renderu — do tad se thread jos
     skroluje pa bi izmerena pozicija bila pogresna. */
  const handleEnter = () => {
    const el = wrapRef.current;
    const thread = el?.closest('.thread');
    if (!thread) return;
    const room = thread.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;
    setFlipUp(room < PICKER_SPACE);
  };

  // { userId: 'LIKE' } -> koliko ljudi je dalo koji tip
  const counts = {};
  Object.values(reactions ?? {}).forEach((type) => {
    counts[type] = (counts[type] ?? 0) + 1;
  });
  const myReaction = reactions?.[myUserId] ?? null;

  return (
    <div
      className={`msgRow ${mine ? 'msgRow-me' : 'msgRow-them'}`}
      data-msg-id={message.id}
    >
      <div
        ref={wrapRef}
        className={`bubbleWrap${flipUp ? ' bubbleWrap-flip' : ''}`}
        onMouseEnter={handleEnter}
      >
      <div className={`bubble ${mine ? 'bubble-me' : 'bubble-them'}`}>
        {message.replyToMessageId != null && (
          <QuoteBlock
            who={message.replyFrom === 'me' ? 'YOU' : contactName}
            // replyToText je null kad je original bio slika
            text={message.replyToText ?? '[IMAGE]'}
            onClick={() => onJumpTo?.(message.replyToMessageId)}
          />
        )}

        {message.type === 'image' && (
          <img className="bubbleImg" src={message.src} alt="slika" />
        )}

        {message.type === 'file' && (
          <div className="fileMsg">
            <span className="fileTag">[FILE]</span>
            <a className="fileLink" href={message.src} download={message.name}>
              {message.name}
            </a>
            <span className="fileSize">{formatSize(message.size)}</span>
          </div>
        )}

        {message.type === 'voice' && <VoiceContent message={message} />}

        {/* Tekst se prikazuje i uz sliku, ako poruka ima oboje */}
        {message.text && message.type !== 'file' && (
          <p className="bubbleTxt">{message.text}</p>
        )}

        <div className="bubbleMeta">
          <span className="bubbleTime">{message.time}</span>
          {mine && <StatusDots status={message.status} />}
        </div>
      </div>

        {Object.keys(counts).length > 0 && (
          <div className="reactionChips">
            {/* REACTIONS drzi stalan redosled, da cipovi ne poskakuju */}
            {REACTIONS.filter((type) => counts[type]).map((type) => (
              <button
                key={type}
                type="button"
                className={`reactionChip${myReaction === type ? ' reactionChip-mine' : ''}`}
                title={type}
                onClick={() => onReact?.(message.id, type)}
              >
                <ReactionIcon type={type} size={14} />
                {counts[type] > 1 && <span className="reactionCount">{counts[type]}</span>}
              </button>
            ))}
          </div>
        )}

        <ReactionPicker
          active={myReaction}
          onSelect={(type) => onReact?.(message.id, type)}
          onReply={() => onReply?.(message)}
        />
      </div>
    </div>
  );
}
