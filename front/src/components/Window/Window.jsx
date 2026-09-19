import './Window.css';

/** Retro "OS window" kontejner sa scanlines overlay-em. */
export default function Window({ theme = 'buddy', children }) {
  return (
    <div className="window" data-theme={theme}>
      <div className="scanlines" />
      {children}
    </div>
  );
}
