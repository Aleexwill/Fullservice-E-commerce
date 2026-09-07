'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Paperclip, Send, Loader2, ImageIcon, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export interface AsistenteResult {
  serviceTitle: string;
  serviceType: string;
  description: string;
  details: string;
  estimatedDuration: string;
  priority: string;
  estimatedValue: number;
  calculationData: any;
}

interface Props {
  onUsar: (result: AsistenteResult) => void;
  onCerrar: () => void;
}

export function PresupuestoAsistente({ onUsar, onCerrar }: Props) {
  const [texto, setTexto] = useState('');
  const [imagen, setImagen] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<AsistenteResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setImagen({ base64, mimeType: file.type, preview: dataUrl });
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const analizar = async () => {
    if (!texto.trim() && !imagen) {
      setError('Describí el servicio o adjuntá una imagen');
      return;
    }
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('/api/presupuestos/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() || undefined, imagen: imagen?.base64, mimeType: imagen?.mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');
      setResultado(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onCerrar}>
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-steel-900/40 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-muted">
            <Sparkles className="h-4 w-4 text-blue-bright" />
          </div>
          <div>
            <h2 className="font-display text-h4 text-arctic">Asistente de Presupuestos</h2>
            <p className="font-body text-caption text-steel-500">Describí el servicio o adjuntá la foto del cliente</p>
          </div>
          <button onClick={onCerrar} className="ml-auto rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(90vh - 72px)' }}>

          {/* Si no hay resultado todavía — mostrar input */}
          {!resultado && (
            <>
              {/* Textarea */}
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder={'Describí lo que necesita el cliente...\n\nEj: "Limpieza profunda de cocina industrial, empresa TWG SA, zona central, 200m²"'}
                className="input w-full resize-none font-body text-body-sm"
                rows={4}
                disabled={loading}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) analizar(); }}
              />

              {/* Imagen adjunta */}
              {imagen ? (
                <div className="mt-3 flex items-center gap-3 rounded-md border border-steel-900/40 bg-carbon p-3">
                  <img src={imagen.preview} alt="adjunto" className="h-14 w-14 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-body text-body-sm text-arctic">Imagen adjuntada</p>
                    <p className="font-body text-caption text-steel-500">{imagen.mimeType}</p>
                  </div>
                  <button onClick={() => setImagen(null)} className="rounded p-1 text-steel-500 hover:bg-steel-900 hover:text-danger-bright">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  ref={dropRef}
                  onDrop={onDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-steel-900/60 bg-carbon/50 py-5 transition-colors hover:border-blue/40 hover:bg-blue-muted/20"
                >
                  <ImageIcon className="h-6 w-6 text-steel-500" />
                  <p className="font-body text-caption text-steel-500">
                    Adjuntá la foto del cliente <span className="text-blue-bright">o arrastrala acá</span>
                  </p>
                  <p className="font-body text-[0.6rem] text-steel-700">JPG, PNG, WEBP — máx. 5 MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              {/* Error */}
              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-danger-light px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-danger-bright" />
                  <p className="font-body text-caption text-danger-bright">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="mt-4 flex gap-2">
                <button onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={analizar}
                  disabled={loading || (!texto.trim() && !imagen)}
                  className="btn-primary flex flex-1 items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando...</> : <><Sparkles className="h-4 w-4" /> Generar presupuesto</>}
                </button>
              </div>
              {!loading && (texto.trim() || imagen) && (
                <p className="mt-2 text-center font-body text-caption text-steel-700">Ctrl+Enter para enviar</p>
              )}
            </>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-success-light px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success-bright" />
                <p className="font-body text-caption text-success-bright">Presupuesto generado — revisá y ajustá antes de guardar</p>
              </div>

              {/* Resumen */}
              <div className="card p-4 space-y-3">
                <div>
                  <p className="font-body text-caption text-steel-500">Servicio</p>
                  <p className="font-display text-h4 text-arctic">{resultado.serviceTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-body text-caption text-steel-500">Tipo</p>
                    <p className="font-body text-body-sm capitalize text-arctic">{resultado.serviceType}</p>
                  </div>
                  <div>
                    <p className="font-body text-caption text-steel-500">Prioridad</p>
                    <p className="font-body text-body-sm capitalize text-arctic">{resultado.priority}</p>
                  </div>
                  <div>
                    <p className="font-body text-caption text-steel-500">Duración estimada</p>
                    <p className="font-body text-body-sm text-arctic">{resultado.estimatedDuration}</p>
                  </div>
                  <div>
                    <p className="font-body text-caption text-steel-500">Valor estimado</p>
                    <p className="font-mono text-body-sm text-yellow-bright">{gs(resultado.estimatedValue)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-body text-caption text-steel-500">Descripción</p>
                  <p className="font-body text-body-sm text-steel-300">{resultado.description}</p>
                </div>
              </div>

              {/* Rubros */}
              {resultado.calculationData?.filas?.length > 0 && (
                <div className="card overflow-hidden p-0">
                  <div className="border-b border-steel-900/40 px-4 py-2.5">
                    <p className="font-body text-caption font-medium uppercase tracking-[0.06em] text-steel-500">Planilla de costos ({resultado.calculationData.filas.length} ítems)</p>
                  </div>
                  <div className="divide-y divide-steel-900/20">
                    {resultado.calculationData.filas.slice(0, 8).map((f: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${f.tipo === 'titulo' ? 'bg-steel-900/30' : ''}`}>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase ${
                          f.tipo === 'titulo' ? 'bg-steel-700 text-arctic' :
                          f.tipo === 'material' ? 'bg-blue/20 text-blue-bright' :
                          f.tipo === 'mano_obra' ? 'bg-success-light text-success-bright' :
                          'bg-steel-900 text-steel-300'
                        }`}>
                          {f.tipo === 'titulo' ? 'T' : f.tipo === 'material' ? 'M' : f.tipo === 'mano_obra' ? 'MO' : 'O'}
                        </span>
                        <span className={`flex-1 font-body text-body-sm ${f.tipo === 'titulo' ? 'font-semibold text-arctic' : 'text-steel-300'}`}>{f.descripcion}</span>
                        {f.tipo !== 'titulo' && (
                          <span className="font-mono text-caption text-steel-500">{f.cantidad} {f.unidad}</span>
                        )}
                        {f.tipo !== 'titulo' && f.precioVenta > 0 && (
                          <span className="font-mono text-caption text-arctic">{gs(f.precioVenta)}</span>
                        )}
                      </div>
                    ))}
                    {resultado.calculationData.filas.length > 8 && (
                      <div className="px-4 py-2 text-center font-body text-caption text-steel-500">
                        +{resultado.calculationData.filas.length - 8} ítems más — visibles al abrir la planilla
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                <button onClick={() => setResultado(null)} className="btn-secondary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Volver a generar
                </button>
                <button onClick={() => onUsar(resultado)} className="btn-primary flex flex-1 items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Usar este presupuesto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
