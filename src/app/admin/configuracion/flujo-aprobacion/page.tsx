'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '@/lib/utils';
import { useToast } from '@/components/admin/toast';
import {
  GitBranch, Plus, Trash2, ChevronUp, ChevronDown, Save, RefreshCw,
  CheckCircle2, Circle, ArrowRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';

type ApproverRole = 'gerencia' | 'administracion' | 'comercial' | 'planner';

interface FlowStep {
  order: number;
  role: ApproverRole;
  label: string;
  required: boolean;
}

interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: FlowStep[];
  createdAt: string;
  updatedAt: string;
}

const APPROVER_ROLES: { value: ApproverRole; label: string }[] = [
  { value: 'comercial', label: ROLE_LABELS.comercial },
  { value: 'planner', label: ROLE_LABELS.planner },
  { value: 'administracion', label: ROLE_LABELS.administracion },
  { value: 'gerencia', label: ROLE_LABELS.gerencia },
];

const ROLE_COLORS: Record<ApproverRole, string> = {
  comercial: 'badge-blue',
  planner: 'badge-yellow',
  administracion: 'border border-steel-700 bg-steel-900/50 text-steel-300 px-2 py-0.5 rounded text-caption font-medium',
  gerencia: 'border border-success-bright/30 bg-success-light/10 text-success-bright px-2 py-0.5 rounded text-caption font-medium',
};

function RoleBadge({ role }: { role: ApproverRole }) {
  const cls = ROLE_COLORS[role] || 'badge-blue';
  const simple = cls.startsWith('badge-');
  return simple
    ? <span className={cls}>{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</span>
    : <span className={cls}>{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</span>;
}

export default function FlujoAprobacionPage() {
  const { showToast } = useToast();
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFlow, setActiveFlow] = useState<ApprovalFlow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSteps, setEditSteps] = useState<FlowStep[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [dirty, setDirty] = useState(false);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    const data = await fetchJson<{ flows: ApprovalFlow[] }>('/api/approval-flows');
    if (data) {
      setFlows(data.flows);
      const active = data.flows.find((f) => f.isActive) || data.flows[0] || null;
      selectFlow(active);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadFlows(); }, [loadFlows]);

  function selectFlow(flow: ApprovalFlow | null) {
    setActiveFlow(flow);
    if (flow) {
      setEditName(flow.name);
      setEditDesc(flow.description);
      setEditSteps((flow.steps as FlowStep[]).sort((a, b) => a.order - b.order));
      setEditActive(flow.isActive);
    }
    setDirty(false);
  }

  async function handleCreateFlow() {
    setSaving(true);
    const data = await fetchJson<{ flow: ApprovalFlow }>('/api/approval-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nuevo flujo de aprobacion',
        description: '',
        isActive: flows.length === 0,
        steps: [],
      }),
    });
    if (data?.flow) {
      setFlows((prev) => [...prev, data.flow]);
      selectFlow(data.flow);
      showToast('Flujo creado', 'success');
    } else {
      showToast('No se pudo crear el flujo', 'error');
    }
    setSaving(false);
  }

  async function handleSave() {
    if (!activeFlow) return;
    setSaving(true);
    const steps = editSteps.map((s, i) => ({ ...s, order: i + 1 }));
    const data = await fetchJson<{ flow: ApprovalFlow }>(`/api/approval-flows/${activeFlow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, isActive: editActive, steps }),
    });
    if (data?.flow) {
      setFlows((prev) => prev.map((f) => (f.id === data.flow.id ? data.flow : f)));
      setActiveFlow(data.flow);
      setEditSteps(steps);
      setDirty(false);
      showToast('Flujo guardado', 'success');
    } else {
      showToast('No se pudo guardar el flujo', 'error');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este flujo de aprobacion?')) return;
    const data = await fetchJson<{ ok: boolean }>(`/api/approval-flows/${id}`, { method: 'DELETE' });
    if (data?.ok) {
      const remaining = flows.filter((f) => f.id !== id);
      setFlows(remaining);
      selectFlow(remaining[0] || null);
      showToast('Flujo eliminado', 'success');
    } else {
      showToast('No se pudo eliminar', 'error');
    }
  }

  function addStep() {
    const newStep: FlowStep = {
      order: editSteps.length + 1,
      role: 'comercial',
      label: 'Aprobacion',
      required: true,
    };
    setEditSteps((prev) => [...prev, newStep]);
    setDirty(true);
  }

  function removeStep(index: number) {
    setEditSteps((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function moveStep(index: number, dir: -1 | 1) {
    const next = [...editSteps];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setEditSteps(next);
    setDirty(true);
  }

  function updateStep(index: number, field: keyof FlowStep, value: unknown) {
    setEditSteps((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    setDirty(true);
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Flujo de Aprobación</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">
            Configure los pasos requeridos para aprobar presupuestos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadFlows} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button onClick={handleCreateFlow} disabled={saving} className="btn-secondary">
            <Plus className="h-4 w-4" />
            Nuevo flujo
          </button>
          {dirty && activeFlow && (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="h-4 w-48 rounded bg-steel-900" />
              <div className="mt-2 h-3 w-64 rounded bg-steel-900" />
            </div>
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="card p-12 text-center">
          <GitBranch className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin flujos configurados</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">
            Crea un flujo para definir quién debe aprobar cada presupuesto.
          </p>
          <button onClick={handleCreateFlow} disabled={saving} className="btn-primary mt-6 inline-flex">
            <Plus className="h-4 w-4" />
            Crear primer flujo
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Flow list sidebar */}
          <div className="space-y-2">
            <p className="font-body text-caption uppercase tracking-[0.06em] text-steel-500">Flujos disponibles</p>
            {flows.map((flow) => (
              <button
                key={flow.id}
                onClick={() => selectFlow(flow)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                  activeFlow?.id === flow.id
                    ? 'border-blue/30 bg-blue-muted/40 text-arctic'
                    : 'border-steel-900/40 bg-carbon-light text-steel-300 hover:border-steel-700 hover:text-arctic'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-body-sm font-medium truncate">{flow.name}</span>
                  {flow.isActive
                    ? <span className="badge-green ml-2 shrink-0">Activo</span>
                    : <span className="badge-neutral ml-2 shrink-0">Inactivo</span>
                  }
                </div>
                <p className="mt-0.5 font-body text-caption text-steel-500">
                  {(flow.steps as FlowStep[]).length} paso{(flow.steps as FlowStep[]).length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Editor */}
          {activeFlow && (
            <div className="space-y-4">
              {/* Flow meta */}
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <label className="mb-1 block font-body text-caption text-steel-400">Nombre del flujo</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setDirty(true); }}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-body text-caption text-steel-400">Descripción (opcional)</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => { setEditDesc(e.target.value); setDirty(true); }}
                        placeholder="Para qué tipo de servicios aplica este flujo"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditActive((v) => !v); setDirty(true); }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-steel-900/50"
                    >
                      {editActive
                        ? <ToggleRight className="h-6 w-6 text-success-bright" />
                        : <ToggleLeft className="h-6 w-6 text-steel-500" />
                      }
                      <span className="font-body text-body-sm text-steel-300">
                        {editActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(activeFlow.id)}
                      className="flex items-center gap-1 rounded px-2 py-1 font-body text-caption text-steel-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-h4 text-arctic">Pasos de aprobación</h3>
                  <button onClick={addStep} className="btn-secondary text-sm py-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Agregar paso
                  </button>
                </div>

                {editSteps.length === 0 ? (
                  <div className="py-8 text-center">
                    <Circle className="mx-auto h-8 w-8 text-steel-700" />
                    <p className="mt-2 font-body text-body-sm text-steel-500">
                      Sin pasos configurados. Agrega al menos un paso para activar el flujo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editSteps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-steel-900/40 bg-carbon p-3"
                      >
                        {/* Order badge */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-steel-900 font-mono text-caption text-steel-400">
                          {i + 1}
                        </div>

                        {/* Role select */}
                        <select
                          value={step.role}
                          onChange={(e) => updateStep(i, 'role', e.target.value as ApproverRole)}
                          className="input w-auto flex-1"
                        >
                          {APPROVER_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>

                        {/* Label input */}
                        <input
                          type="text"
                          value={step.label}
                          onChange={(e) => updateStep(i, 'label', e.target.value)}
                          placeholder="Etiqueta del paso"
                          className="input flex-1"
                        />

                        {/* Required toggle */}
                        <button
                          type="button"
                          onClick={() => updateStep(i, 'required', !step.required)}
                          className="flex items-center gap-1 rounded px-2 py-1 font-body text-caption transition-colors hover:bg-steel-900/50"
                          title={step.required ? 'Requerido' : 'Opcional'}
                        >
                          {step.required
                            ? <CheckCircle2 className="h-4 w-4 text-success-bright" />
                            : <Circle className="h-4 w-4 text-steel-500" />
                          }
                          <span className={step.required ? 'text-success-bright' : 'text-steel-500'}>
                            {step.required ? 'Req.' : 'Opt.'}
                          </span>
                        </button>

                        {/* Move up/down */}
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveStep(i, -1)}
                            disabled={i === 0}
                            className="rounded p-0.5 text-steel-600 hover:text-steel-300 disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(i, 1)}
                            disabled={i === editSteps.length - 1}
                            className="rounded p-0.5 text-steel-600 hover:text-steel-300 disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeStep(i)}
                          className="rounded p-1.5 text-steel-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flow preview */}
              {editSteps.length > 0 && (
                <div className="card p-4">
                  <h3 className="mb-3 font-display text-h4 text-arctic">Vista previa del flujo</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-body text-caption text-steel-500">Presupuesto</span>
                    {editSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-steel-600" />
                        <div className="flex flex-col items-center gap-0.5">
                          <RoleBadge role={step.role} />
                          <span className="font-body text-[0.6rem] text-steel-600">{step.label}</span>
                        </div>
                      </div>
                    ))}
                    <ArrowRight className="h-3.5 w-3.5 text-steel-600" />
                    <span className="badge-green">Aprobado</span>
                  </div>
                </div>
              )}

              {/* Save button */}
              {dirty && (
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
