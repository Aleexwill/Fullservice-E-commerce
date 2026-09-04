'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type AiConfidence = 'alta' | 'media' | 'baja';

export interface PresupuestoAiSuggestion {
  id: string;
  original: string;
  corregido: string;
  titulo: string;
  alcance: string;
  confianza?: AiConfidence;
  advertencia?: string;
}

interface Props {
  suggestion: PresupuestoAiSuggestion;
  onUseCorrected: () => void;
  onUseTechnical: () => void;
  onUseScope: () => void;
  onApplyTechnicalAndScope: () => void;
  onClose: () => void;
}

const confidenceLabel: Record<AiConfidence, string> = {
  alta: 'Confianza alta',
  media: 'Confianza media',
  baja: 'Confianza baja',
};

export function PresupuestoAiSuggestionPanel({
  suggestion,
  onUseCorrected,
  onUseTechnical,
  onUseScope,
  onApplyTechnicalAndScope,
  onClose,
}: Props) {
  const confidence = suggestion.confianza ?? 'media';

  return (
    <div className="mx-2 mb-2 flex flex-col gap-3 rounded-lg border border-blue-bright/20 bg-blue-bright/5 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-body text-[0.6rem] font-semibold uppercase tracking-wider text-blue-bright/70">Sugerencias IA</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-steel-800/60 px-2 py-0.5 font-body text-[0.58rem] text-steel-400">
            {confidence === 'alta' ? <CheckCircle2 className="h-3 w-3 text-[#48BB78]" /> : <AlertCircle className="h-3 w-3 text-yellow-400" />}
            {confidenceLabel[confidence]}
          </span>
        </div>
        <button onClick={onClose} aria-label="Cerrar sugerencias" className="rounded p-1 text-steel-600 transition-colors hover:bg-steel-800/50 hover:text-steel-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {suggestion.advertencia && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
          <p className="font-body text-caption leading-relaxed text-yellow-200/80">{suggestion.advertencia}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-md border border-steel-800/60 bg-steel-900/40 px-2.5 py-2">
          <p className="font-body text-[0.55rem] font-semibold uppercase tracking-wider text-steel-400">Corrección ortográfica</p>
          <p className="flex-1 font-body text-body-sm leading-snug text-steel-200">{suggestion.corregido}</p>
          <button onClick={onUseCorrected} className="self-start rounded border border-steel-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-steel-400 transition-colors hover:border-steel-500 hover:text-arctic">Usar título</button>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-blue-bright/25 bg-blue-bright/5 px-2.5 py-2">
          <p className="font-body text-[0.55rem] font-semibold uppercase tracking-wider text-blue-bright/70">Título técnico</p>
          <p className="flex-1 font-body text-body-sm font-semibold leading-snug text-arctic">{suggestion.titulo}</p>
          <button onClick={onUseTechnical} className="self-start rounded border border-blue-bright/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-bright transition-colors hover:bg-blue-bright/10">Usar título</button>
        </div>
      </div>

      {suggestion.alcance && (
        <div className="rounded-md border border-steel-800/50 bg-carbon/40 px-2.5 py-2">
          <p className="mb-1 font-body text-[0.58rem] font-semibold uppercase tracking-wider text-steel-500">Alcance de trabajos</p>
          <p className="font-body text-body-sm leading-relaxed text-steel-300">{suggestion.alcance}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={onUseScope} className="rounded border border-steel-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-steel-400 transition-colors hover:border-steel-500 hover:text-arctic">Usar alcance</button>
            <button onClick={onApplyTechnicalAndScope} className="rounded border border-blue-bright/30 bg-blue-bright/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-bright transition-colors hover:bg-blue-bright/20">Aplicar título + alcance</button>
          </div>
        </div>
      )}
    </div>
  );
}
