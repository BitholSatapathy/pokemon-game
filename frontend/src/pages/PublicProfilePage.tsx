import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Coins,
  Layers,
  ArrowLeftRight,
  UserCheck,
  UserPlus,
  Sparkles,
  Calendar,
  Award,
  ChevronLeft,
  Users,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPublicProfile,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  fetchUserEquippedCosmetics,
  PublicProfile,
  SocialUserBasic,
  EquippedCosmetics,
} from '../services/api';

export const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { token, user: authUser, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [socialModal, setSocialModal] = useState<'followers' | 'following' | null>(null);
  const [socialList, setSocialList] = useState<SocialUserBasic[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);

  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics | null>(null);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [data, eqData] = await Promise.all([
        fetchPublicProfile(username, token || undefined),
        fetchUserEquippedCosmetics(username).catch(() => null),
      ]);
      setProfile(data);
      if (eqData) setEquippedCosmetics(eqData);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    if (!token) {
      openAuthModal();
      return;
    }
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await unfollowUser(token, profile.id);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: false,
                followers_count: Math.max(0, prev.followers_count - 1),
              }
            : null
        );
      } else {
        await followUser(token, profile.id);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: true,
                followers_count: prev.followers_count + 1,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const openSocialList = async (type: 'followers' | 'following') => {
    if (!profile) return;
    setSocialModal(type);
    setListLoading(true);
    try {
      const users =
        type === 'followers'
          ? await fetchFollowers(profile.id)
          : await fetchFollowing(profile.id);
      setSocialList(users);
    } catch (err) {
      console.error('Failed to load social list:', err);
    } finally {
      setListLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Loading player profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          🔍
        </div>
        <h2 className="text-2xl font-bold text-white">Player Not Found</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Could not find player <span className="text-purple-400 font-mono">@{username}</span> in the Nexus database.
        </p>
        <Link
          to="/leaderboard"
          className="mt-2 px-5 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>
      </div>
    );
  }

  const isMe = String(authUser?.id) === String(profile.id);
  const memberDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar with Level Ring */}
          <div className="relative group">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-black/60 transition-all duration-300 ${equippedCosmetics?.avatar_frame?.asset_data || 'border-2 border-purple-400/80 shadow-glow-purple'}`}>
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border border-purple-300 shadow-lg uppercase font-mono tracking-wider">
              Lvl {profile.level}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display">
                    {profile.username}
                  </h1>
                  {isMe && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                      YOU
                    </span>
                  )}
                </div>
                {equippedCosmetics?.title && (
                  <div className={`text-xs font-mono uppercase tracking-widest mt-1 ${equippedCosmetics.title.asset_data || 'text-purple-300'}`}>
                    {equippedCosmetics.title.name}
                  </div>
                )}
                <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-gray-400 font-mono mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Joined {memberDate}
                  </span>
                  <span>•</span>
                  <span className="text-purple-300 font-bold">{profile.xp.toLocaleString()} XP</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                {!isMe && (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                        profile.is_following
                          ? 'bg-white/10 hover:bg-red-500/20 text-gray-200 hover:text-red-400 border border-white/20 hover:border-red-500/40'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple border border-purple-400/50'
                      }`}
                    >
                      {profile.is_following ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-400" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Follow Player
                        </>
                      )}
                    </button>

                    <Link
                      to="/trading"
                      className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-cyan-400" /> Trade
                    </Link>

                    <Link
                      to={`/shop/${profile.username}`}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Store className="w-4 h-4 text-amber-400" /> Visit Stall
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Social Counts Bar */}
            <div className="flex items-center justify-center md:justify-start gap-6 pt-2 border-t border-white/10">
              <button
                onClick={() => openSocialList('followers')}
                className="text-left group hover:opacity-80 transition-opacity"
              >
                <div className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                  {profile.followers_count}
                </div>
                <div className="text-[11px] text-gray-400 font-mono uppercase">Followers</div>
              </button>

              <div className="w-px h-8 bg-white/10" />

              <button
                onClick={() => openSocialList('following')}
                className="text-left group hover:opacity-80 transition-opacity"
              >
                <div className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                  {profile.following_count}
                </div>
                <div className="text-[11px] text-gray-400 font-mono uppercase">Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quad Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{profile.coins.toLocaleString()}</div>
            <div className="text-[11px] text-gray-400 font-mono uppercase">Vault Coins</div>
          </div>
        </div>

        <div className="bg-surface/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{profile.unique_cards}</div>
            <div className="text-[11px] text-gray-400 font-mono uppercase">Unique Cards</div>
          </div>
        </div>

        <div className="bg-surface/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{profile.completed_trades}</div>
            <div className="text-[11px] text-gray-400 font-mono uppercase">Trades Done</div>
          </div>
        </div>

        <div className="bg-surface/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{profile.total_cards}</div>
            <div className="text-[11px] text-gray-400 font-mono uppercase">Total Cards</div>
          </div>
        </div>
      </div>

      {/* Showcase Vault (Top 6 Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-display">
              Showcase Vault (Top Cards)
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {profile.top_cards.length} Featured
          </span>
        </div>

        {profile.top_cards.length === 0 ? (
          <div className="bg-surface/40 border border-white/5 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No cards in showcase vault yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {profile.top_cards.map((card) => (
              <div
                key={card.id}
                className={`relative rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 ${
                  card.is_foil
                    ? 'bg-gradient-to-b from-purple-950/60 to-surface-card border-purple-500/50 shadow-glow-purple'
                    : 'bg-surface/60 border-white/10 hover:border-white/20'
                }`}
              >
                {card.is_foil && (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-full shadow-lg">
                    Foil ✨
                  </span>
                )}
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-600 font-mono text-xs">No Image</div>
                  )}
                </div>
                <div className="text-center w-full">
                  <div className="text-xs font-bold text-white truncate">{card.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">
                    {card.rarity} {card.quantity > 1 ? `(x${card.quantity})` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social List Modal (Followers / Following) */}
      {socialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                {socialModal === 'followers' ? 'Followers' : 'Following'} ({socialList.length})
              </h3>
              <button
                onClick={() => setSocialModal(null)}
                className="text-gray-400 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {listLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : socialList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No users to display.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5 space-y-1">
                {socialList.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2.5 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                          alt={u.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          to={`/player/${u.username}`}
                          onClick={() => setSocialModal(null)}
                          className="font-bold text-white hover:text-purple-300 text-sm transition-colors"
                        >
                          {u.username}
                        </Link>
                        <div className="text-[10px] text-gray-400 font-mono">Level {u.level}</div>
                      </div>
                    </div>

                    <Link
                      to={`/player/${u.username}`}
                      onClick={() => setSocialModal(null)}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 font-mono"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default PublicProfilePage;
