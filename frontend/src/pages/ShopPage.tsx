import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, Coins, Check, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CardPanel } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { BoosterPack, UserProfile } from '../types';
import { MOCK_PACKS } from '../data/mockData';
import { fetchShopPacks, purchaseBoosterPack } from '../services/api';

interface ShopProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const ShopPage: React.FC<ShopProps> = ({ user, setUser }) => {
  const [packs, setPacks] = useState<BoosterPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<BoosterPack | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { isAuthenticated, token, openAuthModal } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadPacks = async () => {
      setIsLoading(true);
      const apiPacks = await fetchShopPacks();
      if (isMounted) {
        if (apiPacks.length > 0) {
          setPacks(apiPacks);
        } else {
          setPacks(MOCK_PACKS);
        }
        setIsLoading(false);
      }
    };
    loadPacks();
    return () => {
      isMounted = false;
    };
  }, []);

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
        showToast(result.message, 'gold', 'Pack Deposited!');
      } else {
        // Local simulation fallback
        setUser((prev) => ({
          ...prev,
          coins: prev.coins - selectedPack.priceCoins,
        }));
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

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Booster Pack Depot</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">OFFICIAL BOOSTER SHOP</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Guaranteed 10 cards per pack. Server-side RNG odds with immediate inventory crediting.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141424] border border-amber-500/40">
          <Coins className="w-4 h-4 text-brand-gold" />
          <span className="text-xs text-gray-300">Your Balance:</span>
          <span className="text-sm font-bold text-amber-300 font-mono">{user.coins.toLocaleString()} 🪙</span>
        </div>
      </div>

      {/* Packs Catalog */}
      {isLoading ? (
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

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedPack)}
        onClose={() => setSelectedPack(null)}
        title="Confirm Booster Purchase"
      >
        {selectedPack && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-[#17172B] border border-[#25253E]">
              <img
                src={selectedPack.coverImage}
                alt={selectedPack.name}
                className="w-16 h-20 object-cover rounded-lg border border-[#25253E]"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{selectedPack.name}</h4>
                <p className="text-xs text-gray-400">{selectedPack.series} • 10 Cards</p>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {selectedPack.priceCoins.toLocaleString()} Coins
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-300 space-y-1 bg-[#121222] p-3 rounded-lg border border-[#201E38]">
              <div className="flex justify-between">
                <span>Current Coins:</span>
                <span className="font-mono text-white">{user.coins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Cost:</span>
                <span className="font-mono">-{selectedPack.priceCoins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#201E38] font-bold text-amber-300">
                <span>Remaining Balance:</span>
                <span className="font-mono">{(user.coins - selectedPack.priceCoins).toLocaleString()} 🪙</span>
              </div>
            </div>

            {user.coins < selectedPack.priceCoins && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You do not have enough coins to purchase this pack.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedPack(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                isLoading={isPurchasing}
                onClick={handlePurchase}
                disabled={user.coins < selectedPack.priceCoins}
                leftIcon={<Check className="w-4 h-4 text-black" />}
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
