import ReactionIcon, { PixelIcon, REACTIONS } from './ReactionIcon.jsx';
import './Reactions.css';

// Strelica odgovora. currentColor -> boju uzima iz CSS-a, prati temu.
const REPLY_ROWS = [
  '............',
  '............',
  '...a........',
  '..aa........',
  '.aaaaaaaaa..',
  'aaaaaaaaaaa.',
  '.aaaaaaaaaa.',
  '..aa......a.',
  '...a......a.',
  '..........a.',
  '............',
  '............',
];
const REPLY_COLORS = { a: 'currentColor' };

/** Red od sest ikonica koji se pojavi na hover iznad poruke. */
export default function ReactionPicker({ active, onSelect, onReply }) {
  return (
    <div className="reactionBar">
      {/* Panel je unutar bar-a koji ima providan padding na dnu — tako
          nema rupe izmedju mehurica i panela koja bi prekinula :hover. */}
      <div className="reactionPanel">
        {REACTIONS.map((type) => (
          <button
            key={type}
            type="button"
            className={`reactionBtn${active === type ? ' reactionBtn-active' : ''}`}
            title={type}
            onClick={() => onSelect(type)}
          >
            <ReactionIcon type={type} size={18} />
          </button>
        ))}

        {/* privremeno: reply, za pregled dizajna */}
        <span className="reactionSep" />
        <button type="button" className="reactionBtn" title="REPLY" onClick={onReply}>
          <PixelIcon rows={REPLY_ROWS} colors={REPLY_COLORS} size={18} label="REPLY" />
        </button>
      </div>
    </div>
  );
}
