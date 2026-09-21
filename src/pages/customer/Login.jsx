import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LOGO_URL } from '../../mock/mockData';
import { LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success('Sikeres bejelentkezés');
      const dest = loc.state?.from || (u.role === 'admin' ? '/admin/uj-rendeles' : '/');
      nav(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hibás email vagy jelszó');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <div className="text-center">
          <img src={LOGO_URL} className="h-20 mx-auto" alt="" />
          <h1 className="font-display text-3xl font-black text-white mt-2">BEJELENTKEZÉS</h1>
          <p className="text-sm text-neutral-400 mt-1">Rendeléshez lépj be a fiókodba.</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail cím" className="w-full pl-9 pr-3 py-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Jelszó" className="w-full pl-9 pr-3 py-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
          <button disabled={loading} type="submit" className="w-full gold-gradient text-black font-bold py-3 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"><LogIn size={16} /> {loading ? 'Bejelentkezés...' : 'Belépés'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-neutral-400">
          Még nincs fiókod? <Link to="/regisztracio" className="text-[#d4af37] hover:underline">Regisztráció</Link>
        </div>
        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-500">
          <div className="font-semibold text-neutral-300">Admin próbafiók</div>
          <div>Email: <span className="text-neutral-200">admin@zuparo.hu</span></div>
          <div>Jelszó: <span className="text-neutral-200">admin123</span></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
