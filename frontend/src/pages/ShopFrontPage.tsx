import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Eye,
  Coins,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPlayerShop,
  toggleUpvoteShop,
  buyFromPlayerShop,
  PlayerShop,
  ShopCardItem,
} from '../services/api';

export const ShopFrontPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { token, user: authUser, refreshUser, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState<PlayerShop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);
  const [buyLoadingId, setBuyLoadingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadShop = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const data = await fetchPlayerShop(username, token || undefined);
      setShop(data);
    } catch (err) {
      console.error('Failed to load shop:', err);
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const handleLikeToggle = async () => {
    if (!shop || !username) return;
    if (!token) {
      openAuthModal();
      return;
    }
    setLikeLoading(true);
    try {
      const res = await toggleUpvoteShop(token, username);
      setShop((prev) =>
        prev
          ? {
              ...prev,
              likes_count: res.likes_count,
              is_liked_by_me: res.is_liked,
            }
          : null
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to upvote shop', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBuyItem = async (item: ShopCardItem) => {
    if (!token) {
      openAuthModal();
      return;
    }
    setBuyLoadingId(item.id);
    try {
      const res = await buyFromPlayerShop(token, item.id);
      showToast(`Successfully purchased ${res.card_name} for ${res.price_coins.toLocaleString()} Coins! 🎉`, 'success');
      await refreshUser();
      // Remove item locally
      setShop((prev) =>
        prev
          ? {
              ...prev,
              item_count: Math.max(0, prev.item_count - 1),
              items: prev.items.filter((i) => i.id !== item.id),
            }
          : null
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to purchase card', 'error');
    } finally {
      setBuyLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-gray-400">Opening player storefront...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          🏬
        </div>
        <h2 className="text-2xl font-bold text-white">Storefront Not Found</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Player <span className="text-purple-400 font-mono">@{username}</span> has not launched a storefront in the Bazaar yet.
        </p>
        <Link
          to="/shops"
          className="mt-2 px-5 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Bazaar
        </Link>
      </div>
    );
  }

  const isOwner = authUser?.username === shop.owner_username;

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

      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/shops')}
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Bazaar
        </button>
      </div>

      {/* Hero Storefront Banner */}
      <div
        className={`rounded-3xl border border-white/15 overflow-hidden shadow-2xl relative p-6 sm:p-8 ${
          shop.banner_url || 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {/* Owner Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-black/60">
                <img
                  src={
                    shop.owner_avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  }
                  alt={shop.owner_username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-300">
                Lvl {shop.owner_level}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display">
                  {shop.shop_name}
                </h1>
                {!shop.is_open && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/40">
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm mt-1 max-w-lg">
                {shop.slogan || 'Welcome to my card shop! Browse my inventory.'}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-xs font-mono text-purple-300">
                <Link
                  to={`/player/${shop.owner_username}`}
                  className="hover:underline flex items-center gap-1"
                >
                  Proprietor: @{shop.owner_username} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Social Stats & Like Button */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-center px-2">
              <div className="text-lg font-black text-white flex items-center justify-center gap-1">
                <Eye className="w-4 h-4 text-cyan-400" /> {shop.visits_count}
              </div>
              <div className="text-[10px] text-gray-400 font-mono uppercase">Visits</div>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <button
              onClick={handleLikeToggle}
              disabled={likeLoading || isOwner}
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${
                shop.is_liked_by_me
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <div className="text-lg font-black flex items-center gap-1">
                <Heart
                  className={`w-4 h-4 ${
                    shop.is_liked_by_me ? 'text-rose-400 fill-rose-400' : 'text-gray-400'
                  }`}
                />
                <span>{shop.likes_count}</span>
              </div>
              <div className="text-[10px] font-mono uppercase">
                {shop.is_liked_by_me ? 'Liked' : 'Like'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Card Pedestal (If Present) */}
      {shop.featured_card && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-surface/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs uppercase font-bold tracking-widest text-amber-300 font-mono">
              Center Stage Pedestal
            </h2>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-36 h-48 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-glow-amber bg-black/60 p-2 transform hover:scale-105 transition-transform duration-300">
              {shop.featured_card.image_url ? (
                <img
                  src={shop.featured_card.image_url}
                  alt={shop.featured_card.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🎴</div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-black text-white">{shop.featured_card.name}</h3>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                {shop.featured_card.rarity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stocked Shelves Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" /> Stocked Cards for Sale ({shop.items.length})
          </h2>
          {isOwner && (
            <Link
              to="/shops"
              className="text-xs font-mono text-purple-400 hover:text-purple-300"
            >
              Manage Inventory →
            </Link>
          )}
        </div>

        {shop.items.length === 0 ? (
          <div className="bg-surface/40 border border-white/5 rounded-3xl p-16 text-center space-y-2">
            <Layers className="w-10 h-10 text-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Cards Stocked Currently</h3>
            <p className="text-gray-400 text-xs">
              Check back soon or visit other collector stalls in the Bazaar!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shop.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border bg-surface/70 p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] ${
                  item.is_foil
                    ? 'border-purple-500/50 shadow-glow-purple bg-gradient-to-b from-purple-950/40 to-surface-card'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  {item.is_foil && (
                    <div className="text-[9px] font-black uppercase tracking-wider text-amber-300 mb-1">
                      ✨ Foil Edition
                    </div>
                  )}

                  {/* Artwork */}
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center mb-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-white text-xs truncate">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">
                    {item.rarity}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono">Price:</span>
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {item.price_coins.toLocaleString()}
                    </span>
                  </div>

                  {isOwner ? (
                    <div className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-center text-[10px] font-mono text-gray-400 uppercase">
                      Your Listing
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(item)}
                      disabled={buyLoadingId === item.id || !shop.is_open}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {buyLoadingId === item.id ? 'Buying...' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ShopFrontPage;
