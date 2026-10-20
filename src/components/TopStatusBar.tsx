/**
 * Top Status Bar Component
 * Minimalist top-dock navigation bar with telemetry badges, clean static indicators,
 * camera screenshot capture, language switcher (ES/EN), and auto-minimizing immersion mode.
 */

import React from 'react';
import { WarpParameters } from '../physics/types';
import {
  Rocket,
  Hand,
  BookOpen,
  HelpCircle,
  Activity,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Camera,
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface TopStatusBarProps {
  params: WarpParameters;
  isHudVisible: boolean;
  onToggleHud: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  onOpenGestures: () => void;
  onOpenEquations: () => void;
  onOpenExplainer: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onCaptureScreenshot: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  params,
  isHudVisible,
  onToggleHud,
  isAudioActive,
  onToggleAudio,
  onOpenGestures,
  onOpenEquations,
  onOpenExplainer,
  language,
  onToggleLanguage,
  onCaptureScreenshot,
  isPaused,
  onTogglePause,
  isMinimized,
  onToggleMinimize,
}) => {
  const t = translations[language];

  // Minimized floating pill (revealed when animation canvas is tapped)
  if (isMinimized) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          onClick={onToggleMinimize}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/92 border border-cyan-500/50 text-cyan-300 text-xs font-mono-code font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:bg-slate-900 hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-none"
          title={t.minimizedBarPill}
        >
          <ChevronDown className="w-4 h-4 text-cyan-400" />
          <span>{t.minimizedBarPill}</span>
        </button>
      </div>
    );
  }

  return (
    <header className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 clay-crystal-panel pointer-events-auto">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-orbitron text-xs sm:text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 uppercase">
              {t.title}
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-lg text-[9px] font-mono-code font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-inner">
              {t.versionBadge}
            </span>
          </div>
          <p className="text-[10px] font-mono-code text-slate-400 hidden md:block">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Telemetry Status Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2 font-mono-code text-xs">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl neumorphic-inset text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">{t.warpFactor}</span>
          <span className="font-bold text-cyan-300">{params.velocity.toFixed(2)}c</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl neumorphic-inset text-slate-300">
          <span className="text-slate-400 text-[11px]">{t.position}</span>
          <span className="font-bold text-white">{params.xCenter.toFixed(2)} u</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neumorphic-inset text-slate-300">
          <span className="text-slate-400 text-[11px] hidden sm:inline">{t.inertialFrame}</span>
          <span className={`font-semibold text-[11px] ${isPaused ? 'text-amber-400 font-bold animate-pulse' : 'text-emerald-400'}`}>
            {isPaused ? t.pausedStatus : (params.isCruising ? t.cruising : t.stationary)}
          </span>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Pause / Unpause Simulation Toggle */}
        <button
          onClick={onTogglePause}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-mono-code font-bold border transition-all cursor-pointer ${
            isPaused
              ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/60'
              : 'clay-button text-cyan-200'
          }`}
          title={isPaused ? t.unpauseTooltip : t.pauseTooltip}
        >
          {isPaused ? (
            <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
          ) : (
            <Pause className="w-3.5 h-3.5 text-cyan-300" />
          )}
          <span className="hidden sm:inline">{isPaused ? t.unpauseSimulation : t.pauseSimulation}</span>
        </button>

        {/* High-Resolution Screenshot Capture Button */}
        <button
          onClick={onCaptureScreenshot}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 clay-button text-cyan-200 cursor-pointer"
          title={t.screenshotButton}
        >
          <Camera className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden xl:inline">{t.screenshotButton}</span>
        </button>

        {/* Spatial Audio Synthesizer Toggle */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-mono-code font-bold border transition-all ${
            isAudioActive
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
              : 'clay-button text-slate-300'
          }`}
          title={t.toggleAudio}
        >
          {isAudioActive ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">{isAudioActive ? t.audioOn : t.audioOff}</span>
        </button>

        {/* Toggle Eulerian HUD */}
        <button
          onClick={onToggleHud}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-mono-code font-bold border transition-all ${
            isHudVisible
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.35)]'
              : 'clay-button text-slate-300'
          }`}
          title={t.hudToggle}
        >
          {isHudVisible ? (
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">{t.hudButton}</span>
        </button>

        {/* Gestures */}
        <button
          onClick={onOpenGestures}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 clay-button text-cyan-200"
          title={t.gesturesButton}
        >
          <Hand className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden md:inline">{t.gesturesButton}</span>
        </button>

        {/* Equations */}
        <button
          onClick={onOpenEquations}
          className="flex items-center gap-1 px-2.5 py-1.5 clay-button text-indigo-200"
          title={t.equationsButton}
        >
          <BookOpen className="w-4 h-4 text-indigo-300" />
          <span className="hidden md:inline">{t.equationsButton}</span>
        </button>

        {/* Viable Physics */}
        <button
          onClick={onOpenExplainer}
          className="p-1.5 sm:px-2 sm:py-1.5 clay-button text-slate-300"
          title={t.physicsButton}
        >
          <HelpCircle className="w-4 h-4 text-cyan-300" />
        </button>

        {/* Language Switcher Button (ES <-> EN) */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1 px-2 py-1.5 clay-button text-cyan-200"
          title="Cambiar idioma / Switch language"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-[11px] font-bold text-cyan-200 uppercase">
            {language === 'es' ? 'EN' : 'ES'}
          </span>
        </button>

        {/* Minimize Top Bar toggle button */}
        <button
          onClick={onToggleMinimize}
          className="p-1.5 clay-button text-slate-300"
          title={t.hideTopBarTooltip}
        >
          <ChevronUp className="w-3.5 h-3.5 text-cyan-300" />
        </button>
      </div>
    </header>
  );
};
