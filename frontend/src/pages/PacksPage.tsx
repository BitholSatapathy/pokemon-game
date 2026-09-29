import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageOpen,
  Sparkles,
  RefreshCw,
  Eye,
  Flame,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Zap,
  Coins,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchPlayerPacks,
  openBoosterPack,
  ApiPlayerPack,
  ApiPulledCard,
} from '../services/api';
import { playPackRipSound, playCardFlipSound, playHoloShineSound } from '../services/sound';

export const PacksPage: React.FC = () => {
  const { user, token, isAuthenticated, updateStats, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [playerPacks, setPlayerPacks] = useState<ApiPlayerPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isRipping, setIsRipping] = useState(false);
  const [packOpened, setPackOpened] = useState(false);
  const [openedPackName, setOpenedPackName] = useState('');
  const [currentCards, setCurrentCards] = useState<ApiPulledCard[]>([]);
  const [revealedCards, setRevealedCards] = useState<Record<number, boolean>>({});
  const [xpEarned, setXpEarned] = useState(0);

  // Load player's real unopened booster packs
  const loadPacks = useCallback(async () => {
    if (!token) {
      setIsLoadingPacks(false);
      return;
    }
    setIsLoadingPacks(true);
    const packs = await fetchPlayerPacks(token);
    setPlayerPacks(packs);
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0].pack_id);
    }
    setIsLoadingPacks(false);
  }, [token, selectedPackId]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const selectedPack = playerPacks.find((p) => p.pack_id === selectedPackId) || playerPacks[0];

  const handleOpenPack = async () => {
    if (!isAuthenticated || !token) {
      openAuthModal('login');
      return;
    }

    if (!selectedPack || selectedPack.quantity <= 0) {
      showToast('You do not have any unopened packs of this type!', 'error', 'No Packs Left');
      return;
    }

    setIsRipping(true);
    playPackRipSound();

    try {
      const result = await openBoosterPack(selectedPack.pack_id, token);

      // Update global user stats (coins, gems, level, xp)
      if (result.player_stats) {
        updateStats({
          coins: result.player_stats.coins,
          gems: result.player_stats.gems,
          level: result.player_stats.level,
          xp: result.player_stats.xp,
        });
      }

      // Update local unopened packs list
      setPlayerPacks((prev) =>
        prev
          .map((p) =>
            p.pack_id === selectedPack.pack_id ? { ...p, quantity: result.remaining_packs } : p
          )
          .filter((p) => p.quantity > 0)
      );

      // Brief dramatic unsealing delay
      setTimeout(() => {
        setCurrentCards(result.cards);
        setOpenedPackName(result.pack_name);
        setXpEarned(result.xp_earned);
        setRevealedCards({});
        setPackOpened(true);
        setIsRipping(false);
        showToast(
          `Unsealed ${result.pack_name}! Tap cards to flip them.`,
          'gold',
          'Booster Pack Ripped!'
        );
      }, 700);
    } catch (err: any) {
      setIsRipping(false);
      showToast(err.message || 'Failed to open pack.', 'error', 'Opening Failed');
    }
  };

  const handleFlipCard = (index: number) => {
    if (revealedCards[index]) return;
    setRevealedCards((prev) => ({ ...prev, [index]: true }));
    playCardFlipSound();

    const card = currentCards[index];
    if (card) {
      if (card.rarity === 'Rare Holo' || card.rarity === 'Ultra Rare' || card.rarity === 'Secret Rare') {
        playHoloShineSound();
        showToast(
          `🌟 LEGENDARY PULL! Pulled ${card.name} (${card.rarity}) — Value: ${card.market_price}🪙!`,
          'gold',
          'High-Tier Hit!'
        );
      } else if (card.is_foil) {
        showToast(
          `✨ Reverse Foil Hit! Pulled ${card.name} (${card.rarity})!`,
          'purple',
          'Foil Pull!'
        );
      }
    }
  };

  const handleRevealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    currentCards.forEach((_, idx) => {
      allRevealed[idx] = true;
    });
    setRevealedCards(allRevealed);
  };

  const handleReset = () => {
    setPackOpened(false);
    setRevealedCards({});
    setCurrentCards([]);
    loadPacks();
  };

  const allRevealed = currentCards.length > 0 && Object.keys(revealedCards).length === currentCards.length;
  const totalPackValue = currentCards.reduce((acc, c) => acc + (c.market_price || 0), 0);
  const totalUnopenedPacks = playerPacks.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <PackageOpen className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
            <span>Phase 5 — Pack Opening Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">BOOSTER PACK OPENER</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Rip open booster packs with authentic server-side RNG. Flip cards to reveal holographic hits and add them to your binder.
          </p>
        </div>

        {packOpened && (
          <div className="flex items-center gap-3">
            {!allRevealed && (
              <Button size="sm" variant="outline" onClick={handleRevealAll} leftIcon={<Eye className="w-4 h-4" />}>
                Reveal All
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Back to Packs
            </Button>
          </div>
        )}
      </div>

      {/* Main Opener Stage */}
      {!packOpened ? (
        <div className="space-y-8">
          {/* Unauthenticated State */}
          {!isAuthenticated ? (
            <div className="glass-panel rounded-2xl p-10 text-center max-w-xl mx-auto space-y-6 border border-purple-500/30">
              <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center mx-auto text-brand-gold">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white font-display">Sign In to Rip Packs</h3>
                <p className="text-sm text-gray-400">
                  Log in to access your unopened booster packs, collect cards, and level up your Trainer account.
                </p>
              </div>
              <Button
                variant="gold"
                size="lg"
                onClick={() => openAuthModal('login')}
                leftIcon={<Flame className="w-5 h-5 text-black" />}
              >
                Sign In / Register
              </Button>
            </div>
          ) : isLoadingPacks ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
              <span>Checking your booster inventory...</span>
            </div>
          ) : totalUnopenedPacks === 0 ? (
            /* Empty Unopened Packs State */
            <div className="glass-panel rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 border border-surface-border relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-20 h-20 rounded-2xl bg-surface-light border border-surface-border flex items-center justify-center mx-auto text-gray-400">
                <ShoppingBag className="w-10 h-10 text-brand-gold" />
              </div>
              <div className="space-y-2">
                <Badge variant="purple">Booster Vault Empty</Badge>
                <h3 className="text-2xl font-bold text-white font-display">No Unopened Booster Packs</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  You do not have any unopened packs in your vault right now. Use your{' '}
                  <strong className="text-brand-gold">{user?.coins.toLocaleString()} Coins</strong> to grab booster packs at the official shop!
                </p>
              </div>
              <Link to="/shop">
                <Button variant="gold" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Booster Shop
                </Button>
              </Link>
            </div>
          ) : (
            /* Booster Pack Selector & Unsealing Area */
            <div className="space-y-8">
              {/* Pack Selector Tabs if player has multiple types */}
              {playerPacks.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  <span className="text-xs font-mono text-gray-400 shrink-0 uppercase">Select Pack:</span>
                  {playerPacks.map((p) => (
                    <button
                      key={p.pack_id}
                      onClick={() => setSelectedPackId(p.pack_id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
                        selectedPack?.pack_id === p.pack_id
                          ? 'bg-brand-purple/20 border-brand-purple text-white shadow-glow-purple'
                          : 'bg-surface-card border-surface-border text-gray-400 hover:text-white hover:border-gray-600'
                      }`}
                    >
                      <span>{p.pack.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px]">
                        x{p.quantity}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 3D Pack Centerpiece */}
              {selectedPack && (
                <div className="flex flex-col items-center justify-center py-6 px-4">
                  <div className="relative group max-w-sm w-full">
                    {/* Pulsing Aura */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-brand-violet via-purple-600 to-brand-gold rounded-3xl blur-2xl opacity-40 transition-all duration-700 ${
                        isRipping ? 'scale-110 opacity-90 animate-pulse' : 'group-hover:opacity-75'
                      }`}
                    />

                    <div className="relative glass-panel rounded-3xl p-6 border-2 border-purple-500/40 text-center space-y-6">
                      {/* Pack Art Container */}
                      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 relative border border-purple-500/30 shadow-2xl">
                        <img
                          src={selectedPack.pack.cover_image}
                          alt={selectedPack.pack.name}
                          className={`w-full h-full object-cover transition-transform duration-700 ${
                            isRipping ? 'scale-110 filter brightness-125' : 'group-hover:scale-105'
                          }`}
                        />

                        {/* Ripping Tear Line Visual */}
                        {isRipping && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_20px_#F59E0B] animate-pulse" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Badge variant="gold">10 Cards Inside</Badge>
                            <Badge variant="purple">x{selectedPack.quantity} Owned</Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white font-display">{selectedPack.pack.name}</h3>
                          <span className="text-xs text-brand-purple font-medium">Authentic 1999 Base Set Pool</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="space-y-2">
                        <Button
                          size="lg"
                          variant="gold"
                          className="w-full text-base font-extrabold tracking-wide"
                          onClick={handleOpenPack}
                          isLoading={isRipping}
                          disabled={isRipping}
                          leftIcon={<Flame className="w-5 h-5 text-black" />}
                        >
                          {isRipping ? 'UNSEALING BOOSTER...' : 'RIP BOOSTER PACK'}
                        </Button>
                        <p className="text-[11px] text-gray-400">
                          Consumes 1 unopened pack & adds 10 cards to your collection binder
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Reveal Deck Stage */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Progress & Stat Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-gold">
                <PackageOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                  {openedPackName}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    Revealed:{' '}
                    <strong className="text-brand-purple">
                      {Object.keys(revealedCards).length} / {currentCards.length}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Zap className="w-3.5 h-3.5" /> +{xpEarned} XP Earned
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!allRevealed && (
                <Button size="sm" variant="outline" onClick={handleRevealAll} leftIcon={<Eye className="w-4 h-4" />}>
                  Reveal All
                </Button>
              )}
              {allRevealed && (
                <Link to="/collection">
                  <Button size="sm" variant="gold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View in Binder
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* 10 Card Grid (5x2 on desktop, 2x5 on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {currentCards.map((card, idx) => {
              const isFlipped = Boolean(revealedCards[idx]);
              const isHolo =
                card.rarity === 'Rare Holo' ||
                card.rarity === 'Ultra Rare' ||
                card.rarity === 'Secret Rare';

              return (
                <div
                  key={`${card.id}-${idx}`}
                  onClick={() => handleFlipCard(idx)}
                  className="perspective-1000 aspect-[2.5/3.5] cursor-pointer group select-none"
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Card BACK (Face Down) */}
                    <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-purple-500/40 bg-surface-card p-3 flex flex-col items-center justify-center text-center shadow-lg group-hover:border-brand-purple transition-all group-hover:shadow-glow-purple">
                      <div className="w-12 h-12 rounded-full bg-surface-light border border-purple-500/30 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-brand-gold animate-spin-slow" />
                      </div>
                      <span className="text-xs font-bold text-gray-300 mt-2 font-display">SLOT {idx + 1}</span>
                      <span className="text-[10px] text-brand-purple font-medium">Click to flip</span>
                      {idx === 9 && (
                        <span className="mt-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                          ★ RARE SLOT
                        </span>
                      )}
                    </div>

                    {/* Card FRONT (Face Up) */}
                    <div
                      className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden border ${
                        isHolo
                          ? 'border-amber-400/90 shadow-glow-gold holo-card-shine'
                          : card.is_foil
                          ? 'border-purple-400/80 shadow-glow-purple holo-card-shine'
                          : 'border-surface-border bg-surface'
                      }`}
                    >
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between">
                        {card.is_new ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-white font-black text-[9px] shadow-sm uppercase tracking-wide">
                            NEW!
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-black/75 text-gray-300 font-mono text-[9px]">
                            x{card.total_owned}
                          </span>
                        )}

                        <Badge rarity={card.rarity} className="text-[9px] px-1.5 py-0" />
                      </div>

                      {/* Bottom Info Footer */}
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/85 backdrop-blur-sm text-[10px] flex items-center justify-between font-mono border-t border-white/10">
                        <span className="text-white truncate font-bold">{card.name}</span>
                        <span className="text-brand-gold shrink-0">{card.market_price}🪙</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Post-Reveal Summary Banner */}
          {allRevealed && (
            <div className="glass-panel p-6 rounded-2xl border-2 border-brand-purple/40 space-y-4 animate-in slide-in-from-bottom duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white font-display">
                      All 10 Cards Added to Your Collection!
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your collection binder has been permanently updated. You can view, search, and inspect cards anytime.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-surface-card px-4 py-2 rounded-xl border border-surface-border">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-mono">TOTAL PACK VALUE</span>
                    <span className="text-base font-black text-brand-gold font-mono flex items-center gap-1 justify-end">
                      <Coins className="w-4 h-4" /> {totalPackValue.toLocaleString()} 🪙
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Remaining Unopened Packs:</span>
                  <Badge variant="purple">{selectedPack?.quantity ?? 0} left</Badge>
                </div>

                <div className="flex items-center gap-3">
                  {(selectedPack?.quantity ?? 0) > 0 ? (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={handleReset}
                      leftIcon={<Flame className="w-4 h-4 text-black" />}
                    >
                      Rip Another Pack ({selectedPack?.quantity} left)
                    </Button>
                  ) : (
                    <Link to="/shop">
                      <Button size="sm" variant="gold" leftIcon={<ShoppingBag className="w-4 h-4 text-black" />}>
                        Buy More Packs
                      </Button>
                    </Link>
                  )}
                  <Link to="/collection">
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      View in Binder
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

