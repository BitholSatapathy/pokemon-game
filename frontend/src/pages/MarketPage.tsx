import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store,
  PlusCircle,
  ShoppingCart,
  User,
  Check,
  Tag,
  History,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Coins,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tabs, TabItem } from '../components/ui/Tabs';
import { SearchAutocomplete } from '../components/common/SearchAutocomplete';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import {
  fetchMarketListings,
  fetchMyMarketListings,
  createMarketListing,
  buyMarketListing,
  cancelMarketListing,
  fetchMarketStats,
  fetchMyCollection,
  ApiMarketListing,
  ApiMarketplaceStats,
  ApiUserCard,
} from '../services/api';

interface MarketProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const RARITY_OPTIONS = [
  { label: 'All Rarities', value: '' },
  { label: 'Common', value: 'COMMON' },
  { label: 'Uncommon', value: 'UNCOMMON' },
  { label: 'Rare', value: 'RARE' },
  { label: 'Holo Rare', value: 'HOLO_RARE' },
  { label: 'Ultra Rare', value: 'ULTRA_RARE' },
  { label: 'Secret Rare', value: 'SECRET_RARE' },
];

const SORT_OPTIONS: { label: string; value: 'newest' | 'price_asc' | 'price_desc' }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export const MarketPage: React.FC<MarketProps> = ({ user, setUser }) => {
  const { isAuthenticated, token, refreshUser, openAuthModal } = useAuth();
  const { showToast } = useToast();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('browse');

  // Market Listings (Browse)
  const [listings, setListings] = useState<ApiMarketListing[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [onlyFoil, setOnlyFoil] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Market Stats
  const [stats, setStats] = useState<ApiMarketplaceStats | null>(null);

  // User's own listings (Active & History)
  const [myListings, setMyListings] = useState<ApiMarketListing[]>([]);
  const [isLoadingMyListings, setIsLoadingMyListings] = useState(false);

  // Buy Modal
  const [selectedListing, setSelectedListing] = useState<ApiMarketListing | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  // Cancel action
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Create Listing Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userCards, setUserCards] = useState<ApiUserCard[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [selectedCardToList, setSelectedCardToList] = useState<ApiUserCard | null>(null);
  const [listingPrice, setListingPrice] = useState<number>(100);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);

  // Load Market Stats
  const loadStats = useCallback(async () => {
    const data = await fetchMarketStats();
    if (data) setStats(data);
  }, []);

  // Load Public Listings
  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    const data = await fetchMarketListings({
      search: searchQuery.trim() || undefined,
      rarity: selectedRarity || undefined,
      is_foil: onlyFoil ? true : undefined,
      sort_by: sortBy,
      page: 1,
      limit: 50,
    });
    setListings(data.items);
    setTotalListings(data.total);
    setIsLoadingListings(false);
  }, [searchQuery, selectedRarity, onlyFoil, sortBy]);

  // Load User's Listings
  const loadMyListings = useCallback(async () => {
    if (!token) return;
    setIsLoadingMyListings(true);
    const data = await fetchMyMarketListings(token);
    setMyListings(data);
    setIsLoadingMyListings(false);
  }, [token]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadListings();
  }, [loadStats, loadListings]);

  // Reload user listings when auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      loadMyListings();
    } else {
      setMyListings([]);
    }
  }, [isAuthenticated, token, loadMyListings]);

  // My active vs history listings
  const myActiveListings = useMemo(
    () => myListings.filter((l) => l.status === 'ACTIVE'),
    [myListings]
  );
  const myTradeHistory = useMemo(
    () => myListings.filter((l) => l.status !== 'ACTIVE'),
    [myListings]
  );

  // Navigation tabs configuration
  const tabs: TabItem[] = [
    {
      id: 'browse',
      label: 'Browse Market',
      count: totalListings,
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: 'my_listings',
      label: 'My Active Listings',
      count: myActiveListings.length,
      icon: <Tag className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Trade Ledger',
      count: myTradeHistory.length,
      icon: <History className="w-4 h-4" />,
    },
  ];

  // Open Create Listing Modal
  const handleOpenCreateModal = async () => {
    if (!isAuthenticated || !token) {
      showToast('Please sign in or create an account to sell cards!', 'info', 'Authentication Required');
      openAuthModal('login');
      return;
    }

    setIsCreateModalOpen(true);
    setSelectedCardToList(null);
    setCardSearch('');
    setIsLoadingCollection(true);

    const collectionData = await fetchMyCollection(token);
    if (collectionData && collectionData.items) {
      setUserCards(collectionData.items.filter((item) => item.quantity > 0));
    }
    setIsLoadingCollection(false);
  };

  // Submit New Listing
  const handleCreateListing = async () => {
    if (!selectedCardToList || !token) return;
    if (listingPrice < 1) {
      showToast('Listing price must be at least 1 coin!', 'error', 'Invalid Price');
      return;
    }

    setIsSubmittingListing(true);
    try {
      await createMarketListing(
        {
          card_id: selectedCardToList.card_id,
          price_coins: listingPrice,
          is_foil: selectedCardToList.is_foil,
          quantity: 1,
        },
        token
      );

      showToast(
        `Successfully listed ${selectedCardToList.card.name} for ${listingPrice.toLocaleString()} 🪙! Card transferred to secure escrow.`,
        'gold',
        'Listing Live'
      );

      setIsCreateModalOpen(false);
      setSelectedCardToList(null);
      // Reload states
      loadListings();
      loadMyListings();
      loadStats();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to list card for sale', 'error', 'Listing Error');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  // Cancel Listing
  const handleCancelListing = async (listingId: number, cardName: string) => {
    if (!token) return;
    setCancellingId(listingId);

    try {
      const res = await cancelMarketListing(listingId, token);
      showToast(
        res.message || `Listing cancelled! 1x ${cardName} returned to your collection vault.`,
        'info',
        'Listing Cancelled'
      );
      // Refresh
      loadListings();
      loadMyListings();
      loadStats();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel listing', 'error', 'Cancellation Error');
    } finally {
      setCancellingId(null);
    }
  };

  // Execute Buy Listing
  const handleBuyListing = async () => {
    if (!selectedListing) return;

    if (!isAuthenticated || !token) {
      showToast('Please sign in to purchase marketplace listings!', 'info', 'Sign In Required');
      openAuthModal('login');
      return;
    }

    if (user.coins < selectedListing.price_coins) {
      showToast('Insufficient coins in your vault!', 'error', 'Transaction Failed');
      return;
    }

    setIsBuying(true);
    try {
      const res = await buyMarketListing(selectedListing.id, token);

      // Update user state coins
      setUser((prev) => ({
        ...prev,
        coins: res.new_coin_balance,
      }));

      showToast(
        `Acquired ${res.card_name} from ${selectedListing.seller_name} for ${res.price_coins.toLocaleString()} 🪙! Card added to your vault.`,
        'gold',
        'Market Trade Settled'
      );

      setSelectedListing(null);
      // Reload
      loadListings();
      loadMyListings();
      loadStats();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete card purchase', 'error', 'Trade Error');
    } finally {
      setIsBuying(false);
    }
  };

  // Filtered cards for listing modal
  const filteredUserCards = useMemo(() => {
    return userCards.filter((uc) =>
      uc.card.name.toLowerCase().includes(cardSearch.toLowerCase())
    );
  }, [userCards, cardSearch]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Phase 10 Engine • P2P Trading Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">PLAYER MARKETPLACE</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time player order book. Trade cards with zero counterparty friction and instant 5% escrow settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={handleOpenCreateModal}
            leftIcon={<PlusCircle className="w-4 h-4 text-black" />}
          >
            Create Listing
          </Button>
        </div>
      </div>

      {/* Market Stats Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-surface-border hover:border-amber-500/30 transition-colors">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">24h Market Volume</span>
          <span className="text-xl font-bold text-amber-300 font-mono flex items-center gap-1.5 mt-0.5">
            <Coins className="w-4 h-4 text-amber-400" />
            {(stats?.total_volume_24h ?? 0).toLocaleString()} 🪙
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border hover:border-brand-purple/40 transition-colors">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Active Listings</span>
          <span className="text-xl font-bold text-brand-purple font-mono mt-0.5 block">
            {(stats?.active_listings_count ?? 0).toLocaleString()} cards
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border hover:border-emerald-500/30 transition-colors">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Protocol Escrow Fee</span>
          <span className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
            {stats?.fee_percentage ?? 5.0}%
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border hover:border-purple-500/30 transition-colors">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Top Traded Asset</span>
          <span className="text-lg font-bold text-white font-display truncate mt-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
            {stats?.top_traded_card || 'Charizard Base'}
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'browse' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={loadListings}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingListings ? 'animate-spin' : ''}`} />}
            className="text-gray-400 hover:text-white"
          >
            Refresh Book
          </Button>
        )}
      </div>

      {/* TAB 1: BROWSE MARKETPLACE */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-xl border border-surface-border flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <SearchAutocomplete
                placeholder="Search listings by card name..."
                category="cards"
                value={searchQuery}
                autoNavigate={false}
                onChange={(val) => setSearchQuery(val)}
                onSelect={(item) => setSearchQuery(item.title)}
                className="w-full text-xs sm:text-sm"
              />
            </div>

            {/* Filter Dropdowns & Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-surface-light border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                {RARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface-dark text-white">
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-surface-light border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface-dark text-white">
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyFoil(!onlyFoil)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  onlyFoil
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-gold'
                    : 'bg-surface-light text-gray-400 border-surface-border hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Holo Foil Only</span>
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoadingListings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-panel p-4 rounded-xl border border-surface-border animate-pulse h-36" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-surface-border text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center mx-auto text-brand-purple">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">No Active Listings Found</h3>
              <p className="text-xs text-gray-400">
                {searchQuery || selectedRarity || onlyFoil
                  ? 'No cards currently listed match your active filters. Try broadening your search!'
                  : 'The marketplace book is currently empty. Be the first player to list a rare card for sale!'}
              </p>
              <Button variant="gold" onClick={handleOpenCreateModal} leftIcon={<PlusCircle className="w-4 h-4 text-black" />}>
                List a Card for Sale
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const isSeller = user && listing.seller_name.toLowerCase() === user.username.toLowerCase();
                const cardImage = listing.card.image_url || (listing.card as any).imageUrl;

                return (
                  <CardPanel
                    key={listing.id}
                    hoverEffect
                    className={`flex flex-col justify-between p-4 border transition-all duration-200 ${
                      listing.is_foil
                        ? 'border-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                        : 'border-surface-border hover:border-brand-purple/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Card Preview with Holo Effect */}
                      <div className="relative w-20 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-surface-border bg-black shrink-0 group">
                        <img
                          src={cardImage}
                          alt={listing.card.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {listing.is_foil && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-transparent to-purple-400/30 pointer-events-none holo-card-shine" />
                        )}
                        {listing.is_foil && (
                          <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-[8px] font-mono font-bold text-amber-300 px-1 py-0.5 rounded border border-amber-500/40 flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2 text-amber-400" />
                            FOIL
                          </span>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge rarity={listing.card.rarity} className="text-[9px] px-1.5 py-0" />
                          <span className="text-[10px] text-gray-500 font-mono">
                            #{listing.card.number}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white font-display truncate">
                          {listing.card.name}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-0.5">
                          <User className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                          <span className="truncate max-w-[120px] font-medium">
                            {isSeller ? (
                              <span className="text-brand-purple font-semibold">You (Seller)</span>
                            ) : (
                              listing.seller_name
                            )}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-500">
                          Listed {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Price</span>
                        <div className="text-lg font-extrabold text-amber-300 font-mono flex items-center gap-1">
                          {listing.price_coins.toLocaleString()} 🪙
                        </div>
                      </div>

                      {isSeller ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelListing(listing.id, listing.card.name)}
                          disabled={cancellingId === listing.id}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs"
                        >
                          {cancellingId === listing.id ? 'Cancelling...' : 'Cancel & Reclaim'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => setSelectedListing(listing)}
                          leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-black" />}
                        >
                          Buy Now
                        </Button>
                      )}
                    </div>
                  </CardPanel>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ACTIVE LISTINGS */}
      {activeTab === 'my_listings' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="glass-panel p-8 rounded-xl border border-surface-border text-center space-y-3 max-w-md mx-auto">
              <User className="w-8 h-8 text-brand-purple mx-auto" />
              <h3 className="text-base font-bold text-white">Sign In to View Listings</h3>
              <p className="text-xs text-gray-400">Connect your collector profile to manage your listed cards.</p>
              <Button variant="primary" onClick={() => openAuthModal('login')}>
                Sign In
              </Button>
            </div>
          ) : isLoadingMyListings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel p-4 rounded-xl border border-surface-border animate-pulse h-32" />
              ))}
            </div>
          ) : myActiveListings.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-surface-border text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-surface-light border border-surface-border flex items-center justify-center mx-auto text-gray-400">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">No Cards Currently Listed</h3>
              <p className="text-xs text-gray-400">
                You don't have any cards listed on the market. Put duplicate or valuable cards up for sale to earn coins!
              </p>
              <Button variant="gold" onClick={handleOpenCreateModal} leftIcon={<PlusCircle className="w-4 h-4 text-black" />}>
                List a Card Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myActiveListings.map((listing) => {
                const cardImage = listing.card.image_url || (listing.card as any).imageUrl;
                const netPayout = Math.floor(listing.price_coins * 0.95);

                return (
                  <CardPanel key={listing.id} className="p-4 border border-brand-purple/30 flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-surface-border bg-black shrink-0">
                        <img src={cardImage} alt={listing.card.name} className="w-full h-full object-cover" />
                        {listing.is_foil && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-purple-400/30" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge rarity={listing.card.rarity} className="text-[9px] px-1.5 py-0" />
                          {listing.is_foil && (
                            <span className="text-[9px] font-bold text-amber-300 font-mono">FOIL</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white font-display truncate">
                          {listing.card.name}
                        </h4>
                        <div className="text-xs text-gray-400">
                          Listed for <span className="font-mono text-amber-300 font-bold">{listing.price_coins.toLocaleString()} 🪙</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Estimated Payout: ~{netPayout.toLocaleString()} 🪙 (after 5% fee)
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelListing(listing.id, listing.card.name)}
                        disabled={cancellingId === listing.id}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs"
                      >
                        {cancellingId === listing.id ? 'Reclaiming...' : 'Cancel & Reclaim'}
                      </Button>
                    </div>
                  </CardPanel>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRADE LEDGER & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="glass-panel p-8 rounded-xl border border-surface-border text-center space-y-3 max-w-md mx-auto">
              <History className="w-8 h-8 text-brand-purple mx-auto" />
              <h3 className="text-base font-bold text-white">Sign In to View Trade History</h3>
              <p className="text-xs text-gray-400">Connect your account to inspect your complete sales & transaction ledger.</p>
              <Button variant="primary" onClick={() => openAuthModal('login')}>
                Sign In
              </Button>
            </div>
          ) : isLoadingMyListings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel p-4 rounded-xl border border-surface-border animate-pulse h-16" />
              ))}
            </div>
          ) : myTradeHistory.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-surface-border text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-surface-light border border-surface-border flex items-center justify-center mx-auto text-gray-400">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">No Completed Trades Yet</h3>
              <p className="text-xs text-gray-400">
                When your listed cards sell or listings are cancelled, their audit records will appear in this ledger.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTradeHistory.map((item) => {
                const isSold = item.status === 'SOLD';
                const cardImage = item.card.image_url || (item.card as any).imageUrl;
                const netPayout = Math.floor(item.price_coins * 0.95);

                return (
                  <div
                    key={item.id}
                    className="glass-panel p-4 rounded-xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cardImage}
                        alt={item.card.name}
                        className="w-12 aspect-[2.5/3.5] rounded object-cover border border-surface-border bg-black"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.card.name}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isSold
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          {isSold ? (
                            <span>Sold to: <strong className="text-white">{item.buyer_name || 'Collector'}</strong></span>
                          ) : (
                            <span>Listing Cancelled</span>
                          )}
                          <span>•</span>
                          <span>{new Date(item.sold_at || item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-300 font-mono">
                        {item.price_coins.toLocaleString()} 🪙
                      </div>
                      {isSold && (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          +{netPayout.toLocaleString()} 🪙 Net Payout
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="List Card on Marketplace"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {!selectedCardToList ? (
            /* Step 1: Select Card from Vault */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Step 1: Choose a Card from your Vault
                </span>
                <span className="text-xs font-mono text-brand-purple">
                  {filteredUserCards.length} cards available
                </span>
              </div>

              {/* Card Search */}
              <div className="relative">
                <SearchAutocomplete
                  placeholder="Search your collection..."
                  category="cards"
                  value={cardSearch}
                  autoNavigate={false}
                  onChange={(val) => setCardSearch(val)}
                  onSelect={(item) => setCardSearch(item.title)}
                  className="w-full text-xs"
                />
              </div>

              {/* Card Picker Grid */}
              {isLoadingCollection ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-[2.5/3.5] rounded-xl bg-surface-light animate-pulse" />
                  ))}
                </div>
              ) : filteredUserCards.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No cards found in your vault. Open booster packs first to build your inventory!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1 scrollbar-thin">
                  {filteredUserCards.map((uc) => {
                    const cardImg = uc.card.image_url || (uc.card as any).imageUrl;

                    return (
                      <button
                        key={`${uc.card_id}-${uc.is_foil}`}
                        type="button"
                        onClick={() => {
                          setSelectedCardToList(uc);
                          setListingPrice(Math.max(10, uc.card.market_price || 100));
                        }}
                        className="group relative rounded-xl border border-surface-border bg-surface-light/40 p-2 text-left hover:border-brand-purple hover:bg-surface-light transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black mb-2 border border-surface-border/50">
                          <img src={cardImg} alt={uc.card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute top-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            x{uc.quantity}
                          </div>
                          {uc.is_foil && (
                            <div className="absolute bottom-1 left-1 bg-amber-500/90 text-black text-[8px] font-bold px-1 rounded">
                              FOIL
                            </div>
                          )}
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-white truncate">{uc.card.name}</h5>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                            <span className="truncate">{uc.card.rarity}</span>
                            <span className="font-mono text-amber-300 font-semibold">{uc.card.market_price || 50} 🪙</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Configure Listing Price & Review Escrow Terms */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Step 2: Set Listing Price & Review Escrow
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCardToList(null)}
                  className="text-xs text-brand-purple hover:underline cursor-pointer"
                >
                  Change Card
                </button>
              </div>

              {/* Selected Card Spotlight */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light border border-surface-border">
                <img
                  src={selectedCardToList.card.image_url || (selectedCardToList.card as any).imageUrl}
                  alt={selectedCardToList.card.name}
                  className="w-16 aspect-[2.5/3.5] object-cover rounded-lg border border-surface-border bg-black"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge rarity={selectedCardToList.card.rarity} className="text-[9px] px-1.5 py-0" />
                    {selectedCardToList.is_foil && (
                      <span className="text-[9px] font-bold text-amber-300 font-mono">HOLO FOIL</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white font-display">{selectedCardToList.card.name}</h4>
                  <p className="text-xs text-gray-400">
                    Owned: <strong className="text-white">{selectedCardToList.quantity} copies</strong> • Base value: {selectedCardToList.card.market_price} 🪙
                  </p>
                </div>
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 block">
                  Listing Price (Coins)
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-surface-border rounded-xl text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              {/* Fee Breakdown Card */}
              <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border space-y-2 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Listing Price:</span>
                  <span className="font-mono font-semibold text-white">{listingPrice.toLocaleString()} 🪙</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Marketplace Protocol Fee (5%):</span>
                  <span className="font-mono">-{Math.floor(listingPrice * 0.05).toLocaleString()} 🪙</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-border font-bold text-emerald-400 text-sm">
                  <span>Net Payout on Sale:</span>
                  <span className="font-mono">+{Math.floor(listingPrice * 0.95).toLocaleString()} 🪙</span>
                </div>
              </div>

              {/* Escrow Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-brand-purple/10 border border-brand-purple/30 text-[11px] text-gray-300">
                <ShieldCheck className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                <span>
                  <strong>Escrow Guarantee:</strong> 1 copy of this card will be held in secure escrow. You can cancel this listing anytime to immediately restore the card to your vault.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="gold"
                  onClick={handleCreateListing}
                  disabled={isSubmittingListing || listingPrice < 1}
                  leftIcon={<Check className="w-4 h-4 text-black" />}
                >
                  {isSubmittingListing ? 'Publishing Order...' : `List for ${listingPrice.toLocaleString()} 🪙`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* BUY CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        title="Confirm Marketplace Purchase"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light border border-surface-border">
              <img
                src={selectedListing.card.image_url || (selectedListing.card as any).imageUrl}
                alt={selectedListing.card.name}
                className="w-16 aspect-[2.5/3.5] object-cover rounded-lg border border-surface-border bg-black"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Badge rarity={selectedListing.card.rarity} className="text-[9px] px-1.5 py-0" />
                  {selectedListing.is_foil && (
                    <span className="text-[9px] font-bold text-amber-300 font-mono">FOIL</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{selectedListing.card.name}</h4>
                <p className="text-xs text-gray-400">Seller: <strong className="text-white">{selectedListing.seller_name}</strong></p>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {selectedListing.price_coins.toLocaleString()} Coins
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-300 space-y-1.5 bg-surface-card p-3 rounded-lg border border-surface-border">
              <div className="flex justify-between">
                <span>Your Vault Balance:</span>
                <span className="font-mono text-white">{user.coins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Purchase Price:</span>
                <span className="font-mono">-{selectedListing.price_coins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-border font-bold text-amber-300">
                <span>Remaining Balance:</span>
                <span className={`font-mono ${user.coins < selectedListing.price_coins ? 'text-rose-400' : ''}`}>
                  {(user.coins - selectedListing.price_coins).toLocaleString()} 🪙
                </span>
              </div>
            </div>

            {user.coins < selectedListing.price_coins && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient coins! You need {(selectedListing.price_coins - user.coins).toLocaleString()} more coins.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedListing(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={handleBuyListing}
                disabled={isBuying || user.coins < selectedListing.price_coins}
                leftIcon={<Check className="w-4 h-4 text-black" />}
              >
                {isBuying
                  ? 'Completing Trade...'
                  : `Confirm Buy for ${selectedListing.price_coins.toLocaleString()} 🪙`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MarketPage;
