import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Coins,
  Clock,
  Flame,
  Zap,
  Tag,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CardPanel } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { BoosterPack, UserProfile } from '../types';
import { MOCK_PACKS } from '../data/mockData';
import {
  fetchShopPacks,
  purchaseBoosterPack,
  fetchMysteryShop,
  buyMysteryShopItem,
  MysteryShopItem,
} from '../services/api';
import { playCoinClinkSound } from '../services/sound';

interface ShopProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const ShopPage: React.FC<ShopProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'depot' | 'mystery'>('depot');
  const [packs, setPacks] = useState<BoosterPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [selectedPack, setSelectedPack] = useState<BoosterPack | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Mystery Black Market State
  const [mysteryItems, setMysteryItems] = useState<MysteryShopItem[]>([]);
  const [mysterySecondsLeft, setMysterySecondsLeft] = useState<number>(14400);
  const [isLoadingMystery, setIsLoadingMystery] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  const { isAuthenticated, token, openAuthModal } = useAuth();
  const { showToast } = useToast();

  // Load Standard Packs
  const loadPacks = async () => {
    setIsLoadingPacks(true);
    const apiPacks = await fetchShopPacks();
    if (apiPacks.length > 0) {
      setPacks(apiPacks);
    } else {
      setPacks(MOCK_PACKS);
    }
    setIsLoadingPacks(false);
  };

  // Load Mystery Shop
  const loadMysteryShop = async () => {
    if (!token) return;
    setIsLoadingMystery(true);
    try {
      const data = await fetchMysteryShop(token);
      setMysteryItems(data.items);
      setMysterySecondsLeft(data.seconds_remaining);
    } catch (err: any) {
      console.warn('Failed to load mystery shop:', err);
    } finally {
      setIsLoadingMystery(false);
    }
  };

  useEffect(() => {
    loadPacks();
    if (token) {
      loadMysteryShop();
    }
  }, [token]);

  // Live Timer Countdown for 4-Hour Mystery Shop
  useEffect(() => {
    const timer = setInterval(() => {
      setMysterySecondsLeft((prev) => {
        if (prev <= 1) {
          if (token) loadMysteryShop();
          return 14400;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [token]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenBuyModal = (pack: BoosterPack) => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to buy booster packs!', 'info', 'Sign In Required');
      openAuthModal('login');
      return;
    }
    setSelectedPack(pack);
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    if (user.coins < selectedPack.priceCoins) {
      showToast('Insufficient coins in your vault! Claim daily rewards or sell cards.', 'error', 'Purchase Failed');
      return;
    }

    setIsPurchasing(true);
    try {
      if (token) {
        const result = await purchaseBoosterPack(selectedPack.id, token);
        setUser((prev) => ({
          ...prev,
          coins: result.remaining_coins,
        }));
        playCoinClinkSound();
        showToast(result.message, 'gold', 'Pack Deposited!');
      } else {
        setUser((prev) => ({
          ...prev,
          coins: prev.coins - selectedPack.priceCoins,
        }));
        playCoinClinkSound();
        showToast(
          `Successfully bought 1x ${selectedPack.name} for ${selectedPack.priceCoins} 🪙`,
          'gold',
          'Pack Purchased!'
        );
      }
      setSelectedPack(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete purchase.', 'error', 'Purchase Error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleBuyMysteryItem = async (item: MysteryShopItem) => {
    if (!isAuthenticated || !token) {
      showToast('Please sign in to buy from the Black Market!', 'info');
      openAuthModal('login');
      return;
    }

    if (item.quantity_remaining <= 0) {
      showToast('This item is currently sold out in this 4-hour cycle!', 'error');
      return;
    }

    if (user.coins < item.price_coins) {
      showToast(`Insufficient coins! Need ${item.price_coins.toLocaleString()} Coins.`, 'error');
      return;
    }

    setBuyingItemId(item.id);
    try {
      const res = await buyMysteryShopItem(item.id, 1, token);
      setUser((prev) => ({ ...prev, coins: res.new_coins }));
      playCoinClinkSound();
      showToast(res.message, 'success', 'Black Market Secured!');

      // Update local stock quantity
      setMysteryItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, quantity_remaining: res.quantity_remaining, is_sold_out: res.is_sold_out }
            : it
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Purchase failed', 'error');
    } finally {
      setBuyingItemId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Card & Booster Depot</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">OFFICIAL SHOP & BAZAAR</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Official booster packs and 4-hour rotating limited black market deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141424] border border-amber-500/40">
            <Coins className="w-4 h-4 text-brand-gold" />
            <span className="text-xs text-gray-300">Vault Balance:</span>
            <span className="text-sm font-bold text-amber-300 font-mono">{user.coins.toLocaleString()} 🪙</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#121222] border border-[#201E38] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('depot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'depot'
              ? 'bg-gradient-to-r from-brand-violet to-purple-600 text-white shadow-glow-purple'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Booster Pack Depot</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('mystery');
            if (token && mysteryItems.length === 0) loadMysteryShop();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
            activeTab === 'mystery'
              ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>⚡ 4-Hour Mystery Black Market</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono uppercase font-black">
            Limited
          </span>
        </button>
      </div>

      {/* TAB 1: STANDARD BOOSTER DEPOT */}
      {activeTab === 'depot' && (
        <div className="space-y-6">
          {isLoadingPacks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} variant="card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packs.map((pack) => (
                <CardPanel
                  key={pack.id}
                  hoverEffect
                  className="flex flex-col justify-between overflow-hidden relative group border-[#201E38] hover:border-purple-500/50"
                >
                  {pack.featured && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="gold">
                        <Sparkles className="w-3 h-3 text-brand-gold mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Pack Art Visual */}
                    <div className="w-full aspect-[3/4.2] rounded-xl overflow-hidden bg-black/50 relative border border-[#25253E] group-hover:border-purple-500/40 transition-colors">
                      <img
                        src={pack.coverImage}
                        alt={pack.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121222] via-transparent to-transparent opacity-85" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-brand-purple font-semibold">
                          {pack.series}
                        </span>
                        <h3 className="text-base font-bold text-white font-display leading-tight">{pack.name}</h3>
                      </div>
                    </div>

                    {/* Description & Specs */}
                    <p className="text-xs text-gray-400 line-clamp-2">{pack.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-300 bg-[#17172B] px-3 py-1.5 rounded-lg border border-[#25253E]">
                      <span>Cards per pack:</span>
                      <span className="font-bold text-white font-mono">{pack.cardsCount}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-5 mt-4 border-t border-[#201E38]/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Price</span>
                      <div className="text-base font-extrabold text-amber-400 font-mono">
                        {pack.priceCoins.toLocaleString()} 🪙
                      </div>
                    </div>
                    <Button
                      variant={pack.featured ? 'gold' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenBuyModal(pack)}
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Buy Pack
                    </Button>
                  </div>
                </CardPanel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 4-HOUR ROTATING MYSTERY BLACK MARKET */}
      {activeTab === 'mystery' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Black Market Live Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-6 sm:p-8 bg-gradient-to-r from-[#170E04] via-[#1A1226] to-[#0E0C1C] shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-black uppercase bg-red-600 text-white tracking-widest">
                    BLACK MARKET CYCLE
                  </span>
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> High Demand Deals
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                  CLANDESTINE SYNDICATE KIOSK
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Steeply discounted cards and limited-edition packs. Every trainer receives their own distinct rotation. 
                  Stock is fixed per 4-hour window and regenerates upon timer expiration.
                </p>
              </div>

              {/* Reroll Countdown Clock */}
              <div className="shrink-0 flex flex-col items-center sm:items-end justify-center p-4 rounded-2xl bg-black/60 border border-amber-500/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-400">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span>Rerolls In:</span>
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-amber-300 tracking-wider mt-1 filter drop-shadow">
                  {formatTimer(mysterySecondsLeft)}
                </div>
                <span className="text-[10px] text-gray-500 font-mono mt-1">
                  Cycles every 4 hours (UTC)
                </span>
              </div>
            </div>
          </div>

          {/* Mystery Items Grid */}
          {isLoadingMystery ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={idx} variant="card" />
              ))}
            </div>
          ) : mysteryItems.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-white/5 space-y-3">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Sign In Required</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Please log into your trainer account to access your personal rotating mystery stock.
              </p>
              <Button variant="primary" size="sm" onClick={() => openAuthModal('login')}>
                Sign In Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mysteryItems.map((item) => (
                <CardPanel
                  key={item.id}
                  hoverEffect
                  className={`flex flex-col justify-between overflow-hidden relative group border transition-all ${
                    item.is_sold_out
                      ? 'border-gray-800 bg-[#0E0E18]/60 opacity-60'
                      : 'border-amber-500/30 hover:border-amber-400/70 bg-gradient-to-b from-[#14121F] to-[#0D0B14]'
                  }`}
                >
                  {/* Discount Tag */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-0.5 rounded-lg font-mono font-black text-xs bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md flex items-center gap-1">
                      <Tag className="w-3 h-3" /> -{item.discount_percent}%
                    </span>
                  </div>

                  {/* Stock Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] uppercase shadow-md ${
                        item.is_sold_out
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          : item.quantity_remaining === 1
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      {item.is_sold_out ? 'SOLD OUT' : `${item.quantity_remaining} Left in Stock`}
                    </span>
                  </div>

                  <div className="space-y-4 pt-6">
                    {/* Visual Artwork */}
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-black/60 relative border border-white/10 flex items-center justify-center p-2 group-hover:scale-102 transition-transform">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={`w-full h-full ${item.item_type === 'pack' ? 'object-cover' : 'object-contain'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                          {item.item_type === 'pack' ? 'Booster Pack' : item.types}
                        </span>
                        <h4 className="text-sm font-black text-white font-display leading-tight truncate">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    {/* Metadata Subtitle */}
                    <div className="text-[11px] text-gray-400 truncate">
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Price & Buy Action */}
                  <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-gray-400 line-through">
                        {item.original_price.toLocaleString()} 🪙
                      </div>
                      <div className="text-base font-black text-amber-300 font-mono flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>{item.price_coins.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      variant={item.is_sold_out ? 'outline' : 'gold'}
                      size="sm"
                      disabled={item.is_sold_out || buyingItemId === item.id}
                      isLoading={buyingItemId === item.id}
                      onClick={() => handleBuyMysteryItem(item)}
                      className={item.is_sold_out ? 'opacity-40 cursor-not-allowed' : ''}
                    >
                      {item.is_sold_out ? 'Sold Out' : 'Buy Deal'}
                    </Button>
                  </div>
                </CardPanel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy Booster Pack Modal */}
      <Modal
        isOpen={Boolean(selectedPack)}
        onClose={() => setSelectedPack(null)}
        title="Acquire Booster Pack"
        maxWidth="md"
      >
        {selectedPack && (
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="w-20 aspect-[3/4.2] rounded-xl overflow-hidden bg-black/50 border border-purple-500/40 shrink-0">
                <img
                  src={selectedPack.coverImage}
                  alt={selectedPack.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-purple-400 font-mono uppercase font-bold">
                  {selectedPack.series}
                </span>
                <h3 className="text-lg font-extrabold text-white font-display">
                  {selectedPack.name}
                </h3>
                <p className="text-xs text-gray-400">{selectedPack.description}</p>
              </div>
            </div>

            <div className="bg-[#141424] p-4 rounded-xl border border-[#201E38] space-y-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Unit Price</span>
                <span className="font-mono text-amber-400 font-bold">{selectedPack.priceCoins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Cards Included</span>
                <span className="font-mono font-bold text-white">{selectedPack.cardsCount} Cards</span>
              </div>
              <div className="border-t border-[#252538] pt-2 flex justify-between text-sm font-bold text-white">
                <span>Your Current Balance</span>
                <span className="font-mono text-amber-300">{user.coins.toLocaleString()} 🪙</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedPack(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handlePurchase}
                isLoading={isPurchasing}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Confirm Purchase
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
