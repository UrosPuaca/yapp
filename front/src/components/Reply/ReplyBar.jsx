import QuoteBlock, { quoteText } from './QuoteBlock.jsx';
import './Reply.css';

/** Traka iznad input reda dok se pise odgovor. */
export default function ReplyBar({ message, contactName, onCancel }) {
  return (
    <div className="replyBar">
      <QuoteBlock
        who={message.from === 'me' ? 'YOU' : contactName}
        text={quoteText(message)}
        className="replyBarQuote"
      />
      <button className="replyBarClose" onClick={onCancel} title="cancel reply">
        [X]
      </button>
    </div>
  );
}
