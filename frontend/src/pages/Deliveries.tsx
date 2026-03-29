import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { deliveriesApi, ridersApi } from '../lib/api';
import { deliveryCreateSchema, deliveryUpdateSchema, type DeliveryCreateForm, type DeliveryUpdateForm } from '../schemas';
import type { Delivery } from '../types';

import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AddressAutocomplete from '../components/forms/AddressAutocomplete';

export default function Deliveries() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addressResolved, setAddressResolved] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in_transit': return 'info';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      default: return 'warning'; // assigned
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      default: return 'default';
    }
  };

  const getRiderName = (id: number | null) => {
    if (!id) return 'Unassigned';
    return riders?.find(r => r.id === id)?.name || `Rider #${id}`;
  };

  if (deliveriesLoading || ridersLoading) return <div className="flex h-full items-center justify-center"><Spinner className="h-10 w-10 text-indigo-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Deliveries</h1>
          <p className="mt-1 text-gray-400">Manage all your package deliveries and waypoints.</p>
        </div>
        <Button onClick={openAddModal}>+ New Delivery</Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rider</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {deliveries?.map((d) => (
                <tr key={d.id} className="hover:bg-gray-800/20 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{d.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{d.address || `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(d.status) as any}>{d.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getPriorityColor(d.priority) as any}>{d.priority}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {getRiderName(d.rider_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(d)} className="text-indigo-400 hover:text-indigo-300 mr-4 transition">Edit</button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete delivery ${d.title}?`)) deleteMut.mutate(d.id);
                      }} 
                      className="text-red-400 hover:text-red-300 transition"
                      disabled={deleteMut.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No deliveries found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Delivery' : 'New Delivery'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              {...register('title')}
              className="w-full rounded-lg bg-gray-800 border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
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
              onChange={(val) => {
                setValue('address', val);
              }}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg bg-gray-800 border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Assign Rider</label>
              <select
                {...register('rider_id', { setValueAs: v => (v === "" || v === "null" || !v) ? null : parseInt(v, 10) })}
                className="w-full rounded-lg bg-gray-800 border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {riders?.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg bg-gray-800 border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
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

          <div className="pt-4 flex justify-end gap-3">
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
