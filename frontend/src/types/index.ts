export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Secret Rare';

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
