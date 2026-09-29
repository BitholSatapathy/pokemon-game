import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  Coins,
  Gem,
  PackageOpen,
  Store,
  Layers,
  UserX,
  UserCheck,
  Gift,
  Radio,
  Zap,
  RefreshCw,
  Clock,
  Send,
  Trash2,
  X,
  Flame,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchAdminTelemetry,
  fetchAdminUsers,
  banAdminUser,
  unbanAdminUser,
  grantAdminResources,
  fetchAdminAuditLogs,
  fetchAdminAntiCheatFlags,
  fetchAdminAnnouncements,
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  setAdminXpMultiplier,
  triggerAdminAbuse,
} from '../services/api';
import { SearchAutocomplete } from '../components/common/SearchAutocomplete';
import { playFanfareSound, playCoinClinkSound, playClickSound } from '../services/sound';
import {
  AdminTelemetry,
  AdminUser,
  AuditLogItem,
  AntiCheatFlag,
  SystemAnnouncement,
} from '../types';

export const AdminPage: React.FC = () => {
  const { user, token, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'anticheat' | 'broadcast' | 'chaos'>('overview');
  const [triggeringAction, setTriggeringAction] = useState<string | null>(null);
  const [godLuckActive, setGodLuckActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Telemetry
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null);

  // Users Moderation
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [bannedOnly, setBannedOnly] = useState(false);
  const [usersTotal, setUsersTotal] = useState(0);

  // Anti-Cheat & Logs
  const [antiCheatFlags, setAntiCheatFlags] = useState<AntiCheatFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('');

  // Announcements
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMsg, setNewAnnMsg] = useState('');
  const [newAnnType, setNewAnnType] = useState<'event' | 'info' | 'warning' | 'success'>('event');

  // XP Multiplier
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1.0);
  const [isUpdatingMultiplier, setIsUpdatingMultiplier] = useState(false);

  // Grant Modal
  const [grantModalUser, setGrantModalUser] = useState<AdminUser | null>(null);
  const [grantCoins, setGrantCoins] = useState<number>(1000);
  const [grantGems, setGrantGems] = useState<number>(100);
  const [grantPackId, setGrantPackId] = useState<string>('pack_base_set');
  const [grantPackQty, setGrantPackQty] = useState<number>(2);
  const [grantCardId, setGrantCardId] = useState<string>('');
  const [grantIsFoil, setGrantIsFoil] = useState<boolean>(false);
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  // Ban Modal
  const [banModalUser, setBanModalUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('Abnormal transaction pattern flagged by system');

  // Initial Data Load
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tData, uData, flagsData, logsData, annData] = await Promise.all([
        fetchAdminTelemetry(token),
        fetchAdminUsers(token, userSearch, bannedOnly),
        fetchAdminAntiCheatFlags(token),
        fetchAdminAuditLogs(token, logSeverityFilter || undefined),
        fetchAdminAnnouncements(token),
      ]);
      setTelemetry(tData);
      setSelectedMultiplier(tData.xp_multiplier);
      setUsers(uData.users);
      setUsersTotal(uData.total);
      setAntiCheatFlags(flagsData);
      setAuditLogs(logsData);
      setAnnouncements(annData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load Admin Command Center data.', 'error', 'Admin Access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.isAdmin) {
      loadData();
    }
  }, [token, user?.isAdmin]);

  // Handle User Search/Filter changes
  const handleUserFilter = async (searchVal: string, bannedVal: boolean) => {
    if (!token) return;
    try {
      const res = await fetchAdminUsers(token, searchVal, bannedVal);
      setUsers(res.users);
      setUsersTotal(res.total);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Ban User
  const handleBan = async () => {
    if (!token || !banModalUser) return;
    try {
      await banAdminUser(banModalUser.id, banReason, token);
      showToast(`User ${banModalUser.username} has been suspended.`, 'error', 'Account Suspended');
      setBanModalUser(null);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Unban User
  const handleUnban = async (targetUser: AdminUser) => {
    if (!token) return;
    try {
      await unbanAdminUser(targetUser.id, token);
      showToast(`User ${targetUser.username} reinstated.`, 'success', 'Account Restored');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Grant Resources
  const handleGrant = async () => {
    if (!token || !grantModalUser) return;
    setIsSubmittingGrant(true);
    try {
      const res = await grantAdminResources(
        grantModalUser.id,
        {
          coins: grantCoins > 0 ? grantCoins : undefined,
          gems: grantGems > 0 ? grantGems : undefined,
          pack_id: grantPackQty > 0 && grantPackId ? grantPackId : undefined,
          pack_quantity: grantPackQty > 0 ? grantPackQty : undefined,
          card_id: grantCardId.trim() ? grantCardId.trim() : undefined,
          is_foil: grantIsFoil,
        },
        token
      );
      showToast(res.message, 'success', 'Item Spawner Complete');
      setGrantModalUser(null);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  // Handle XP Multiplier
  const handleMultiplierChange = async (mult: number) => {
    if (!token) return;
    setIsUpdatingMultiplier(true);
    try {
      const res = await setAdminXpMultiplier(mult, token);
      setSelectedMultiplier(res.multiplier);
      showToast(res.message, 'gold', 'Global Event Updated');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdatingMultiplier(false);
    }
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAnnTitle.trim() || !newAnnMsg.trim()) return;
    try {
      await createAdminAnnouncement(
        {
          title: newAnnTitle,
          message: newAnnMsg,
          banner_type: newAnnType,
          is_active: true,
        },
        token
      );
      showToast('Global broadcast published to all player viewports!', 'success', 'Broadcast Live');
      setNewAnnTitle('');
      setNewAnnMsg('');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (id: number) => {
    if (!token) return;
    try {
      await deleteAdminAnnouncement(id, token);
      showToast('Announcement removed.', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Admin Abuse & Chaos Events
  const handleTriggerAbuse = async (
    action: 'coin-rain' | 'gem-eruption' | 'godmode-self' | 'shiny-surge' | 'force-shop-reroll' | 'mass-pack-drop',
    actionTitle: string
  ) => {
    if (!token) return;
    setTriggeringAction(action);
    try {
      const res = await triggerAdminAbuse(action, token);
      if (action === 'coin-rain' || action === 'gem-eruption') {
        playCoinClinkSound();
      } else if (action === 'godmode-self') {
        playFanfareSound();
      } else {
        playClickSound();
      }

      if (action === 'shiny-surge') {
        setGodLuckActive(res.status === 'ENABLED');
      }

      showToast(res.message, 'gold', `⚡ Admin Command: ${actionTitle}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to execute ${actionTitle}`, 'error', 'Command Failed');
    } finally {
      setTriggeringAction(null);
    }
  };

  // Access Denied Screen
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-400 shadow-glow-red">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wide">
            Restricted Game Master Terminal
          </h2>
          <p className="text-sm text-slate-400">
            Access to this command center requires Game Master Level 4 administrative credentials. Your current account ({user?.username || 'Guest'}) does not have permission.
          </p>
        </div>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-sm shadow-lg hover:from-red-500 hover:to-rose-600 transition-all"
        >
          Sign In as Administrator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top GM Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-purple-500/30 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                GAME MASTER LEVEL 4
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {telemetry?.system_status || 'LIVE'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
              <span>COMMAND CENTER</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Real-time platform telemetry, anti-cheat diagnostics, item spawning, and live server operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
          </div>
        </div>

        {/* Global Tabs */}
        <div className="flex items-center gap-2 mt-8 border-b border-slate-800/80 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Telemetry & Economy', icon: <Activity className="w-4 h-4" /> },
            { id: 'moderation', label: `Trainers (${usersTotal})`, icon: <Users className="w-4 h-4" /> },
            { id: 'anticheat', label: `Anti-Cheat & Security (${antiCheatFlags.length})`, icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
            { id: 'broadcast', label: 'Broadcasts & Live Ops', icon: <Radio className="w-4 h-4 text-cyan-400" /> },
            { id: 'chaos', label: '⚡ God Mode & Chaos Events', icon: <Flame className="w-4 h-4 text-amber-400 animate-pulse" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple border border-purple-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Players</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{telemetry?.total_users ?? 0}</div>
              <div className="text-[10px] text-slate-500">{telemetry?.banned_users ?? 0} suspended</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Coins Circulating</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">
                {telemetry ? (telemetry.total_coins / 1000).toFixed(1) + 'k' : '0'}
              </div>
              <div className="text-[10px] text-slate-500">Economy healthy</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Vault Gems</span>
                <Gem className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-black text-pink-300">
                {telemetry?.total_gems?.toLocaleString() ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">Reserve backing</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Cards Held</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {telemetry?.total_cards_owned?.toLocaleString() ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">{telemetry?.total_graded_cards ?? 0} NGS slabs</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Packs Opened</span>
                <PackageOpen className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300">
                {telemetry?.total_packs_opened?.toLocaleString() ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">All 4 Vintage sets</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-dark border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Market Escrow</span>
                <Store className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-300">
                {telemetry?.active_market_listings ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">{telemetry?.total_market_volume_coins?.toLocaleString()} Coins vol</div>
            </div>
          </div>

          {/* Live GM Event Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global XP Booster Modifier */}
            <div className="p-6 rounded-3xl bg-surface-dark border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Global XP Multiplier</h3>
                    <p className="text-xs text-slate-400">Boosts all Gym Battles, PvP matches, and Tournaments</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                  {selectedMultiplier}x ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {[1.0, 1.5, 2.0, 3.0].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => handleMultiplierChange(mult)}
                    disabled={isUpdatingMultiplier}
                    className={`py-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                      selectedMultiplier === mult
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-glow-amber'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mult === 1.0 ? '1.0x (Standard)' : mult === 2.0 ? '2.0x (Double XP)' : `${mult}x Event`}
                  </button>
                ))}
              </div>
            </div>

            {/* Server Health & Diagnostics */}
            <div className="p-6 rounded-3xl bg-surface-dark border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">System Health & Uptime</h3>
                    <p className="text-xs text-slate-400">Continuous telemetry feed</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {telemetry?.server_uptime}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-mono text-white">SQLite 3 (Synchronous Full)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Active Tournaments</span>
                  <span className="font-mono text-white">{telemetry?.total_tournaments ?? 0} Knockout Brackets</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Economy Inflation Index</span>
                  <span className="font-mono text-emerald-400">0.02% (Target Stable)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODERATION & USERS */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-dark border border-slate-800">
            <div className="relative w-full sm:w-80">
              <SearchAutocomplete
                placeholder="Search username or email..."
                category="users"
                value={userSearch}
                autoNavigate={false}
                onChange={(val) => {
                  setUserSearch(val);
                  handleUserFilter(val, bannedOnly);
                }}
                onSelect={(item) => {
                  setUserSearch(item.title);
                  handleUserFilter(item.title, bannedOnly);
                }}
                className="w-full text-xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const newVal = !bannedOnly;
                  setBannedOnly(newVal);
                  handleUserFilter(userSearch, newVal);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  bannedOnly
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {bannedOnly ? 'Showing Suspended Only' : 'Show Suspended Only'}
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-surface-dark">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Level / XP</th>
                  <th className="py-3 px-4">Vault (Coins / Gems)</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url}
                          alt={u.username}
                          className="w-9 h-9 rounded-xl object-cover border border-purple-500/30"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.username}</span>
                            {u.is_admin && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-purple-300 font-bold">Lvl {u.level}</span>
                      <div className="text-[10px] text-slate-500">{u.xp} XP</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-300 font-bold">{u.coins.toLocaleString()} C</span>
                        <span className="font-mono text-pink-300 font-bold">{u.gems} G</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span>{u.cards_count} cards</span> • <span>{u.packs_count} packs</span>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_banned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setGrantModalUser(u)}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all"
                          title="Grant Currency, Packs, or Cards"
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-all"
                            title="Reinstate Account"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanModalUser(u)}
                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 transition-all"
                            title="Suspend Account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-CHEAT & SECURITY TRAIL */}
      {activeTab === 'anticheat' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Automated Heuristic Flag Monitor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Automated Integrity & Anomaly Scanner
              </h3>
              <span className="text-xs font-mono text-slate-400">Heuristic Engine Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {antiCheatFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    flag.severity === 'CRITICAL'
                      ? 'bg-red-950/30 border-red-500/40 shadow-glow-red'
                      : flag.severity === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-surface-dark border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                        flag.severity === 'CRITICAL'
                          ? 'bg-red-500 text-white animate-pulse'
                          : flag.severity === 'WARNING'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{flag.flag_type}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{flag.description}</h4>
                    <p className="text-xs text-slate-400 mt-1">Metric: {flag.metric_value}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-slate-400 font-bold block mb-0.5">Recommended Action:</span>
                    {flag.recommended_action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Security Audit Trail (Last 50 Events)
              </h3>

              <div className="flex items-center gap-2">
                {['', 'INFO', 'WARNING', 'CRITICAL'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => {
                      setLogSeverityFilter(sev);
                      if (token) fetchAdminAuditLogs(token, sev || undefined).then(setAuditLogs);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      logSeverityFilter === sev
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sev || 'ALL'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-surface-dark divide-y divide-slate-800/60 overflow-hidden">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No audit events recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            log.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : log.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {log.severity}
                        </span>
                        <span className="font-bold text-xs text-white">{log.action}</span>
                        <span className="text-[11px] text-slate-500">by {log.actor_username}</span>
                      </div>
                      <p className="text-xs text-slate-300">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCASTS & LIVE OPS */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Broadcast Creator Form */}
          <div className="p-6 rounded-3xl bg-surface-dark border border-slate-800 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Publish Server Broadcast Banner
              </h3>
              <p className="text-xs text-slate-400">
                Pushes instant banners to all logged-in and guest client viewports across the platform.
              </p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Banner Headline</label>
                <input
                  type="text"
                  placeholder="e.g. 🏆 Double XP Weekend Active!"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Message Body</label>
                <textarea
                  placeholder="Detailed notification text for the banner..."
                  value={newAnnMsg}
                  onChange={(e) => setNewAnnMsg(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Banner Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['event', 'info', 'warning', 'success'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewAnnType(type)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase font-mono transition-all border ${
                        newAnnType === type
                          ? 'bg-slate-800 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-cyan transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Transmit Global Broadcast
              </button>
            </form>
          </div>

          {/* Active Announcements List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Active Broadcast Banners ({announcements.length})
            </h3>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-500 bg-surface-dark">
                  No active broadcasts. Use the form to send an alert.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl bg-surface-dark border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold bg-slate-800 text-cyan-300">
                          {ann.banner_type}
                        </span>
                        <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{ann.message}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex-shrink-0"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOD MODE & ADMIN ABUSE ENGINE */}
      {activeTab === 'chaos' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Chaos Engine Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/50 via-purple-950/60 to-indigo-950/50 border border-purple-500/40 p-6 sm:p-8 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    ADMIN ABUSE ENGINE
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 border ${
                    godLuckActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {godLuckActive ? '100% SHINY SUPERNOVA ACTIVE' : 'LUCK RNG STANDARD'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight flex items-center gap-2.5">
                  <span>OMNIPOTENT GAME MASTER VAULT</span>
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Execute server-wide economic events, inject infinite riches, manipulate RNG booster pull algorithms, or force instantaneous shop rerolls for all trainers on the server.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Server State
                </button>
              </div>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Action 1: Coin Rain */}
            <div className="rounded-3xl bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-amber-400/50 transition-all shadow-lg hover:shadow-glow-amber">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
                    <Coins className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                    +25,000 COINS / ALL
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    🌧️ Global Coin Rain
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Triggers a torrential golden shower across the server. Instantly credits <span className="text-amber-300 font-bold">+25,000 Coins</span> into every registered player's account.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('coin-rain', 'Global Coin Rain (+25k to All)')}
                disabled={triggeringAction === 'coin-rain'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'coin-rain' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                <span>Trigger Coin Rain</span>
              </button>
            </div>

            {/* Action 2: Gem Volcano */}
            <div className="rounded-3xl bg-gradient-to-b from-pink-950/30 via-slate-900 to-slate-900 border border-pink-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-pink-400/50 transition-all shadow-lg hover:shadow-glow-pink">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 shadow-inner">
                    <Gem className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[10px] font-mono font-bold">
                    +250 GEMS / ALL
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    💎 Gem Volcano Eruption
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Detonates the mythical crystalline volcano. Grants <span className="text-pink-300 font-bold">+250 Rare Gems</span> to every player in the server database immediately.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('gem-eruption', 'Gem Volcano Eruption (+250 Gems to All)')}
                disabled={triggeringAction === 'gem-eruption'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'gem-eruption' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Gem className="w-4 h-4" />
                )}
                <span>Erupt Gem Volcano</span>
              </button>
            </div>

            {/* Action 3: Ascended Godmode Self */}
            <div className="rounded-3xl bg-gradient-to-b from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/40 p-6 flex flex-col justify-between space-y-5 hover:border-purple-400 transition-all shadow-xl hover:shadow-glow-purple">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/50 flex items-center justify-center text-white shadow-glow-purple">
                    <Crown className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-mono font-bold">
                    SELF ASCENSION
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    👑 Ascended Godmode
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Ascend your personal administrator trainer to maximum power: grants <span className="text-amber-300 font-bold">+1,000,000 Coins</span>, <span className="text-pink-300 font-bold">+50,000 Gems</span>, and promotes you directly to <span className="text-purple-300 font-bold">Level 100</span>!
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('godmode-self', 'Godmode Self-Ascension (+1M C, +50k G, Lvl 100)')}
                disabled={triggeringAction === 'godmode-self'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-glow-purple active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'godmode-self' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                <span>Ascend to Godmode (Self)</span>
              </button>
            </div>

            {/* Action 4: Cosmic Shiny Supernova */}
            <div className="rounded-3xl bg-gradient-to-b from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-cyan-400/50 transition-all shadow-lg hover:shadow-glow-cyan">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                    100% HOLO BOOST
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    🌟 Cosmic Shiny Supernova
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Rewrites booster card drop probabilities. While active, every booster pack opened on the platform is guaranteed to deliver an <span className="text-cyan-300 font-bold">Ultra Rare / Secret Rare Holo foil</span> in Slot 10.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('shiny-surge', 'Cosmic Shiny Supernova Toggle')}
                disabled={triggeringAction === 'shiny-surge'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'shiny-surge' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Toggle 100% Holo Supernova</span>
              </button>
            </div>

            {/* Action 5: Force Shop Reroll */}
            <div className="rounded-3xl bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-emerald-400/50 transition-all shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                    SHOP REFRESH
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    🔄 Temporal Shop Fracture
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Shatters the current 4-hour timeline. Forces an instantaneous reroll of the <span className="text-emerald-300 font-bold">Mystery Black Market</span> for all players right now with fresh stock and new discounts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('force-shop-reroll', 'Instant 4-Hour Black Market Reroll')}
                disabled={triggeringAction === 'force-shop-reroll'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'force-shop-reroll' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Force Shop Reroll Now</span>
              </button>
            </div>

            {/* Action 6: Mass Booster Air Drop */}
            <div className="rounded-3xl bg-gradient-to-b from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-indigo-400/50 transition-all shadow-lg hover:shadow-glow-purple">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
                    <Gift className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold">
                    3x PACKS / USER
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display tracking-wide">
                    🎁 Celestial Apex Air Drop
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Deploys a server-wide cargo drop. Airdrops <span className="text-indigo-300 font-bold">3x Celestial Horizons Apex Booster Packs</span> directly into the inventory of all registered trainers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTriggerAbuse('mass-pack-drop', 'Celestial Apex Booster Air Drop (3x Packs to All)')}
                disabled={triggeringAction === 'mass-pack-drop'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-400 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {triggeringAction === 'mass-pack-drop' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                <span>Launch Mass Pack Air Drop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRANT RESOURCES MODAL */}
      {grantModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-dark border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  Item Spawner: {grantModalUser.username}
                </h3>
              </div>
              <button
                onClick={() => setGrantModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-slate-400 uppercase">Coins</label>
                  <input
                    type="number"
                    value={grantCoins}
                    onChange={(e) => setGrantCoins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-slate-400 uppercase">Gems</label>
                  <input
                    type="number"
                    value={grantGems}
                    onChange={(e) => setGrantGems(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-slate-400 uppercase">Booster Pack & Qty</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={grantPackId}
                    onChange={(e) => setGrantPackId(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="pack_base_set">Base Set Booster</option>
                    <option value="pack_jungle">Jungle Booster</option>
                    <option value="pack_fossil">Fossil Booster</option>
                    <option value="pack_team_rocket">Team Rocket Pack</option>
                  </select>
                  <input
                    type="number"
                    value={grantPackQty}
                    onChange={(e) => setGrantPackQty(Number(e.target.value))}
                    min={0}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-slate-400 uppercase">Specific Pokémon Card (Optional ID)</label>
                <input
                  type="text"
                  placeholder="e.g. base1-4 (Charizard), base1-15 (Venusaur)"
                  value={grantCardId}
                  onChange={(e) => setGrantCardId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={grantIsFoil}
                    onChange={(e) => setGrantIsFoil(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-600"
                  />
                  <span>Holographic 1st Edition Foil</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGrant}
              disabled={isSubmittingGrant}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-glow-purple transition-all"
            >
              {isSubmittingGrant ? 'Transferring...' : 'Execute Spawner Transfer'}
            </button>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-dark border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <UserX className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white font-display">
                  Suspend {banModalUser.username}
                </h3>
              </div>
              <button
                onClick={() => setBanModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Suspended users are immediately revoked of login tokens, marketplace escrow, and tournament eligibility.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-mono text-slate-400 uppercase">Reason for Suspension</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setBanModalUser(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
