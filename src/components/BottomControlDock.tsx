/**
 * Ergonomic Bottom Control Dock
 * Conforms to Three.js UX directives: consolidated bottom dock with cinema collapse mode,
 * zero viewport occlusion, and instant reactive physics parameter tuning.
 */

import React, { useState } from 'react';
import { WarpParameters, WarpPreset, PresetKey } from '../physics/types';
import { WARP_PRESETS } from '../physics/alcubierrePhysics';
import { VisualStyle, CameraPreset } from '../webgl/WarpSpacetimeScene';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp,
  Atom,
  Gauge,
  HelpCircle,
  BookOpen,
  Compass,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface BottomControlDockProps {
  params: WarpParameters;
  onUpdateParams: (newParams: Partial<WarpParameters>) => void;
  onResetParams: () => void;
  currentPreset: PresetKey;
  onSelectPreset: (preset: WarpPreset) => void;
  visualStyle: VisualStyle;
  onChangeVisualStyle: (style: VisualStyle) => void;
  cameraPreset: CameraPreset;
  onChangeCameraPreset: (preset: CameraPreset) => void;
  onOpenEquations: () => void;
  onOpenPhysicsExplainer: () => void;
  isAudioActive?: boolean;
  audioVolume?: number;
  onToggleAudio?: () => void;
  onChangeAudioVolume?: (vol: number) => void;
  language: Language;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  params,
  onUpdateParams,
  onResetParams,
  currentPreset,
  onSelectPreset,
  visualStyle,
  onChangeVisualStyle,
  cameraPreset,
  onChangeCameraPreset,
  onOpenEquations,
  onOpenPhysicsExplainer,
  isAudioActive = false,
  audioVolume = 0.45,
  onToggleAudio,
  onChangeAudioVolume,
  language,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'physics' | 'ship' | 'presets' | 'view'>('physics');
  const t = translations[language];

  return (
    <div
      className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(940px,95vw)] transition-transform duration-300 ${
        isCollapsed ? 'translate-y-[calc(100%-38px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <div className="flex justify-center -mb-[1px]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-lg bg-slate-900 border-t border-x border-cyan-500/30 text-[11px] font-mono-code font-semibold text-cyan-300 hover:text-cyan-100 hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
          title={isCollapsed ? t.expandDock : t.collapseDock}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.expandDock}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.collapseDock}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="clay-crystal-panel p-3.5 sm:p-5">
        {/* Top Control Bar: Tabs & Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/10">
          {/* Category Tabs (Horizontally scrollable on mobile) */}
          <div className="flex items-center gap-1 neumorphic-inset p-1 overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setActiveTab('physics')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'physics'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t.tabPhysics}</span>
            </button>

            <button
              onClick={() => setActiveTab('ship')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'ship'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.tabShip}</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{t.tabPresets}</span>
            </button>

            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'view'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.tabView}</span>
            </button>
          </div>

          {/* Hologram Equations & Theory Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenEquations}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-mono-code font-semibold hover:bg-indigo-900/60 hover:text-indigo-100 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{t.equationsButton}</span>
              <span className="sm:hidden">MATH</span>
            </button>

            <button
              onClick={onOpenPhysicsExplainer}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono-code font-semibold hover:bg-cyan-900/60 hover:text-cyan-100 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{t.physicsButton}</span>
              <span className="sm:hidden">{language === 'es' ? 'TEORÍA' : 'PHYSICS'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Physics Parameters Controls */}
        {activeTab === 'physics' && (
          <div className="pt-3.5 space-y-3">
            {/* Cruise & Position scrub bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateParams({ isCruising: !params.isCruising })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-code text-xs font-bold transition-all cursor-pointer ${
                    params.isCruising
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  {params.isCruising ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{t.pauseCruise}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{t.startCruise}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onResetParams}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title={t.resetDefault}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Position slider */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-[11px] font-mono-code text-slate-400 whitespace-nowrap">
                  {t.positionXLabel}
                </span>
                <input
                  type="range"
                  min="-3.2"
                  max="3.2"
                  step="0.05"
                  value={params.xCenter}
                  onChange={(e) =>
                    onUpdateParams({
                      xCenter: parseFloat(e.target.value),
                      isCruising: false,
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono-code text-xs font-bold text-cyan-300 w-12 text-right">
                  {params.xCenter.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Main Interactive Physics Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Slider 1: Velocidad de curvatura (v_s) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    {t.velocityLabel}
                  </span>
                  <span className="font-bold text-white bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {params.velocity.toFixed(2)} c
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="6.0"
                  step="0.05"
                  value={params.velocity}
                  onChange={(e) => onUpdateParams({ velocity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>{t.subluminal}</span>
                  <span className="text-amber-400">{t.speedOfLight}</span>
                  <span>{t.superluminal}</span>
                </div>
              </div>

              {/* Slider 2: Densidad de Energía Exótica / Nitidez Pared (sigma) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <Atom className="w-3.5 h-3.5 text-red-400" />
                    {t.exoticLabel}
                  </span>
                  <span className="font-bold text-white bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                    σ = {params.wallSharpness.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="14.0"
                  step="0.2"
                  value={params.wallSharpness}
                  onChange={(e) => onUpdateParams({ wallSharpness: parseFloat(e.target.value) })}
                  className="w-full accent-red-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>{t.wideWall}</span>
                  <span className="text-red-300">{t.thinWall}</span>
                </div>
              </div>

              {/* Slider 3: Radio de Burbuja (R) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-indigo-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {t.radiusLabel}
                  </span>
                  <span className="font-bold text-white bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    R = {params.bubbleRadius.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.2"
                  step="0.05"
                  value={params.bubbleRadius}
                  onChange={(e) => onUpdateParams({ bubbleRadius: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>{t.compactBubble}</span>
                  <span>{t.spaciousBubble}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Nave Espacial - Rotación en Ejes XYZ */}
        {activeTab === 'ship' && (
          <div className="pt-3.5 space-y-3">
            {/* Quick Actions & Continuous Auto-Rotate */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onUpdateParams({ autoRotateShip: !params.autoRotateShip })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-code text-xs font-bold transition-all cursor-pointer ${
                    params.autoRotateShip
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${params.autoRotateShip ? 'animate-spin' : ''}`} />
                  <span>{t.continuousRotation} {params.autoRotateShip ? t.active : t.inactive}</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateParams({
                      shipRotationX: 0,
                      shipRotationY: 0,
                      shipRotationZ: 0,
                      autoRotateShip: false,
                    })
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-mono-code transition-colors cursor-pointer"
                  title={t.resetOrientation}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.resetOrientation}</span>
                </button>
              </div>

              {/* Quick Preset Angles */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono-code text-slate-400 hidden sm:inline">
                  {t.quickAngle}
                </span>
                <button
                  onClick={() => onUpdateParams({ shipRotationX: 0, shipRotationY: 0, shipRotationZ: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono-code cursor-pointer"
                >
                  {t.angleFront}
                </button>
                <button
                  onClick={() => onUpdateParams({ shipRotationX: 0, shipRotationY: 90, shipRotationZ: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono-code cursor-pointer"
                >
                  {t.angleSide}
                </button>
                <button
                  onClick={() => onUpdateParams({ shipRotationX: 0, shipRotationY: 180, shipRotationZ: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono-code cursor-pointer"
                >
                  {t.angleReverse}
                </button>
                <button
                  onClick={() => onUpdateParams({ shipRotationX: 180, shipRotationY: 0, shipRotationZ: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono-code cursor-pointer"
                >
                  {t.angleInverted}
                </button>
              </div>
            </div>

            {/* 3 Interactive XYZ Rotation Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Eje X (Roll / Alabeo) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    {t.axisXRoll}
                  </span>
                  <span className="font-bold text-white bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {(params.shipRotationX || 0).toFixed(0)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={params.shipRotationX || 0}
                  onChange={(e) => onUpdateParams({ shipRotationX: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>-180° {t.degLeft}</span>
                  <span className="text-cyan-300">0° {t.degLevel}</span>
                  <span>+180° {t.degRight}</span>
                </div>
              </div>

              {/* Eje Y (Yaw / Guiñada) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-indigo-300 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    {t.axisYYaw}
                  </span>
                  <span className="font-bold text-white bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    {(params.shipRotationY || 0).toFixed(0)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={params.shipRotationY || 0}
                  onChange={(e) => onUpdateParams({ shipRotationY: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>-180° {t.angleReverse}</span>
                  <span className="text-indigo-300">0° {t.degForward}</span>
                  <span>+180°</span>
                </div>
              </div>

              {/* Eje Z (Pitch / Cabeceo) */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    {t.axisZPitch}
                  </span>
                  <span className="font-bold text-white bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    {(params.shipRotationZ || 0).toFixed(0)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="1"
                  value={params.shipRotationZ || 0}
                  onChange={(e) => onUpdateParams({ shipRotationZ: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono-code text-slate-400 mt-1">
                  <span>-90° {t.degNoseDown}</span>
                  <span className="text-amber-300">0° {t.degLevel}</span>
                  <span>+90° {t.degNoseUp}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Presets & Scientific Models */}
        {activeTab === 'presets' && (
          <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {WARP_PRESETS.map((preset) => {
              const isSelected = currentPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron text-xs font-bold text-cyan-300">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono-code bg-cyan-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                        {t.activePresetBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono-code text-slate-400 mt-0.5">
                    {preset.subtitle}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1.5 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Camera Presets & Visual Shading */}
        {activeTab === 'view' && (
          <div className="pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Presets */}
            <div className="space-y-2">
              <span className="text-xs font-mono-code text-slate-400 block font-semibold">
                {t.cameraPerspectives}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'isometric', label: t.camIsometric },
                  { id: 'cinematic', label: t.camCinematic },
                  { id: 'cockpit', label: t.camCockpit },
                  { id: 'top_down', label: t.camTopDown },
                  { id: 'side_profile', label: t.camSideProfile },
                ].map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeCameraPreset(item.id as CameraPreset)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono-code font-semibold border transition-all text-left cursor-pointer ${
                      idx === 4 ? 'col-span-2' : ''
                    } ${
                      cameraPreset === item.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shading Styles */}
            <div className="space-y-2">
              <span className="text-xs font-mono-code text-slate-400 block font-semibold">
                {t.meshStyle}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'checkerboard', label: t.styleCheckerboard },
                  { id: 'heat_expansion', label: t.styleHeatmap },
                  { id: 'hologram', label: t.styleHologram },
                  { id: 'deep_space', label: t.styleDeepSpace },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeVisualStyle(item.id as VisualStyle)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono-code font-semibold border transition-all text-left cursor-pointer ${
                      visualStyle === item.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spatial Audio Synthesizer */}
            <div className="col-span-1 md:col-span-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2 mt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                    {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </span>
                  <div>
                    <span className="text-xs font-mono-code font-bold text-slate-200 block">
                      {t.audioTitle}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      {t.audioDesc} ({params.velocity.toFixed(2)}c, R = {params.bubbleRadius.toFixed(2)}u)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {onToggleAudio && (
                    <button
                      onClick={onToggleAudio}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold border transition-all cursor-pointer ${
                        isAudioActive
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isAudioActive ? t.audioActiveBadge : t.audioActivateBadge}
                    </button>
                  )}
                </div>
              </div>

              {/* Volume Slider & Frequency Telemetry */}
              {isAudioActive && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs font-mono-code">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-slate-400 text-[11px] whitespace-nowrap">{t.masterVolume}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={audioVolume}
                      onChange={(e) => onChangeAudioVolume && onChangeAudioVolume(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-emerald-300 font-bold w-10 text-right">
                      {Math.round(audioVolume * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{t.freqSub} <strong className="text-emerald-400">{((38 + params.velocity * 14) * Math.max(0.6, Math.min(1.4, 1.0 / Math.sqrt(params.bubbleRadius)))).toFixed(0)} Hz</strong></span>
                    <span>•</span>
                    <span>{t.pulseLfo} <strong className="text-cyan-400">{Math.min(10, 1.2 + params.velocity * 1.1).toFixed(1)} Hz</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
