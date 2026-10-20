/**
 * Holographic HUD Component
 * Renders the Eulerian Energy Density T_00 profile curve in real time (matching ManimGX HUD)
 * and displays expansion/contraction gauges and holographic telemetry.
 * Positioned in the top-right corner of the viewport.
 */

import React, { useMemo } from 'react';
import { WarpParameters } from '../physics/types';
import { computeHudCurve, referenceEnergyPeak, volumeExpansion } from '../physics/alcubierrePhysics';
import { Eye, X } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface HolographicHudProps {
  params: WarpParameters;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  language: Language;
}

export const HolographicHud: React.FC<HolographicHudProps> = ({
  params,
  isExpanded,
  onToggleExpand,
  isVisible,
  onToggleVisibility,
  language,
}) => {
  const bounds = 4.0;
  const samples = 100;
  const t = translations[language];

  // Compute curve points reactive to params
  const { curvePoints, peakVal, svgPath, aheadTheta, behindTheta } = useMemo(() => {
    const peak = referenceEnergyPeak(bounds, samples, params);
    const points = computeHudCurve(bounds, samples, params.xCenter, params, peak);

    // Map to SVG coordinates: W = 280, H = 120
    const w = 280;
    const h = 120;
    const padX = 20;
    const padY = 16;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    const yMin = -1.25;
    const yMax = 0.25;

    const toSvgX = (x: number) => padX + ((x + bounds) / (bounds * 2)) * plotW;
    const toSvgY = (yVal: number) => padY + ((yMax - yVal) / (yMax - yMin)) * plotH;

    let path = '';
    points.forEach((pt, idx) => {
      const sx = toSvgX(pt.x);
      const sy = toSvgY(pt.normalizedT00);
      if (idx === 0) {
        path += `M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      } else {
        path += ` L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      }
    });

    const ahead = volumeExpansion(params.xCenter + params.bubbleRadius, 0, 0, params.xCenter, params);
    const behind = volumeExpansion(params.xCenter - params.bubbleRadius, 0, 0, params.xCenter, params);

    return {
      curvePoints: points,
      peakVal: peak,
      svgPath: path,
      aheadTheta: ahead,
      behindTheta: behind,
    };
  }, [params]);

  // Zero-line Y coordinate in SVG
  const zeroY = 16 + ((0.25 - 0) / (0.25 - (-1.25))) * (120 - 32);

  // If hidden by user, do not render floating button (only show when explicitly requested via top status bar)
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-14 right-2 sm:top-16 sm:right-4 z-20 flex flex-col gap-2 pointer-events-none select-none max-w-[calc(100vw-1rem)] sm:max-w-[320px]">
      {/* Primary HUD Card */}
      <div className="pointer-events-auto clay-crystal-panel p-3.5 sm:p-4 transition-all duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-cyan-300 uppercase">
              {t.hudTitle}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleExpand}
              className="text-[10px] font-mono-code px-2 py-1 clay-button text-cyan-300"
              title={isExpanded ? (language === 'es' ? 'Ver menos detalles' : 'View less details') : (language === 'es' ? 'Ver más telemetría' : 'View more telemetry')}
            >
              {isExpanded ? t.hudMin : t.hudExp}
            </button>
            <button
              onClick={onToggleVisibility}
              className="p-1.5 rounded-xl clay-button text-slate-400 hover:text-red-400"
              title={t.hudClose}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex justify-between items-center text-[11px] font-mono-code text-slate-300 mt-2.5 px-1">
          <span>{t.hudTransverseCut} {params.yCut.toFixed(1)}</span>
          <span className="text-red-400 font-semibold">{t.hudExoticBadge}</span>
        </div>

        {/* 2D Curve Canvas/SVG matching ManimGX build_hud */}
        <div className="relative mt-2.5 neumorphic-inset p-2">
          <svg viewBox="0 0 280 120" className="w-full h-24 overflow-visible">
            {/* Grid background lines */}
            <line x1="20" y1={zeroY} x2="260" y2={zeroY} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="140" y1="16" x2="140" y2="104" stroke="#334155" strokeWidth="1" />

            {/* Axis ticks */}
            {[-3, -2, -1, 0, 1, 2, 3].map((val) => {
              const tx = 20 + ((val + 4) / 8) * 240;
              return (
                <line key={val} x1={tx} y1={zeroY - 3} x2={tx} y2={zeroY + 3} stroke="#64748b" strokeWidth="1" />
              );
            })}

            {/* Bubble position indicator line */}
            <line
              x1={20 + ((params.xCenter + 4) / 8) * 240}
              y1="16"
              x2={20 + ((params.xCenter + 4) / 8) * 240}
              y2="104"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeOpacity="0.75"
            />

            {/* T_00 Negative Energy Density Curve */}
            <path
              d={svgPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Labels under graph */}
          <div className="flex justify-between text-[9px] font-mono-code text-slate-400 px-1 mt-0.5">
            <span>x = -4.0</span>
            <span className="text-cyan-400 font-medium">
              {language === 'es' ? 'Burbuja' : 'Bubble'} x = {params.xCenter.toFixed(2)}
            </span>
            <span>x = +4.0</span>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px] font-mono-code">
          <div className="bg-slate-900/60 p-1.5 rounded border border-cyan-500/20">
            <span className="text-slate-400 block">{t.hudPeak}</span>
            <span className="text-red-400 font-bold text-xs">{peakVal.toFixed(4)}</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-cyan-500/20">
            <span className="text-slate-400 block">{t.hudWallThickness}</span>
            <span className="text-cyan-300 font-bold text-xs">{(1.0 / params.wallSharpness).toFixed(3)} u</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5 text-[10px] font-mono-code">
            <div className="flex justify-between text-slate-300">
              <span>{t.hudFrontContraction}</span>
              <span className="text-cyan-400 font-bold">{aheadTheta.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{t.hudRearExpansion}</span>
              <span className="text-amber-400 font-bold">+{behindTheta.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{t.hudShiftVector}</span>
              <span className="text-indigo-300">-{params.velocity.toFixed(2)} c</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{t.hudProperTime}</span>
              <span className="text-emerald-400 font-semibold">{t.hudProperTimeVal}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
