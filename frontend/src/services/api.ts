import { Card, BoosterPack } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export interface ApiCard {
  id: string;
  name: string;
  set_id: string;
  number: string;
  rarity: string;
  types?: string;
  hp?: number;
  image_url: string;
  market_price: number;
  flavor_text?: string;
  artist?: string;
}

export interface ApiSet {
  id: string;
  name: string;
  series_id: string;
  total_cards: number;
  logo_url?: string;
  symbol_url?: string;
  release_date?: string;
}

export interface ApiPack {
  id: string;
  name: string;
  set_id: string;
  price_coins: number;
  cards_per_pack: number;
  cover_image: string;
  description?: string;
  is_featured: boolean;
}

export interface ApiPlayerPack {
  id: number;
  pack_id: string;
  quantity: number;
  obtained_at: string;
  pack: ApiPack;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  pack: ApiPack;
  remaining_coins: number;
  pack_quantity: number;
}

export const fetchSets = async (): Promise<ApiSet[]> => {
  try {
    const res = await fetch(`${API_BASE}/sets`);
    if (!res.ok) throw new Error('Failed to fetch sets');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching sets:', err);
    return [];
  }
};

export const fetchCards = async (params: {
  set_id?: string;
  rarity?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<{ total: number; items: Card[] }> => {
  try {
    const query = new URLSearchParams();
    if (params.set_id) query.append('set_id', params.set_id);
    if (params.rarity && params.rarity !== 'All') query.append('rarity', params.rarity);
    if (params.search) query.append('search', params.search);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/cards?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch cards');
    const data = await res.json();

    const items: Card[] = data.items.map((c: ApiCard) => ({
      id: c.id,
      name: c.name,
      setId: c.set_id,
      setName: c.set_id === 'base1' ? 'Base Set' : c.set_id,
      number: c.number,
      rarity: c.rarity as any,
      hp: c.hp,
      types: c.types ? c.types.split(', ') : [],
      imageUrl: c.image_url,
      marketPrice: c.market_price,
      ownedQuantity: c.name === 'Charizard' ? 1 : c.name === 'Pikachu' ? 3 : c.name === 'Blastoise' ? 1 : 0,
      artist: c.artist,
      flavorText: c.flavor_text,
    }));

    return { total: data.total, items };
  } catch (err) {
    console.warn('API error fetching cards:', err);
    return { total: 0, items: [] };
  }
};

export const fetchCardById = async (cardId: string): Promise<Card | null> => {
  try {
    const res = await fetch(`${API_BASE}/cards/${cardId}`);
    if (!res.ok) throw new Error('Failed to fetch card details');
    const c: ApiCard = await res.json();
    return {
      id: c.id,
      name: c.name,
      setId: c.set_id,
      setName: c.set_id === 'base1' ? 'Base Set' : c.set_id,
      number: c.number,
      rarity: c.rarity as any,
      hp: c.hp,
      types: c.types ? c.types.split(', ') : [],
      imageUrl: c.image_url,
      marketPrice: c.market_price,
      ownedQuantity: 1,
      artist: c.artist,
      flavorText: c.flavor_text,
    };
  } catch (err) {
    console.warn('API error fetching card:', err);
    return null;
  }
};

// Booster Packs API
export const fetchShopPacks = async (): Promise<BoosterPack[]> => {
  try {
    const res = await fetch(`${API_BASE}/packs`);
    if (!res.ok) throw new Error('Failed to fetch shop packs');
    const data: ApiPack[] = await res.json();
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      series: 'Base Expansion',
      priceCoins: p.price_coins,
      cardsCount: p.cards_per_pack,
      coverImage: p.cover_image,
      description: p.description || 'Authentic booster pack.',
      featured: p.is_featured,
      slots: ['common', 'common', 'common', 'uncommon', 'uncommon', 'uncommon', 'reverse', 'reverse', 'rare', 'special'],
    }));
  } catch (err) {
    console.warn('API error fetching packs:', err);
    return [];
  }
};

export const purchaseBoosterPack = async (packId: string, token: string): Promise<PurchaseResult> => {
  const res = await fetch(`${API_BASE}/packs/${packId}/purchase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to purchase booster pack.');
  }
  return data;
};

export const fetchPlayerPacks = async (token: string): Promise<ApiPlayerPack[]> => {
  try {
    const res = await fetch(`${API_BASE}/packs/inventory/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch player packs');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching player packs:', err);
    return [];
  }
};

export interface ApiPulledCard {
  id: string;
  name: string;
  set_id: string;
  number: string;
  rarity: string;
  types?: string;
  hp?: number;
  image_url: string;
  market_price: number;
  flavor_text?: string;
  artist?: string;
  is_foil: boolean;
  is_new: boolean;
  total_owned: number;
}

export interface PackOpenResult {
  success: boolean;
  message: string;
  pack_id: string;
  pack_name: string;
  cards: ApiPulledCard[];
  remaining_packs: number;
  xp_earned: number;
  player_stats: {
    coins: number;
    gems: number;
    level: number;
    xp: number;
  };
}

export const openBoosterPack = async (packId: string, token: string): Promise<PackOpenResult> => {
  const res = await fetch(`${API_BASE}/packs/${packId}/open`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to open booster pack.');
  }
  return data;
};

export interface ApiUserCard {
  id: number;
  card_id: string;
  quantity: number;
  is_foil: boolean;
  obtained_at: string;
  card: ApiCard;
}

export interface RarityStat {
  owned: number;
  total: number;
  percentage: number;
}

export interface ApiUserCollection {
  total_cards: number;
  unique_cards: number;
  total_set_cards: number;
  completion_percentage: number;
  total_market_value?: number;
  rarity_breakdown?: Record<string, RarityStat>;
  items: ApiUserCard[];
}


export const fetchMyCollection = async (token: string): Promise<ApiUserCollection | null> => {
  try {
    const res = await fetch(`${API_BASE}/cards/collection/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user collection');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching collection:', err);
    return null;
  }
};

export interface CardSellResult {
  success: boolean;
  message: string;
  card_id: string;
  card_name: string;
  quantity_sold: number;
  coins_earned: number;
  new_coin_balance: number;
  remaining_card_quantity: number;
}

export interface BulkSellResult {
  success: boolean;
  message: string;
  cards_sold: number;
  total_coins_earned: number;
  new_coin_balance: number;
}

export interface ApiTransaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  currency: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export const sellCard = async (
  cardId: string,
  quantity: number = 1,
  isFoil: boolean = false,
  token: string
): Promise<CardSellResult> => {
  const res = await fetch(`${API_BASE}/cards/${cardId}/sell`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ quantity, is_foil: isFoil }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to sell card.');
  }
  return data;
};

export const bulkSellDuplicates = async (token: string): Promise<BulkSellResult> => {
  const res = await fetch(`${API_BASE}/cards/sell-duplicates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to liquidate duplicate cards.');
  }
  return data;
};

export const fetchMyTransactions = async (token: string): Promise<ApiTransaction[]> => {
  try {
    const res = await fetch(`${API_BASE}/packs/transactions/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching transactions:', err);
    return [];
  }
};

export interface ApiUserMission {
  id: string;
  mission_id: string;
  category: 'daily' | 'weekly' | 'achievement';
  title: string;
  description: string;
  target: number;
  progress: number;
  percent: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_xp: number;
  reward_coins: number;
  reward_gems: number;
  icon: string;
}

export interface ApiMissionsSummary {
  daily: ApiUserMission[];
  weekly: ApiUserMission[];
  achievements: ApiUserMission[];
  daily_reset_seconds: number;
  weekly_reset_seconds: number;
  claimable_count: number;
}

export interface ApiMissionClaimResult {
  success: boolean;
  message: string;
  mission_id: string;
  reward_xp: number;
  reward_coins: number;
  reward_gems: number;
  new_coins: number;
  new_gems: number;
  new_level: number;
  new_xp: number;
  leveled_up: boolean;
  level_up_bonuses?: {
    old_level: number;
    new_level: number;
    bonus_coins: number;
    bonus_gems: number;
    new_rank: string;
  };
}

export interface ApiPlayerProgression {
  level: number;
  title: string;
  xp: number;
  next_level_xp: number;
  xp_percentage: number;
  coins: number;
  gems: number;
  total_packs_opened: number;
  total_cards_collected: number;
}

export const fetchMyMissions = async (token: string): Promise<ApiMissionsSummary | null> => {
  try {
    const res = await fetch(`${API_BASE}/missions/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch missions');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching missions:', err);
    return null;
  }
};

export const claimMissionReward = async (
  missionId: string,
  token: string
): Promise<ApiMissionClaimResult> => {
  const res = await fetch(`${API_BASE}/missions/${missionId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to claim mission reward.');
  }
  return data;
};

export const fetchMyProgression = async (token: string): Promise<ApiPlayerProgression | null> => {
  try {
    const res = await fetch(`${API_BASE}/missions/progression/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch player progression');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching progression:', err);
    return null;
  }
};

export interface ApiMarketListing {
  id: number;
  seller_id: number;
  seller_name: string;
  card_id: string;
  is_foil: boolean;
  quantity: number;
  price_coins: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  buyer_id?: number | null;
  buyer_name?: string | null;
  created_at: string;
  sold_at?: string | null;
  card: ApiCard;
}

export interface ApiMarketplaceListings {
  items: ApiMarketListing[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiMarketplaceStats {
  active_listings_count: number;
  total_volume_24h: number;
  top_traded_card?: string | null;
  fee_percentage: number;
}

export interface CreateListingPayload {
  card_id: string;
  price_coins: number;
  is_foil?: boolean;
  quantity?: number;
}

export interface BuyListingResult {
  success: boolean;
  message: string;
  listing_id: number;
  card_name: string;
  price_coins: number;
  new_coin_balance: number;
}

export interface CancelListingResult {
  success: boolean;
  message: string;
  listing_id: number;
  card_name: string;
}

export const fetchMarketListings = async (params: {
  search?: string;
  rarity?: string;
  set_id?: string;
  is_foil?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}): Promise<ApiMarketplaceListings> => {
  try {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.rarity) q.append('rarity', params.rarity);
    if (params.set_id) q.append('set_id', params.set_id);
    if (params.is_foil !== undefined) q.append('is_foil', String(params.is_foil));
    if (params.min_price !== undefined) q.append('min_price', String(params.min_price));
    if (params.max_price !== undefined) q.append('max_price', String(params.max_price));
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/market/listings?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch market listings');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching market listings:', err);
    return { items: [], total: 0, page: 1, limit: 20 };
  }
};

export const fetchMyMarketListings = async (token: string): Promise<ApiMarketListing[]> => {
  try {
    const res = await fetch(`${API_BASE}/market/my-listings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user listings');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching my listings:', err);
    return [];
  }
};

export const createMarketListing = async (
  payload: CreateListingPayload,
  token: string
): Promise<ApiMarketListing> => {
  const res = await fetch(`${API_BASE}/market/listings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to list card for sale.');
  }
  return data;
};

export const buyMarketListing = async (
  listingId: number,
  token: string
): Promise<BuyListingResult> => {
  const res = await fetch(`${API_BASE}/market/listings/${listingId}/buy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to purchase listing.');
  }
  return data;
};

export const cancelMarketListing = async (
  listingId: number,
  token: string
): Promise<CancelListingResult> => {
  const res = await fetch(`${API_BASE}/market/listings/${listingId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to cancel listing.');
  }
  return data;
};

export const fetchMarketStats = async (): Promise<ApiMarketplaceStats | null> => {
  try {
    const res = await fetch(`${API_BASE}/market/stats`);
    if (!res.ok) throw new Error('Failed to fetch market stats');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching market stats:', err);
    return null;
  }
};


// ==========================================
// PHASE 11: EVENTS & DAILY SYSTEMS
// ==========================================

export interface ApiDailyStreakRewardItem {
  day: number;
  title: string;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
  pack_id?: string | null;
  pack_name?: string | null;
  is_claimed: boolean;
  is_today: boolean;
  is_locked: boolean;
}

export interface ApiDailyStreakStatus {
  current_streak: number;
  longest_streak: number;
  total_claims: number;
  can_claim_today: boolean;
  last_claim_date?: string | null;
  seconds_to_reset: number;
  calendar: ApiDailyStreakRewardItem[];
}

export interface ApiClaimStreakResult {
  success: boolean;
  message: string;
  day_claimed: number;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
  pack_awarded?: string | null;
  new_coin_balance: number;
  new_gem_balance: number;
  new_level: number;
  new_xp: number;
  new_streak: number;
}

export interface ApiGameEvent {
  id: string;
  name: string;
  subtitle?: string | null;
  description: string;
  banner_image: string;
  badge_text: string;
  event_type: string;
  buff_xp_multiplier: number;
  buff_foil_rate_boost: number;
  buff_shop_discount_pct: number;
  start_date: string;
  end_date: string;
  seconds_remaining: number;
  is_active: boolean;
  bounties: {
    id: string;
    title: string;
    description: string;
    target: number;
    reward_coins: number;
    reward_gems: number;
    icon?: string;
  }[];
}

export interface ApiFlashDeal {
  id: number;
  deal_date: string;
  title: string;
  description: string;
  pack_id: string;
  pack_name: string;
  pack_image: string;
  original_price: number;
  discount_price: number;
  discount_pct: number;
  bonus_coins: number;
  can_purchase: boolean;
  has_purchased: boolean;
  seconds_to_reset: number;
}

export interface ApiPurchaseFlashDealResult {
  success: boolean;
  message: string;
  pack_name: string;
  price_paid: number;
  new_coin_balance: number;
}

export const fetchDailyStreak = async (token: string): Promise<ApiDailyStreakStatus | null> => {
  try {
    const res = await fetch(`${API_BASE}/events/streak`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch streak status');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching daily streak:', err);
    return null;
  }
};

export const claimDailyStreak = async (token: string): Promise<ApiClaimStreakResult> => {
  const res = await fetch(`${API_BASE}/events/streak/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to claim daily check-in reward.');
  }
  return data;
};

export const fetchActiveEvents = async (): Promise<ApiGameEvent[]> => {
  try {
    const res = await fetch(`${API_BASE}/events/active`);
    if (!res.ok) throw new Error('Failed to fetch active events');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching active events:', err);
    return [];
  }
};

export const fetchDailyFlashDeal = async (token?: string): Promise<ApiFlashDeal | null> => {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/events/flash-deal`, { headers });
    if (!res.ok) throw new Error('Failed to fetch flash deal');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching daily flash deal:', err);
    return null;
  }
};

export const purchaseDailyFlashDeal = async (token: string): Promise<ApiPurchaseFlashDealResult> => {
  const res = await fetch(`${API_BASE}/events/flash-deal/purchase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to purchase flash deal.');
  }
  return data;
};
