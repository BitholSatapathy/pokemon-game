import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  PackageOpen,
  Coins,
  DollarSign,
  ArrowRightLeft,
  Sparkles,
  Check,
  Database,
  History,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { MOCK_PACKS } from '../data/mockData';
import {
  fetchPlayerPacks,
  fetchMyCollection,
  sellCard,
  bulkSellDuplicates,
  fetchMyTransactions,
  ApiPlayerPack,
  ApiUserCard,
  ApiTransaction,
} from '../services/api';

interface InventoryProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const InventoryPage: React.FC<InventoryProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'packs' | 'cards' | 'history' | 'items'>('packs');
  const [playerPacks, setPlayerPacks] = useState<ApiPlayerPack[]>([]);
  const [userCards, setUserCards] = useState<ApiUserCard[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);

  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSellingBulk, setIsSellingBulk] = useState(false);
  const [isSellingSingle, setIsSellingSingle] = useState(false);

  // Single card sell modal state
  const [selectedSellCard, setSelectedSellCard] = useState<ApiUserCard | null>(null);
  const [sellQty, setSellQty] = useState<number>(1);
  const [duplicateFilterOnly, setDuplicateFilterOnly] = useState<boolean>(true);

  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Load packs
  const loadPacks = async () => {
    if (!token) return;
    setIsLoadingPacks(true);
    try {
      const packs = await fetchPlayerPacks(token);
      setPlayerPacks(packs);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  // Load collection
  const loadCollection = async () => {
    if (!token) return;
    setIsLoadingCards(true);
    try {
      const col = await fetchMyCollection(token);
      if (col && col.items) {
        setUserCards(col.items);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingCards(false);
    }
  };

  // Load transaction history
  const loadTransactions = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const txs = await fetchMyTransactions(token);
      setTransactions(txs);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'packs') loadPacks();
      if (activeTab === 'cards') loadCollection();
      if (activeTab === 'history') loadTransactions();
    }
  }, [token, activeTab]);

  // Fallback mock packs if user not logged in
  const fallbackPacks = [
    { pack: MOCK_PACKS[0], count: 3 },
    { pack: MOCK_PACKS[1], count: 1 },
  ];

  // Calculate duplicates (cards with quantity > 1)
  const duplicateCards = useMemo(() => {
    return userCards.filter((uc) => uc.quantity > 1);
  }, [userCards]);

  const totalDuplicateSurplus = useMemo(() => {
    return duplicateCards.reduce((acc, uc) => acc + (uc.quantity - 1), 0);
  }, [duplicateCards]);

  const estimatedDuplicatePayout = useMemo(() => {
    return duplicateCards.reduce((acc, uc) => {
      const unit = Math.max(10, Math.floor(uc.card.market_price * 0.70));
      return acc + unit * (uc.quantity - 1);
    }, 0);
  }, [duplicateCards]);

  // Bulk liquidation handler
  const handleBulkSellDuplicates = async () => {
    if (!token) {
      showToast('Please sign in to sell cards.', 'error');
      return;
    }
    if (totalDuplicateSurplus === 0) {
      showToast('You do not have any duplicate cards to sell.', 'info');
      return;
    }

    setIsSellingBulk(true);
    try {
      const result = await bulkSellDuplicates(token);
      setUser((prev) => ({
        ...prev,
        coins: result.new_coin_balance,
      }));
      showToast(
        `Liquidated ${result.cards_sold} duplicate copies for +${result.total_coins_earned.toLocaleString()} Coins! (1 copy of each card preserved in Vault)`,
        'gold',
        'Duplicate Liquidation Complete'
      );
      loadCollection();
      loadTransactions();
    } catch (err: any) {
      showToast(err.message || 'Bulk sell failed.', 'error');
    } finally {
      setIsSellingBulk(false);
    }
  };

  // Single card sell handler
  const handleConfirmSingleSell = async () => {
    if (!selectedSellCard || !token) return;
    setIsSellingSingle(true);
    try {
      const result = await sellCard(
        selectedSellCard.card.id,
        sellQty,
        selectedSellCard.is_foil,
        token
      );
      setUser((prev) => ({
        ...prev,
        coins: result.new_coin_balance,
      }));
      showToast(
        `Sold ${result.quantity_sold}x ${result.card_name} for +${result.coins_earned.toLocaleString()} Coins!`,
        'success',
        'Sale Confirmed'
      );
      setSelectedSellCard(null);
      setSellQty(1);
      loadCollection();
      loadTransactions();
    } catch (err: any) {
      showToast(err.message || 'Sale failed.', 'error');
    } finally {
      setIsSellingSingle(false);
    }
  };

  const totalPacksCount =
    playerPacks.length > 0
      ? playerPacks.reduce((acc, p) => acc + p.quantity, 0)
      : fallbackPacks.reduce((a, b) => a + b.count, 0);

  const displayedCards = duplicateFilterOnly ? duplicateCards : userCards;

  const tabs = [
    { id: 'packs', label: 'Unopened Packs', count: totalPacksCount },
    { id: 'cards', label: 'Vault & Duplicates', count: duplicateCards.length },
    { id: 'history', label: 'Ledger', count: transactions.length },
    { id: 'items', label: 'Special Items', count: 2 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Phases 7 & 8 Engine</span>
            {isAuthenticated && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Database className="w-3 h-3" /> Live Vault Synchronized
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">PLAYER INVENTORY</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Unopened booster packs, duplicate liquidation engine, and financial transaction ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141424] border border-amber-500/40 text-xs font-mono shadow-lg shadow-amber-500/5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{user.coins.toLocaleString()} 🪙</span>
          </div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />
        </div>
      </div>

      {/* Tab 1: Unopened Packs */}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 font-mono flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-brand-gold" />
              Sealed Booster Packs in Vault ({totalPacksCount})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={loadPacks}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingPacks ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>

          {isLoadingPacks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : playerPacks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playerPacks.map((item) => (
                <CardPanel
                  key={item.id}
                  className="flex gap-4 items-center justify-between border-[#201E38] hover:border-brand-purple/40 transition-all p-4 bg-[#10101F]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 aspect-[3/4.2] rounded-xl overflow-hidden border border-[#25253E] bg-black/40 shrink-0 shadow-lg shadow-purple-500/10">
                      <img src={item.pack.cover_image} alt={item.pack.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-display">{item.pack.name}</h4>
                      <span className="text-xs text-brand-purple font-mono block">Base Set 1st Gen</span>
                      <div className="text-xs text-gray-300 mt-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        In Vault: <strong className="text-amber-300 font-mono text-sm">{item.quantity}x</strong>
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
                      Open Pack
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/shop')}
                    >
                      Shop More
                    </Button>
                  </div>
                </CardPanel>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#10101F] border border-[#201E38] space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white font-display">No Booster Packs in Inventory</h4>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                  Your vault is currently empty. Visit the Booster Shop to acquire authentic Base Set booster packs with your coins!
                </p>
              </div>
              <Button variant="gold" onClick={() => navigate('/shop')} leftIcon={<PackageOpen className="w-4 h-4 text-black" />}>
                Go to Booster Shop
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vault & Duplicate Liquidator (Phase 8) */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {/* Hero Banner: Quick Duplicate Liquidator */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A0B2E] via-[#121226] to-[#0D1527] border border-amber-500/30 p-6 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    Phase 8 Economy Engine
                  </span>
                  <span className="text-xs text-gray-400 font-mono">70% Liquidation Rate</span>
                </div>
                <h3 className="text-2xl font-black text-white font-display tracking-wide">
                  AUTOMATED DUPLICATE LIQUIDATOR
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Instantly cash out all surplus copies above 1x for coins. The system automatically preserves <strong>1 master copy</strong> in your Collection Binder!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#0B0B16]/80 p-4 rounded-xl border border-[#25253E]">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-gray-400 uppercase">Surplus Copies</span>
                  <div className="text-2xl font-bold font-mono text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-purple" />
                    {totalDuplicateSurplus}
                  </div>
                </div>

                <div className="h-10 w-px bg-[#25253E]" />

                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-gray-400 uppercase">Est. Payout</span>
                  <div className="text-2xl font-bold font-mono text-amber-300 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    +{estimatedDuplicatePayout.toLocaleString()} 🪙
                  </div>
                </div>

                <Button
                  size="md"
                  variant="gold"
                  disabled={totalDuplicateSurplus === 0 || isSellingBulk}
                  onClick={handleBulkSellDuplicates}
                  leftIcon={<DollarSign className={`w-4 h-4 text-black ${isSellingBulk ? 'animate-spin' : ''}`} />}
                  className="shadow-lg shadow-amber-500/20"
                >
                  {isSellingBulk ? 'Liquidating...' : `Liquidate All (${totalDuplicateSurplus})`}
                </Button>
              </div>
            </div>
          </div>

          {/* Subheader Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121222] p-3 rounded-xl border border-[#201E38]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-purple" />
              <span className="text-xs font-mono text-gray-300 uppercase">View Filter:</span>
              <button
                onClick={() => setDuplicateFilterOnly(true)}
                className={`text-xs px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                  duplicateFilterOnly
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Duplicates Only ({duplicateCards.length})
              </button>
              <button
                onClick={() => setDuplicateFilterOnly(false)}
                className={`text-xs px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                  !duplicateFilterOnly
                    ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Vault Cards ({userCards.length})
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={loadCollection}
              leftIcon={<RefreshCw className={`w-3 h-3 ${isLoadingCards ? 'animate-spin' : ''}`} />}
            >
              Refresh Vault
            </Button>
          </div>

          {/* Cards Grid */}
          {isLoadingCards ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : displayedCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCards.map((uc) => {
                const unitPayout = Math.max(10, Math.floor(uc.card.market_price * 0.70));
                return (
                  <CardPanel
                    key={`${uc.card.id}-${uc.is_foil}`}
                    className="flex items-center justify-between gap-3 border-[#201E38] hover:border-amber-500/30 transition-all p-3 bg-[#10101F]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={uc.card.image_url}
                          alt={uc.card.name}
                          className="w-14 aspect-[2.5/3.5] rounded object-cover border border-[#25253E] shadow-md"
                        />
                        {uc.is_foil && (
                          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-amber-500 text-black text-[9px] font-bold font-mono">
                            FOIL
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-sm font-bold text-white truncate">{uc.card.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge rarity={uc.card.rarity} className="text-[9px] px-1.5 py-0" />
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">
                            Owned: {uc.quantity}x
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          Sell: <span className="text-amber-300 font-bold">+{unitPayout.toLocaleString()} 🪙</span> / copy
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => {
                          setSelectedSellCard(uc);
                          setSellQty(1);
                        }}
                        leftIcon={<DollarSign className="w-3 h-3 text-black" />}
                      >
                        Sell
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          showToast(`Card ${uc.card.name} bookmarked for trading desk (Phase 12).`, 'info', 'Trading Desk')
                        }
                        leftIcon={<ArrowRightLeft className="w-3 h-3" />}
                      >
                        Trade
                      </Button>
                    </div>
                  </CardPanel>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#10101F] border border-[#201E38] space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white font-display">No Duplicate Cards Found</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {duplicateFilterOnly
                  ? 'Your collection contains no surplus duplicates right now. Every card in your vault is a unique copy!'
                  : 'You do not have any cards stored in your vault yet. Open booster packs to collect cards!'}
              </p>
              {duplicateFilterOnly && (
                <Button size="sm" variant="outline" onClick={() => setDuplicateFilterOnly(false)}>
                  View All Vault Cards ({userCards.length})
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Transaction Audit Ledger */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 font-mono flex items-center gap-2">
                <History className="w-4 h-4 text-brand-purple" />
                Immutable Transaction Audit Ledger ({transactions.length})
              </h3>
              <p className="text-xs text-gray-400">
                Verifiable on-chain-style ledger recording every booster acquisition, pack unsealing, and card sale.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadTransactions}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />}
            >
              Refresh Ledger
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                const isZero = tx.amount === 0;

                const typeLabels: Record<string, { label: string; color: string }> = {
                  CARD_SALE: { label: 'Card Sold', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' },
                  BULK_CARD_SALE: { label: 'Bulk Duplicate Liquidation', color: 'bg-amber-950/80 text-amber-300 border-amber-500/40' },
                  PACK_PURCHASE: { label: 'Pack Purchased', color: 'bg-purple-950/80 text-purple-300 border-purple-500/40' },
                  PACK_OPEN: { label: 'Booster Opened', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40' },
                };

                const typeBadge = typeLabels[tx.type] || {
                  label: tx.type,
                  color: 'bg-gray-800 text-gray-300 border-gray-600',
                };

                return (
                  <CardPanel
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-[#201E38] bg-[#10101F] hover:border-[#2E2E50] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPositive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isZero
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : isZero ? (
                          <PackageOpen className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            TX #{tx.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-200 font-medium">{tx.description}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1B1B30]">
                      <div className="text-sm font-mono font-bold">
                        {isPositive && (
                          <span className="text-emerald-400">+{tx.amount.toLocaleString()} 🪙</span>
                        )}
                        {!isPositive && !isZero && (
                          <span className="text-rose-400">{tx.amount.toLocaleString()} 🪙</span>
                        )}
                        {isZero && <span className="text-gray-400 font-mono">Pack Opened</span>}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(tx.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </CardPanel>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#10101F] border border-[#201E38] space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
                <History className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white font-display">No Transactions Yet</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Transactions will be recorded here when you purchase booster packs in the shop, unseal packs, or liquidate cards.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Special Items */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardPanel className="flex items-center gap-4 border-[#201E38] bg-[#10101F] p-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-brand-purple flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Ultra-Rare Binder Sleeve (Cosmetic)</h4>
              <p className="text-xs text-gray-400">Gives cards in your public binder a dark prismatic sheen.</p>
              <Badge variant="purple" className="mt-2 text-[10px]">
                Equipped
              </Badge>
            </div>
          </CardPanel>

          <CardPanel className="flex items-center gap-4 border-[#201E38] bg-[#10101F] p-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-brand-gold flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">2x Coin Boost Token</h4>
              <p className="text-xs text-gray-400">Doubles coin rewards earned from daily missions for 2 hours.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs"
                onClick={() => showToast('Activated 2x Coin Boost Token!', 'gold')}
              >
                Activate Boost
              </Button>
            </div>
          </CardPanel>
        </div>
      )}

      {/* Sell Single Card Modal */}
      <Modal
        isOpen={Boolean(selectedSellCard)}
        onClose={() => {
          setSelectedSellCard(null);
          setSellQty(1);
        }}
        title="Liquidate Card for Coins"
      >
        {selectedSellCard && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#17172B] border border-[#25253E]">
              <img
                src={selectedSellCard.card.image_url}
                alt={selectedSellCard.card.name}
                className="w-16 aspect-[2.5/3.5] object-cover rounded-lg border border-[#25253E] shadow-md"
              />
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{selectedSellCard.card.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge rarity={selectedSellCard.card.rarity} />
                  {selectedSellCard.is_foil && (
                    <span className="text-[10px] font-mono font-bold text-amber-400">FOIL</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Currently owned: <strong className="text-emerald-400">{selectedSellCard.quantity}x copies</strong>
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 bg-[#121222] p-3 rounded-lg border border-[#201E38]">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="font-mono">Select Quantity to Liquidate:</span>
                <span className="font-mono font-bold text-white">{sellQty} / {selectedSellCard.quantity}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sellQty <= 1}
                  onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                >
                  -
                </Button>
                <input
                  type="range"
                  min={1}
                  max={selectedSellCard.quantity}
                  value={sellQty}
                  onChange={(e) => setSellQty(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sellQty >= selectedSellCard.quantity}
                  onClick={() => setSellQty((q) => Math.min(selectedSellCard.quantity, q + 1))}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSellQty(Math.max(1, selectedSellCard.quantity - 1))}
                  className="text-[10px] font-mono"
                >
                  Keep 1x
                </Button>
              </div>
            </div>

            {/* Valuation Breakdown */}
            {(() => {
              const unitPayout = Math.max(10, Math.floor(selectedSellCard.card.market_price * 0.70));
              const totalPayout = unitPayout * sellQty;
              const willLeaveZero = sellQty === selectedSellCard.quantity;

              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-300 space-y-1.5 bg-[#121222] p-3 rounded-lg border border-[#201E38]">
                    <div className="flex justify-between">
                      <span>Market Valuation (100%):</span>
                      <span className="font-mono text-gray-400">{selectedSellCard.card.market_price.toLocaleString()} 🪙</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidation Rate (70%):</span>
                      <span className="font-mono text-amber-400 font-bold">{unitPayout.toLocaleString()} 🪙 / unit</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold text-sm pt-1.5 border-t border-[#201E38]">
                      <span>Total Payout ({sellQty}x):</span>
                      <span className="font-mono text-base">+{totalPayout.toLocaleString()} 🪙</span>
                    </div>
                  </div>

                  {willLeaveZero && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Notice: Selling all {selectedSellCard.quantity} copies will remove this card from your Collection Binder.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedSellCard(null);
                  setSellQty(1);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                disabled={isSellingSingle}
                onClick={handleConfirmSingleSell}
                leftIcon={<Check className={`w-4 h-4 text-black ${isSellingSingle ? 'animate-spin' : ''}`} />}
              >
                {isSellingSingle ? 'Processing...' : 'Confirm Sale'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

