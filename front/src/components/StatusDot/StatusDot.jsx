import './StatusDot.css';

/** Kvadratna tačka statusa: online / away / offline. */
export default function StatusDot({ status }) {
  return <div className={`dot dot-${status}`} />;
}
