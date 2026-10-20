/**
 * Holographic Equations Projector
 * Displays the mathematical foundations of the Alcubierre Warp Drive in a high-tech holographic HUD.
 */

import React, { useState } from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { WarpParameters } from '../physics/types';
import { Language, translations } from '../i18n/translations';

interface EquationsPanelProps {
  params: WarpParameters;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const EquationsPanel: React.FC<EquationsPanelProps> = ({
  params,
  isOpen,
  onClose,
  language = 'es',
}) => {
  const [selectedEquation, setSelectedEquation] = useState<number>(0);

  if (!isOpen) return null;

  const t = translations[language];

  const equations = language === 'es' ? [
    {
      title: '1. Métrica Espacio-Temporal de Alcubierre (1994)',
      symbol: 'ds²',
      latex: 'ds^2 = -c^2 dt^2 + [dx - v_s f(r_s) dt]^2 + dy^2 + dz^2',
      expanded: 'ds^2 = -(c^2 - v_s^2 f(r_s)^2) dt^2 - 2 v_s f(r_s) dx dt + dx^2 + dy^2 + dz^2',
      admSplit: 'Formalismo ADM 3+1: Lapso α = 1, Desplazamiento βⁱ = (-v_s f(r_s), 0, 0), Métrica espacial γᵢⱼ = δᵢⱼ',
      explanation:
        'El elemento de línea describe un espacio-tiempo donde el espacio plano es arrastrado con una velocidad aparente v_s en la dirección x. Dentro de la burbuja (f = 1), el espacio-tiempo es completamente plano y el tiempo propio coincide exactamente con el tiempo coordinado (dτ = dt). Fuera de la burbuja (f = 0), es el espacio de Minkowski ordinario.',
      currentValues: `v_s = ${params.velocity.toFixed(2)} c | Posición x_s = ${params.xCenter.toFixed(2)}`,
    },
    {
      title: '2. Función de Forma Analítica y Regularizada',
      symbol: 'f(rₛ)',
      latex: 'f(r_s) = \\frac{\\tanh[\\sigma(r_s + R)] - \\tanh[\\sigma(r_s - R)]}{2 \\tanh(\\sigma R)}',
      expanded: '\\lim_{r_s \\to 0} f(r_s) = 1 \\quad (\\text{interior}), \\qquad \\lim_{r_s \\gg R} f(r_s) = 0 \\quad (\\text{exterior})',
      admSplit: 'Derivada analítica libre de divergencias computada mediante sech²(u) = 1 - tanh²(u)',
      explanation:
        'La función de forma define el perfil geométrico de la burbuja. R es el radio de la burbuja interior y σ es el inverso del espesor de la pared cuántica (Δ ~ 1/σ). En el centro de la nave (r_s ~ 0), la función es constante f = 1, lo que anula cualquier fuerza de marea gravitacional que pudiera destruir la nave.',
      currentValues: `Radio R = ${params.bubbleRadius.toFixed(2)} | Nitidez σ = ${params.wallSharpness.toFixed(1)} | Espesor pared Δ ≈ ${(1 / params.wallSharpness).toFixed(3)} u`,
    },
    {
      title: '3. Escalar de Expansión Volumétrica (Curvatura de York)',
      symbol: 'θ (York)',
      latex: '\\theta = v_s \\frac{x - x_s}{r_s} \\frac{df}{dr_s}',
      expanded: 'r_s = \\sqrt{(x - x_s)^2 + y^2 + z^2}, \\qquad \\frac{df}{dr_s} \\le 0',
      admSplit: 'θ < 0 (Contracción espacial adelante) | θ > 0 (Expansión espacial detrás) | θ = 0 (Reposo local en la nave)',
      explanation:
        'La expansión fraccional del volumen de los observadores eulerianos es proporcional a la traza de la curvatura extrínseca (K = -θ). En el frente de la nave (x > x_s), el espacio se contrae (θ < 0), absorbiendo distancia hacia el destino. En la parte posterior (x < x_s), el espacio se expande (θ > 0), empujando la burbuja hacia adelante.',
      currentValues: `Curvatura de cresta estimada: ±${(params.velocity * 1.8).toFixed(2)} s⁻¹`,
    },
    {
      title: '4. Densidad de Energía para Observadores Eulerianos',
      symbol: 'T₀₀',
      latex: 'T_{00} = -\\frac{v_s^2 (y^2 + z^2)}{32 \\pi r_s^2} \\left( \\frac{df}{dr_s} \\right)^2',
      expanded: 'T_{00} \\le 0 \\quad \\forall (x, y, z) \\implies \\text{Violación de la Condición Débil de Energía (WEC)}',
      admSplit: 'En el eje central (y = z = 0): T₀₀ = 0. En la pared ecuatorial: Concentración de energía exótica negativa.',
      explanation:
        'De acuerdo con las ecuaciones de campo de Einstein G_μν = 8π T_μν, la geometría de Alcubierre exige una densidad de energía estrictamente negativa T₀₀ < 0 en la pared de la burbuja. Esto requiere materia exótica que viole la Condición Débil de Energía (WEC), similar al efecto Casimir dinámico a escalas cuánticas.',
      currentValues: `Corte HUD y = ${params.yCut.toFixed(1)} | Estado WEC: Violada en la pared`,
    },
  ] : [
    {
      title: '1. Alcubierre Spacetime Metric (1994)',
      symbol: 'ds²',
      latex: 'ds^2 = -c^2 dt^2 + [dx - v_s f(r_s) dt]^2 + dy^2 + dz^2',
      expanded: 'ds^2 = -(c^2 - v_s^2 f(r_s)^2) dt^2 - 2 v_s f(r_s) dx dt + dx^2 + dy^2 + dz^2',
      admSplit: 'ADM 3+1 Split: Lapse α = 1, Shift βⁱ = (-v_s f(r_s), 0, 0), Spatial 3-Metric γᵢⱼ = δᵢⱼ',
      explanation:
        'The line element describes a spacetime wherein flat space is dragged with apparent coordinate velocity v_s in the x direction. Inside the bubble (f = 1), spacetime is completely flat and proper time matches coordinate time (dτ = dt). Outside (f = 0), ordinary flat Minkowski space persists.',
      currentValues: `v_s = ${params.velocity.toFixed(2)} c | Bubble center x_s = ${params.xCenter.toFixed(2)}`,
    },
    {
      title: '2. Analytical Top-Hat Shape Function',
      symbol: 'f(rₛ)',
      latex: 'f(r_s) = \\frac{\\tanh[\\sigma(r_s + R)] - \\tanh[\\sigma(r_s - R)]}{2 \\tanh(\\sigma R)}',
      expanded: '\\lim_{r_s \\to 0} f(r_s) = 1 \\quad (\\text{interior}), \\qquad \\lim_{r_s \\gg R} f(r_s) = 0 \\quad (\\text{exterior})',
      admSplit: 'Divergence-free analytical derivative computed via sech²(u) = 1 - tanh²(u)',
      explanation:
        'The shape function dictates the geometric profile of the bubble. R is the interior radius and σ is the inverse wall thickness (Δ ~ 1/σ). At the ship center (r_s ~ 0), the function is flat and constant f = 1, vanishing tidal gravitational forces that would otherwise stress the hull.',
      currentValues: `Radius R = ${params.bubbleRadius.toFixed(2)} | Sharpness σ = ${params.wallSharpness.toFixed(1)} | Wall thickness Δ ≈ ${(1 / params.wallSharpness).toFixed(3)} u`,
    },
    {
      title: '3. Volume Expansion Scalar (York Extrinsic Curvature)',
      symbol: 'θ (York)',
      latex: '\\theta = v_s \\frac{x - x_s}{r_s} \\frac{df}{dr_s}',
      expanded: 'r_s = \\sqrt{(x - x_s)^2 + y^2 + z^2}, \\qquad \\frac{df}{dr_s} \\le 0',
      admSplit: 'θ < 0 (Forward spatial contraction) | θ > 0 (Rearward spatial expansion) | θ = 0 (Internal local rest)',
      explanation:
        'The fractional volume expansion rate of Eulerian observers is proportional to the trace of the extrinsic curvature (K = -θ). Ahead of the craft (x > x_s), space contracts (θ < 0), collapsing distance. Behind the craft (x < x_s), space expands (θ > 0), propelling the bubble forward.',
      currentValues: `Estimated peak crest curvature: ±${(params.velocity * 1.8).toFixed(2)} s⁻¹`,
    },
    {
      title: '4. Eulerian Energy-Momentum Density',
      symbol: 'T₀₀',
      latex: 'T_{00} = -\\frac{v_s^2 (y^2 + z^2)}{32 \\pi r_s^2} \\left( \\frac{df}{dr_s} \\right)^2',
      expanded: 'T_{00} \\le 0 \\quad \\forall (x, y, z) \\implies \\text{Weak Energy Condition (WEC) Violation}',
      admSplit: 'Central axis (y = z = 0): T₀₀ = 0. Equatorial toroidal band: Peak negative exotic density.',
      explanation:
        'From Einstein Field Equations G_μν = 8π T_μν, Alcubierre geometry necessitates strictly negative energy density T₀₀ < 0 in the bubble wall. This requires exotic matter violating the Weak Energy Condition (WEC), analogous to macroscopic quantum Casimir phenomena.',
      currentValues: `HUD transverse cut y = ${params.yCut.toFixed(1)} | WEC status: Violated in wall`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-3xl bg-slate-950/95 border-2 border-indigo-500/40 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Holographic Header */}
        <div className="p-4 bg-slate-900/90 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-orbitron text-sm font-bold text-indigo-200 uppercase tracking-wider">
                {t.equationsTitle}
              </h2>
              <p className="text-[10px] font-mono-code text-slate-400">
                {t.equationsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Equation Tab Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {equations.map((eq, i) => (
              <button
                key={i}
                onClick={() => setSelectedEquation(i)}
                className={`p-2.5 rounded-xl border text-left font-mono-code transition-all cursor-pointer ${
                  selectedEquation === i
                    ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-bold text-xs">{eq.symbol}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{eq.title.split('. ')[1]}</div>
              </button>
            ))}
          </div>

          {/* Active Equation Display */}
          {(() => {
            const eq = equations[selectedEquation];
            return (
              <div className="space-y-4">
                <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 shadow-inner">
                  <h3 className="font-orbitron text-xs font-bold text-indigo-300 uppercase">
                    {eq.title}
                  </h3>

                  {/* Primary Equation Holographic Container */}
                  <div className="my-3 p-3.5 bg-black/60 rounded-lg border border-indigo-500/20 text-center font-mono-code text-indigo-300 font-bold text-sm sm:text-base tracking-wide overflow-x-auto shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                    {eq.latex}
                  </div>

                  {/* Expanded notation */}
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-center font-mono-code text-cyan-300 text-xs overflow-x-auto">
                    {eq.expanded}
                  </div>

                  {/* ADM split */}
                  <div className="mt-2.5 text-[11px] font-mono-code text-amber-300/90 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                    <strong>{eq.admSplit}</strong>
                  </div>
                </div>

                {/* Physical Context */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <h4 className="font-orbitron text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {t.physicalInterpretation}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {eq.explanation}
                  </p>
                </div>

                {/* Real-time Parameter Bindings */}
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between text-xs font-mono-code">
                  <span className="text-cyan-400 font-semibold">{t.realTimeValues}</span>
                  <span className="text-cyan-200">{eq.currentValues}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-indigo-500/20 flex justify-between items-center text-[10px] font-mono-code text-slate-400">
          <span>{t.geometrizedUnits}</span>
          <span className="text-indigo-400">{t.warpBubbleBadge}</span>
        </div>
      </div>
    </div>
  );
};
