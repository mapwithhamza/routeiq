/**
 * src/schemas/index.ts — Zod schemas mirroring backend Pydantic models.
 * Used with react-hook-form via @hookform/resolvers/zod.
 */
import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
});
export type RegisterForm = z.infer<typeof registerSchema>;

// ── Delivery ──────────────────────────────────────────────────────────────────

export const deliveryPriorities = ['low', 'normal', 'high', 'urgent'] as const;
export const deliveryStatuses = [
  'pending',
  'assigned',
  'in_transit',
  'delivered',
  'failed',
] as const;

export const deliveryCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  address: z.string().max(500).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  priority: z.enum(deliveryPriorities).default('normal'),
  rider_id: z.number().int().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type DeliveryCreateForm = z.infer<typeof deliveryCreateSchema>;

export const deliveryUpdateSchema = deliveryCreateSchema.partial().extend({
  status: z.enum(deliveryStatuses).optional(),
});
export type DeliveryUpdateForm = z.infer<typeof deliveryUpdateSchema>;

// ── Rider ─────────────────────────────────────────────────────────────────────

export const riderCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().max(20).optional().nullable(),
  vehicle_type: z.string().max(100).optional().nullable(),
  current_lat: z.number().min(-90).max(90).optional().nullable(),
  current_lon: z.number().min(-180).max(180).optional().nullable(),
});
export type RiderCreateForm = z.infer<typeof riderCreateSchema>;

export const riderUpdateSchema = riderCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type RiderUpdateForm = z.infer<typeof riderUpdateSchema>;

// ── Route Optimization ────────────────────────────────────────────────────────

export const waypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  label: z.string().optional().nullable(),
});

export const optimizeRequestSchema = z.object({
  name: z.string().max(255).default('Optimized Route'),
  rider_id: z.number().int().positive().optional().nullable(),
  waypoints: z.array(waypointSchema).min(2, 'At least 2 waypoints required'),
});
export type OptimizeRequestForm = z.infer<typeof optimizeRequestSchema>;
