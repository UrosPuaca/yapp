import './Reply.css';

/* Tekst citata za traku iznad inputa — tamo imamo celu poruku. */
export function quoteText(message) {
  if (!message) return '';
  if (message.text) return message.text;
  if (message.type === 'image') return '[IMAGE]';
  if (message.type === 'file') return '[FILE]';
  if (message.type === 'voice') return '[VOICE]';
  return '';
}

/** Citirana poruka — u mehuricu ili u traci iznad input reda. */
export default function QuoteBlock({ who, text, className = 'quoteBlock', onClick }) {
  return (
    <div
      className={`${className}${onClick ? ' quoteBlock-clickable' : ''}`}
      onClick={onClick}
      title={onClick ? 'jump to message' : undefined}
    >
      <span className="quoteWho">{who}</span>
      <span className="quoteText">{text}</span>
    </div>
  );
}
