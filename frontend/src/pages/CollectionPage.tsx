import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderHeart,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { Card, CardRarity } from '../types';
import { MOCK_CARDS } from '../data/mockData';
import { fetchCards, fetchMyCollection } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const CollectionPage: React.FC = () => {
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFromDb, setIsFromDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [ownedFilter, setOwnedFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [activeCardModal, setActiveCardModal] = useState<Card | null>(null);
  const { showToast } = useToast();

  const rarities: (string | CardRarity)[] = [
    'All',
    'Common',
    'Uncommon',
    'Rare',
    'Rare Holo',
    'Holo Rare',
    'Ultra Rare',
    'Secret Rare',
  ];

  useEffect(() => {
    let isMounted = true;
    const loadCards = async () => {
      setIsLoading(true);
      try {
        const [cardsRes, collRes] = await Promise.all([
          fetchCards({ set_id: 'base1', limit: 110 }),
          token ? fetchMyCollection(token) : Promise.resolve(null),
        ]);

        const ownedMap = new Map<string, number>();
        if (collRes && collRes.items) {
          collRes.items.forEach((item) => {
            ownedMap.set(item.card_id, (ownedMap.get(item.card_id) || 0) + item.quantity);
          });
        }

        if (isMounted) {
          if (cardsRes.items.length > 0) {
            const mapped = cardsRes.items.map((c) => ({
              ...c,
              ownedQuantity: token ? (ownedMap.get(c.id) || 0) : c.ownedQuantity,
            }));
            setCards(mapped);
            setIsFromDb(true);
          } else {
            setCards(MOCK_CARDS);
            setIsFromDb(false);
          }
        }
      } catch (err) {
        console.error('Error loading collection:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCards();
    return () => {
      isMounted = false;
    };
  }, [token]);


  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.number.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRarity =
        selectedRarity === 'All' ||
        card.rarity.toLowerCase().includes(selectedRarity.toLowerCase());

      const matchesOwned =
        ownedFilter === 'all'
          ? true
          : ownedFilter === 'owned'
          ? card.ownedQuantity > 0
          : card.ownedQuantity === 0;

      return matchesSearch && matchesRarity && matchesOwned;
    });
  }, [cards, searchQuery, selectedRarity, ownedFilter]);

  const ownedCount = cards.filter((c) => c.ownedQuantity > 0).length;
  const totalCount = cards.length || 102;
  const completionPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Set Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Master Binder View</span>
            {isFromDb && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Database className="w-3 h-3" /> Live TCGdex DB (102 Cards)
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">BASE SET COLLECTION</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Browse all 102 authentic cards imported from the TCGdex database.
          </p>
        </div>

        {/* Set Progress Widget */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 min-w-[280px] space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-300">Base Set Completion</span>
            <span className="text-amber-400 font-mono">
              {ownedCount} / {totalCount} Cards ({completionPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#201E38] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-violet to-brand-gold h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, completionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#121222] backdrop-blur-md p-4 rounded-2xl border border-[#201E38]">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search card name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#17172B] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple transition-colors placeholder:text-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Rarity Select */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-2 bg-[#17172B] border border-[#2A2A44] rounded-xl text-xs font-medium text-gray-200 focus:outline-none focus:border-brand-purple cursor-pointer"
          >
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Rarities' : r}
              </option>
            ))}
          </select>

          {/* Owned Status Tabs */}
          <div className="flex items-center gap-1 bg-[#17172B] p-1 rounded-xl border border-[#2A2A44] text-xs">
            <button
              onClick={() => setOwnedFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                ownedFilter === 'all' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setOwnedFilter('owned')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                ownedFilter === 'owned' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Owned
            </button>
            <button
              onClick={() => setOwnedFilter('missing')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                ownedFilter === 'missing' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Missing
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <Skeleton key={idx} variant="card" />
          ))}
        </div>
      ) : (
        /* Binder Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCards.map((card) => {
            const isOwned = card.ownedQuantity > 0;
            return (
              <div
                key={card.id}
                onClick={() => setActiveCardModal(card)}
                className="bg-[#121222] border border-[#201E38] hover:border-purple-500/60 rounded-xl p-2.5 cursor-pointer relative group flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-glow-purple"
              >
                {/* Owned Quantity Indicator Badge */}
                <div className="absolute top-2 right-2 z-10">
                  {isOwned ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> {card.ownedQuantity}x
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-bold text-slate-400">
                      <HelpCircle className="w-3 h-3" /> ?
                    </span>
                  )}
                </div>

                {/* Card Artwork */}
                <div
                  className={`aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/60 relative border transition-all ${
                    isOwned
                      ? 'border-purple-500/30 group-hover:border-purple-400/80 group-hover:scale-105'
                      : 'border-surface-border filter grayscale opacity-45 group-hover:opacity-75'
                  }`}
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Footer Info */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white truncate">{card.name}</span>
                    <span className="font-mono text-gray-400">#{card.number.split('/')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge rarity={card.rarity} className="text-[9px] px-1.5 py-0 truncate max-w-[80px]" />
                    <span className="text-[10px] text-amber-300 font-mono font-bold">
                      {card.marketPrice.toLocaleString()} 🪙
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCards.length === 0 && (
        <div className="text-center py-16 bg-[#121222] rounded-2xl border border-[#201E38]">
          <Layers className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No cards match your filter</h3>
          <p className="text-xs text-gray-400 mt-1">Try clearing search terms or selecting another rarity.</p>
        </div>
      )}

      {/* Card Detail Modal */}
      <Modal
        isOpen={Boolean(activeCardModal)}
        onClose={() => setActiveCardModal(null)}
        title={activeCardModal?.name || 'Card Details'}
        maxWidth="lg"
      >
        {activeCardModal && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Card Large Artwork */}
              <div className="w-48 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/50 holo-card-shine shrink-0">
                <img
                  src={activeCardModal.imageUrl}
                  alt={activeCardModal.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Specs */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-2">
                  <Badge rarity={activeCardModal.rarity} />
                  <span className="text-xs font-mono text-gray-400">Card #{activeCardModal.number}</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white font-display">{activeCardModal.name}</h3>
                  <p className="text-xs text-brand-purple">{activeCardModal.setName}</p>
                </div>

                {activeCardModal.flavorText && (
                  <p className="text-xs text-gray-300 italic border-l-2 border-purple-500/40 pl-3 py-1">
                    "{activeCardModal.flavorText}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#17172B] p-3 rounded-xl border border-[#2A2A44]">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Market Value</span>
                    <span className="font-bold text-amber-300 font-mono text-sm">
                      {activeCardModal.marketPrice.toLocaleString()} Coins
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Owned Copies</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {activeCardModal.ownedQuantity}x in collection
                    </span>
                  </div>
                  {activeCardModal.artist && (
                    <div className="col-span-2 pt-1 border-t border-[#25253E]">
                      <span className="text-gray-400 text-[10px]">Illustrated by: </span>
                      <span className="text-gray-200 font-medium">{activeCardModal.artist}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#25253E]">
              <Button variant="ghost" onClick={() => setActiveCardModal(null)}>
                Close
              </Button>
              <Button
                variant="gold"
                onClick={() => {
                  showToast(
                    `Marketplace listing preview for ${activeCardModal.name} prepared. Available in Phase 11.`,
                    'info',
                    'Market Preview'
                  );
                  setActiveCardModal(null);
                }}
                leftIcon={<Sparkles className="w-4 h-4 text-black" />}
              >
                List on Marketplace
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
