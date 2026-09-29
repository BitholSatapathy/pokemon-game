import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateUserAvatar } from '../../services/api';
import { playClickSound, playFanfareSound } from '../../services/sound';

export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  url: string;
  badgeColor: string;
}

export const CURATED_AVATARS: AvatarOption[] = [
  {
    id: 'pikachu',
    name: 'Pikachu Spark',
    role: 'Electric Icon',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    badgeColor: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  },
  {
    id: 'charizard',
    name: 'Charizard Inferno',
    role: 'Fire Titan',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    badgeColor: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
  },
  {
    id: 'gengar',
    name: 'Gengar Shadow',
    role: 'Ghost Trickster',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
    badgeColor: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo Psystrike',
    role: 'Psychic Mythic',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    badgeColor: 'border-pink-500/50 bg-pink-500/10 text-pink-300',
  },
  {
    id: 'rayquaza',
    name: 'Rayquaza Sky Lord',
    role: 'Dragon Guardian',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png',
    badgeColor: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  },
  {
    id: 'lucario',
    name: 'Lucario Aura',
    role: 'Fighting Master',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
    badgeColor: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
  },
  {
    id: 'red',
    name: 'Champion Red',
    role: 'Legendary Trainer',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png',
    badgeColor: 'border-red-500/50 bg-red-500/10 text-red-300',
  },
  {
    id: 'cynthia',
    name: 'Champion Cynthia',
    role: 'Sinnoh Master',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/cynthia.png',
    badgeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'misty',
    name: 'Leader Misty',
    role: 'Cerulean Star',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/misty.png',
    badgeColor: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
  },
  {
    id: 'giovanni',
    name: 'Boss Giovanni',
    role: 'Team Rocket',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/giovanni.png',
    badgeColor: 'border-purple-600/50 bg-purple-900/20 text-purple-300',
  },
];

export const DEFAULT_AVATAR = CURATED_AVATARS[0].url;

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated?: (newUrl: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  onAvatarUpdated,
}) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [selectedUrl, setSelectedUrl] = useState<string>(user?.avatarUrl || DEFAULT_AVATAR);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
    playClickSound();
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await updateUserAvatar(selectedUrl, token);
      playFanfareSound();
      showToast('Avatar profile picture updated successfully!', 'success', 'Profile Updated');
      if (onAvatarUpdated) {
        onAvatarUpdated(selectedUrl);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update avatar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Profile Avatar" maxWidth="lg">
      <div className="space-y-6">
        <p className="text-xs text-gray-400">
          Select one of the 10 official iconic Pokémon & Trainer avatars to represent you across the Leaderboard, Trading Hub, and Battle Arena.
        </p>

        {/* 10 Avatar Choices Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CURATED_AVATARS.map((av) => {
            const isSelected = selectedUrl === av.url;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelect(av.url)}
                className={`relative p-2.5 rounded-2xl flex flex-col items-center gap-2 border transition-all text-center group cursor-pointer ${
                  isSelected
                    ? 'bg-brand-violet/20 border-brand-purple ring-2 ring-purple-400/50 shadow-glow-purple scale-102'
                    : 'bg-[#141424] border-[#2A2A44] hover:border-purple-500/50 hover:bg-[#1A1A2E]'
                }`}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-violet text-white flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Avatar Preview */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                  <img
                    src={av.url}
                    alt={av.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="w-full">
                  <div className="text-xs font-bold text-white truncate">{av.name}</div>
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold mt-1 ${av.badgeColor}`}>
                    {av.role}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#201E38]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(DEFAULT_AVATAR)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Sparkles className="w-4 h-4 text-white" />}
            >
              Save Avatar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
