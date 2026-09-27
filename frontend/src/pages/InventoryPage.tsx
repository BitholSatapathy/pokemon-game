import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, PackageOpen, Coins, DollarSign, ArrowRightLeft, Sparkles, Check } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { UserProfile, Card } from '../types';
import { MOCK_CARDS, MOCK_PACKS } from '../data/mockData';

interface InventoryProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const InventoryPage: React.FC<InventoryProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'packs' | 'cards' | 'items'>('packs');
  const [sellingCard, setSellingCard] = useState<Card | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Mock inventory packs
  const inventoryPacks = [
    { pack: MOCK_PACKS[0], count: 3 },
    { pack: MOCK_PACKS[1], count: 1 },
  ];

  // Cards with duplicates (quantity > 1)
  const duplicateCards = MOCK_CARDS.filter((c) => c.ownedQuantity > 1);

  const handleConfirmSell = () => {
    if (!sellingCard) return;
    const sellValue = Math.round(sellingCard.marketPrice * 0.85); // 85% liquidity payout

    setUser((prev) => ({
      ...prev,
      coins: prev.coins + sellValue,
    }));

    showToast(
      `Sold 1x ${sellingCard.name} for +${sellValue.toLocaleString()} Coins (Transaction logged).`,
      'success',
      'Card Sold!'
    );
    setSellingCard(null);
  };

  const tabs = [
    { id: 'packs', label: 'Unopened Packs', count: inventoryPacks.reduce((a, b) => a + b.count, 0) },
    { id: 'cards', label: 'Tradable Cards', count: duplicateCards.length },
    { id: 'items', label: 'Special Items', count: 2 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Phase 7 & 8 Module</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">PLAYER INVENTORY</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Items, duplicate assets, and boosters ready for unboxing, liquidation, or trading.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-amber-500/40 text-xs font-mono">
            <Coins className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-amber-300 font-bold">{user.coins.toLocaleString()} 🪙</span>
          </div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />
        </div>
      </div>

      {/* Tab 1: Unopened Packs */}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventoryPacks.map(({ pack, count }) => (
              <CardPanel key={pack.id} className="flex gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 aspect-[3/4] rounded-lg overflow-hidden border border-surface-border bg-black/40 shrink-0">
                    <img src={pack.coverImage} alt={pack.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-display">{pack.name}</h4>
                    <span className="text-xs text-brand-purple font-mono">{pack.series}</span>
                    <div className="text-xs text-gray-400 mt-1">
                      In Stock: <strong className="text-white font-mono">{count}x Packs</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => navigate('/packs')}
                    leftIcon={<PackageOpen className="w-3.5 h-3.5 text-black" />}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      showToast(`Listed 1x ${pack.name} for sale on pack market!`, 'gold', 'Pack Listed')
                    }
                  >
                    Sell Pack
                  </Button>
                </div>
              </CardPanel>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Duplicate Cards (Selling & Trading) */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-card border border-purple-500/30 flex items-center justify-between">
            <span className="text-xs text-gray-300">
              💡 Duplicate cards can be liquidated for instant coins or preserved for player trading.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {duplicateCards.map((card) => (
              <CardPanel key={card.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-14 aspect-[2.5/3.5] rounded object-cover border border-surface-border shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{card.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge rarity={card.rarity} className="text-[9px] px-1.5 py-0" />
                      <span className="text-xs text-gray-400 font-mono">Owned: {card.ownedQuantity}x</span>
                    </div>
                    <span className="text-xs text-amber-300 font-mono font-bold mt-1 block">
                      Value: {card.marketPrice.toLocaleString()} 🪙
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => setSellingCard(card)}
                    leftIcon={<DollarSign className="w-3 h-3 text-black" />}
                  >
                    Sell
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      showToast(`Card ${card.name} tagged for direct trade!`, 'info', 'Trading Desk')
                    }
                    leftIcon={<ArrowRightLeft className="w-3 h-3" />}
                  >
                    Trade
                  </Button>
                </div>
              </CardPanel>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Special Items */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardPanel className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-brand-purple flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Ultra-Rare Binder Sleeve (Cosmetic)</h4>
              <p className="text-xs text-gray-400">Gives cards in your public binder a dark prismatic sheen.</p>
              <Badge variant="purple" className="mt-2">Equipped</Badge>
            </div>
          </CardPanel>
          <CardPanel className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-brand-gold flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">2x Coin Boost Token</h4>
              <p className="text-xs text-gray-400">Doubles coin rewards earned from daily missions for 2 hours.</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => showToast('Activated 2x Coin Boost Token!', 'gold')}>
                Activate
              </Button>
            </div>
          </CardPanel>
        </div>
      )}

      {/* Sell Confirmation Modal */}
      <Modal
        isOpen={Boolean(sellingCard)}
        onClose={() => setSellingCard(null)}
        title="Sell Card for Coins"
      >
        {sellingCard && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light border border-surface-border">
              <img
                src={sellingCard.imageUrl}
                alt={sellingCard.name}
                className="w-16 aspect-[2.5/3.5] object-cover rounded-lg border border-surface-border"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{sellingCard.name}</h4>
                <Badge rarity={sellingCard.rarity} />
                <p className="text-xs text-gray-400">
                  Current owned: <strong className="text-white">{sellingCard.ownedQuantity}x</strong>
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-300 space-y-1.5 bg-surface-card p-3 rounded-lg border border-surface-border">
              <div className="flex justify-between">
                <span>Market Reference Value:</span>
                <span className="font-mono text-white">{sellingCard.marketPrice.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-amber-300 font-bold text-sm pt-1 border-t border-surface-border">
                <span>Instant Liquidation Payout (85%):</span>
                <span className="font-mono">+{Math.round(sellingCard.marketPrice * 0.85).toLocaleString()} 🪙</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSellingCard(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={handleConfirmSell}
                leftIcon={<Check className="w-4 h-4 text-black" />}
              >
                Confirm Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
