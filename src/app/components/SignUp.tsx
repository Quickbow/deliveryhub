import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShoppingCart, Store, Truck } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'customer', label: 'Customer', icon: ShoppingCart, color: 'from-pink-500 to-rose-400' },
  { value: 'seller',   label: 'Seller',   icon: Store,        color: 'from-yellow-400 to-orange-400' },
  { value: 'delivery', label: 'Delivery', icon: Truck,        color: 'from-cyan-400 to-blue-500' },
] as const;

const BG_IMAGES: Record<string, string> = {
  customer: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
  seller:   'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
  delivery: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&q=80',
};

const OVERLAYS: Record<string, string> = {
  customer: 'from-cyan-700/50 via-blue-600/40 to-sky-500/30',
  seller:   'from-cyan-700/50 via-blue-600/40 to-sky-500/30',
  delivery: 'from-cyan-700/50 via-blue-600/40 to-sky-500/30',
};

const BLOBS: Record<string, { top: string; bottom: string }> = {
  customer: { top: 'bg-cyan-400',  bottom: 'bg-sky-400' },
  seller:   { top: 'bg-cyan-400',  bottom: 'bg-sky-400' },
  delivery: { top: 'bg-cyan-400',  bottom: 'bg-sky-400' },
};

export const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState<'customer' | 'seller' | 'delivery'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(name, email, password, role);
    if (success) {
      toast.success('Account created successfully!');
      navigate(`/${role}`);
    } else {
      toast.error('Registration failed. Try again.');
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-card { animation: slideUp 0.65s cubic-bezier(.22,1,.36,1) 0.2s both; }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        {/* crossfade backgrounds */}
        {Object.entries(BG_IMAGES).map(([r, url]) => (
          <div
            key={r}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              backgroundImage: `url("${url}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: role === r ? 1 : 0,
            }}
          />
        ))}
        {/* colour overlay — switches per role */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 ${OVERLAYS[role]}`} />
        <div className={`absolute -top-32 -left-32 w-96 h-96 opacity-30 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${BLOBS[role].top}`} />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 opacity-30 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${BLOBS[role].bottom}`} />

        <div className="anim-card relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-extrabold text-white mb-1">
                Create <span className="bg-gradient-to-r from-pink-400 to-yellow-300 bg-clip-text text-transparent">Account</span>
              </h1>
              <p className="text-white/60 text-sm">Sign up to get started</p>
            </div>

            {/* role selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ROLES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-semibold transition-all duration-200 border ${
                    role === value
                      ? `bg-gradient-to-br ${color} text-white border-transparent shadow-lg scale-105`
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-white/80 text-sm">Full Name</Label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-white/80 text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-white/80 text-sm">Password</Label>
                <Input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 py-5 font-bold rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 border-0 shadow-lg shadow-pink-500/30 hover:scale-[1.02] transition-all duration-200"
              >
                Create Account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-white/50">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-pink-300 hover:text-pink-200 font-semibold hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};