import { useState } from 'react';
import { ArrowRight, BookOpenCheck, LoaderCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (isSignup ? signup(values) : login({ email: values.email, password: values.password }));
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-screen">
    <section className="auth-visual">
      <div className="visual-grid" />
      <div className="visual-top"><span className="brand-mark"><BookOpenCheck size={19} /></span><span>LECTURE<span className="brand-light">/</span>NOTES</span></div>
      <div className="visual-content">
        <span className="eyebrow"><i /> A BETTER WAY TO REMEMBER</span>
        <h1>Every lecture.<br /><em>Still with you.</em></h1>
        <p>Bring recordings and board work together into a notebook that grows with every class.</p>
        <div className="visual-stamp">01 <span>CAPTURE</span><b>·</b> 02 <span>CONNECT</span><b>·</b> 03 <span>RECALL</span></div>
      </div>
      <div className="visual-footer">YOUR STUDY, IN GOOD ORDER <span>EST. TODAY</span></div>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <div className="auth-kicker">{isSignup ? 'START YOUR NOTEBOOK' : 'WELCOME BACK'}</div>
        <h2>{isSignup ? 'Make room to think.' : 'Pick up where you left off.'}</h2>
        <p className="auth-subtitle">{isSignup ? 'Create your private study space.' : 'Your classes and notes are waiting.'}</p>
        <form onSubmit={submit} className="auth-form">
          {isSignup && <label>Your name<input autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required maxLength={80} /></label>}
          <label>Email address<input type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required /></label>
          <label>Password<input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} required minLength={isSignup ? 8 : 1} /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button auth-submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <>{isSignup ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></>}
          </button>
        </form>
        <div className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Lecture Notes?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></div>
      </div>
      <div className="auth-footnote">PRIVATE BY DESIGN <span>·</span> BUILT FOR THE LONG SEMESTER</div>
    </section>
  </div>;
}