import { useEffect, useState } from 'react';

const initialForm = { name: '', email: '', password: '' };

function App() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('harbor_token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('harbor_token'));
  }, []);

  const updateForm = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', text: '' });
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('harbor_token', data.token);
      setUser(data.user);
      setForm(initialForm);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => { localStorage.removeItem('harbor_token'); setUser(null); };

  if (user) return <main className="shell"><section className="panel welcome-panel"><div className="brand-mark">H</div><p className="eyebrow">Your private harbor</p><h1>Welcome back,<br /><span>{user.name}</span>.</h1><p className="muted">Your identity is verified and your account is ready to go.</p><div className="account-card"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-button" aria-label="Sign out" onClick={signOut}>↗</button></div><p className="security-note"><span className="dot" /> Secured with encrypted sessions</p></section></main>;

  return <main className="shell"><section className="panel"><div className="panel-top"><div className="brand-mark">H</div><span className="status-pill"><span className="dot" /> Secure access</span></div><div className="intro"><p className="eyebrow">Welcome to Harbor</p><h1>{mode === 'login' ? 'A calmer place to sign in.' : 'Make room for what matters.'}</h1><p className="muted">{mode === 'login' ? 'Access your workspace with a single, secure sign in.' : 'Create your secure account and start with a clean slate.'}</p></div><div className="tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStatus({}); }}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setStatus({}); }}>Create account</button></div><form onSubmit={submit}>{mode === 'register' && <label>Full name<input name="name" value={form.name} onChange={updateForm} placeholder="Alex Morgan" autoComplete="name" /></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={updateForm} placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input name="password" type="password" value={form.password} onChange={updateForm} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>{status.text && <p className="error">{status.text}</p>}<button className="submit" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Enter Harbor  →' : 'Create my account  →'}</button></form><p className="fine-print">By continuing, you agree to our terms and acknowledge our privacy policy.</p></section><aside className="side-note"><span className="line" /><p>Built for focus.<br /><em>Designed for trust.</em></p></aside></main>;
}

export default App;
