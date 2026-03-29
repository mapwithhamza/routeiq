/**
 * src/pages/Riders.tsx — Phase 12 (UI Redesign)
 * 35/65 split, 550px+ map, rider cards with vehicle icons.
 * All API calls, hooks, Zod schemas, form handlers preserved.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Bike, Car, Truck, Trash2, X, MapPin, Users } from 'lucide-react';

import { ridersApi, deliveriesApi } from '../lib/api';
import { riderCreateSchema, type RiderCreateForm } from '../schemas';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import AddressAutocomplete from '../components/forms/AddressAutocomplete';

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  bike: Bike,
  car: Car,
  truck: Truck,
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  on_route:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  offline:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function Riders() {
  const queryClient = useQueryClient();
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResolved, setAddressResolved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RiderCreateForm>({
    resolver: zodResolver(riderCreateSchema),
    defaultValues: { vehicle_type: 'bike' },
  });

  const openModal = () => {
    setAddressSearch('');
    setAddressResolved(false);
    reset({ vehicle_type: 'bike' });
    setIsModalOpen(true);
  };

  const { data: riders, isLoading: ridersLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: ridersApi.list,
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: deliveriesApi.list,
  });

  const updateDeliveryMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => deliveriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery assigned successfully');
      setAssignDeliveryId('');
    },
    onError: () => toast.error('Failed to assign delivery'),
  });

  const createRiderMut = useMutation({
    mutationFn: ridersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider added successfully');
      setIsModalOpen(false);
      setAddressSearch('');
      setAddressResolved(false);
      reset({ vehicle_type: 'bike' });
    },
    onError: () => toast.error('Failed to add rider'),
  });

  const deleteMut = useMutation({
    mutationFn: ridersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider deleted');
    },
    onError: () => toast.error('Failed to delete rider'),
  });

  if (ridersLoading || deliveriesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-10 w-10 text-cyan-500" />
      </div>
    );
  }

  const unassignedDeliveries = deliveries?.filter(d => d.rider_id === null && d.status === 'pending') || [];

  const handleAssign = (riderId: number) => {
    if (!assignDeliveryId) return;
    updateDeliveryMut.mutate({
      id: Number(assignDeliveryId),
      data: { rider_id: riderId, status: 'assigned' },
    });
  };

  const activeRider = riders?.find(r => r.id === selectedRider);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-1">
            Fleet Management
          </p>
          <h1 className="text-3xl font-bold text-slate-100 dark:text-slate-100 text-slate-900 tracking-tight">
            Riders
          </h1>
          <p className="mt-1 text-slate-400 dark:text-slate-400 text-slate-500 text-sm">
            Track and manage your delivery fleet.
          </p>
        </div>
        <Button onClick={openModal}>
          <Plus size={16} className="mr-1.5" />
          Add Rider
        </Button>
      </div>

      {/* 35/65 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
        {/* Left: Rider Cards */}
        <div className="space-y-3">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total',     value: riders?.length || 0,                                          color: 'text-slate-300' },
              { label: 'Available', value: riders?.filter(r => r.status === 'available').length || 0,    color: 'text-emerald-400' },
              { label: 'On Route',  value: riders?.filter(r => r.status === 'on_route').length  || 0,    color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-3 text-center">
                <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Rider list */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
              <Users size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">Fleet Roster</h2>
            </div>
            <div className="divide-y divide-slate-700/30 max-h-[520px] overflow-y-auto">
              {riders?.map(rider => {
                const VehicleIcon = VEHICLE_ICONS[rider.vehicle_type || 'bike'] || Bike;
                const isSelected = selectedRider === rider.id;
                return (
                  <div
                    key={rider.id}
                    onClick={() => setSelectedRider(isSelected ? null : rider.id)}
                    className={`p-4 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                        : 'hover:bg-slate-700/20 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                        }`}>
                          <VehicleIcon size={16} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-100 dark:text-slate-100 text-slate-900 truncate">
                            {rider.name}
                          </h3>
                          <p className="text-xs text-slate-500 capitalize">{rider.vehicle_type || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          STATUS_STYLES[rider.status] || STATUS_STYLES.offline
                        }`}>
                          {rider.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete rider ${rider.name}?`)) deleteMut.mutate(rider.id);
                          }}
                          className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Assignment section */}
                    {isSelected && (
                      <div
                        className="mt-3 pt-3 border-t border-slate-700/40"
                        onClick={e => e.stopPropagation()}
                      >
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Assign Delivery
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700/60 px-2 py-1.5 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500/50 transition outline-none"
                            value={assignDeliveryId}
                            onChange={(e) => setAssignDeliveryId(e.target.value ? Number(e.target.value) : '')}
                          >
                            <option value="">Select delivery…</option>
                            {unassignedDeliveries.map(d => (
                              <option key={d.id} value={d.id}>{d.title}</option>
                            ))}
                          </select>
                          <Button
                            onClick={() => handleAssign(rider.id)}
                            disabled={!assignDeliveryId || updateDeliveryMut.isPending}
                            className="py-1 px-3 text-xs"
                          >
                            Assign
                          </Button>
                        </div>
                        {rider.current_lat && rider.current_lon && (
                          <p className="mt-2 text-[10px] text-slate-600 flex items-center gap-1">
                            <MapPin size={10} />
                            {rider.current_lat.toFixed(4)}, {rider.current_lon.toFixed(4)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!riders || riders.length === 0) && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <Users size={32} className="text-slate-700" />
                  <p className="text-sm text-slate-500 text-center">No riders configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map (65%) */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 overflow-hidden" style={{ minHeight: '560px' }}>
          <div className="px-5 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/40">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-200">Live Fleet Map</h2>
            </div>
            <div className="flex items-center gap-2">
              {activeRider && (
                <span className="text-xs text-cyan-400 font-medium">
                  Viewing: {activeRider.name}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {riders?.filter(r => r.current_lat && r.current_lon).length || 0} on map
              </span>
            </div>
          </div>
          <div className="relative" style={{ height: 'calc(100% - 49px)', minHeight: '511px' }}>
            <Map
              initialViewState={{
                longitude: 73.0479,
                latitude: 33.6844,
                zoom: 11,
              }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            >
              {riders?.map(rider => {
                if (rider.current_lat && rider.current_lon) {
                  const isSelected = selectedRider === rider.id;
                  return (
                    <Marker
                      key={rider.id}
                      longitude={rider.current_lon}
                      latitude={rider.current_lat}
                      anchor="bottom"
                      onClick={e => {
                        e.originalEvent.stopPropagation();
                        setSelectedRider(rider.id);
                      }}
                    >
                      <div className={`transition-all duration-200 ${isSelected ? 'scale-125' : 'scale-100'}`}>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 border-white shadow-cyan-500/50'
                            : 'bg-indigo-600 border-white/70 shadow-indigo-500/30'
                        }`}>
                          <Bike size={14} className="text-white" />
                        </div>
                        {isSelected && (
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-slate-900/90 rounded px-1 py-0.5">
                            {rider.name}
                          </div>
                        )}
                      </div>
                    </Marker>
                  );
                }
                return null;
              })}
            </Map>
          </div>
        </div>
      </div>

      {/* Add Rider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700/60 bg-slate-800 p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Users size={16} className="text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Add New Rider</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((d) => createRiderMut.mutate(d as any))}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Ali Khan"
                  className={`w-full rounded-lg bg-slate-900/60 border ${
                    errors.name ? 'border-red-500/60' : 'border-slate-700/60'
                  } px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/50 transition`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bike', 'car', 'truck'] as const).map((vt) => {
                    const VIcon = VEHICLE_ICONS[vt];
                    return (
                      <label
                        key={vt}
                        className="relative cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={vt}
                          {...register('vehicle_type')}
                          className="sr-only peer"
                        />
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-700/60 bg-slate-900/40 peer-checked:border-cyan-500/60 peer-checked:bg-cyan-500/10 transition capitalize text-slate-400 peer-checked:text-cyan-400 hover:border-slate-600">
                          <VIcon size={20} />
                          <span className="text-xs font-medium capitalize">{vt}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.vehicle_type && (
                  <p className="mt-1 text-xs text-red-500">{errors.vehicle_type.message}</p>
                )}
              </div>

              <div className="hidden">
                <input type="hidden" {...register('current_lat')} />
                <input type="hidden" {...register('current_lon')} />
              </div>
              <div className="z-50 relative">
                <AddressAutocomplete
                  label="Search Location"
                  value={addressSearch}
                  onChange={(val) => { setAddressSearch(val); }}
                  onSelect={(addr, lat, lon) => {
                    setAddressSearch(addr);
                    setValue('current_lat', lat, { shouldValidate: true });
                    setValue('current_lon', lon, { shouldValidate: true });
                    setAddressResolved(true);
                  }}
                  resolved={addressResolved}
                  onClearResolve={() => {
                    setAddressResolved(false);
                    setValue('current_lat', null as any);
                    setValue('current_lon', null as any);
                  }}
                  error={(errors.current_lat || errors.current_lon)?.message as string}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRiderMut.isPending}>
                  {createRiderMut.isPending ? 'Saving…' : 'Add Rider'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
