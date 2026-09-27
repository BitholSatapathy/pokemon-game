import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Sparkles,
  Shield,
  Layers,
  Image as ImageIcon,
  Award,
  Coins,
  Gem,
  Check,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCosmeticsShop,
  fetchMyEquippedCosmetics,
  buyCosmetic,
  equipCosmetic,
  CosmeticItem,
  EquippedCosmetics,
  CosmeticType,
} from '../services/api';

const RARITY_COLORS: Record<string, { badge: string; border: string }> = {
  common: {
    badge: 'bg-slate-700/60 text-slate-300 border-slate-500/40',
    border: 'border-slate-700/50 hover:border-slate-500',
  },
  rare: {
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    border: 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
  },
  epic: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    border: 'border-purple-500/40 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  legendary: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
};

export const CosmeticsPage: React.FC = () => {
  const { token, user: authUser, refreshUser, openAuthModal } = useAuth();
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedCosmetics | null>(null);
  const [activeTab, setActiveTab] = useState<CosmeticType>('sleeve');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [flipPreview, setFlipPreview] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const shopItems = await fetchCosmeticsShop(token || undefined);
      setItems(shopItems);
      if (token) {
        const eq = await fetchMyEquippedCosmetics(token);
        setEquipped(eq);
      }
    } catch (err) {
      console.error('Failed to load cosmetics data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBuy = async (item: CosmeticItem, currency: 'coins' | 'gems') => {
    if (!token) {
      openAuthModal();
      return;
    }
    setActionLoading(item.id);
    try {
      await buyCosmetic(token, item.id, currency);
      showToast(`Successfully unlocked ${item.name}! 🎉`, 'success');
      await refreshUser();
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to purchase cosmetic item', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquip = async (item: CosmeticItem) => {
    if (!token) {
      openAuthModal();
      return;
    }
    setActionLoading(item.id);
    try {
      const updated = await equipCosmetic(token, item.type, item.id);
      setEquipped(updated);
      showToast(`Equipped ${item.name}! ✨`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to equip cosmetic item', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequip = async (slot: string) => {
    if (!token) return;
    setActionLoading(slot);
    try {
      const updated = await equipCosmetic(token, slot, null);
      setEquipped(updated);
      showToast(`Unequipped ${slot.replace('_', ' ')}`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to unequip item', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { type: CosmeticType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      type: 'sleeve',
      label: 'Card Sleeves',
      icon: <Layers className="w-4 h-4" />,
      count: items.filter((i) => i.type === 'sleeve').length,
    },
    {
      type: 'binder_theme',
      label: 'Binder Themes',
      icon: <Palette className="w-4 h-4" />,
      count: items.filter((i) => i.type === 'binder_theme').length,
    },
    {
      type: 'playmat',
      label: 'Playmats',
      icon: <ImageIcon className="w-4 h-4" />,
      count: items.filter((i) => i.type === 'playmat').length,
    },
    {
      type: 'avatar_frame',
      label: 'Avatar Frames',
      icon: <Shield className="w-4 h-4" />,
      count: items.filter((i) => i.type === 'avatar_frame').length,
    },
    {
      type: 'title',
      label: 'Prestige Titles',
      icon: <Award className="w-4 h-4" />,
      count: items.filter((i) => i.type === 'title').length,
    },
  ];

  const filteredItems = items.filter((i) => i.type === activeTab);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/50'
              : 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-900/50'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                Cosmetics & Dressing Room
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider font-display">
              Customization <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Vault</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Equip unique card sleeves, atmospheric binder themes, custom tournament playmats, and prestige titles.
            </p>
          </div>

          {/* Currencies & Balances */}
          {authUser && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-amber-300">
                  {authUser.coins.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Gem className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-black text-purple-300">
                  {authUser.gems.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Live Dressing Room / Stage */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-surface-card to-surface/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">
                Live Dressing Room Preview
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Real-time visual reflection of your equipped cosmetics
              </p>
            </div>
          </div>

          <button
            onClick={() => setFlipPreview(!flipPreview)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono text-purple-300 hover:text-white transition-all flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {flipPreview ? 'View Card Front' : 'View Card Sleeve Back'}
          </button>
        </div>

        {/* Stage Presentation */}
        <div className="pt-8 pb-4 flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Card Preview with Sleeve */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-52 h-72 rounded-2xl p-2.5 transition-all duration-500 flex flex-col items-center justify-center text-center shadow-2xl relative cursor-pointer group ${
                equipped?.playmat?.asset_data || 'bg-slate-950/70 border border-slate-800'
              }`}
              onClick={() => setFlipPreview(!flipPreview)}
            >
              <div
                className={`w-full h-full rounded-xl flex flex-col items-center justify-center p-4 border transition-all duration-300 ${
                  equipped?.sleeve?.asset_data ||
                  'bg-gradient-to-b from-slate-900 to-black border-slate-700 text-slate-400'
                }`}
              >
                {flipPreview ? (
                  /* Sleeve Back Preview */
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/5 shadow-inner">
                      <Sparkles className="w-7 h-7 text-white animate-pulse-slow" />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase font-mono">
                      {equipped?.sleeve?.name || 'Default Sleeve'}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">Click to flip</span>
                  </div>
                ) : (
                  /* Card Front Preview */
                  <div className="w-full h-full flex flex-col items-center justify-between py-2">
                    <div className="flex justify-between w-full text-[10px] font-bold text-white/70">
                      <span>Charizard</span>
                      <span className="text-red-400">120 HP</span>
                    </div>
                    <div className="w-24 h-24 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-3xl">
                      🔥
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                        Fire Spin
                      </div>
                      <div className="text-[10px] text-white/40 font-mono mt-0.5">Click to view sleeve</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400">
              Sleeve: <span className="text-purple-300 font-bold">{equipped?.sleeve?.name || 'Default'}</span>
            </span>
          </div>

          {/* Profile Avatar Frame & Title Preview */}
          <div className="flex flex-col items-center gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6 min-w-[280px]">
            <div className="relative group">
              <div
                className={`w-24 h-24 rounded-3xl overflow-hidden bg-black/60 transition-all duration-300 ${
                  equipped?.avatar_frame?.asset_data || 'border-2 border-white/20'
                }`}
              >
                <img
                  src={
                    authUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  }
                  alt="Player Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="font-extrabold text-white text-base">
                {authUser?.username || 'Nexus Collector'}
              </div>
              <div
                className={`text-xs font-mono transition-all ${
                  equipped?.title?.asset_data || 'text-slate-400 font-medium'
                }`}
              >
                {equipped?.title?.name || 'Novice Collector'}
              </div>
            </div>

            <div className="w-full pt-3 border-t border-white/10 space-y-1 text-xs text-gray-400 font-mono">
              <div className="flex justify-between">
                <span>Theme:</span>
                <span className="text-white font-bold">{equipped?.binder_theme?.name || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span>Playmat:</span>
                <span className="text-white font-bold">{equipped?.playmat?.name || 'Default'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left ${
                isActive
                  ? 'bg-gradient-to-br from-purple-900/60 to-surface-card border-purple-500 shadow-glow-purple scale-[1.02]'
                  : 'bg-surface/60 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl bg-black/40 border border-white/10 ${
                  isActive ? 'scale-110 text-purple-300' : ''
                }`}
              >
                {tab.icon}
              </div>
              <div>
                <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {tab.label}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{tab.count} Available</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cosmetics Catalogue Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-gray-400">Loading cosmetic catalogue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            const isEquipped = item.is_equipped;
            const isOwned = item.is_owned;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border bg-surface/70 p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.02] ${rarityStyle.border}`}
              >
                {/* Header & Preview Art */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${rarityStyle.badge}`}
                    >
                      {item.rarity}
                    </span>
                    {isEquipped && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Equipped
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden p-3 relative group">
                    <div
                      className={`w-full h-full rounded-xl flex items-center justify-center text-center p-2 transition-transform duration-300 group-hover:scale-105 ${
                        item.asset_data || 'bg-slate-900 border border-slate-700 text-white'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {/* Name & Description */}
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-snug">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Action Button: Equip or Buy */}
                <div className="pt-3 border-t border-white/10">
                  {isEquipped ? (
                    <button
                      onClick={() => handleUnequip(item.type)}
                      disabled={actionLoading === item.type}
                      className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors uppercase tracking-wider"
                    >
                      Unequip
                    </button>
                  ) : isOwned ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={actionLoading === item.id}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-glow-purple transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Equip Now
                    </button>
                  ) : (
                    /* Purchase Options */
                    <div className="flex gap-2">
                      {item.price_coins > 0 && (
                        <button
                          onClick={() => handleBuy(item, 'coins')}
                          disabled={actionLoading === item.id}
                          className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          {item.price_coins.toLocaleString()}
                        </button>
                      )}
                      {item.price_gems > 0 && (
                        <button
                          onClick={() => handleBuy(item, 'gems')}
                          disabled={actionLoading === item.id}
                          className="flex-1 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Gem className="w-3.5 h-3.5 text-purple-400" />
                          {item.price_gems.toLocaleString()}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CosmeticsPage;
