'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2, XCircle, RefreshCw, MessageSquare,
  ChevronDown, ChevronUp, Loader2, History, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast';

interface ApprovalNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  type: string;
}

interface PresupuestoBasic {
  id: string;
  code: string;
  serviceTitle: string;
  status: string;
  customer: { name?: string } | null;
  notes?: ApprovalNote[];
}

interface UserPerms {
  canAprobarPresupuestos: boolean;
}

type ApprovalAction = 'aprobar' | 'rechazar' | 'solicitar_cambios';

const ACTION_CONFIG: Record<ApprovalAction, {
  label: string;
  icon: React.ElementType;
  confirmLabel: string;
  requireComment: boolean;
  commentPlaceholder: string;
  colorClass: string;
  confirmColorClass: string;
}> = {
  aprobar: {
    label: 'Aprobar',
    icon: CheckCircle2,
    confirmLabel: 'Confirmar aprobación',
    requireComment: false,
    commentPlaceholder: 'Comentario de aprobación (opcional)…',
    colorClass: 'border-success-bright/30 bg-success-light/10 text-success-bright hover:bg-success-light/20',
    confirmColorClass: 'bg-success-bright text-carbon hover:bg-success-bright/90',
  },
  rechazar: {
    label: 'Rechazar',
    icon: XCircle,
    confirmLabel: 'Confirmar rechazo',
    requireComment: true,
    commentPlaceholder: 'Motivo del rechazo (requerido)…',
    colorClass: 'border-danger-bright/30 bg-danger-light/10 text-danger-bright hover:bg-danger-light/20',
    confirmColorClass: 'bg-danger-bright text-white hover:bg-danger-bright/90',
  },
  solicitar_cambios: {
    label: 'Solicitar cambios',
    icon: RefreshCw,
    confirmLabel: 'Confirmar solicitud',
    requireComment: true,
    commentPlaceholder: 'Describe los cambios requeridos (requerido)…',
    colorClass: 'border-yellow/30 bg-yellow-muted/20 text-yellow-bright hover:bg-yellow-muted/40',
    confirmColorClass: 'bg-yellow text-carbon hover:bg-yellow/90',
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

function ApprovalHistory({ notes }: { notes: ApprovalNote[] }) {
  const approvalNotes = notes.filter((n) => n.type === 'aprobacion');
  if (approvalNotes.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="flex items-center gap-1.5 font-body text-[0.65rem] font-semibold uppercase tracking-wider text-steel-500">
        <History className="h-3 w-3" />
        Historial de revisión
      </p>
      {approvalNotes.map((n) => (
        <div key={n.id} className="rounded-md border border-steel-900/40 bg-carbon/60 px-3 py-2">
          <p className="font-body text-body-sm text-arctic">{n.text}</p>
          <p className="mt-0.5 font-body text-[0.6rem] text-steel-600">{timeAgo(n.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

export default function PresupuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [presupuesto, setPresupuesto] = useState<PresupuestoBasic | null>(null);
  const [perms, setPerms] = useState<UserPerms | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const [activeAction, setActiveAction] = useState<ApprovalAction | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true);
  const [infoBannerExpanded, setInfoBannerExpanded] = useState(true);

  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/presupuestos/${id}`).then((r) => r.ok ? r.json() : null),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]).then(([p, me]) => {
      if (p) setPresupuesto(p);
      if (me?.permissions) setPerms(me.permissions);
      setLoadingPerms(false);
    }).catch(() => setLoadingPerms(false));
  }, [id]);

  useEffect(() => {
    if (activeAction) setTimeout(() => commentRef.current?.focus(), 50);
  }, [activeAction]);

  const status = presupuesto?.status;
  const notes = presupuesto?.notes ?? [];
  const approvalNotes = notes.filter((n) => n.type === 'aprobacion');
  const lastApprovalNote = approvalNotes[approvalNotes.length - 1];

  const showApprovalBanner =
    !loadingPerms &&
    status === 'pendiente_aprobacion' &&
    perms?.canAprobarPresupuestos;

  const showRevisionBanner = !loadingPerms && status === 'en_revision' && !!lastApprovalNote;
  const showRejectedBanner = !loadingPerms && status === 'de_baja' && !!lastApprovalNote;

  async function handleSubmit() {
    if (!activeAction) return;
    const cfg = ACTION_CONFIG[activeAction];
    if (cfg.requireComment && !comment.trim()) {
      showToast('El comentario es requerido para esta acción', 'error');
      commentRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/presupuestos/${id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: activeAction, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al procesar la acción', 'error');
      } else {
        const labels: Record<ApprovalAction, string> = {
          aprobar: 'Presupuesto aprobado',
          rechazar: 'Presupuesto rechazado',
          solicitar_cambios: 'Cambios solicitados',
        };
        showToast(labels[activeAction], 'success');
        setActiveAction(null);
        setComment('');
        // Update full presupuesto so notes are reflected immediately
        if (data.presupuesto) {
          setPresupuesto(data.presupuesto);
        } else {
          setPresupuesto((prev) => prev ? { ...prev, status: data.status } : prev);
        }
        router.refresh();
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>

      {/* Banner: cambios solicitados (en_revision) */}
      {showRevisionBanner && (
        <div className="shrink-0 border-b border-yellow/30 bg-yellow-muted/10">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-muted text-yellow-bright">
                <RefreshCw className="h-3 w-3" />
              </div>
              <p className="font-body text-body-sm font-semibold text-yellow-bright">
                Se solicitaron cambios
              </p>
              {!infoBannerExpanded && (
                <p className="truncate max-w-xs font-body text-caption text-steel-400">
                  {lastApprovalNote.text}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setInfoBannerExpanded((v) => !v)}
              className="rounded p-1 text-steel-500 hover:bg-steel-900/50 hover:text-arctic transition-colors"
              title={infoBannerExpanded ? 'Minimizar' : 'Expandir'}
            >
              {infoBannerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {infoBannerExpanded && (
            <div className="border-t border-yellow/20 px-4 pb-3 pt-2">
              <p className="font-body text-body-sm text-arctic">{lastApprovalNote.text}</p>
              <p className="mt-1 font-body text-[0.6rem] text-steel-600">{timeAgo(lastApprovalNote.createdAt)}</p>
              {approvalNotes.length > 1 && <ApprovalHistory notes={notes} />}
            </div>
          )}
        </div>
      )}

      {/* Banner: rechazado (de_baja) */}
      {showRejectedBanner && (
        <div className="shrink-0 border-b border-danger-bright/30 bg-danger-light/10">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger-light text-danger-bright">
                <AlertCircle className="h-3 w-3" />
              </div>
              <p className="font-body text-body-sm font-semibold text-danger-bright">
                Presupuesto rechazado
              </p>
              {!infoBannerExpanded && (
                <p className="truncate max-w-xs font-body text-caption text-steel-400">
                  {lastApprovalNote.text}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setInfoBannerExpanded((v) => !v)}
              className="rounded p-1 text-steel-500 hover:bg-steel-900/50 hover:text-arctic transition-colors"
              title={infoBannerExpanded ? 'Minimizar' : 'Expandir'}
            >
              {infoBannerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {infoBannerExpanded && (
            <div className="border-t border-danger-bright/20 px-4 pb-3 pt-2">
              <p className="font-body text-body-sm text-arctic">{lastApprovalNote.text}</p>
              <p className="mt-1 font-body text-[0.6rem] text-steel-600">{timeAgo(lastApprovalNote.createdAt)}</p>
              {approvalNotes.length > 1 && <ApprovalHistory notes={notes} />}
            </div>
          )}
        </div>
      )}

      {/* Banner: pendiente de aprobación */}
      {showApprovalBanner && (
        <div className="shrink-0 border-b border-yellow/30 bg-yellow-muted/15">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-muted text-yellow-bright">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-body text-body-sm font-semibold text-arctic">
                  Pendiente de tu aprobación
                </p>
                <p className="font-body text-caption text-steel-400">
                  {presupuesto?.code}{presupuesto?.customer?.name ? ` — ${presupuesto.customer.name}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBannerExpanded((v) => !v)}
              className="rounded p-1 text-steel-500 hover:bg-steel-900/50 hover:text-arctic transition-colors"
              title={bannerExpanded ? 'Colapsar' : 'Expandir'}
            >
              {bannerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {bannerExpanded && (
            <div className="border-t border-yellow/20 px-4 pb-4 pt-3">
              {/* Previous approval history (e.g. prior change requests) */}
              {approvalNotes.length > 0 && (
                <ApprovalHistory notes={notes} />
              )}

              {/* Action selector */}
              <div className={`flex flex-wrap gap-2 ${approvalNotes.length > 0 ? 'mt-3' : ''}`}>
                {(Object.keys(ACTION_CONFIG) as ApprovalAction[]).map((action) => {
                  const cfg = ACTION_CONFIG[action];
                  const Icon = cfg.icon;
                  const isActive = activeAction === action;
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setActiveAction(isActive ? null : action);
                        setComment('');
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-body text-body-sm font-medium transition-all ${
                        isActive ? `${cfg.colorClass} ring-2 ring-current/40` : cfg.colorClass
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Comment + confirm */}
              {activeAction && (() => {
                const ConfirmIcon = ACTION_CONFIG[activeAction].icon;
                return (
                  <div className="mt-3 space-y-2">
                    <textarea
                      ref={commentRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={ACTION_CONFIG[activeAction].commentPlaceholder}
                      rows={2}
                      className="input w-full resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || (ACTION_CONFIG[activeAction].requireComment && !comment.trim())}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body text-body-sm font-semibold transition-all disabled:opacity-50 ${ACTION_CONFIG[activeAction].confirmColorClass}`}
                      >
                        {submitting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <ConfirmIcon className="h-4 w-4" />
                        }
                        {submitting ? 'Procesando…' : ACTION_CONFIG[activeAction].confirmLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveAction(null); setComment(''); }}
                        className="rounded-lg px-3 py-2 font-body text-body-sm text-steel-400 hover:text-arctic transition-colors"
                      >
                        Cancelar
                      </button>
                      {ACTION_CONFIG[activeAction].requireComment && !comment.trim() && (
                        <p className="font-body text-caption text-yellow-bright">
                          El comentario es requerido
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Iframe */}
      <iframe
        key={id}
        src={`/costos.html?id=${id}&_t=${id}`}
        className="w-full flex-1 border-none"
        title="Costos y Propuesta"
      />
    </div>
  );
}
