import { useState } from 'react';
import FormField from './FormField.jsx';
import { register } from '../../api/auth.js';
import './Auth.css';

export default function RegisterForm({ onRegister, onGoLogin }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !username.trim() ||
      !name.trim() ||
      !surname.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
      setError('FILL IN ALL FIELDS');
      return;
    }
    if (!email.includes('@')) {
      setError('INVALID EMAIL');
      return;
    }
    if (password.length < 6) {
      setError('PASSWORD MIN 6 CHARS');
      return;
    }
    if (password !== confirm) {
      setError('PASSWORDS DO NOT MATCH');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await register({
        username: username.trim(),
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
      });

      // Token se dobija tek na loginu — posle registracije idemo na prijavu.
      onRegister(username.trim(), email.trim());
    } catch (err) {
      // Poruka sa backenda se prikazuje takva kakva je (engleski)
      setError(err.message.toUpperCase());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authBody">
      <form className="authPanel authPanel-wide" onSubmit={handleSubmit}>
        <div className="authTitle">&gt; NEW_ACCOUNT</div>

        <div className="authGrid">
          <FormField
            label="USERNAME"
            value={username}
            onChange={setUsername}
            placeholder="enter_username..."
          />
          <FormField
            label="EMAIL"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@network.exe"
          />
          <FormField label="FIRST_NAME" value={name} onChange={setName} placeholder="first_name..." />
          <FormField
            label="LAST_NAME"
            value={surname}
            onChange={setSurname}
            placeholder="last_name..."
          />
          <FormField
            label="PASSWORD"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="enter_password..."
          />
          <FormField
            label="REPEAT_PASSWORD"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="once_more..."
          />
        </div>

        {error && <div className="authError">! {error}</div>}

        <button type="submit" className="authBtn authBtn-pink" disabled={busy}>
          {busy ? 'REGISTERING...' : 'SIGN UP'}
        </button>

        <div className="authSwitch">
          have an account?{' '}
          <button type="button" className="authLink" onClick={onGoLogin}>
            log in
          </button>
        </div>
      </form>
    </div>
  );
}
