import React, { useState } from 'react';
import { Sparkles, Lock, User, Mail, LogIn, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync tab with context when modal opens
  React.useEffect(() => {
    setTab(authModalTab);
    setErrorMsg('');
  }, [authModalTab, isAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'login') {
      if (!username || !password) {
        setErrorMsg('Please enter both username and password.');
        return;
      }
      const success = await login(username, password);
      if (!success) {
        setErrorMsg('Invalid username/email or password.');
      }
    } else {
      if (!username || !email || !password) {
        setErrorMsg('All fields are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      const success = await register(username, email, password);
      if (!success) {
        setErrorMsg('Registration failed. Username or email may already be taken.');
      }
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={tab === 'login' ? 'Player Authentication' : 'Create Trainer Account'}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Starter Pack Promotional Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2.5 shadow-glow-gold">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
          <div>
            <strong className="text-white block font-display uppercase tracking-wider">
              Phase 2 Starter Vault Perks
            </strong>
            <span>New trainers instantly receive 10,000 Coins 🪙 + 250 Gems 💎 at Level 1!</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#141424] rounded-xl border border-[#25253E] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-brand-violet text-white shadow-glow-purple font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-brand-violet text-white shadow-glow-purple font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Username / Username or Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              {tab === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={tab === 'login' ? 'Enter username or email' : 'e.g. Bithol'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#141424] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                required
              />
            </div>
          </div>

          {/* Email (only in Register mode) */}
          {tab === 'register' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="trainer@nexuscards.gg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141424] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#141424] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant={tab === 'register' ? 'gold' : 'primary'}
              size="lg"
              className="w-full text-sm font-bold"
              isLoading={isLoading}
              leftIcon={tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4 text-black" />}
            >
              {tab === 'login' ? 'Enter Vault' : 'Claim 10,000 Coins & Register'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
