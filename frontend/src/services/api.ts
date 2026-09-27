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

