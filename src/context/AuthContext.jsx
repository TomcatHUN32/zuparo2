import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : '') + '/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('zuparo_token'));
  const [ready, setReady] = useState(false);

  // Attach token globally
  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!token) { setReady(true); return; }
      try {
        const { data } = await axios.get(`${API}/auth/me`);
        setUser(data);
      } catch { localStorage.removeItem('zuparo_token'); setToken(null); }
      finally { setReady(true); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('zuparo_token', data.token);
    setToken(data.token); setUser(data.user);
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await axios.post(`${API}/auth/register`, payload);
    localStorage.setItem('zuparo_token', data.token);
    setToken(data.token); setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem('zuparo_token');
    setToken(null); setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
