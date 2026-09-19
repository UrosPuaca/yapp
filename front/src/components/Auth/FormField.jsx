import './Auth.css';

/** Labela + input u retro stilu, kontrolisana komponenta. */
export default function FormField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="formField">
      <span className="formLabel">{label}</span>
      <input
        className="formInput"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
