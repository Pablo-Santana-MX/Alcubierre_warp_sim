/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WarpParameters, WarpPreset, PresetKey } from './physics/types';
import { WARP_PRESETS } from './physics/alcubierrePhysics';
import { VisualStyle, CameraPreset, WarpSpacetimeScene } from './webgl/WarpSpacetimeScene';
import { warpAudio } from './audio/WarpAudioEngine';
import { SpacetimeViewport } from './components/SpacetimeViewport';
import { TopStatusBar } from './components/TopStatusBar';
import { HolographicHud } from './components/HolographicHud';
import { BottomControlDock } from './components/BottomControlDock';
import { GestureController } from './components/GestureController';
import { EquationsPanel } from './components/EquationsPanel';
import { PhysicsExplainerModal } from './components/PhysicsExplainerModal';
import { Language, translations } from './i18n/translations';
import { CheckCircle2 } from 'lucide-react';

const DEFAULT_WARP_PARAMS: WarpParameters = {
  bubbleRadius: 0.8,
  wallSharpness: 6.0,
  velocity: 1.5,
  yCut: 0.8,
  heightScale: 0.28,
  exoticEnergyMultiplier: 1.0,
  xCenter: 0.0,
  isCruising: true,
  cruiseSpeed: 0.85,
  shipRotationX: 0,
  shipRotationY: 0,
  shipRotationZ: 0,
  autoRotateShip: false,
};

export default function App() {
  const [params, setParams] = useState<WarpParameters>(DEFAULT_WARP_PARAMS);
  const [currentPreset, setCurrentPreset] = useState<PresetKey>('alcubierre_classic');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('checkerboard');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  // Language State (ES / EN)
  const [language, setLanguage] = useState<Language>('es');

  // Modals and HUD state
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false);
  const [isGesturesOpen, setIsGesturesOpen] = useState<boolean>(false);
  const [isEquationsOpen, setIsEquationsOpen] = useState<boolean>(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  // Top Status Bar minimization (toggled when animation canvas is tapped)
  const [isTopBarMinimized, setIsTopBarMinimized] = useState<boolean>(false);

  // Screenshot capture notification
  const [screenshotToast, setScreenshotToast] = useState<string | null>(null);

  // Simulation pause state to facilitate screenshot capture
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // WebGL Scene Reference for direct captures
  const sceneRef = useRef<WarpSpacetimeScene | null>(null);

  // Spatial Audio State
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.45);

  const t = translations[language];

  // Adjust volume subtly when paused
  useEffect(() => {
    if (isAudioActive) {
      if (isPaused) {
        warpAudio.setVolume(audioVolume * 0.25);
      } else {
        warpAudio.setVolume(audioVolume);
      }
    }
  }, [isPaused, isAudioActive, audioVolume]);

  // Sync real-time parameter changes to procedural audio engine
  useEffect(() => {
    if (isAudioActive) {
      warpAudio.updateParams(params);
    }
  }, [params, isAudioActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      warpAudio.stop();
    };
  }, []);

  // Audio Toggle
  const handleToggleAudio = useCallback(async () => {
    if (isAudioActive) {
      warpAudio.stop();
      setIsAudioActive(false);
    } else {
      const started = await warpAudio.start(params);
      if (started) {
        warpAudio.setVolume(audioVolume);
        setIsAudioActive(true);
      }
    }
  }, [isAudioActive, params, audioVolume]);

  const handleChangeVolume = useCallback((vol: number) => {
    setAudioVolume(vol);
    warpAudio.setVolume(vol);
  }, []);

  // Parameter update handler
  const handleUpdateParams = useCallback((newParams: Partial<WarpParameters>) => {
    setParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  }, []);

  // Reset to default configuration
  const handleResetParams = useCallback(() => {
    setParams(DEFAULT_WARP_PARAMS);
    setCurrentPreset('alcubierre_classic');
  }, []);

  // Preset selector
  const handleSelectPreset = useCallback((preset: WarpPreset) => {
    setCurrentPreset(preset.id);
    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
  }, []);

  // Language toggle handler
  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);

  // Canvas tap handler: minimises the main Alcubierre warp metric top bar
  const handleCanvasTap = useCallback(() => {
    setIsTopBarMinimized((prev) => !prev);
  }, []);

  // Simulation pause / unpause toggle to facilitate screenshot captures
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // High-Resolution Screenshot Capture
  const handleCaptureScreenshot = useCallback(() => {
    if (!sceneRef.current) return;
    try {
      const dataUrl = sceneRef.current.captureScreenshot();
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `alcubierre-warp-bubble-${params.velocity.toFixed(1)}c-${timestamp}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const msg = t.screenshotSuccess;
      setScreenshotToast(msg);
      setTimeout(() => setScreenshotToast(null), 3200);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
    }
  }, [params.velocity, t.screenshotSuccess]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. Top Navigation & Telemetry Bar (Alcubierre Warp Metric main bar) */}
      <TopStatusBar
        params={params}
        isHudVisible={isHudVisible}
        onToggleHud={() => setIsHudVisible((prev) => !prev)}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        onOpenGestures={() => setIsGesturesOpen(true)}
        onOpenEquations={() => setIsEquationsOpen(true)}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onCaptureScreenshot={handleCaptureScreenshot}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        isMinimized={isTopBarMinimized}
        onToggleMinimize={() => setIsTopBarMinimized((prev) => !prev)}
      />

      {/* 2. Holographic HUD Overlay (Top and Right) */}
      <HolographicHud
        params={params}
        isVisible={isHudVisible}
        onToggleVisibility={() => setIsHudVisible((prev) => !prev)}
        isExpanded={isHudExpanded}
        onToggleExpand={() => setIsHudExpanded(!isHudExpanded)}
        language={language}
      />

      {/* 3. Central WebGL 3D Spacetime Viewport */}
      <main className="w-full h-full">
        <SpacetimeViewport
          params={params}
          visualStyle={visualStyle}
          cameraPreset={cameraPreset}
          language={language}
          isPaused={isPaused}
          onUpdateParams={handleUpdateParams}
          onSceneReady={(scene) => {
            sceneRef.current = scene;
          }}
          onCanvasTap={handleCanvasTap}
        />
      </main>

      {/* 4. Collapsible Bottom Control Dock */}
      <BottomControlDock
        params={params}
        onUpdateParams={handleUpdateParams}
        onResetParams={handleResetParams}
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        visualStyle={visualStyle}
        onChangeVisualStyle={setVisualStyle}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={setCameraPreset}
        onOpenEquations={() => setIsEquationsOpen(true)}
        onOpenPhysicsExplainer={() => setIsExplainerOpen(true)}
        isAudioActive={isAudioActive}
        audioVolume={audioVolume}
        onToggleAudio={handleToggleAudio}
        onChangeAudioVolume={handleChangeVolume}
        language={language}
      />

      {/* 5. Air Gestures & Spatial Touch Controller Modal */}
      <GestureController
        params={params}
        onUpdateParams={handleUpdateParams}
        isOpen={isGesturesOpen}
        onClose={() => setIsGesturesOpen(false)}
        language={language}
      />

      {/* 6. Holographic Tensor Equations Projector Modal */}
      <EquationsPanel
        params={params}
        isOpen={isEquationsOpen}
        onClose={() => setIsEquationsOpen(false)}
        language={language}
      />

      {/* 7. Educational Physics Explainer Modal */}
      <PhysicsExplainerModal
        params={params}
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        language={language}
      />

      {/* 8. Screenshot Capture Success Toast Notification */}
      {screenshotToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-mono-code font-bold shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{screenshotToast}</span>
        </div>
      )}
    </div>
  );
}
