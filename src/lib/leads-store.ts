import { prisma } from './prisma';
import type { Lead as PrismaLead } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'quoted' | 'negotiation' | 'converted' | 'lost';
export type LeadSource = 'contact_form' | 'whatsapp' | 'phone' | 'referral' | 'walk_in' | 'social_media' | 'website' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType = 'note' | 'status_change' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'task' | 'system';

export interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface LeadTask {
  id: string;
  text: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
    avatar: string;
  };
  subject: string;
  message: string;
  serviceInterest: string;
  estimatedValue: number | null;
  tags: string[];
  activities: Activity[];
  tasks: LeadTask[];
  notes: { id: string; text: string; createdAt: string }[];
  assignedTo: string;
  lastContactedAt: string;
  nextFollowUp: string;
  lostReason: string;
  leadType: string;
  createdAt: string;
  updatedAt: string;
}

function toLead(l: PrismaLead): Lead {
  return {
    id: l.id,
    status: l.status as LeadStatus,
    priority: l.priority as LeadPriority,
    source: l.source as LeadSource,
    customer: l.customer as Lead['customer'],
    subject: l.subject,
    message: l.message,
    serviceInterest: l.serviceInterest,
    estimatedValue: l.estimatedValue === null ? null : Number(l.estimatedValue),
    tags: l.tags,
    activities: l.activities as unknown as Activity[],
    tasks: l.tasks as unknown as LeadTask[],
    notes: l.notes as Lead['notes'],
    assignedTo: l.assignedTo,
    lastContactedAt: l.lastContactedAt,
    nextFollowUp: l.nextFollowUp,
    lostReason: l.lostReason,
    leadType: l.leadType,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  return leads.map(toLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const l = await prisma.lead.findUnique({ where: { id } });
  return l ? toLead(l) : null;
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const customer = {
    name: data.customer?.name || '',
    email: data.customer?.email || '',
    phone: data.customer?.phone || '',
    company: data.customer?.company || '',
    position: data.customer?.position || '',
    avatar: data.customer?.avatar || '',
  };
  const activities: Activity[] = [
    { id: Date.now().toString(36), type: 'system', text: 'Lead creado', createdAt: new Date().toISOString() },
    ...(data.activities || []),
  ];

  const l = await prisma.lead.create({
    data: {
      ...data,
      customer,
      activities: activities as unknown as Prisma.InputJsonValue,
      tasks: (data.tasks || []) as unknown as Prisma.InputJsonValue,
      notes: (data.notes || []) as unknown as Prisma.InputJsonValue,
      tags: data.tags || [],
      estimatedValue: data.estimatedValue ?? undefined,
      leadType: data.leadType || 'general',
    },
  });
  return toLead(l);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
  const old = await prisma.lead.findUnique({ where: { id } });
  if (!old) return null;

  let activities = old.activities as unknown as Activity[];
  if (data.status && data.status !== old.status) {
    const act: Activity = {
      id: Date.now().toString(36) + 'sc',
      type: 'status_change',
      text: `Estado cambiado de "${old.status}" a "${data.status}"`,
      metadata: { from: old.status, to: data.status },
      createdAt: new Date().toISOString(),
    };
    activities = [...activities, act];
  }

  const { id: _id, createdAt: _createdAt, activities: _activities, ...rest } = data;
  const l = await prisma.lead.update({
    where: { id },
    data: {
      ...rest,
      activities: activities as unknown as Prisma.InputJsonValue,
      estimatedValue: rest.estimatedValue ?? undefined,
    } as unknown as Prisma.LeadUncheckedUpdateInput,
  });
  return toLead(l);
}

export async function addActivityToLead(
  id: string,
  type: ActivityType,
  text: string,
  metadata?: Record<string, string>
): Promise<Lead | null> {
  const old = await prisma.lead.findUnique({ where: { id } });
  if (!old) return null;
  const act: Activity = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    type,
    text,
    metadata,
    createdAt: new Date().toISOString(),
  };
  const activities = [...(old.activities as unknown as Activity[]), act];
  const isContact = type === 'call' || type === 'email' || type === 'whatsapp' || type === 'meeting';

  const l = await prisma.lead.update({
    where: { id },
    data: {
      activities: activities as unknown as Prisma.InputJsonValue,
      lastContactedAt: isContact ? new Date().toISOString() : old.lastContactedAt,
    },
  });
  return toLead(l);
}

export async function addNoteToLead(id: string, text: string): Promise<Lead | null> {
  const old = await prisma.lead.findUnique({ where: { id } });
  if (!old) return null;
  const note = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), text, createdAt: new Date().toISOString() };
  const notes = [...(old.notes as unknown as Lead['notes']), note];
  const act: Activity = {
    id: note.id + 'a',
    type: 'note',
    text: `Nota: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`,
    createdAt: new Date().toISOString(),
  };
  const activities = [...(old.activities as unknown as Activity[]), act];

  const l = await prisma.lead.update({ where: { id }, data: { notes: notes as unknown as Prisma.InputJsonValue, activities: activities as unknown as Prisma.InputJsonValue } });
  return toLead(l);
}

export async function addTaskToLead(id: string, text: string, dueDate: string): Promise<Lead | null> {
  const old = await prisma.lead.findUnique({ where: { id } });
  if (!old) return null;
  const task: LeadTask = { id: Date.now().toString(36), text, dueDate, completed: false, createdAt: new Date().toISOString() };
  const tasks = [...(old.tasks as unknown as LeadTask[]), task];
  const act: Activity = { id: task.id + 'ta', type: 'task', text: `Tarea creada: ${text}`, createdAt: new Date().toISOString() };
  const activities = [...(old.activities as unknown as Activity[]), act];

  const l = await prisma.lead.update({ where: { id }, data: { tasks: tasks as unknown as Prisma.InputJsonValue, activities: activities as unknown as Prisma.InputJsonValue } });
  return toLead(l);
}

export async function toggleTask(id: string, taskId: string): Promise<Lead | null> {
  const old = await prisma.lead.findUnique({ where: { id } });
  if (!old) return null;
  const tasks = (old.tasks as unknown as LeadTask[]).map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  if (!tasks.some((t) => t.id === taskId)) return null;

  const l = await prisma.lead.update({ where: { id }, data: { tasks: tasks as unknown as Prisma.InputJsonValue } });
  return toLead(l);
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    await prisma.lead.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getLeadStats() {
  const leads = await prisma.lead.findMany();
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const valueByStatus: Record<string, number> = {};
  let totalEstimated = 0;

  leads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;
    if (l.estimatedValue) {
      const v = Number(l.estimatedValue);
      totalEstimated += v;
      valueByStatus[l.status] = (valueByStatus[l.status] || 0) + v;
    }
  });

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const converted = leads.filter((l) => l.status === 'converted').length;
  const lost = leads.filter((l) => l.status === 'lost').length;
  const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

  return { total: leads.length, newLeads, converted, lost, conversionRate, totalEstimated, byStatus, bySource, byPriority, valueByStatus };
}
