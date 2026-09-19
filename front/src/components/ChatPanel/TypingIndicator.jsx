import './TypingIndicator.css';

/** Tri tackice dok sagovornik kuca. Stoji na dnu threada, kao tudja poruka. */
export default function TypingIndicator({ name }) {
  return (
    <div className="typingRow msgRow msgRow-them">
      <div className="typing" title={`${name} is typing`}>
        <span className="typingDot" />
        <span className="typingDot" />
        <span className="typingDot" />
      </div>
    </div>
  );
}
