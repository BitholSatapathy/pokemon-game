import { Card } from '../types';

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

    // Map ApiCard to frontend Card type
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
      ownedQuantity: c.name === 'Charizard' ? 1 : c.name === 'Pikachu' ? 3 : c.name === 'Blastoise' ? 1 : 0, // mock ownership for prototype
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
