import React, { useState } from 'react';
import { authApi } from '../../api/client';
import styles from './AuthModal.module.scss';

interface Props {
  onSuccess: () => void;
}

type Tab = 'login' | 'register';

const AuthModal: React.FC<Props> = ({ onSuccess }) => {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await authApi.login({ email, password });
      } else {
        await authApi.register({ email, password, full_name: fullName });
        await authApi.login({ email, password });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.detail ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['auth-overlay']}>
      <div className={styles['auth-modal']}>
        <div className={styles['auth-modal__logo']}>
          Resume<span>.</span>
        </div>

        <div className={styles['auth-modal__tabs']}>
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              className={[
                styles['auth-modal__tab'],
                tab === t ? styles['auth-modal__tab--active'] : '',
              ].join(' ')}
              onClick={() => { setTab(t); reset(); }}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div className={styles['auth-modal__error']}>{error}</div>
        )}

        <form className={styles['auth-modal__form']} onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className={`btn btn--primary ${styles['auth-modal__submit']}`}
            disabled={loading}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;