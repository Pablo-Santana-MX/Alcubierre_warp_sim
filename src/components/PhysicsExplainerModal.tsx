/**
 * Educational Modal: "Física Posible, Energía Exótica y Límites de la Métrica de Alcubierre"
 * Comprehensive, scientifically rigorous explainer grounded in peer-reviewed general relativity.
 */

import React from 'react';
import { X, CheckCircle, AlertTriangle, Globe, Atom, Zap } from 'lucide-react';
import { analyzeEnergyConditions } from '../physics/alcubierrePhysics';
import { WarpParameters } from '../physics/types';
import { Language, translations } from '../i18n/translations';

interface PhysicsExplainerModalProps {
  params: WarpParameters;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const PhysicsExplainerModal: React.FC<PhysicsExplainerModalProps> = ({
  params,
  isOpen,
  onClose,
  language = 'es',
}) => {
  if (!isOpen) return null;

  const analysis = analyzeEnergyConditions(params);
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl clay-crystal-panel overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Atom className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-orbitron text-sm font-bold text-cyan-200 uppercase tracking-wider">
                {t.explainerTitle}
              </h2>
              <p className="text-[10px] font-mono-code text-slate-400">
                {t.explainerSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl clay-button text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5 text-cyan-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
          {/* Current parameter diagnostics */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
            <div className="font-orbitron text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              {t.diagnosticTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-code text-[11px]">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">{t.regimeLabel}</span>
                <span className={`font-bold ${params.velocity > 1.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {params.velocity > 1.0 ? t.superluminalEffective : t.subluminalRelativistic}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">{t.wecLabel}</span>
                <span className="text-red-400 font-bold">{t.wecViolatedText}</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">{t.exoticMassLabel}</span>
                <span className="text-amber-300 font-bold">{analysis.estimatedExoticMassKg}</span>
              </div>
            </div>
          </div>

          {language === 'es' ? (
            <>
              {/* Section 1: ¿Por qué no viola la Relatividad Especial? */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  1. ¿Por qué la métrica no rompe la velocidad de la luz localmente?
                </h3>
                <p>
                  En la <strong>Relatividad Especial</strong>, ningún objeto material con masa puede superar la velocidad de la luz (c) dentro de su marco inercial local. Sin embargo, en la <strong>Relatividad General</strong>, el tejido mismo del espacio-tiempo no tiene límite de velocidad para expandirse o contraerse (como lo demuestra la inflación cósmica del Big Bang).
                </p>
                <p>
                  La nave espacial se mantiene <strong>estacionaria y en caída libre dentro de la burbuja plana central</strong> (donde f = 1 y df/dr = 0). Para los tripulantes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono-code text-[11px]">
                  <li>Fuerzas G de aceleración: <strong>0 g (Gravedad cero local)</strong></li>
                  <li>Dilatación temporal: <strong>dτ/dt = 1 (No hay paradoja de los gemelos)</strong></li>
                  <li>Fuerzas de marea gravitacional en la nave: <strong>Cero (espacio plano interno)</strong></li>
                </ul>
              </div>

              {/* Section 2: La Condición de Energía y la Materia Exótica */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  2. El Gran Reto: Densidad de Energía Negativa (T₀₀ &lt; 0)
                </h3>
                <p>
                  La ecuación de Alcubierre requiere una franja de materia con densidad de energía negativa en la pared de la burbuja, violando la <em>Weak Energy Condition (WEC)</em>.
                </p>
                <p>
                  La física cuántica ya ha verificado experimentalmente la existencia de densidades de energía negativas en el <strong>Efecto Casimir</strong> (fuerzas de atracción entre dos placas conductoras neutras en el vacío debido a la supresión de modos cuánticos).
                </p>
              </div>

              {/* Section 3: Evolución de las Soluciones Científicas */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  3. Optimizaciones Históricas de la Literatura Física
                </h3>
                <div className="space-y-2 text-[11px] font-mono-code text-slate-300">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <strong className="text-cyan-300">Alcubierre (1994):</strong> Estimación inicial de energía exótica equivalente a -10⁶⁴ kg (mayor a la masa del universo visible).
                  </div>
                  <div className="border-l-2 border-indigo-400 pl-3">
                    <strong className="text-indigo-300">Van Den Broeck (1999):</strong> Geometría con bolsillo espacial interior amplio y cuello exterior minúsculo. Redujo el requisito a fracciones de masa solar (~10³⁰ kg).
                  </div>
                  <div className="border-l-2 border-emerald-400 pl-3">
                    <strong className="text-emerald-300">White-Juday / NASA Eagleworks (2012):</strong> Suavizado del gradiente de pared y resonancia toroidal en oscilación, proyectando requisitos de masa exótica a ~700 kg.
                  </div>
                  <div className="border-l-2 border-purple-400 pl-3">
                    <strong className="text-purple-300">Bobrick & Martire / Lentz (2021):</strong> Búsqueda de solitones hiperlumínicos y configuraciones con plasma clásico y distribuciones energéticas positivas.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Section 1: Why does it not violate Special Relativity? */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  1. Why does the metric not violate Special Relativity locally?
                </h3>
                <p>
                  In <strong>Special Relativity</strong>, no material entity with mass can exceed the speed of light (c) inside its local inertial frame. However, in <strong>General Relativity</strong>, the fabric of spacetime itself is not constrained by any speed limit when contracting or expanding (as demonstrated by primordial cosmic inflation).
                </p>
                <p>
                  The spaceship remains <strong>at rest and in geodesic free-fall inside the central flat bubble</strong> (where f = 1 and df/dr = 0). For the crew onboard:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono-code text-[11px]">
                  <li>Acceleration G-forces: <strong>0 g (Zero local acceleration / weightlessness)</strong></li>
                  <li>Time dilation: <strong>dτ/dt = 1 (No twin paradox / clocks tick normally)</strong></li>
                  <li>Tidal shear forces: <strong>Zero across the central volume</strong></li>
                </ul>
              </div>

              {/* Section 2: Energy Condition and Exotic Matter */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  2. The Core Challenge: Negative Energy Density (T₀₀ &lt; 0)
                </h3>
                <p>
                  The Alcubierre field equation requires a toroidal band of negative energy density along the bubble walls, violating the classical <em>Weak Energy Condition (WEC)</em>.
                </p>
                <p>
                  Quantum physics has already experimentally observed negative Casimir energy densities in laboratory settings (attractive van der Waals forces between neutral conductive plates due to quantum zero-point mode exclusion).
                </p>
              </div>

              {/* Section 3: Historical Physical Literature */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="font-orbitron text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  3. Key Physical Milestones & Refinements
                </h3>
                <div className="space-y-2 text-[11px] font-mono-code text-slate-300">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <strong className="text-cyan-300">Alcubierre (1994):</strong> Original naive derivation requiring ~ -10⁶⁴ kg of exotic energy (exceeding total mass of observable universe).
                  </div>
                  <div className="border-l-2 border-indigo-400 pl-3">
                    <strong className="text-indigo-300">Van Den Broeck (1999):</strong> Microscopic neck geometry with microscopic external throat, dropping exotic mass requirements to solar-mass orders (~10³⁰ kg).
                  </div>
                  <div className="border-l-2 border-emerald-400 pl-3">
                    <strong className="text-emerald-300">White-Juday / NASA Eagleworks (2012):</strong> Softened bubble transition boundary and toroidal oscillatory warping, estimating mass budget down to ~700 kg.
                  </div>
                  <div className="border-l-2 border-purple-400 pl-3">
                    <strong className="text-purple-300">Bobrick & Martire / Lentz (2021):</strong> Positive-energy physical soliton warp metrics and modified lapse distributions.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-cyan-500/20 flex justify-between items-center text-[10px] font-mono-code text-slate-400">
          <span>{language === 'es' ? 'Relatividad General Computacional' : 'Computational General Relativity'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            {t.understoodButton}
          </button>
        </div>
      </div>
    </div>
  );
};
