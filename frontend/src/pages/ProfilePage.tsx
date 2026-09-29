import React, { useState } from 'react';
import {
  Award,
  Coins,
  Gem,
  PackageCheck,
  Sparkles,
  Camera,
} from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AvatarPickerModal, DEFAULT_AVATAR } from '../components/common/AvatarPickerModal';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  setUser?: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const ProfilePage: React.FC<ProfileProps> = ({ user, setUser }) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));

  const handleAvatarUpdated = (newUrl: string) => {
    if (setUser) {
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
    }
  };

  const achievements = [
    { id: '1', title: 'First Pull', desc: 'Open your first booster pack.', icon: '🏆', unlocked: true },
    { id: '2', title: 'Rare Hunter', desc: 'Pull an Ultra Rare or Secret Rare card.', icon: '🔥', unlocked: true },
    { id: '3', title: 'Collector', desc: 'Collect 100 unique cards in your binder.', icon: '📚', unlocked: false, progress: '68/100' },
    { id: '4', title: 'Big Spender', desc: 'Spend 50,000 coins across the shop and market.', icon: '💰', unlocked: false, progress: '8,000/50,000' },
    { id: '5', title: 'Completionist', desc: 'Complete 100% of the Base Set binder.', icon: '👑', unlocked: false, progress: '42%' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Card Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar with Glow Frame & Click-to-Edit Trigger */}
          <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-purple shadow-glow-purple bg-surface-card flex items-center justify-center group-hover:border-purple-300 transition-all">
              <img
                src={user.avatarUrl || DEFAULT_AVATAR}
                alt={user.username}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-2xl">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold font-mono">Change</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-brand-gold text-black font-extrabold text-xs flex items-center justify-center shadow-md">
              {user.level}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {user.username}
              </h1>
              {user.isAdmin && (
                <Badge variant="gold" className="animate-pulse bg-red-950/80 border-red-500/60 text-red-300">
                  👑 GOD OVERLORD ADMIN
                </Badge>
              )}
              <Badge variant="purple">Level {user.level} Trainer</Badge>
              <Badge variant="gold">Phase 2 Ready</Badge>
            </div>
            <p className="text-xs text-gray-400 font-mono">{user.email}</p>

            {/* Level XP Bar */}
            <div className="pt-2 max-w-md space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-300">Level Progression</span>
                <span className="text-brand-purple font-mono">
                  {user.xp} / {user.xpToNextLevel} XP ({xpPercent}%)
                </span>
              </div>
              <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-violet to-brand-purple h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, xpPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAvatarModalOpen(true)}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Change Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onAvatarUpdated={handleAvatarUpdated}
      />

      {/* Balances & Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardPanel className="space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Wallet Coins</span>
            <Coins className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {user.coins.toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-400">Starter Balance (Phase 2)</span>
        </CardPanel>

        <CardPanel className="space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Premium Gems</span>
            <Gem className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {user.gems.toLocaleString()}
          </div>
          <span className="text-[11px] text-cyan-400">For exclusive drops</span>
        </CardPanel>

        <CardPanel className="space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Total Cards</span>
            <PackageCheck className="w-4 h-4 text-brand-purple" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{user.totalCards}</div>
          <span className="text-[11px] text-emerald-400">68 registered</span>
        </CardPanel>

        <CardPanel className="space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase">Packs Opened</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{user.packsOpened}</div>
          <span className="text-[11px] text-amber-300">14 lifetime</span>
        </CardPanel>
      </div>

      {/* Achievements Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-display tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-gold" />
            <span>ACCOMPLISHMENTS & BADGES (PHASE 10 PREVIEW)</span>
          </h2>
          <span className="text-xs text-gray-400 font-mono">2 / 5 Unlocked</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <CardPanel
              key={ach.id}
              className={`flex items-start gap-4 ${
                ach.unlocked ? 'border-purple-500/40' : 'opacity-60 border-surface-border'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  ach.unlocked ? 'bg-purple-900/40 border border-purple-500/50 shadow-glow-purple' : 'bg-surface-light border border-surface-border'
                }`}
              >
                {ach.icon}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{ach.title}</h4>
                  {ach.unlocked ? (
                    <Badge variant="success" className="text-[9px] px-1.5 py-0">
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] px-1.5 py-0">Locked</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-tight">{ach.desc}</p>
                {ach.progress && (
                  <span className="text-[11px] text-brand-purple font-mono block pt-1">
                    Progress: {ach.progress}
                  </span>
                )}
              </div>
            </CardPanel>
          ))}
        </div>
      </div>
    </div>
  );
};
