import './Avatar.css';

/** Kvadratni pixel avatar — slika ako postoji, inače inicijal. */
export default function Avatar({ name, src }) {
  if (src) {
    return <img className="avatar avatarImg" src={src} alt={name} />;
  }
  return <div className="avatar">{name.charAt(0)}</div>;
}
