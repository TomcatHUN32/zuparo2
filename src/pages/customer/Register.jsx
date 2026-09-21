import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LOGO_URL } from '../../mock/mockData';
import { UserPlus, User, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error('A jelszó legalább 6 karakter legyen');
    setLoading(true);
    try {
      await register(f);
      toast.success('Sikeres regisztráció');
      nav('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hiba történt');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <div className="text-center">
          <img src={LOGO_URL} className="h-20 mx-auto" alt="" />
          <h1 className="font-display text-3xl font-black text-white mt-2">REGISZTRÁCIÓ</h1>
          <p className="text-sm text-neutral-400 mt-1">Hozd létre a fiókod pár lépésben.</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field icon={User} placeholder="Név" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <Field icon={Mail} type="email" placeholder="E-mail" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
          <Field icon={Phone} placeholder="Telefonszám" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} required={false} />
          <Field icon={Lock} type="password" placeholder="Jelszó (min. 6 karakter)" value={f.password} onChange={(v) => setF({ ...f, password: v })} />
          <button disabled={loading} type="submit" className="w-full gold-gradient text-black font-bold py-3 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"><UserPlus size={16} /> {loading ? 'Regisztráció...' : 'Regisztráció'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-neutral-400">
          Már van fiókod? <Link to="/belepes" className="text-[#d4af37] hover:underline">Bejelentkezés</Link>
        </div>
      </div>
    </div>
  );
};
const Field = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
    <input {...props} onChange={(e) => props.onChange(e.target.value)} required={props.required !== false} className="w-full pl-9 pr-3 py-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
  </div>
);
export default Register;
