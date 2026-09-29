import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Sparkles, CheckCircle2, 
  Search, AlertCircle, RefreshCw, Zap, Layers, 
  HelpCircle, Lock
} from 'lucide-react';
import { 
  fetchMyCollection, fetchGradingRates, 
  fetchMyGradedSlabs, submitForGrading, verifyCertNumber,
  ApiUserCard, GradedCard, GradingRates
} from '../services/api';
import { SearchAutocomplete } from '../components/common/SearchAutocomplete';
import { useAuth } from '../context/AuthContext';
import { GradedSlab } from '../components/cards/GradedSlab';

export const GradingPage: React.FC = () => {
  const { user, token, refreshUser, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'vault' | 'verify'>('submit');

  // Rates & Data
  const [rates, setRates] = useState<GradingRates | null>(null);
  const [collection, setCollection] = useState<ApiUserCard[]>([]);
  const [mySlabs, setMySlabs] = useState<GradedCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Submission State
  const [selectedUserCard, setSelectedUserCard] = useState<ApiUserCard | null>(null);
  const [selectedTier, setSelectedTier] = useState<'standard' | 'express'>('standard');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Ceremony Reveal State
  const [revealingSlab, setRevealingSlab] = useState<GradedCard | null>(null);
  const [ceremonyStep, setCeremonyStep] = useState<number>(0); 
  // 0: Centering, 1: Corners, 2: Edges, 3: Surface, 4: Encapsulated Final!

  // Cert Verification State
  const [certQuery, setCertQuery] = useState<string>('');
  const [verifiedSlab, setVerifiedSlab] = useState<GradedCard | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [certSearching, setCertSearching] = useState<boolean>(false);

  // Detail Modal
  const [inspectSlab, setInspectSlab] = useState<GradedCard | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const ratesRes = await fetchGradingRates().catch(() => null);
      if (ratesRes) setRates(ratesRes);

      if (token) {
        const [collRes, slabsRes] = await Promise.all([
          fetchMyCollection(token),
          fetchMyGradedSlabs(token)
        ]);
        if (collRes?.items) setCollection(collRes.items);
        if (slabsRes) setMySlabs(slabsRes);
      }
    } catch (err: any) {
      console.error('Failed to load grading data:', err);
      setErrorMsg('Failed to load grading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCard = (uc: ApiUserCard) => {
    setSelectedUserCard(uc);
  };

  const getTierPrice = (tierKey: 'standard' | 'express') => {
    if (!rates?.tiers) return tierKey === 'express' ? 1500 : 500;
    const t = rates.tiers.find(r => r.id === tierKey);
    return t ? t.price_coins : (tierKey === 'express' ? 1500 : 500);
  };

  const handleSubmit = async () => {
    if (!token) {
      openAuthModal('login');
      return;
    }
    if (!selectedUserCard) return;

    const cost = getTierPrice(selectedTier);
    if ((user?.coins ?? 0) < cost) {
      setErrorMsg(`Insufficient coins! You need ${cost.toLocaleString()} coins but have ${(user?.coins ?? 0).toLocaleString()}.`);
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const slab = await submitForGrading(token, {
        user_card_id: selectedUserCard.id,
        service_tier: selectedTier
      });
      
      // Update balance & collection
      await refreshUser();
      const updatedSlabs = await fetchMyGradedSlabs(token);
      setMySlabs(updatedSlabs);

      // Start ceremony reveal
      setRevealingSlab(slab);
      setCeremonyStep(0);
      setSelectedUserCard(null);

      // Sequence the reveal steps
      setTimeout(() => setCeremonyStep(1), 800);
      setTimeout(() => setCeremonyStep(2), 1600);
      setTimeout(() => setCeremonyStep(3), 2400);
      setTimeout(() => setCeremonyStep(4), 3300);

    } catch (err: any) {
      setErrorMsg(err.message || 'Grading submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyCert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!certQuery.trim()) return;

    setCertSearching(true);
    setCertError(null);
    setVerifiedSlab(null);

    try {
      const cleanCert = certQuery.trim().toUpperCase();
      const result = await verifyCertNumber(cleanCert);
      setVerifiedSlab(result);
    } catch (err: any) {
      setCertError(err.message || 'No authentic slab found matching this Cert #.');
    } finally {
      setCertSearching(false);
    }
  };

  const filteredCollection = collection.filter(c => 
    c.card.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.card.rarity && c.card.rarity.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/60 p-8 border border-emerald-500/20 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Nexus Grading Service (NGS)
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Card Grading & Authentication
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
                Submit raw mint cards to NGS for 4-point diagnostic evaluation (Centering, Corners, Edges, Surface).
                Encapsulate cards into tamper-proof acrylic slabs and unlock up to 5x market multiplier value!
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-2xl shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                🪙
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Your Balance</div>
                <div className="text-lg font-black text-amber-400">
                  {user?.coins?.toLocaleString() ?? 0} <span className="text-xs font-normal text-slate-400">Coins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 border-t border-slate-800/80 pt-6">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'submit'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              Submission Desk
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'vault'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Slab Vault ({mySlabs.length})
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === 'verify'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              Cert Verification
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: SUBMISSION DESK */}
        {activeTab === 'submit' && (
          <div>
            {!token ? (
              <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
                <Lock className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Sign In Required</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Please log in or create an account to grade raw cards from your collection.
                </p>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20"
                >
                  Log In / Sign Up
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Card Selection */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">Select Card from Vault</h2>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                        {filteredCollection.length} Available
                      </span>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <SearchAutocomplete
                        placeholder="Search name, rarity..."
                        category="cards"
                        value={searchFilter}
                        autoNavigate={false}
                        onChange={(val) => setSearchFilter(val)}
                        onSelect={(item) => setSearchFilter(item.title)}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                      <p className="text-sm text-slate-400">Loading your collection...</p>
                    </div>
                  ) : filteredCollection.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
                      <p className="text-slate-400 text-sm">No cards match your filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredCollection.map((uc) => {
                        const isSelected = selectedUserCard?.id === uc.id;
                        return (
                          <div
                            key={uc.id}
                            onClick={() => handleSelectCard(uc)}
                            className={`group relative cursor-pointer rounded-2xl p-3 border transition-all duration-200 ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div className="aspect-[2.5/3.5] rounded-xl overflow-hidden mb-2 bg-slate-950 border border-slate-800/60 relative">
                              <img
                                src={uc.card.image_url || '/placeholder-card.png'}
                                alt={uc.card.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {uc.is_foil && (
                                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/90 text-slate-950 shadow">
                                  Holo
                                </span>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-md" />
                                </div>
                              )}
                            </div>
                            <div className="truncate text-xs font-bold text-white">{uc.card.name}</div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                              <span className="truncate">{uc.card.rarity}</span>
                              <span className="font-mono text-emerald-400 font-bold">${uc.card.market_price.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Submission Config & Review */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Service Tier & Confirmation
                    </h3>

                    {/* Selected Card Preview */}
                    {selectedUserCard ? (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
                        <img
                          src={selectedUserCard.card.image_url}
                          alt={selectedUserCard.card.name}
                          className="w-16 h-22 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                        />
                        <div className="overflow-hidden flex-1">
                          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Selected Specimen</div>
                          <div className="text-base font-black text-white truncate">{selectedUserCard.card.name}</div>
                          <div className="text-xs text-slate-400 truncate">{selectedUserCard.card.rarity}</div>
                          <div className="text-xs font-semibold text-slate-300 mt-1">
                            Est. Raw Value: <span className="text-emerald-400 font-mono font-bold">${selectedUserCard.card.market_price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-800 text-center">
                        <p className="text-sm text-slate-400">Please select a card from your vault on the left.</p>
                      </div>
                    )}

                    {/* Tier Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Choose Evaluation Tier
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setSelectedTier('standard')}
                          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                            selectedTier === 'standard'
                              ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">Standard</span>
                            <span className="text-xs text-amber-400 font-bold font-mono">{getTierPrice('standard')} 🪙</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Regular authentication & 4-point diagnostic slab.</p>
                        </div>

                        <div
                          onClick={() => setSelectedTier('express')}
                          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                            selectedTier === 'express'
                              ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Express
                            </span>
                            <span className="text-xs text-amber-400 font-bold font-mono">{getTierPrice('express')} 🪙</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Expedited queue + enhanced pristine boost chance.</p>
                        </div>
                      </div>
                    </div>

                    {/* Subgrade Guarantee Info */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                      <div className="font-bold text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Diagnostic Metrics Evaluated:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 text-slate-400">
                        <li><strong className="text-slate-300">Centering:</strong> Front & back 50/50 ratio alignment</li>
                        <li><strong className="text-slate-300">Corners:</strong> Precision cut & micro-fraying inspection</li>
                        <li><strong className="text-slate-300">Edges:</strong> Silvering & whitening defect detection</li>
                        <li><strong className="text-slate-300">Surface:</strong> Holo scratch & print line diagnostic</li>
                      </ul>
                    </div>

                    {/* Submit Action Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedUserCard || actionLoading}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
                        !selectedUserCard || actionLoading
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-500/25 active:scale-[0.98]'
                      }`}
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Encapsulating Specimen...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          Submit & Authenticate Specimen
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SLAB VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">Your NGS Graded Vault</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authenticated acrylic encapsulated specimens in your permanent collection.
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Total Slabs</span>
                  <span className="text-lg font-black text-white font-mono">{mySlabs.length}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Graded Value</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {mySlabs.reduce((acc, s) => acc + (s.graded_price || 0), 0).toLocaleString()} Coins
                  </span>
                </div>
              </div>
            </div>

            {mySlabs.length === 0 ? (
              <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  🛡️
                </div>
                <h3 className="text-lg font-bold text-white">No Graded Cards Yet</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Take raw cards from your vault and submit them for grading to receive authentic NGS acrylic slabs!
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20"
                >
                  Go to Submission Desk
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mySlabs.map((slab) => (
                  <div key={slab.id} className="flex justify-center">
                    <GradedSlab
                      slab={slab}
                      isInteractive={true}
                      onClick={() => setInspectSlab(slab)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CERT VERIFICATION */}
        {activeTab === 'verify' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white">NGS Certification Database</h2>
                <p className="text-xs text-slate-400">
                  Verify the authenticity, subgrades, and specimen details of any Nexus Grading Service slab.
                </p>
              </div>

              <form onSubmit={handleVerifyCert} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. NGS-A7B8C9"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
                />
                <button
                  type="submit"
                  disabled={certSearching || !certQuery.trim()}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                >
                  {certSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
              </form>

              {certError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {certError}
                </div>
              )}

              {verifiedSlab && (
                <div className="space-y-6 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Official Authenticated Specimen
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Graded on {new Date(verifiedSlab.graded_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <GradedSlab slab={verifiedSlab} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CEREMONY REVEAL MODAL */}
      {revealingSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden">
            {/* Ambient Background glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> NGS Diagnostic Ceremony
              </div>
              <h3 className="text-xl font-black text-white">{revealingSlab.card_name}</h3>
              <p className="text-xs text-slate-400">Optical scanner analyzing card physical characteristics...</p>
            </div>

            {/* Diagnostic Steps Progression */}
            <div className="space-y-3 text-left bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              {/* Centering */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Centering Ratio:</span>
                <span className={`font-mono font-bold transition-all ${ceremonyStep >= 0 ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                  {ceremonyStep >= 0 ? `${revealingSlab.sub_centering.toFixed(1)} / 10` : 'Scanning...'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-emerald-500 transition-all duration-500 ${ceremonyStep >= 0 ? 'w-full' : 'w-0'}`} 
                />
              </div>

              {/* Corners */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Corner Sharpness:</span>
                <span className={`font-mono font-bold transition-all ${ceremonyStep >= 1 ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                  {ceremonyStep >= 1 ? `${revealingSlab.sub_corners.toFixed(1)} / 10` : 'Evaluating...'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-emerald-500 transition-all duration-500 ${ceremonyStep >= 1 ? 'w-full' : 'w-0'}`} 
                />
              </div>

              {/* Edges */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Edge Integrity:</span>
                <span className={`font-mono font-bold transition-all ${ceremonyStep >= 2 ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                  {ceremonyStep >= 2 ? `${revealingSlab.sub_edges.toFixed(1)} / 10` : 'Measuring...'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-emerald-500 transition-all duration-500 ${ceremonyStep >= 2 ? 'w-full' : 'w-0'}`} 
                />
              </div>

              {/* Surface */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Surface Finish:</span>
                <span className={`font-mono font-bold transition-all ${ceremonyStep >= 3 ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                  {ceremonyStep >= 3 ? `${revealingSlab.sub_surface.toFixed(1)} / 10` : 'Inspecting...'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-emerald-500 transition-all duration-500 ${ceremonyStep >= 3 ? 'w-full' : 'w-0'}`} 
                />
              </div>
            </div>

            {/* Final Encapsulation Reveal */}
            {ceremonyStep >= 4 ? (
              <div className="space-y-4 animate-scale-up">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40">
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Authentication Finalized</div>
                  <div className="text-4xl font-black text-white mt-1">
                    {revealingSlab.grade.toFixed(1)} <span className="text-emerald-400 text-2xl font-bold">{revealingSlab.grade_label}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-2 font-mono">
                    Cert: {revealingSlab.cert_number} • Multiplier: <span className="text-emerald-400 font-bold">{revealingSlab.value_multiplier}x</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRevealingSlab(null);
                      setActiveTab('vault');
                    }}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25"
                  >
                    View in Slab Vault
                  </button>
                  <button
                    onClick={() => setRevealingSlab(null)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                Encapsulating into sonically welded acrylic slab...
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECT SLAB MODAL */}
      {inspectSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Slab Inspection</h3>
              <button 
                onClick={() => setInspectSlab(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center">
              <GradedSlab slab={inspectSlab} />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Specimen Name:</span>
                <span className="text-white font-bold">{inspectSlab.card_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Set:</span>
                <span className="text-white">{inspectSlab.set_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Base Raw Value:</span>
                <span className="font-mono text-slate-300">${inspectSlab.base_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Graded Value (Multiplier {inspectSlab.value_multiplier}x):</span>
                <span className="font-mono text-emerald-400 font-bold">{inspectSlab.graded_price.toLocaleString()} Coins</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Permanent Cert Number:</span>
                <span className="font-mono text-emerald-400">{inspectSlab.cert_number}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingPage;
