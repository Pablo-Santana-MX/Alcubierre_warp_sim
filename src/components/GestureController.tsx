/**
 * Air Gestures & Spatial Touch Controller
 * Provides intuitive multi-touch spatial manipulation and experimental webcam air gesture detection
 * allowing users to sculpt the gravitational metric directly with hand gestures.
 */

import React, { useState, useRef, useEffect } from 'react';
import { WarpParameters } from '../physics/types';
import { Hand, Camera, X, Move, Zap } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface GestureControllerProps {
  params: WarpParameters;
  onUpdateParams: (newParams: Partial<WarpParameters>) => void;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const GestureController: React.FC<GestureControllerProps> = ({
  params,
  onUpdateParams,
  isOpen,
  onClose,
  language = 'es',
}) => {
  const [activeMode, setActiveMode] = useState<'touch_pad' | 'camera_air'>('touch_pad');
  const t = translations[language];
  const [lastAction, setLastAction] = useState<string>(t.waitingInteraction);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamPermissionError, setWebcamPermissionError] = useState<string | null>(null);

  // Touch pad tracking
  const padRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef<boolean>(false);
  const [puckPos, setPuckPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Camera air gestures refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // Handle spatial touch pad interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    isInteractingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePuckFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current) return;
    updatePuckFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isInteractingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if pointer capture already lost
    }
  };

  const updatePuckFromEvent = (e: React.PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const clampedY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const normX = clampedX / rect.width;   // 0 (left) to 1 (right)
    const normY = clampedY / rect.height;  // 0 (top) to 1 (bottom)

    setPuckPos({ x: normX * 100, y: normY * 100 });

    // Map normX -> velocity (0.1 to 6.0 c)
    const newVelocity = 0.1 + normX * 5.9;
    // Map normY -> wall sharpness sigma (14.0 at top -> 1.0 at bottom)
    const newSharpness = 1.0 + (1.0 - normY) * 13.0;

    // Shift key alters bubble radius
    if (e.shiftKey) {
      const newRadius = 0.3 + normX * 1.9;
      onUpdateParams({
        bubbleRadius: parseFloat(newRadius.toFixed(2)),
        wallSharpness: parseFloat(newSharpness.toFixed(1)),
      });
      setLastAction(`Modificando Radio R = ${newRadius.toFixed(2)} u | σ = ${newSharpness.toFixed(1)}`);
    } else {
      onUpdateParams({
        velocity: parseFloat(newVelocity.toFixed(2)),
        wallSharpness: parseFloat(newSharpness.toFixed(1)),
      });
      setLastAction(`v = ${newVelocity.toFixed(2)}c | σ = ${newSharpness.toFixed(1)}`);
    }
  };

  // Webcam Air Gesture Processing
  const startWebcam = async () => {
    setWebcamPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 160, height: 120, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamActive(true);
        setActiveMode('camera_air');
        setLastAction(language === 'es' ? 'Cámara conectada. Mueve la mano frente a la lente.' : 'Camera active. Move hand in front of lens.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setWebcamPermissionError(
        language === 'es'
          ? `Acceso a cámara denegado o no disponible (${errorMsg}). Usa el pad táctil.`
          : `Camera access denied or unavailable (${errorMsg}). Please use the touch pad.`
      );
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsWebcamActive(false);
  };

  useEffect(() => {
    if (!isWebcamActive) return;

    let isRunning = true;
    const processFrame = () => {
      if (!isRunning) return;
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, 80, 60);
          const frame = ctx.getImageData(0, 0, 80, 60);
          const data = frame.data;

          if (prevFrameDataRef.current) {
            const prev = prevFrameDataRef.current;
            let leftDiff = 0;
            let rightDiff = 0;
            let topDiff = 0;
            let bottomDiff = 0;

            for (let y = 0; y < 60; y++) {
              for (let x = 0; x < 80; x++) {
                const idx = (y * 80 + x) * 4;
                const d = Math.abs(data[idx] - prev[idx]) +
                          Math.abs(data[idx + 1] - prev[idx + 1]) +
                          Math.abs(data[idx + 2] - prev[idx + 2]);

                if (d > 75) {
                  if (x < 40) leftDiff += d;
                  else rightDiff += d;

                  if (y < 30) topDiff += d;
                  else bottomDiff += d;
                }
              }
            }

            const threshold = 18000;
            if (rightDiff > threshold && rightDiff > leftDiff * 1.6) {
              const newVel = Math.min(6.0, params.velocity + 0.08);
              onUpdateParams({ velocity: parseFloat(newVel.toFixed(2)) });
              setLastAction(language === 'es' ? `[Gesto Derecha] Acelerando v -> ${newVel.toFixed(2)}c` : `[Right Wave] Accelerating v -> ${newVel.toFixed(2)}c`);
            } else if (leftDiff > threshold && leftDiff > rightDiff * 1.6) {
              const newVel = Math.max(0.1, params.velocity - 0.08);
              onUpdateParams({ velocity: parseFloat(newVel.toFixed(2)) });
              setLastAction(language === 'es' ? `[Gesto Izquierda] Desacelerando v -> ${newVel.toFixed(2)}c` : `[Left Wave] Decelerating v -> ${newVel.toFixed(2)}c`);
            } else if (topDiff > threshold && topDiff > bottomDiff * 1.6) {
              const newSharp = Math.min(14.0, params.wallSharpness + 0.15);
              onUpdateParams({ wallSharpness: parseFloat(newSharp.toFixed(1)) });
              setLastAction(language === 'es' ? `[Mano Arriba] Aumentando Nitidez σ -> ${newSharp.toFixed(1)}` : `[Hand Up] Increasing Wall Sharpness σ -> ${newSharp.toFixed(1)}`);
            }
          }

          prevFrameDataRef.current = new Uint8ClampedArray(data);
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isWebcamActive, params.velocity, params.wallSharpness, onUpdateParams, language]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4 select-none">
      <div className="bg-slate-950/95 border border-cyan-400/50 rounded-2xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron text-sm font-bold text-cyan-300 uppercase tracking-wider">
              {t.gesturesTitle}
            </h2>
          </div>
          <button
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => {
              stopWebcam();
              setActiveMode('touch_pad');
            }}
            className={`py-2 px-3 rounded-xl font-mono-code text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'touch_pad'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Move className="w-4 h-4" />
            <span>{t.modeTouchPad}</span>
          </button>

          <button
            onClick={startWebcam}
            className={`py-2 px-3 rounded-xl font-mono-code text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'camera_air'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{t.modeCameraAir}</span>
          </button>
        </div>

        {/* Feedback Bar */}
        <div className="mt-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono-code">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            {t.statusLabel}
          </span>
          <span className="text-slate-200 font-semibold truncate max-w-[280px]">
            {lastAction}
          </span>
        </div>

        {/* Touch Pad Mode */}
        {activeMode === 'touch_pad' && (
          <div className="mt-4">
            <div
              ref={padRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full h-56 bg-slate-900/90 border-2 border-dashed border-cyan-500/40 rounded-xl overflow-hidden cursor-crosshair touch-none flex items-center justify-center"
            >
              {/* Radial grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]" />
              <div className="absolute w-full h-[1px] bg-cyan-500/20 top-1/2 -translate-y-1/2" />
              <div className="absolute h-full w-[1px] bg-cyan-500/20 left-1/2 -translate-x-1/2" />

              {/* Axes Guides */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono-code text-cyan-400/80">
                {t.highExotic}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono-code text-cyan-400/80">
                {t.lowExotic}
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono-code text-cyan-400/80 -rotate-90">
                {t.brakeWarp}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono-code text-cyan-400/80 rotate-90">
                {t.accelerateWarp}
              </div>

              {/* Holographic Puck Indicator */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-cyan-400/30 border-2 border-cyan-300 shadow-[0_0_20px_#22d3ee] flex items-center justify-center pointer-events-none transition-transform"
                style={{
                  left: `${puckPos.x}%`,
                  top: `${puckPos.y}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-200" />
              </div>
            </div>

            <div className="mt-3 text-[11px] font-mono-code text-slate-400 space-y-1">
              <p>{t.touchTip1}</p>
              <p>{t.touchTip2}</p>
            </div>
          </div>
        )}

        {/* Camera Air Gestures Mode */}
        {activeMode === 'camera_air' && (
          <div className="mt-4 space-y-3">
            {webcamPermissionError ? (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs font-mono-code text-red-300">
                {webcamPermissionError}
              </div>
            ) : (
              <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden border border-cyan-500/40 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100 opacity-60"
                />
                <canvas ref={canvasRef} width={80} height={60} className="hidden" />

                <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/30 rounded-xl flex items-center justify-center">
                  <div className="w-32 h-32 border border-dashed border-cyan-400/60 rounded-full animate-spin [animation-duration:15s]" />
                  <div className="absolute text-center text-xs font-mono-code text-cyan-200 drop-shadow">
                    {t.cameraInstruction}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono-code text-slate-300 space-y-1.5">
              <div className="font-semibold text-cyan-300">{t.airGuideTitle}</div>
              <div>{t.airGuide1}</div>
              <div>{t.airGuide2}</div>
              <div>{t.airGuide3}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
