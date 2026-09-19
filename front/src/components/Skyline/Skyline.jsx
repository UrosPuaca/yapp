import './Skyline.css';

const BUILDING_COUNT = 14;

/** Dekorativna silueta grada ispod title bara. */
export default function Skyline() {
  return (
    <div className="skyline">
      {Array.from({ length: BUILDING_COUNT }, (_, i) => (
        <div className="bld" key={i} />
      ))}
    </div>
  );
}
