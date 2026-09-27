import React, { useState } from 'react';
import { PackageOpen, Sparkles, RefreshCw, Eye, Flame, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { Card } from '../types';
import { MOCK_CARDS, MOCK_PACKS } from '../data/mockData';

export const PacksPage: React.FC = () => {
  const [packOpened, setPackOpened] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Record<number, boolean>>({});
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const { showToast } = useToast();

  const selectedPack = MOCK_PACKS[0]; // Base Set Booster

  const handleOpenPack = () => {
    // Generate a 10-card pack pull from mock cards (ensuring 1 rare at end)
    const shuffled = [...MOCK_CARDS].sort(() => 0.5 - Math.random());
    const packSelection = shuffled.slice(0, 10);
    // Ensure slot 10 is high rarity for excitement
    packSelection[9] = MOCK_CARDS[0]; // Charizard secret rare!

    setCurrentCards(packSelection);
    setRevealedCards({});
    setPackOpened(true);
    showToast(`Unsealed ${selectedPack.name}! Tap cards to flip them.`, 'gold', 'Pack Ripped!');
  };

  const handleFlipCard = (index: number) => {
    if (revealedCards[index]) return;
    setRevealedCards((prev) => ({ ...prev, [index]: true }));

    const card = currentCards[index];
    if (card && (card.rarity === 'Secret Rare' || card.rarity === 'Ultra Rare')) {
      showToast(`Pulled ${card.name} (${card.rarity})! 🔥`, 'gold', 'High-Tier Hit!');
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
  };

  const allRevealed = currentCards.length > 0 && Object.keys(revealedCards).length === currentCards.length;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <PackageOpen className="w-3.5 h-3.5" />
            <span>Milestone 4 Preview</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">PACK OPENING ENGINE</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Interactive simulator preview. Click cards to test 3D flip physics, holographic sheen, and server reveal states.
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
              Open New Pack
            </Button>
          </div>
        )}
      </div>

      {/* Main Opener Stage */}
      {!packOpened ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative group cursor-pointer max-w-sm w-full" onClick={handleOpenPack}>
            {/* Ambient Booster Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-violet to-brand-gold rounded-3xl blur-2xl opacity-40 group-hover:opacity-80 transition-all duration-500 animate-pulse-slow" />

            <div className="relative glass-panel rounded-3xl p-6 border-2 border-purple-500/40 text-center space-y-6">
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 relative border border-purple-500/30">
                <img
                  src={selectedPack.coverImage}
                  alt={selectedPack.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <Badge variant="gold" className="self-center mb-2">10 Cards Inside</Badge>
                  <h3 className="text-xl font-bold text-white font-display">{selectedPack.name}</h3>
                  <span className="text-xs text-brand-purple">{selectedPack.series}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button size="lg" variant="gold" className="w-full" leftIcon={<Flame className="w-5 h-5 text-black" />}>
                  RIP BOOSTER PACK
                </Button>
                <p className="text-[11px] text-gray-400">Click to unseal and flip your 10 cards</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Revealed:{' '}
              <strong className="text-brand-purple">
                {Object.keys(revealedCards).length} / {currentCards.length}
              </strong>
            </span>
            {allRevealed && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All cards added to your collection binder!
              </span>
            )}
          </div>

          {/* 10 Card Grid (5x2 on desktop, 2x5 on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {currentCards.map((card, idx) => {
              const isFlipped = Boolean(revealedCards[idx]);
              const isHolo = card.rarity === 'Secret Rare' || card.rarity === 'Ultra Rare';

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
                    <div className="absolute inset-0 backface-hidden rounded-xl border border-purple-500/40 bg-surface-card p-3 flex flex-col items-center justify-center text-center shadow-lg group-hover:border-brand-purple transition-colors">
                      <div className="w-12 h-12 rounded-full bg-surface-light border border-purple-500/30 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-300 mt-2 font-display">SLOT {idx + 1}</span>
                      <span className="text-[10px] text-brand-purple">Tap to flip</span>
                    </div>

                    {/* Card FRONT (Face Up) */}
                    <div
                      className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden border ${
                        isHolo
                          ? 'border-amber-400/80 shadow-glow-gold holo-card-shine'
                          : 'border-surface-border bg-surface'
                      }`}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1">
                        <Badge rarity={card.rarity} className="text-[9px] px-1.5 py-0" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/80 backdrop-blur-sm text-[10px] flex items-center justify-between font-mono">
                        <span className="text-white truncate font-bold">{card.name}</span>
                        <span className="text-brand-gold shrink-0">{card.marketPrice}🪙</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
