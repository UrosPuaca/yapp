import { useEffect, useState } from 'react';
import StatusDot from '../StatusDot/StatusDot.jsx';
import { getUser } from '../../api/users.js';
import './Profile.css';

/** Profil sagovornika — podaci sa backenda (/api/user/{id}), samo za gledanje. */
export default function ContactProfileModal({ contact, onClose }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contact.otherUserId) return; // mock kontakt bez pravog ID-a
    getUser(contact.otherUserId)
      .then((data) => setInfo(data))
      .catch((err) => setError(err.message.toUpperCase()));
  }, [contact.otherUserId]);

  const displayName = info?.username || contact.name;
  const avatarSrc = info?.profileImageUrl || contact.avatar || null;
  const loading = contact.otherUserId && !info && !error;

  return (
    <div className="profileOverlay" onClick={onClose}>
      <div className="profilePanel" onClick={(e) => e.stopPropagation()}>
        <div className="profileHead">
          <span className="profileTitle">&gt; USER_PROFILE</span>
          <button className="profileClose" onClick={onClose}>
            [X]
          </button>
        </div>

        <div className="profileAvatarWrap">
          {avatarSrc ? (
            <img className="profileAvatar" src={avatarSrc} alt={displayName} />
          ) : (
            <div className="profileAvatar profileAvatar-empty">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {error && <div className="authError">! {error}</div>}
        {loading && <div className="profileLoading">LOADING...</div>}

        <div className="profileRow">
          <span className="profileLabel">USERNAME</span>
          <span className="profileValue">{displayName}</span>
        </div>
        {info && (
          <>
            <div className="profileRow">
              <span className="profileLabel">FIRST_NAME</span>
              <span className="profileValue">{info.name}</span>
            </div>
            <div className="profileRow">
              <span className="profileLabel">LAST_NAME</span>
              <span className="profileValue">{info.surname}</span>
            </div>
          </>
        )}
        <div className="profileRow">
          <span className="profileLabel">STATUS</span>
          <span className="profileValue profileStatus">
            <StatusDot status={contact.status} /> {contact.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
