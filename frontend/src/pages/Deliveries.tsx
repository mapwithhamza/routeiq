/**
 * src/pages/Deliveries.tsx — Phase 12 (UI Redesign)
 * Filter tabs, clean table, colored badges, modal with scaleIn animation.
 * All API calls, hooks, Zod schemas, form handlers preserved untouched.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

import { deliveriesApi, ridersApi } from '../lib/api';
import { deliveryCreateSchema, deliveryUpdateSchema, type DeliveryCreateForm, type DeliveryUpdateForm } from '../schemas';
import type { Delivery } from '../types';

import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AddressAutocomplete from '../components/forms/AddressAutocomplete';

type FilterTab = 'all' | 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-slate-500/15 text-slate-300 border-slate-500/30',
  assigned:   'bg-violet-500/15 text-violet-400 border-violet-500/30',
  in_transit: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  delivered:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:     'bg-red-500/15 text-red-400 border-red-500/30',
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  high:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  normal: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  low:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function ColBadge({ text, styleClass }: { text: string; styleClass: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClass}`}>
      {text.replace('_', ' ')}
    </span>
  );
}

export default function Deliveries() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addressResolved, setAddressResolved] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Queries
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: deliveriesApi.list,
  });

  const { data: riders, isLoading: ridersLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: ridersApi.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeliveryCreateForm | DeliveryUpdateForm>({
    resolver: zodResolver(editingId ? deliveryUpdateSchema : deliveryCreateSchema),
    defaultValues: { priority: 'normal', status: 'pending' },
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: deliveriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery created');
      closeModal();
    },
    onError: () => toast.error('Failed to create delivery'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeliveryUpdateForm }) => deliveriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery updated');
      closeModal();
    },
    onError: () => toast.error('Failed to update delivery'),
  });

  const deleteMut = useMutation({
    mutationFn: deliveriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery deleted');
    },
    onError: () => toast.error('Failed to delete delivery'),
  });

  const openAddModal = () => {
    setEditingId(null);
    setAddressResolved(false);
    reset({ priority: 'normal', status: 'pending', title: '', address: '', lat: 0, lon: 0, notes: '', rider_id: null });
    setModalOpen(true);
  };

  const openEditModal = (d: Delivery) => {
    setEditingId(d.id);
    setAddressResolved(!!d.address && d.lat !== 0 && d.lon !== 0);
    reset({
      title: d.title,
      address: d.address || '',
      lat: d.lat,
      lon: d.lon,
      priority: d.priority,
      status: d.status,
      rider_id: d.rider_id,
      notes: d.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: DeliveryCreateForm | DeliveryUpdateForm) => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: data as DeliveryUpdateForm });
    } else {
      createMut.mutate(data as DeliveryCreateForm);
    }
  };

  const getRiderName = (id: number | null) => {
    if (!id) return 'Unassigned';
    return riders?.find(r => r.id === id)?.name || `Rider #${id}`;
  };

  if (deliveriesLoading || ridersLoading) return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-10 w-10 text-cyan-500" />
    </div>
  );

  const filteredDeliveries = activeTab === 'all'
    ? deliveries || []
    : (deliveries || []).filter(d => d.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in bg-[#F0F2F5] dark:bg-[#0D1117] p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">
            Fleet Management
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">
            Deliveries
          </h1>
          <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
            Manage all package deliveries and waypoints.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} className="mr-1.5" />
          New Delivery
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl shadow-sm bg-white dark:bg-[#1C2128] p-1 w-fit flex-wrap">
        {FILTER_TABS.map(({ key, label }) => {
          const count = key === 'all'
            ? deliveries?.length || 0
            : deliveries?.filter(d => d.status === key).length || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === key
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-100 dark:border-transparent'
                  : 'text-gray-500 dark:text-[#8B949E] hover:text-gray-900 border border-transparent dark:hover:text-[#E6EDF3] hover:bg-gray-50 dark:hover:bg-[#262D36]'
              }`}
            >
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                activeTab === key ? 'bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300' : 'bg-gray-100 dark:bg-[#262D36] text-gray-500 dark:text-[#8B949E]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl shadow-md border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#30363D]">
            <thead className="bg-gray-50 dark:bg-[#161B22]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Priority</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Rider</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#30363D]">
              {filteredDeliveries.map((d) => (
                <tr key={d.id} className="bg-white dark:bg-[#1C2128] hover:bg-gray-50 dark:hover:bg-[#262D36] transition group">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#161B22] border border-gray-200 dark:border-transparent flex items-center justify-center shrink-0">
                        <Package size={14} className="text-gray-500 dark:text-[#8B949E]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-[#E6EDF3]">{d.title}</div>
                        <div className="text-xs text-gray-500 dark:text-[#8B949E] truncate max-w-xs">
                          {d.address || `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <ColBadge text={d.status} styleClass={STATUS_STYLES[d.status] || STATUS_STYLES.pending} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <ColBadge text={d.priority} styleClass={PRIORITY_STYLES[d.priority] || PRIORITY_STYLES.normal} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#8B949E]">
                    {getRiderName(d.rider_id)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete delivery "${d.title}"?`)) deleteMut.mutate(d.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        title="Delete"
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDeliveries.length === 0 && (
                <tr className="bg-white dark:bg-[#1C2128]">
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Package size={36} className="text-gray-300 dark:text-[#30363D] mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-[#8B949E]">
                      {activeTab === 'all' ? 'No deliveries yet. Create one to get started.' : `No ${activeTab} deliveries.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Delivery' : 'New Delivery'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-scale-in">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Package to Gulberg"
              className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition"
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message as string}</p>}
          </div>

          <div className="hidden">
            <input type="hidden" {...register('lat', { valueAsNumber: true })} />
            <input type="hidden" {...register('lon', { valueAsNumber: true })} />
            <input type="hidden" {...register('address')} />
          </div>

          <div className="z-50 relative">
            <AddressAutocomplete
              label="Search Address"
              value={watch('address') || ''}
              onChange={(val) => { setValue('address', val); }}
              onSelect={(addr, lat, lon) => {
                setValue('address', addr, { shouldValidate: true });
                setValue('lat', lat, { shouldValidate: true });
                setValue('lon', lon, { shouldValidate: true });
                setAddressResolved(true);
              }}
              resolved={addressResolved}
              onClearResolve={() => {
                setAddressResolved(false);
                setValue('lat', '' as any);
                setValue('lon', '' as any);
              }}
              error={(errors.address || errors.lat || errors.lon)?.message as string}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign Rider</label>
              <select
                {...register('rider_id', { setValueAs: v => (v === '' || v === 'null' || !v) ? null : parseInt(v, 10) })}
                className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="">Unassigned</option>
                {riders?.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {editingId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={createMut.isPending || updateMut.isPending}>
              {editingId ? 'Save Changes' : 'Create Delivery'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
