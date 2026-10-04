import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem('lecture-notes-token');
      setUser(null);
    };
    window.addEventListener('auth:expired', clearSession);
    const token = localStorage.getItem('lecture-notes-token');
    if (!token) {
      setLoading(false);
    } else {
      api.get('/api/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(clearSession)
        .finally(() => setLoading(false));
    }
    return () => window.removeEventListener('auth:expired', clearSession);
  }, []);

  const authenticate = async (path, values) => {
    const { data } = await api.post(`/api/auth/${path}`, values);
    localStorage.setItem('lecture-notes-token', data.token);
    setUser(data.user);
    return data.user;
  };

  const value = {
    user,
    loading,
    signup: (values) => authenticate('signup', values),
    login: (values) => authenticate('login', values),
    logout: () => {
      localStorage.removeItem('lecture-notes-token');
      setUser(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}