import { useEffect, useRef, useState } from 'react';
import StatusDot from '../StatusDot/StatusDot.jsx';
import { THEMES } from '../../data/themes.js';
import { getMe, updateAvatar } from '../../api/users.js';
import { uploadMedia } from '../../api/media.js';
import './Profile.css';

/** Modal preko chata: podaci sa backenda (/api/user/me), slika i izbor teme. */
export default function ProfileModal({ user, onAvatarChange, onClose, theme, onThemeChange }) {
  const fileRef = useRef(null);

  // Podaci profila sa backenda
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => setInfo(data))
      .catch((err) => setError(err.message.toUpperCase()));
  }, []);

  /* Izbor slike: 1) upload na media servis -> URL, 2) URL na /api/me/avatar */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      await updateAvatar(url);
      setInfo((prev) => (prev ? { ...prev, profileImageUrl: url } : prev));
      onAvatarChange(url); // da se odmah vidi i u sidebaru
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setUploading(false);
    }
  };

  // Slika: prvo lokalno izabrana, pa ona sa servera
  const avatarSrc = user.avatar || info?.profileImageUrl || null;
  const displayName = info?.username || user.username;

  return (
    <div className="profileOverlay" onClick={onClose}>
      <div className="profilePanel" onClick={(e) => e.stopPropagation()}>
        <div className="profileHead">
          <span className="profileTitle">&gt; MY_PROFILE</span>
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
          <button
            className="profileBtn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'UPLOADING...' : avatarSrc ? 'CHANGE PHOTO' : 'ADD PHOTO'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </div>

        {error && <div className="authError">! {error}</div>}
        {!info && !error && <div className="profileLoading">LOADING...</div>}

        {info && (
          <>
            <div className="profileRow">
              <span className="profileLabel">USERNAME</span>
              <span className="profileValue">{info.username}</span>
            </div>
            <div className="profileRow">
              <span className="profileLabel">FIRST_NAME</span>
              <span className="profileValue">{info.name}</span>
            </div>
            <div className="profileRow">
              <span className="profileLabel">LAST_NAME</span>
              <span className="profileValue">{info.surname}</span>
            </div>
            <div className="profileRow">
              <span className="profileLabel">EMAIL</span>
              <span className="profileValue">{info.email}</span>
            </div>
            <div className="profileRow">
              <span className="profileLabel">STATUS</span>
              <span className="profileValue profileStatus">
                <StatusDot status="online" /> ONLINE
              </span>
            </div>
          </>
        )}

        <div className="styleSection">
          <span className="profileLabel">CHOOSE_STYLE</span>
          <div className="styleRow">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                className={'styleSwatch' + (t.id === theme ? ' styleSwatch-active' : '')}
                style={{
                  background: `linear-gradient(90deg, ${t.colors[0]} 0 34%, ${t.colors[1]} 34% 67%, ${t.colors[2]} 67% 100%)`,
                }}
                onClick={() => onThemeChange(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
