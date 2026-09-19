import { useState } from 'react';
import FormField from './FormField.jsx';
import { login } from '../../api/auth.js';
import { setToken } from '../../api/client.js';
import './Auth.css';

export default function LoginForm({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('FILL IN ALL FIELDS');
      return;
    }

    setError('');
    setBusy(true);
    try {
      const data = await login({ email: email.trim(), password });

      // Backend sada vraca JSON: { token, username }
      const token = typeof data === 'string' ? data : data?.token || null;
      if (!token) throw new Error('NO TOKEN IN RESPONSE');

      const username = data?.username || email.trim();
      setToken(token);
      onLogin(username, email.trim());
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authBody">
      <form className="authPanel" onSubmit={handleSubmit}>
        <div className="authTitle">&gt; LOGIN</div>

        <FormField
          label="EMAIL"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@network.exe"
        />
        <FormField
          label="PASSWORD"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="enter_password..."
        />

        {error && <div className="authError">! {error}</div>}

        <button type="submit" className="authBtn" disabled={busy}>
          {busy ? 'LOGGING IN...' : 'LOG IN'}
        </button>

        <div className="authSwitch">
          no account?{' '}
          <button type="button" className="authLink" onClick={onGoRegister}>
            sign up
          </button>
        </div>
      </form>
    </div>
  );
}
