import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Minus, Layers, AlertCircle, 
  Save, RefreshCw 
} from 'lucide-react';
import { 
  fetchMyCollection, createDeck, updateDeck, 
  ApiUserCard, DeckOut, DeckCardItemIn 
} from '../../services/api';
import { SearchAutocomplete } from '../common/SearchAutocomplete';
import { useAuth } from '../../context/AuthContext';

interface DeckBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckToEdit?: DeckOut | null;
  onSaved: () => void;
}

export const DeckBuilderModal: React.FC<DeckBuilderModalProps> = ({
  isOpen,
  onClose,
  deckToEdit,
  onSaved,
}) => {
  const { token } = useAuth();
  const [collection, setCollection] = useState<ApiUserCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deck State
  const [deckName, setDeckName] = useState<string>('My Battle Deck');
  const [selectedCards, setSelectedCards] = useState<Record<string, number>>({});
  const [coverCardId, setCoverCardId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadCollection();
      if (deckToEdit) {
        setDeckName(deckToEdit.name);
        setCoverCardId(deckToEdit.cover_card_id || null);
        const map: Record<string, number> = {};
        deckToEdit.cards.forEach((c) => {
          map[c.card_id] = c.quantity;
        });
        setSelectedCards(map);
      } else {
        setDeckName('New Battle Deck');
        setCoverCardId(null);
        setSelectedCards({});
      }
    }
  }, [isOpen, deckToEdit]);

  const loadCollection = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchMyCollection(token);
      if (res?.items) {
        setCollection(res.items);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load collection for deck building.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalCardsCount = Object.values(selectedCards).reduce((a, b) => a + b, 0);

  const handleAddCard = (cardId: string, maxOwned: number) => {
    const current = selectedCards[cardId] || 0;
    if (current >= maxOwned) return;
    if (current >= 4) return; // Max 4 copies per species
    setSelectedCards({ ...selectedCards, [cardId]: current + 1 });
    if (!coverCardId) setCoverCardId(cardId);
  };

  const handleRemoveCard = (cardId: string) => {
    const current = selectedCards[cardId] || 0;
    if (current <= 1) {
      const copy = { ...selectedCards };
      delete copy[cardId];
      setSelectedCards(copy);
      if (coverCardId === cardId) setCoverCardId(null);
    } else {
      setSelectedCards({ ...selectedCards, [cardId]: current - 1 });
    }
  };

  const handleSaveDeck = async () => {
    if (!token) return;
    if (!deckName.trim()) {
      setErrorMsg('Please enter a valid deck name.');
      return;
    }
    if (totalCardsCount < 4) {
      setErrorMsg('Please select at least 4 cards for your battle team.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const cardsPayload: DeckCardItemIn[] = Object.entries(selectedCards).map(
      ([card_id, quantity]) => ({ card_id, quantity })
    );

    try {
      if (deckToEdit) {
        await updateDeck(token, deckToEdit.id, {
          name: deckName.trim(),
          cover_card_id: coverCardId || undefined,
          cards: cardsPayload,
        });
      } else {
        await createDeck(token, {
          name: deckName.trim(),
          cover_card_id: coverCardId || undefined,
          cards: cardsPayload,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save deck.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCollection = collection.filter((c) =>
    c.card.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.card.types && c.card.types.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {deckToEdit ? 'Edit Battle Deck' : 'Create Custom Deck'}
              </h2>
              <p className="text-xs text-slate-400">
                Assemble cards from your vault to construct your stadium battle team.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 flex-1 overflow-hidden">
          {/* Left: Card Picker from Collection */}
          <div className="lg:col-span-7 flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <SearchAutocomplete
                  placeholder="Search cards by name or element..."
                  category="cards"
                  value={searchFilter}
                  autoNavigate={false}
                  onChange={(val) => setSearchFilter(val)}
                  onSelect={(item) => setSearchFilter(item.title)}
                  className="w-full text-xs"
                />
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                {filteredCollection.length} Owned
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-2" />
                Loading your collection...
              </div>
            ) : filteredCollection.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 border border-slate-800 rounded-2xl bg-slate-950">
                No cards found matching your query.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {filteredCollection.map((uc) => {
                  const currentInDeck = selectedCards[uc.card_id] || 0;
                  const canAdd = currentInDeck < uc.quantity && currentInDeck < 4;

                  return (
                    <div
                      key={uc.id}
                      onClick={() => canAdd && handleAddCard(uc.card_id, uc.quantity)}
                      className={`group relative rounded-xl p-2.5 border transition-all cursor-pointer ${
                        currentInDeck > 0
                          ? 'bg-purple-950/20 border-purple-500/60'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      } ${!canAdd ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                    >
                      <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden mb-1.5 bg-slate-950 relative">
                        <img
                          src={uc.card.image_url}
                          alt={uc.card.name}
                          className="w-full h-full object-cover"
                        />
                        {currentInDeck > 0 && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black font-mono shadow">
                            {currentInDeck} in deck
                          </div>
                        )}
                      </div>
                      <div className="truncate text-xs font-bold text-white">{uc.card.name}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>{uc.card.types || 'Normal'}</span>
                        <span className="font-mono text-emerald-400 font-bold">{uc.card.hp || 50} HP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Current Deck Summary */}
          <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl overflow-hidden">
            {/* Deck Configuration */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Deck Name
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g. Electric Surge Squad"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Total Cards Count Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-300 font-bold">Total Team Size:</div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                <span className={totalCardsCount >= 4 ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalCardsCount}
                </span>
                <span className="text-slate-500">/ 20 Cards</span>
              </div>
            </div>

            {/* Selected Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {Object.keys(selectedCards).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Click cards on the left to add them to your deck.
                </div>
              ) : (
                Object.entries(selectedCards).map(([cardId, qty]) => {
                  const cardItem = collection.find((c) => c.card_id === cardId)?.card;
                  if (!cardItem) return null;

                  return (
                    <div
                      key={cardId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={cardItem.image_url}
                          alt={cardItem.name}
                          className="w-8 h-11 object-cover rounded"
                        />
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-white truncate max-w-[130px]">
                            {cardItem.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cardItem.types} • {cardItem.hp || 50} HP
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveCard(cardId)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold text-white w-4 text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => {
                            const owned = collection.find((c) => c.card_id === cardId)?.quantity || 1;
                            handleAddCard(cardId, owned);
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Save Deck Action */}
            <button
              onClick={handleSaveDeck}
              disabled={saving || totalCardsCount < 4}
              className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
                saving || totalCardsCount < 4
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110 shadow-purple-500/25 active:scale-95'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Deck...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Confirm Deck
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilderModal;
