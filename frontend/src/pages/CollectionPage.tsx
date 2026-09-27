import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderHeart,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  Database,
  Coins,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
  Share2,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { Card, CardRarity } from '../types';
import { MOCK_CARDS } from '../data/mockData';
import { fetchCards, fetchMyCollection, fetchMyEquippedCosmetics, EquippedCosmetics } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const CollectionPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromDb, setIsFromDb] = useState(false);


  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [ownedFilter, setOwnedFilter] = useState<'all' | 'owned' | 'missing' | 'duplicates'>('all');
  const [sortBy, setSortBy] = useState<string>('number-asc');

  // Display Mode & Pagination (for 9-pocket binder)
  const [viewMode, setViewMode] = useState<'grid' | 'binder'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const BINDER_POCKETS_PER_PAGE = 9;

  // Active Card Modal & index for Prev/Next
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const rarities: (string | CardRarity)[] = [
    'All',
    'Common',
    'Uncommon',
    'Rare',
    'Rare Holo',
    'Ultra Rare',
    'Secret Rare',
  ];

  const typesList = [
    'All',
    'Fire',
    'Water',
    'Grass',
    'Lightning',
    'Psychic',
    'Fighting',
    'Colorless',
  ];

  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCards = async () => {
      setIsLoading(true);
      try {
        const [cardsRes, collRes, eqRes] = await Promise.all([
          fetchCards({ set_id: 'base1', limit: 110 }),
          token ? fetchMyCollection(token) : Promise.resolve(null),
          token ? fetchMyEquippedCosmetics(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (isMounted && eqRes) {
          setEquippedCosmetics(eqRes);
        }

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

  // Filtered & Sorted Cards
  const filteredCards = useMemo(() => {
    const list = cards.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.number.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRarity =
        selectedRarity === 'All' ||
        card.rarity.toLowerCase().includes(selectedRarity.toLowerCase());

      const matchesType =
        selectedType === 'All' ||
        (card.types && card.types.some((t) => t.toLowerCase() === selectedType.toLowerCase()));

      const matchesOwned =
        ownedFilter === 'all'
          ? true
          : ownedFilter === 'owned'
          ? card.ownedQuantity > 0
          : ownedFilter === 'missing'
          ? card.ownedQuantity === 0
          : card.ownedQuantity >= 2;

      return matchesSearch && matchesRarity && matchesType && matchesOwned;
    });

    // Sorting
    return list.sort((a, b) => {
      const numA = parseInt(a.number.split('/')[0]) || 0;
      const numB = parseInt(b.number.split('/')[0]) || 0;

      switch (sortBy) {
        case 'number-asc':
          return numA - numB;
        case 'number-desc':
          return numB - numA;
        case 'value-desc':
          return b.marketPrice - a.marketPrice;
        case 'value-asc':
          return a.marketPrice - b.marketPrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'rarity': {
          const rarityRank = (r: string) => {
            if (r.includes('Secret')) return 5;
            if (r.includes('Ultra') || r.includes('Holo')) return 4;
            if (r.includes('Rare')) return 3;
            if (r.includes('Uncommon')) return 2;
            return 1;
          };
          return rarityRank(b.rarity) - rarityRank(a.rarity);
        }
        default:
          return numA - numB;
      }
    });
  }, [cards, searchQuery, selectedRarity, selectedType, ownedFilter, sortBy]);

  // Statistics
  const ownedUniqueCount = cards.filter((c) => c.ownedQuantity > 0).length;
  const totalCount = cards.length || 102;
  const completionPercent = totalCount > 0 ? Math.round((ownedUniqueCount / totalCount) * 100) : 0;
  const totalBinderCopies = cards.reduce((acc, c) => acc + c.ownedQuantity, 0);
  const totalPortfolioValue = cards.reduce((acc, c) => acc + c.marketPrice * c.ownedQuantity, 0);

  // Rarity Breakdown Stats
  const holoRares = cards.filter((c) => c.rarity.includes('Holo'));
  const ownedHoloRares = holoRares.filter((c) => c.ownedQuantity > 0).length;

  // 9-Pocket Binder Pagination
  const totalBinderPages = Math.max(1, Math.ceil(filteredCards.length / BINDER_POCKETS_PER_PAGE));
  const currentBinderCards = useMemo(() => {
    if (viewMode !== 'binder') return filteredCards;
    const start = (currentPage - 1) * BINDER_POCKETS_PER_PAGE;
    return filteredCards.slice(start, start + BINDER_POCKETS_PER_PAGE);
  }, [filteredCards, viewMode, currentPage]);

  const activeCard = activeCardIndex !== null ? filteredCards[activeCardIndex] : null;

  const handlePrevCard = () => {
    if (activeCardIndex !== null && activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex !== null && activeCardIndex < filteredCards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    }
  };

  const handleShareBinder = () => {
    navigator.clipboard.writeText(
      `Check out my Pokémon Base Set Binder on TCG Collector! 🌟 Set Completion: ${ownedUniqueCount}/102 (${completionPercent}%) | Total Portfolio: ${totalPortfolioValue.toLocaleString()} Coins!`
    );
    showToast('Collection stats copied to clipboard!', 'success', 'Binder Copied');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#201E38] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <FolderHeart className="w-3.5 h-3.5 text-brand-gold" />
            <span>Phase 6 — Master Collection Binder</span>
            {isFromDb && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Database className="w-3 h-3" /> Live TCGdex DB (102 Cards)
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">BASE SET 1999 BINDER</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Track your master set completion, inspect authentic high-resolution artwork, and organize your card vault.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/grading">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-400"
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            >
              Grade Cards (NGS)
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareBinder}
            leftIcon={<Share2 className="w-4 h-4 text-brand-purple" />}
          >
            Share Binder
          </Button>
          <Link to="/packs">
            <Button size="sm" variant="gold" leftIcon={<Sparkles className="w-4 h-4 text-black" />}>
              Rip Packs
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Card Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Set Completion Card */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Set Completion</span>
            <span className="text-xs font-bold text-brand-purple font-mono">{completionPercent}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">{ownedUniqueCount}</span>
            <span className="text-xs text-gray-400 font-mono">/ {totalCount} Cards</span>
          </div>
          <div className="w-full bg-[#201E38] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-violet to-brand-gold h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, completionPercent)}%` }}
            />
          </div>
        </div>

        {/* Portfolio Valuation */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Portfolio Value</span>
            <Coins className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-black text-brand-gold font-mono">
            {totalPortfolioValue.toLocaleString()} 🪙
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" /> Based on market valuations
          </span>
        </div>

        {/* Total Owned Copies */}
        <div className="glass-panel p-4 rounded-2xl border border-surface-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Total Cards</span>
            <Layers className="w-4 h-4 text-brand-purple" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalBinderCopies}</div>
          <span className="text-[10px] text-gray-400 font-mono">
            {totalBinderCopies - ownedUniqueCount} duplicates in vault
          </span>
        </div>

        {/* Rare Holo Hits */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Holo Rares</span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-display">
            {ownedHoloRares} <span className="text-xs text-gray-400 font-mono">/ {holoRares.length || 16}</span>
          </div>
          <span className="text-[10px] text-brand-purple font-mono">Legendary Base Set Holos</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 bg-[#121222] backdrop-blur-md p-4 rounded-2xl border border-[#201E38]">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search card name or # (e.g. Charizard)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#17172B] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple transition-colors placeholder:text-gray-500"
            />
          </div>

          {/* Quick Ownership Tabs */}
          <div className="flex items-center gap-1 bg-[#17172B] p-1 rounded-xl border border-[#2A2A44] text-xs overflow-x-auto">
            <button
              onClick={() => {
                setOwnedFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                ownedFilter === 'all' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({cards.length})
            </button>
            <button
              onClick={() => {
                setOwnedFilter('owned');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                ownedFilter === 'owned' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Owned ({ownedUniqueCount})
            </button>
            <button
              onClick={() => {
                setOwnedFilter('missing');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                ownedFilter === 'missing' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Missing ({totalCount - ownedUniqueCount})
            </button>
            <button
              onClick={() => {
                setOwnedFilter('duplicates');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                ownedFilter === 'duplicates' ? 'bg-brand-violet text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Duplicates
            </button>
          </div>

          {/* Controls: Rarity, Sort, View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rarity Select */}
            <select
              value={selectedRarity}
              onChange={(e) => {
                setSelectedRarity(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-[#17172B] border border-[#2A2A44] rounded-xl text-xs font-medium text-gray-200 focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              {rarities.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'All Rarities' : r}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#17172B] border border-[#2A2A44] rounded-xl text-xs font-medium text-gray-200 focus:outline-none focus:border-brand-purple cursor-pointer pr-8"
              >
                <option value="number-asc">Card # (1 → 102)</option>
                <option value="number-desc">Card # (102 → 1)</option>
                <option value="value-desc">Value (High to Low)</option>
                <option value="value-asc">Value (Low to High)</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="rarity">Rarity (Highest)</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs 9-Pocket Binder */}
            <div className="flex items-center bg-[#17172B] p-1 rounded-xl border border-[#2A2A44]">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-brand-violet text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('binder')}
                title="9-Pocket Binder Page View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'binder' ? 'bg-brand-violet text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Energy Type Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#1C1C30]">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider shrink-0">Type:</span>
          {typesList.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
                selectedType === type
                  ? 'bg-brand-purple/20 border-brand-purple text-white shadow-glow-purple font-semibold'
                  : 'bg-[#17172B] border-[#2A2A44] text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <Skeleton key={idx} variant="card" />
          ))}
        </div>
      ) : viewMode === 'binder' ? (
        /* 9-Pocket Binder Page Mode */
        <div className="space-y-6">
          {/* Binder Page Navigation */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <span className="font-bold text-white uppercase">Ultra PRO 9-Pocket Binder</span>
              <span>•</span>
              <span>
                Page <strong className="text-brand-gold">{currentPage}</strong> of {totalBinderPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Prev Page
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalBinderPages}
                onClick={() => setCurrentPage((p) => Math.min(totalBinderPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Page
              </Button>
            </div>
          </div>

          {/* 3x3 Binder Sheet Container with Stitch Border */}
          <div className={`p-6 rounded-3xl shadow-2xl relative border-4 transition-all duration-500 ${equippedCosmetics?.binder_theme?.asset_data || 'bg-[#0F0F1B] border-[#24213F]'}`}>
            {equippedCosmetics?.sleeve && (
              <div className="absolute top-2 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-purple-300">
                <span>Sleeve:</span>
                <span className="font-bold text-white">{equippedCosmetics.sleeve.name}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-6 aspect-[3/4]">
              {Array.from({ length: 9 }).map((_, slotIdx) => {
                const card = currentBinderCards[slotIdx];
                if (!card) {
                  return (
                    <div
                      key={`empty-pocket-${slotIdx}`}
                      className="rounded-2xl border-2 border-dashed border-[#2A2A44] bg-[#141424]/40 flex flex-col items-center justify-center text-center p-4 text-gray-600"
                    >
                      <Layers className="w-6 h-6 mb-1 opacity-30" />
                      <span className="text-[10px] font-mono">Empty Pocket</span>
                    </div>
                  );
                }

                const cardIndexInFiltered = (currentPage - 1) * BINDER_POCKETS_PER_PAGE + slotIdx;
                const isOwned = card.ownedQuantity > 0;
                const isHolo = card.rarity.includes('Holo');

                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveCardIndex(cardIndexInFiltered)}
                    className="cursor-pointer group relative flex flex-col items-center justify-center transition-all duration-300 hover:scale-105"
                  >
                    {/* Clear Pocket Sleeve Effect */}
                    <div
                      className={`w-full aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 shadow-lg relative ${
                        isOwned
                          ? isHolo
                            ? 'border-amber-400/90 shadow-glow-gold holo-card-shine'
                            : 'border-purple-500/40 group-hover:border-brand-purple'
                          : 'border-[#2A2A44] filter grayscale opacity-40'
                      }`}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />

                      {/* Pocket Status Badge */}
                      <div className="absolute top-1.5 right-1.5 z-10">
                        {isOwned ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/95 border border-emerald-400/60 text-[9px] font-bold text-emerald-300">
                            x{card.ownedQuantity}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-black/80 border border-gray-600 text-[9px] font-bold text-gray-400">
                            ?
                          </span>
                        )}
                      </div>

                      {/* Pocket Bottom Info */}
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/80 backdrop-blur-sm text-[10px] flex items-center justify-between font-mono">
                        <span className="text-white truncate font-bold">{card.name}</span>
                        <span className="text-brand-gold shrink-0">{card.marketPrice}🪙</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Fluid 6-Column Grid Mode */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCards.map((card, idx) => {
            const isOwned = card.ownedQuantity > 0;
            const isHolo = card.rarity.includes('Holo');

            return (
              <div
                key={card.id}
                onClick={() => setActiveCardIndex(idx)}
                className="bg-[#121222] border border-[#201E38] hover:border-purple-500/60 rounded-xl p-2.5 cursor-pointer relative group flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-glow-purple select-none"
              >
                {/* Owned Badge */}
                <div className="absolute top-2 right-2 z-10">
                  {isOwned ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 shadow-sm">
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
                      ? isHolo
                        ? 'border-amber-400/80 shadow-glow-gold holo-card-shine group-hover:scale-105'
                        : 'border-purple-500/30 group-hover:border-purple-400/80 group-hover:scale-105'
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
        <div className="text-center py-16 bg-[#121222] rounded-2xl border border-[#201E38] space-y-3">
          <Layers className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No cards match your filter</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting another elemental type, or switching ownership tabs.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedRarity('All');
              setSelectedType('All');
              setOwnedFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Enhanced Card Detail Modal with Prev/Next Navigation */}
      <Modal
        isOpen={activeCard !== null}
        onClose={() => setActiveCardIndex(null)}
        title={activeCard?.name || 'Card Details'}
        maxWidth="lg"
      >
        {activeCard && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Card Large Artwork with Foil Shine */}
              <div className="w-52 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/50 holo-card-shine shrink-0 relative group">
                <img
                  src={activeCard.imageUrl}
                  alt={activeCard.name}
                  className="w-full h-full object-cover"
                />
                {activeCard.rarity.includes('Holo') && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="gold" className="text-[9px]">
                      Holographic Foil
                    </Badge>
                  </div>
                )}
              </div>

              {/* Card Specs */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge rarity={activeCard.rarity} />
                    <span className="text-xs font-mono text-gray-400">Card #{activeCard.number}</span>
                  </div>
                  {activeCard.hp && (
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {activeCard.hp} HP
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white font-display">{activeCard.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-brand-purple font-medium">{activeCard.setName}</span>
                    {activeCard.types && activeCard.types.length > 0 && (
                      <span className="text-xs text-gray-400 font-mono">
                        • {activeCard.types.join(', ')} Type
                      </span>
                    )}
                  </div>
                </div>

                {activeCard.flavorText && (
                  <p className="text-xs text-gray-300 italic border-l-2 border-purple-500/40 pl-3 py-1 bg-surface-card/40 rounded-r-lg">
                    "{activeCard.flavorText}"
                  </p>
                )}

                {/* Valuation & Ownership Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#17172B] p-3.5 rounded-xl border border-[#2A2A44]">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-mono">Market Price</span>
                    <span className="font-bold text-amber-300 font-mono text-base">
                      {activeCard.marketPrice.toLocaleString()} 🪙
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-mono">Ownership Status</span>
                    <span
                      className={`font-bold font-mono text-sm ${
                        activeCard.ownedQuantity > 0 ? 'text-emerald-400' : 'text-gray-400'
                      }`}
                    >
                      {activeCard.ownedQuantity > 0 ? `${activeCard.ownedQuantity}x in Vault` : 'Not in Binder'}
                    </span>
                  </div>
                  {activeCard.artist && (
                    <div className="col-span-2 pt-2 border-t border-[#25253E] flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Illustrated by:</span>
                      <span className="text-gray-200 font-medium">{activeCard.artist}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Navigation & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#25253E]">
              {/* Prev / Next Card Flip Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCardIndex === 0}
                  onClick={handlePrevCard}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCardIndex === filteredCards.length - 1}
                  onClick={handleNextCard}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {activeCard.ownedQuantity === 0 ? (
                  <Link to="/shop" onClick={() => setActiveCardIndex(null)}>
                    <Button size="sm" variant="gold" leftIcon={<ShoppingBag className="w-4 h-4 text-black" />}>
                      Find in Shop
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => {
                      showToast(
                        `Marketplace listing preview for ${activeCard.name} prepared. Available in Phase 11!`,
                        'info',
                        'Market Preview'
                      );
                      setActiveCardIndex(null);
                    }}
                    leftIcon={<Sparkles className="w-4 h-4 text-black" />}
                  >
                    List on Market
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setActiveCardIndex(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

