import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, Plus, Trash2, Edit, CheckCircle, 
  Swords, RefreshCw, AlertCircle, Shield 
} from 'lucide-react';
import { 
  fetchUserDecks, deleteDeck, activateDeck, 
  DeckOut 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import DeckBuilderModal from '../components/battle/DeckBuilderModal';

export const DecksPage: React.FC = () => {
  const { token, openAuthModal } = useAuth();
  const [decks, setDecks] = useState<DeckOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDeck, setEditingDeck] = useState<DeckOut | null>(null);

  useEffect(() => {
    if (token) {
      loadDecks();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadDecks = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchUserDecks(token);
      setDecks(data);
    } catch (err: any) {
      setErrorMsg('Failed to load battle decks.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (deckId: number) => {
    if (!token) return;
    try {
      await activateDeck(token, deckId);
      loadDecks();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to activate deck.');
    }
  };

  const handleDelete = async (deckId: number) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this deck?')) return;
    try {
      await deleteDeck(token, deckId);
      loadDecks();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete deck.');
    }
  };

  const activeDeck = decks.find((d) => d.is_active);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 p-8 border border-purple-500/20 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                TCG Deck Construction Lab
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Battle Decks & Squads
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
                Build synergistic battle squads from your card collection, optimize elemental type coverage,
                and equip your active battle team for Gym Leader duels in the Arena.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!token) {
                    openAuthModal('login');
                    return;
                  }
                  setEditingDeck(null);
                  setIsModalOpen(true);
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-sm hover:brightness-110 shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Deck
              </button>
              <Link
                to="/battle"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm hover:brightness-110 shadow-lg shadow-amber-500/25 flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                Enter Arena
              </Link>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline text-slate-400">
              Dismiss
            </button>
          </div>
        )}

        {/* ACTIVE BATTLE DECK SHOWCASE */}
        {activeDeck && (
          <div className="relative rounded-3xl bg-slate-900/80 border border-purple-500/40 p-6 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-28 rounded-2xl overflow-hidden bg-slate-950 border border-purple-500/50 shadow-2xl flex-shrink-0">
                  <img
                    src={activeDeck.cover_card_image || 'https://assets.tcgdex.net/en/base/base1/4/high.webp'}
                    alt={activeDeck.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active Battle Squad
                  </span>
                  <h2 className="text-2xl font-black text-white">{activeDeck.name}</h2>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>{activeDeck.card_count} Cards</span>
                    <span>•</span>
                    <span>Avg HP: <strong className="text-emerald-400 font-bold">{activeDeck.avg_hp}</strong></span>
                  </div>
                  {/* Elemental Distribution */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(activeDeck.types_distribution || {}).map(([type, count]) => (
                      <span
                        key={type}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono border border-slate-700 font-bold"
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditingDeck(activeDeck);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Squad
                </button>
                <Link
                  to="/battle"
                  className="px-5 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-black hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
                >
                  <Swords className="w-3.5 h-3.5" /> Battle with Squad
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ALL DECKS GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Your Custom Decks ({decks.length} / 10)
            </h3>
          </div>

          {!token ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
              <Shield className="w-12 h-12 text-purple-400 mx-auto" />
              <h4 className="text-lg font-bold text-white">Sign In to Create Custom Decks</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sign in to assemble cards from your collection and battle Gym Leaders.
              </p>
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-purple-500/20"
              >
                Log In / Register
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 rounded-3xl border border-slate-800">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading your battle squads...</p>
            </div>
          ) : decks.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto text-2xl">
                🎴
              </div>
              <h4 className="text-lg font-bold text-white">No Decks Assembled Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Construct your first custom battle squad from your cards and enter the Arena!
              </p>
              <button
                onClick={() => {
                  setEditingDeck(null);
                  setIsModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-purple-500/20"
              >
                Assemble First Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className={`rounded-2xl p-5 border transition-all space-y-4 ${
                    deck.is_active
                      ? 'bg-slate-900/90 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                      <img
                        src={deck.cover_card_image || 'https://assets.tcgdex.net/en/base/base1/4/high.webp'}
                        alt={deck.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white truncate max-w-[130px]">
                          {deck.name}
                        </span>
                        {deck.is_active && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {deck.card_count} Cards • {deck.avg_hp} Avg HP
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(deck.types_distribution || {}).slice(0, 3).map(([type, count]) => (
                          <span key={type} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 font-mono">
                            {type} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingDeck(deck);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Edit Deck"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(deck.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!deck.is_active && (
                      <button
                        onClick={() => handleActivate(deck.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <DeckBuilderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          deckToEdit={editingDeck}
          onSaved={() => loadDecks()}
        />
      </div>
    </div>
  );
};

export default DecksPage;
