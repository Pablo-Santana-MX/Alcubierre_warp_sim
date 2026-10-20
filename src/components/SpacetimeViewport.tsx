/**
 * WebGL 3D Spacetime Viewport Canvas Container
 * Encapsulates the Three.js canvas in an isolated container ref with responsive resize observer.
 */

import React, { useEffect, useRef } from 'react';
import { WarpParameters } from '../physics/types';
import { WarpSpacetimeScene, VisualStyle, CameraPreset } from '../webgl/WarpSpacetimeScene';
import { Language, translations } from '../i18n/translations';

interface SpacetimeViewportProps {
  params: WarpParameters;
  visualStyle: VisualStyle;
  cameraPreset: CameraPreset;
  language: Language;
  isPaused?: boolean;
  onUpdateParams: (newParams: Partial<WarpParameters>) => void;
  onSceneReady?: (scene: WarpSpacetimeScene) => void;
  onCanvasTap?: () => void;
}

export const SpacetimeViewport: React.FC<SpacetimeViewportProps> = ({
  params,
  visualStyle,
  cameraPreset,
  language,
  isPaused,
  onUpdateParams,
  onSceneReady,
  onCanvasTap,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneInstanceRef = useRef<WarpSpacetimeScene | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const t = translations[language];

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new WarpSpacetimeScene(mountRef.current, params);
    sceneInstanceRef.current = scene;
    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Responsive resize handler
    const handleResize = () => {
      if (!mountRef.current || !sceneInstanceRef.current) return;
      sceneInstanceRef.current.handleResize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      sceneInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Reactively propagate physics parameter updates to the active WebGL scene without re-mounting
  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateParams(params);
    }
  }, [params]);

  // Propagate visual style changes
  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.setVisualStyle(visualStyle);
    }
  }, [visualStyle]);

  // Propagate camera preset changes
  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.setCameraPreset(cameraPreset);
    }
  }, [cameraPreset]);

  // Propagate pause / unpause state
  useEffect(() => {
    if (sceneInstanceRef.current && isPaused !== undefined) {
      sceneInstanceRef.current.setPaused(isPaused);
    }
  }, [isPaused]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    if (dx < 12 && dy < 12) {
      if (onCanvasTap) {
        onCanvasTap();
      }
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Floating Viewport Quick Controls hint */}
      <div className="absolute bottom-24 right-4 pointer-events-none hidden md:flex flex-col items-end gap-1 font-mono-code text-[10px] text-slate-500">
        <span>{t.canvasHintRotate}</span>
        <span>{t.canvasHintZoom}</span>
        <span className="text-cyan-500/70">{t.canvasHintTap}</span>
      </div>
    </div>
  );
};
