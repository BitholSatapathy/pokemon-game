import React from 'react';
import { Sparkles, ShieldCheck, QrCode } from 'lucide-react';
import { GradedCard } from '../../services/api';

interface GradedSlabProps {
  slab: GradedCard;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const GradedSlab: React.FC<GradedSlabProps> = ({
  slab,
  onClick,
  isInteractive = true,
}) => {
  const is10 = slab.grade === 10;
  const is9 = slab.grade === 9 || slab.grade === 9.5;

  const headerStyle = is10
    ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-black border-b-2 border-amber-600'
    : is9
    ? 'bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 text-black border-b-2 border-slate-400'
    : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white border-b-2 border-amber-900';

  const gradeNumberStyle = is10
    ? 'text-yellow-950 font-black'
    : is9
    ? 'text-slate-900 font-black'
    : 'text-amber-100 font-black';

  return (
    <div
      onClick={onClick}
      className={`relative w-64 rounded-3xl p-3 bg-gradient-to-b from-white/20 via-white/5 to-white/10 border-2 border-white/40 shadow-2xl backdrop-blur-md transition-all duration-300 select-none ${
        isInteractive ? 'hover:scale-105 hover:shadow-[0_0_35px_rgba(251,191,36,0.35)] cursor-pointer' : ''
      }`}
      style={{
        boxShadow: is10
          ? '0 0 30px rgba(245, 158, 11, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.3)'
          : '0 0 20px rgba(255, 255, 255, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Acrylic Glass Reflections */}
      <div className="absolute top-0 left-0 w-full h-full rounded-3xl pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-96 bg-white/10 rotate-45 transform blur-sm" />
      </div>

      {/* Top Header Label */}
      <div className={`rounded-2xl p-3 shadow-md relative overflow-hidden mb-3 ${headerStyle}`}>
        {/* Hologram strip */}
        <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-widest uppercase border-b border-black/10 pb-1 mb-1.5 opacity-80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> NGS AUTHENTIC
          </span>
          <span>{slab.service_tier.toUpperCase()}</span>
        </div>

        {/* Card Name & Big Grade */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-black/70 truncate">
              {slab.set_name} • #{slab.card_number}
            </div>
            <div className="text-xs font-black uppercase truncate text-black leading-tight">
              {slab.card_name}
            </div>
            <div className="text-[9px] font-mono font-bold tracking-wider text-black/80 mt-0.5">
              {slab.grade_label}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pl-2 border-l border-black/15">
            <div className={`text-2xl leading-none font-display ${gradeNumberStyle}`}>
              {slab.grade.toFixed(1)}
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter text-black/60">GRADE</span>
          </div>
        </div>

        {/* Sub-Grades Grid */}
        <div className="grid grid-cols-4 gap-1 mt-2 pt-1.5 border-t border-black/10 text-[8px] font-mono font-bold text-black/80 text-center">
          <div>
            <div className="text-black/50 text-[7px]">CENT</div>
            <div>{slab.sub_centering}</div>
          </div>
          <div>
            <div className="text-black/50 text-[7px]">CORN</div>
            <div>{slab.sub_corners}</div>
          </div>
          <div>
            <div className="text-black/50 text-[7px]">EDGS</div>
            <div>{slab.sub_edges}</div>
          </div>
          <div>
            <div className="text-black/50 text-[7px]">SURF</div>
            <div>{slab.sub_surface}</div>
          </div>
        </div>

        {/* Cert Barcode/Serial */}
        <div className="mt-1.5 pt-1 border-t border-black/10 flex items-center justify-between text-[8px] font-mono text-black/70">
          <span>CERT #{slab.cert_number}</span>
          <QrCode className="w-2.5 h-2.5 opacity-60" />
        </div>
      </div>

      {/* Card Window */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/60 border-2 border-white/30 p-2 flex items-center justify-center shadow-inner">
        {slab.is_foil && (
          <div className="absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.5 rounded-full shadow-lg">
            Foil ✨
          </div>
        )}

        <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
          {slab.image_url ? (
            <img
              src={slab.image_url}
              alt={slab.card_name}
              className="w-full h-full object-contain filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <Sparkles className="w-10 h-10 text-purple-400" />
          )}
        </div>
      </div>

      {/* Bottom Valuation & Multiplier Bar */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
          {slab.value_multiplier}x Multiplier
        </span>
        <span className="text-xs font-black text-white">
          {slab.graded_price.toLocaleString()} Coins
        </span>
      </div>
    </div>
  );
};
export default GradedSlab;
