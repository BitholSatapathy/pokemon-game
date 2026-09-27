import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Sparkles,
  Heart,
  Eye,
  Plus,
  Coins,
  Trash2,
  ExternalLink,
  Flame,
  Clock,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPlayerShops,
  fetchMyShop,
  setupMyShop,
  stockCardInShop,
  unstockCardFromShop,
  fetchMyCollection,
  PlayerShop,
  ApiUserCard,
} from '../services/api';

const BANNER_PRESETS = [
  { name: 'Obsidian Neon', css: 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950' },
  { name: 'Magma Hearth', css: 'bg-gradient-to-r from-red-950 via-orange-950 to-amber-950' },
  { name: 'Emerald Sanctuary', css: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950' },
  { name: 'Deep Cyberpunk', css: 'bg-gradient-to-r from-cyan-950 via-blue-950 to-purple-950' },
  { name: 'Solaris Gold', css: 'bg-gradient-to-r from-yellow-950 via-amber-950 to-purple-950' },
];

export const PlayerShopsPage: React.FC = () => {
  const { token, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'bazaar' | 'manager'>('bazaar');
  const [sortBy, setSortBy] = useState<'popular' | 'visited' | 'newest'>('popular');
  const [shops, setShops] = useState<PlayerShop[]>([]);
  const [myShop, setMyShop] = useState<PlayerShop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [myCards, setMyCards] = useState<ApiUserCard[]>([]);

  // Setup Form State
  const [shopName, setShopName] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>(BANNER_PRESETS[0].css);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [savingShop, setSavingShop] = useState<boolean>(false);

  // Stock Form State
  const [selectedUserCardId, setSelectedUserCardId] = useState<number | null>(null);
  const [stockPrice, setStockPrice] = useState<string>('500');
  const [stockingCard, setStockingCard] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allShops = await fetchPlayerShops(sortBy, token || undefined);
      setShops(allShops);

      if (token) {
        const mine = await fetchMyShop(token);
        if (mine) {
          setMyShop(mine);
          setShopName(mine.shop_name);
          setSlogan(mine.slogan || '');
          setBannerUrl(mine.banner_url || BANNER_PRESETS[0].css);
          setIsOpen(mine.is_open);
        }
        const coll = await fetchMyCollection(token);
        if (coll && coll.items) {
          setMyCards(coll.items);
        }
      }
    } catch (err) {
      console.error('Failed to load player shops:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }
    if (!shopName.trim()) {
      showToast('Shop name is required', 'error');
      return;
    }
    setSavingShop(true);
    try {
      const updated = await setupMyShop(token, {
        shop_name: shopName.trim(),
        slogan: slogan.trim() || undefined,
        banner_url: bannerUrl,
        is_open: isOpen,
      });
      setMyShop(updated);
      showToast('Shop settings saved successfully! 🎉', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save shop settings', 'error');
    } finally {
      setSavingShop(false);
    }
  };

  const handleStockCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserCardId) return;
    const priceNum = parseInt(stockPrice, 10);
    if (isNaN(priceNum) || priceNum < 10) {
      showToast('Price must be at least 10 Coins', 'error');
      return;
    }
    setStockingCard(true);
    try {
      await stockCardInShop(token, {
        user_card_id: selectedUserCardId,
        price_coins: priceNum,
      });
      showToast('Card placed on your shop shelves! 🎴', 'success');
      setSelectedUserCardId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to stock card', 'error');
    } finally {
      setStockingCard(false);
    }
  };

  const handleUnstock = async (itemId: number) => {
    if (!token) return;
    try {
      await unstockCardFromShop(token, itemId);
      showToast('Card removed from shop inventory', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to unstock card', 'error');
    }
  };

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
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl shadow-lg shadow-amber-500/20">
                <Store className="w-7 h-7 text-black" />
              </div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Nexus Player Bazaar
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider font-display">
              Player <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">Shops & Kiosks</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Browse customized collector kiosks, buy rare finds directly from players, or establish your own storefront stall!
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('bazaar')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
                activeTab === 'bazaar'
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" /> Browse Bazaar ({shops.length})
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
                activeTab === 'manager'
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> My Storefront
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'bazaar' ? (
        /* ================= BROWSE BAZAAR ================= */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono uppercase">Sort Stalls:</span>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  sortBy === 'popular'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-glow-purple'
                    : 'bg-surface/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Most Popular
              </button>
              <button
                onClick={() => setSortBy('visited')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  sortBy === 'visited'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-glow-purple'
                    : 'bg-surface/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Most Visited
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  sortBy === 'newest'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-glow-purple'
                    : 'bg-surface/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-rose-400" /> Newest
              </button>
            </div>

            <span className="text-xs font-mono text-gray-400">
              {shops.length} active player stall{shops.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-gray-400">Loading Bazaar stalls...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="bg-surface/40 border border-white/5 rounded-3xl p-16 text-center space-y-4">
              <Store className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">The Bazaar is Quiet</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                No players have opened their stalls yet. Be the first to launch your shop!
              </p>
              <button
                onClick={() => setActiveTab('manager')}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                Open My Shop Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-3xl border border-white/10 bg-surface/70 overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/40 group"
                >
                  {/* Banner & Header */}
                  <div>
                    <div
                      className={`h-24 p-4 flex items-start justify-between relative ${
                        shop.banner_url || BANNER_PRESETS[0].css
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg bg-black/60">
                          <img
                            src={
                              shop.owner_avatar_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                            }
                            alt={shop.owner_username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-purple-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                            @{shop.owner_username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-full border border-white/10 text-xs font-mono text-gray-300">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        <span>{shop.likes_count}</span>
                      </div>
                    </div>

                    {/* Shop Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                          {shop.shop_name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {shop.slogan || 'Welcome to my card shop! Browse my inventory.'}
                        </p>
                      </div>

                      {/* Featured Pedestal Preview */}
                      {shop.featured_card && (
                        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-black/60 flex items-center justify-center">
                            {shop.featured_card.image_url ? (
                              <img
                                src={shop.featured_card.image_url}
                                alt={shop.featured_card.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Sparkles className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-400 font-mono uppercase font-bold">
                              Featured Showcase
                            </div>
                            <div className="text-xs font-extrabold text-white">
                              {shop.featured_card.name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {shop.featured_card.rarity}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Visit Button */}
                  <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs font-mono text-gray-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" /> {shop.visits_count}
                      </span>
                      <span>•</span>
                      <span>{shop.item_count} cards for sale</span>
                    </div>

                    <Link
                      to={`/shop/${shop.owner_username}`}
                      className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/50 hover:border-purple-400 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      Visit Stall <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= MY STOREFRONT MANAGER ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shop Setup Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" /> Storefront Settings
              </h2>

              <form onSubmit={handleSaveShop} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-gray-400 block mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Master Vault Bazaar"
                    maxLength={100}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-gray-400 block mb-1">
                    Welcome Slogan / Bio
                  </label>
                  <textarea
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Tell visitors about your specialties..."
                    maxLength={255}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-gray-400 block mb-2">
                    Banner Theme
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {BANNER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setBannerUrl(preset.css)}
                        className={`h-9 rounded-xl p-2 text-left text-xs font-bold text-white flex items-center justify-between border transition-all ${
                          preset.css
                        } ${
                          bannerUrl === preset.css
                            ? 'border-purple-400 ring-2 ring-purple-500/50'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span>{preset.name}</span>
                        {bannerUrl === preset.css && <Check className="w-4 h-4 text-purple-300" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono text-gray-300 uppercase">Stall Status</span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
                      isOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {isOpen ? '🟢 Open for Business' : '🔴 Closed'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={savingShop}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-glow-purple transition-all"
                >
                  {savingShop ? 'Saving...' : 'Save Storefront'}
                </button>
              </form>
            </div>
          </div>

          {/* Stock Inventory & Shelves */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock New Card */}
            <div className="bg-surface/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Stock Cards into Storefront
              </h2>

              <form onSubmit={handleStockCard} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-mono uppercase text-gray-400 block mb-1">
                      Select Card from Vault
                    </label>
                    <select
                      value={selectedUserCardId || ''}
                      onChange={(e) => setSelectedUserCardId(Number(e.target.value) || null)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">-- Choose a card from collection --</option>
                      {myCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.card.name} ({c.card.rarity}) {c.is_foil ? '✨ Foil' : ''} - x{c.quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-gray-400 block mb-1">
                      Asking Price (Coins)
                    </label>
                    <input
                      type="number"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(e.target.value)}
                      min={10}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedUserCardId || stockingCard}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-glow-purple transition-all"
                >
                  {stockingCard ? 'Stocking...' : '+ Stock on Shelves'}
                </button>
              </form>
            </div>

            {/* Currently Stocked Items */}
            <div className="bg-surface/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                  Active Stocked Shelves ({myShop?.items?.length || 0})
                </h3>
                {myShop && (
                  <Link
                    to={`/shop/${myShop.owner_username}`}
                    className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                  >
                    View Live Storefront <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {!myShop || !myShop.items || myShop.items.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Your shop shelves are currently empty. Select a card above to start selling!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {myShop.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-4 transition-colors hover:bg-white/[0.02] px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {item.name}
                            {item.is_foil && (
                              <span className="text-[10px] text-amber-300 font-bold">✨ Foil</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono uppercase">
                            {item.rarity}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" /> {item.price_coins.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">Asking Price</div>
                        </div>

                        <button
                          onClick={() => handleUnstock(item.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Unstock Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlayerShopsPage;
