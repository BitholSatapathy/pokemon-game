import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchReceivedTradeOffers,
  fetchSentTradeOffers,
  createTradeOffer,
  acceptTradeOffer,
  declineTradeOffer,
  cancelTradeOffer,
  fetchMyCollection,
  TradeOfferOut,
  TradeItemIn,
  PlayerSearchResult,
  ApiUserCard,
} from '../services/api';
import { SearchAutocomplete } from '../components/common/SearchAutocomplete';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  ACCEPTED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  DECLINED: 'text-red-400 bg-red-400/10 border-red-400/30',
  CANCELLED: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  EXPIRED: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
};

const statusLabel: Record<string, string> = {
  PENDING: '⏳ Pending',
  ACCEPTED: '✅ Accepted',
  DECLINED: '❌ Declined',
  CANCELLED: '🚫 Cancelled',
  EXPIRED: '⌛ Expired',
};

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Card Chip
// ──────────────────────────────────────────────────────────────────────────────

interface CardChipProps {
  name: string | null;
  image: string | null;
  quantity: number;
  foil?: boolean;
}

function CardChip({ name, image, quantity, foil }: CardChipProps) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      {image ? (
        <img src={image} alt={name || 'card'} className="w-8 h-10 object-cover rounded" />
      ) : (
        <div className="w-8 h-10 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">?</div>
      )}
      <div>
        <p className="text-xs font-medium text-white/90 leading-tight">{name || 'Unknown Card'}</p>
        <p className="text-xs text-white/40">
          x{quantity} {foil ? '✨ Foil' : ''}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Trade Card (single offer display)
// ──────────────────────────────────────────────────────────────────────────────

interface TradeCardProps {
  offer: TradeOfferOut;
  perspective: 'received' | 'sent';
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onCancel?: (id: number) => void;
  loading: boolean;
}

function TradeCard({ offer, perspective, onAccept, onDecline, onCancel, loading }: TradeCardProps) {
  const offerItems = offer.items.filter((i) => i.side === 'offer');
  const requestItems = offer.items.filter((i) => i.side === 'request');

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 hover:border-purple-500/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">
            {perspective === 'received' ? (
              <>From <span className="text-purple-300 font-medium">{offer.sender.username}</span></>
            ) : (
              <>To <span className="text-purple-300 font-medium">{offer.receiver.username}</span></>
            )}
          </p>
          {offer.message && (
            <p className="mt-1 text-sm text-white/60 italic">"{offer.message}"</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[offer.status]}`}>
            {statusLabel[offer.status]}
          </span>
          {offer.status === 'PENDING' && (
            <span className="text-xs text-white/30">{timeLeft(offer.expires_at)}</span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/30 font-semibold">
            {perspective === 'received' ? "They're offering" : "You're offering"}
          </p>
          {offerItems.length === 0 ? (
            <p className="text-xs text-white/20 italic">Nothing</p>
          ) : (
            offerItems.map((item) => (
              <CardChip key={item.id} name={item.card_name} image={item.card_image} quantity={item.quantity} />
            ))
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/30 font-semibold">
            {perspective === 'received' ? "They want" : "You want"}
          </p>
          {requestItems.length === 0 ? (
            <p className="text-xs text-white/20 italic">Nothing</p>
          ) : (
            requestItems.map((item) => (
              <CardChip key={item.id} name={item.card_name} image={item.card_image} quantity={item.quantity} />
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      {offer.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          {perspective === 'received' && onAccept && onDecline && (
            <>
              <button
                onClick={() => onAccept(offer.id)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                ✅ Accept Trade
              </button>
              <button
                onClick={() => onDecline(offer.id)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 disabled:opacity-50 text-red-400 text-sm font-semibold transition-colors"
              >
                ❌ Decline
              </button>
            </>
          )}
          {perspective === 'sent' && onCancel && (
            <button
              onClick={() => onCancel(offer.id)}
              disabled={loading}
              className="py-2 px-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white/60 text-sm font-semibold transition-colors"
            >
              🚫 Cancel Offer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Create Trade Wizard
// ──────────────────────────────────────────────────────────────────────────────

interface CreateTradeWizardProps {
  token: string;
  onCreated: () => void;
}

type WizardStep = 'target' | 'offer' | 'request' | 'review';

function CreateTradeWizard({ token, onCreated }: CreateTradeWizardProps) {
  const [step, setStep] = useState<WizardStep>('target');
  const [playerQuery, setPlayerQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [myCards, setMyCards] = useState<ApiUserCard[]>([]);
  const [offerItems, setOfferItems] = useState<TradeItemIn[]>([]);
  const [requestItems, setRequestItems] = useState<TradeItemIn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load my collection once
  useEffect(() => {
    if (step === 'offer' && myCards.length === 0) {
      fetchMyCollection(token).then((data) => setMyCards(data?.items || [])).catch(() => {});
    }
  }, [step, token, myCards.length]);

  const toggleOfferItem = (card: ApiUserCard) => {
    const existing = offerItems.find((i) => i.user_card_id === card.id);
    if (existing) {
      setOfferItems(offerItems.filter((i) => i.user_card_id !== card.id));
    } else {
      setOfferItems([...offerItems, { user_card_id: card.id, quantity: 1 }]);
    }
  };

  const toggleRequestItem = (card: ApiUserCard) => {
    const existing = requestItems.find((i) => i.user_card_id === card.id);
    if (existing) {
      setRequestItems(requestItems.filter((i) => i.user_card_id !== card.id));
    } else {
      setRequestItems([...requestItems, { user_card_id: card.id, quantity: 1 }]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlayer) return;
    setSubmitting(true);
    setError('');
    try {
      await createTradeOffer(token, {
        receiver_username: selectedPlayer.username,
        message: message || undefined,
        offer_items: offerItems,
        request_items: requestItems,
      });
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['target', 'offer', 'request', 'review'] as const;
  const stepIdx = steps.indexOf(step);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      {/* Progress */}
      <div className="flex gap-2 items-center">
        {['Choose Player', 'Your Offer', 'You Want', 'Review & Send'].map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${i <= stepIdx ? 'text-purple-400' : 'text-white/30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${i < stepIdx ? 'bg-purple-500 border-purple-500 text-white' : i === stepIdx ? 'border-purple-400 text-purple-400' : 'border-white/20 text-white/30'}`}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < 3 && <div className={`flex-1 h-px ${i < stepIdx ? 'bg-purple-500' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Choose Player */}
      {step === 'target' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Who do you want to trade with?</h3>
          <SearchAutocomplete
            category="users"
            value={playerQuery}
            autoNavigate={false}
            onChange={(val) => setPlayerQuery(val)}
            onSelect={(item) => {
              const numericId = parseInt(item.id.replace('user_', ''), 10) || 0;
              setSelectedPlayer({ id: numericId, username: item.title });
              setPlayerQuery('');
            }}
            placeholder="Search by username…"
            className="w-full"
          />
          {selectedPlayer && (
            <div className="flex items-center gap-3 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                {selectedPlayer.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">@{selectedPlayer.username}</p>
                <p className="text-xs text-white/40">Selected as trade partner</p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="ml-auto text-white/30 hover:text-white/60">✕</button>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-white/60">Add a message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey! Wanna trade?"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>
          <button
            disabled={!selectedPlayer}
            onClick={() => setStep('offer')}
            className="w-full py-3 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold transition-colors"
          >
            Next: Choose cards to offer →
          </button>
        </div>
      )}

      {/* Step: Your Offer */}
      {step === 'offer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Cards you're offering to <span className="text-purple-300">@{selectedPlayer?.username}</span></h3>
            <span className="text-xs text-white/40">{offerItems.length} selected</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {myCards.map((card) => {
              const sel = offerItems.some((i) => i.user_card_id === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleOfferItem(card)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-left ${sel ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  {card.card.image_url ? (
                    <img src={card.card.image_url} alt={card.card.name} className="w-full h-24 object-contain rounded" />
                  ) : (
                    <div className="w-full h-24 bg-white/10 rounded" />
                  )}
                  <p className="text-xs text-white/80 text-center leading-tight line-clamp-1">{card.card.name}</p>
                  <p className="text-xs text-white/40">x{card.quantity}{card.is_foil ? ' ✨' : ''}</p>
                  {sel && <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('target')} className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm font-semibold">← Back</button>
            <button
              onClick={() => setStep('request')}
              className="flex-1 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors"
            >
              Next: What you want →
            </button>
          </div>
        </div>
      )}

      {/* Step: What you want */}
      {step === 'request' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Cards you want from <span className="text-purple-300">@{selectedPlayer?.username}</span></h3>
            <span className="text-xs text-white/40">{requestItems.length} selected</span>
          </div>
          <p className="text-xs text-white/40">You can specify cards by ID. Enter card IDs separated by commas or select from the list below (shows all cards in system).</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {myCards.map((card) => {
              const sel = requestItems.some((i) => i.user_card_id === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleRequestItem(card)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-left ${sel ? 'border-cyan-500 bg-cyan-500/20' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  {card.card.image_url ? (
                    <img src={card.card.image_url} alt={card.card.name} className="w-full h-24 object-contain rounded" />
                  ) : (
                    <div className="w-full h-24 bg-white/10 rounded" />
                  )}
                  <p className="text-xs text-white/80 text-center leading-tight line-clamp-1">{card.card.name}</p>
                  <p className="text-xs text-white/40">x{card.quantity}{card.is_foil ? ' ✨' : ''}</p>
                  {sel && <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('offer')} className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm font-semibold">← Back</button>
            <button
              onClick={() => setStep('review')}
              className="flex-1 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors"
            >
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-5">
          <h3 className="text-white font-semibold">Review your trade offer</h3>
          <div className="p-4 bg-white/5 rounded-lg space-y-1">
            <p className="text-sm text-white/60">Trading with: <span className="text-purple-300 font-semibold">@{selectedPlayer?.username}</span></p>
            {message && <p className="text-sm text-white/50 italic">Message: "{message}"</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold">You're giving ({offerItems.length} cards)</p>
              {offerItems.length === 0 ? <p className="text-xs text-white/20 italic">Nothing</p> : offerItems.map((item) => {
                const card = myCards.find((c) => c.id === item.user_card_id);
                return <CardChip key={item.user_card_id} name={card?.card.name || null} image={card?.card.image_url || null} quantity={item.quantity} />;
              })}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-white/30 font-semibold">You want ({requestItems.length} cards)</p>
              {requestItems.length === 0 ? <p className="text-xs text-white/20 italic">Nothing</p> : requestItems.map((item) => {
                const card = myCards.find((c) => c.id === item.user_card_id);
                return <CardChip key={item.user_card_id} name={card?.card.name || null} image={card?.card.image_url || null} quantity={item.quantity} />;
              })}
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep('request')} className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm font-semibold">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!offerItems.length && !requestItems.length)}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold text-sm transition-all"
            >
              {submitting ? 'Sending…' : '🤝 Send Trade Offer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────

type Tab = 'received' | 'sent' | 'create';

export default function TradingPage() {
  const { token, isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const [received, setReceived] = useState<TradeOfferOut[]>([]);
  const [sent, setSent] = useState<TradeOfferOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOffers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [rec, snt] = await Promise.all([
        fetchReceivedTradeOffers(token),
        fetchSentTradeOffers(token),
      ]);
      setReceived(rec);
      setSent(snt);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) loadOffers();
  }, [isAuthenticated, loadOffers]);

  const handleAccept = async (id: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await acceptTradeOffer(token, id);
      showToast('Trade accepted! Cards swapped successfully 🎉');
      loadOffers();
    } catch (e: any) {
      showToast(e.message || 'Failed to accept', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (id: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await declineTradeOffer(token, id);
      showToast('Offer declined');
      loadOffers();
    } catch (e: any) {
      showToast(e.message || 'Failed to decline', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await cancelTradeOffer(token, id);
      showToast('Offer cancelled');
      loadOffers();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl text-white/60">🔒 Sign in to access Trading</p>
        <button
          onClick={() => openAuthModal()}
          className="px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const pendingReceived = received.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">⇌ Trading Hub</h1>
        <p className="text-white/50 mt-1">Send and receive direct card trade offers with other players</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
        {([
          { id: 'received' as Tab, label: `📬 Incoming${pendingReceived ? ` (${pendingReceived})` : ''}` },
          { id: 'sent' as Tab, label: '📤 Sent Offers' },
          { id: 'create' as Tab, label: '➕ Create Trade' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-purple-500 text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-20 text-white/40">Loading offers…</div>
      ) : (
        <>
          {activeTab === 'received' && (
            <div className="space-y-4">
              {received.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                  <p className="text-4xl mb-3">📭</p>
                  <p>No incoming trade offers yet</p>
                </div>
              ) : (
                received.map((offer) => (
                  <TradeCard
                    key={offer.id}
                    offer={offer}
                    perspective="received"
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    loading={actionLoading}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sent.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                  <p className="text-4xl mb-3">📤</p>
                  <p>You haven't sent any trade offers yet</p>
                </div>
              ) : (
                sent.map((offer) => (
                  <TradeCard
                    key={offer.id}
                    offer={offer}
                    perspective="sent"
                    onCancel={handleCancel}
                    loading={actionLoading}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'create' && token && (
            <CreateTradeWizard
              token={token}
              onCreated={() => {
                showToast('Trade offer sent! 🤝');
                setActiveTab('sent');
                loadOffers();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
