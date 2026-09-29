export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Rare Holo' | 'Ultra Rare' | 'Secret Rare';

export interface Card {
  id: string;
  name: string;
  setId: string;
  setName: string;
  number: string;
  rarity: CardRarity;
  element?: 'Arcane' | 'Solar' | 'Lunar' | 'Ember' | 'Verdant' | 'Void' | 'Fire' | 'Water' | 'Grass' | 'Lightning' | 'Psychic';
  hp?: number;
  types?: string[];
  imageUrl: string;
  marketPrice: number;
  ownedQuantity: number;
  artist?: string;
  flavorText?: string;
}

export interface BoosterPack {
  id: string;
  name: string;
  series: string;
  priceCoins: number;
  cardsCount: number;
  coverImage: string;
  description: string;
  featured?: boolean;
  element?: string;
  slots: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  packsOpened: number;
  totalCards: number;
  maxCards: number;
  binderCompletionRate: number;
  avatarUrl: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
}

export interface DailyMission {
  id: string;
  title: string;
  current: number;
  target: number;
  rewardCoins: number;
  rewardGems?: number;
  completed?: boolean;
  claimed?: boolean;
}

export interface MarketTrend {
  id: string;
  name: string;
  element: string;
  avatarUrl: string;
  priceCoins: number;
  change24h: number;
  sparkline: number[];
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  card: Card;
  quantity: number;
  priceCoins: number;
  createdAt: string;
  priceChange24h?: number;
}

export interface InventoryItem {
  id: string;
  type: 'card' | 'pack' | 'item';
  name: string;
  quantity: number;
  rarity?: CardRarity;
  imageUrl: string;
  valueCoins: number;
  metadata?: Record<string, any>;
}

export interface BackendHealth {
  status: 'online' | 'offline' | 'checking';
  service?: string;
  version?: string;
  database?: string;
  timestamp?: string;
}

export interface AdminTelemetry {
  total_users: number;
  banned_users: number;
  admin_users: number;
  total_coins: number;
  total_gems: number;
  total_cards_owned: number;
  total_graded_cards: number;
  total_packs_opened: number;
  active_market_listings: number;
  total_market_volume_coins: number;
  total_tournaments: number;
  xp_multiplier: number;
  system_status: string;
  server_uptime: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  avatar_url: string;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason?: string | null;
  created_at: string;
  last_login: string;
  cards_count: number;
  packs_count: number;
  decks_count: number;
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  actor_username: string;
  action: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
  created_at: string;
}

export interface AntiCheatFlag {
  id: string;
  user_id: number;
  username: string;
  flag_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  metric_value: string;
  recommended_action: string;
  timestamp: string;
}

export interface SystemAnnouncement {
  id: number;
  title: string;
  message: string;
  banner_type: 'info' | 'warning' | 'success' | 'event';
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
}
