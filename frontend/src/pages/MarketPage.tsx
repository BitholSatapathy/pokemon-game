import React, { useState } from 'react';
import { Store, TrendingUp, Search, PlusCircle, ShoppingCart, User, Check } from 'lucide-react';
import { CardPanel } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { MarketListing, UserProfile } from '../types';
import { MOCK_MARKET_LISTINGS } from '../data/mockData';

interface MarketProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const MarketPage: React.FC<MarketProps> = ({ user, setUser }) => {
  const [listings, setListings] = useState<MarketListing[]>(MOCK_MARKET_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const handleBuyListing = () => {
    if (!selectedListing) return;
    if (user.coins < selectedListing.priceCoins) {
      showToast('Insufficient coins to purchase this market listing!', 'error', 'Transaction Failed');
      return;
    }

    setUser((prev) => ({
      ...prev,
      coins: prev.coins - selectedListing.priceCoins,
    }));

    setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
    showToast(
      `Purchased ${selectedListing.card.name} from ${selectedListing.sellerName} for ${selectedListing.priceCoins.toLocaleString()} 🪙!`,
      'gold',
      'Market Purchase Complete'
    );
    setSelectedListing(null);
  };

  const filteredListings = listings.filter((l) =>
    l.card.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-purple uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Phases 11–13 Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display mt-1">PLAYER MARKETPLACE</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time player order book. Trade cards & packs with zero counterparty friction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={() =>
              showToast(
                'List Card modal ready for Phase 11 player market milestone!',
                'info',
                'Market Preview'
              )
            }
            leftIcon={<PlusCircle className="w-4 h-4 text-black" />}
          >
            Create Listing
          </Button>
        </div>
      </div>

      {/* Market Stats Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-surface-border">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">24h Market Volume</span>
          <span className="text-lg font-bold text-white font-mono">1,240,000 🪙</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Active Listings</span>
          <span className="text-lg font-bold text-brand-purple font-mono">4,120</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Market Index</span>
          <span className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +4.2%
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-surface-border">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Top Traded</span>
          <span className="text-lg font-bold text-amber-300 font-display">Charizard Base</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search listings by card name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-light border border-surface-border rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-purple placeholder:text-gray-500"
        />
      </div>

      {/* Listings Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredListings.map((listing) => (
          <CardPanel key={listing.id} hoverEffect className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 aspect-[2.5/3.5] rounded-lg overflow-hidden border border-surface-border bg-black shrink-0 holo-card-shine">
                <img
                  src={listing.card.imageUrl}
                  alt={listing.card.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge rarity={listing.card.rarity} className="text-[9px] px-1.5 py-0" />
                  <span className="text-xs text-gray-400 font-mono">Qty: {listing.quantity}</span>
                </div>
                <h4 className="text-base font-bold text-white font-display truncate">
                  {listing.card.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <User className="w-3.5 h-3.5 text-brand-purple" />
                  <span>{listing.sellerName}</span>
                  <span className="text-gray-600">•</span>
                  <span>{listing.createdAt}</span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-2 shrink-0">
              <div>
                <div className="text-base font-extrabold text-amber-300 font-mono">
                  {listing.priceCoins.toLocaleString()} 🪙
                </div>
                {listing.priceChange24h && (
                  <span
                    className={`text-[10px] font-semibold ${
                      listing.priceChange24h > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {listing.priceChange24h > 0 ? '+' : ''}
                    {listing.priceChange24h}% 24h
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="gold"
                onClick={() => setSelectedListing(listing)}
                leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-black" />}
              >
                Buy Now
              </Button>
            </div>
          </CardPanel>
        ))}
      </div>

      {/* Buy Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        title="Confirm Marketplace Purchase"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light border border-surface-border">
              <img
                src={selectedListing.card.imageUrl}
                alt={selectedListing.card.name}
                className="w-16 aspect-[2.5/3.5] object-cover rounded-lg border border-surface-border"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{selectedListing.card.name}</h4>
                <p className="text-xs text-gray-400">Seller: {selectedListing.sellerName}</p>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {selectedListing.priceCoins.toLocaleString()} Coins
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-300 space-y-1 bg-surface-card p-3 rounded-lg border border-surface-border">
              <div className="flex justify-between">
                <span>Your Balance:</span>
                <span className="font-mono text-white">{user.coins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Cost:</span>
                <span className="font-mono">-{selectedListing.priceCoins.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-border font-bold text-amber-300">
                <span>Remaining:</span>
                <span className="font-mono">
                  {(user.coins - selectedListing.priceCoins).toLocaleString()} 🪙
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedListing(null)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={handleBuyListing}
                leftIcon={<Check className="w-4 h-4 text-black" />}
              >
                Buy for {selectedListing.priceCoins.toLocaleString()} 🪙
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
