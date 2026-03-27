import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { ridersApi, deliveriesApi } from '../lib/api';
import { riderCreateSchema, type RiderCreateForm } from '../schemas';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function Riders() {
  const queryClient = useQueryClient();
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RiderCreateForm>({
    resolver: zodResolver(riderCreateSchema),
    defaultValues: { vehicle_type: 'bike' },
  });

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
      reset();
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
    return <div className="flex h-full items-center justify-center"><Spinner className="h-10 w-10 text-indigo-500" /></div>;
  }

  const unassignedDeliveries = deliveries?.filter(d => d.rider_id === null && d.status === 'pending') || [];

  const handleAssign = (riderId: number) => {
    if (!assignDeliveryId) return;
    updateDeliveryMut.mutate({
      id: Number(assignDeliveryId),
      data: { rider_id: riderId, status: 'assigned' },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Riders</h1>
          <p className="mt-1 text-gray-400">Track and manage your delivery fleet.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Rider</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rider List & Assignment */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Fleet Roster</h2>
            <div className="space-y-3">
              {riders?.map(rider => (
                <div 
                  key={rider.id}
                  onClick={() => setSelectedRider(rider.id)}
                  className={`group p-4 rounded-xl border transition cursor-pointer ${
                    selectedRider === rider.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{rider.name}</h3>
                      <p className="text-xs text-gray-400">{rider.vehicle_type || 'Unknown vehicle'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={rider.status === 'available' ? 'success' : rider.status === 'on_route' ? 'info' : 'default'}>
                        {rider.status.replace('_', ' ')}
                      </Badge>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete rider ${rider.name}?`)) deleteMut.mutate(rider.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        disabled={deleteMut.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Assignment Dropdown (visible if selected) */}
                  {selectedRider === rider.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50" onClick={e => e.stopPropagation()}>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Assign Delivery</label>
                      <div className="flex items-center gap-2">
                        <select 
                          className="flex-1 rounded-lg bg-gray-950 border border-gray-700 px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                          value={assignDeliveryId}
                          onChange={(e) => setAssignDeliveryId(e.target.value ? Number(e.target.value) : '')}
                        >
                          <option value="">Select a delivery...</option>
                          {unassignedDeliveries.map(d => (
                            <option key={d.id} value={d.id}>{d.title}</option>
                          ))}
                        </select>
                        <Button 
                          onClick={() => handleAssign(rider.id)} 
                          disabled={!assignDeliveryId || updateDeliveryMut.isPending}
                          className="py-1.5 px-3"
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!riders || riders.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No riders configured.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Map */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <h2 className="text-lg font-semibold text-white">Live Fleet Map</h2>
              <Badge variant="info">{riders?.filter(r => r.current_lat && r.current_lon).length || 0} Drivers on map</Badge>
            </div>
            <div className="flex-1 relative">
              <Map
                initialViewState={{
                  longitude: 73.0479, // Default approx Islamabad
                  latitude: 33.6844,
                  zoom: 11
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
                        <div className={`p-1 rounded-full cursor-pointer transition ${isSelected ? 'bg-white' : 'bg-transparent'}`}>
                          <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-2a1 1 0 00-1-1H3M11 9l1.5-3.5A2 2 0 0114.34 4h1V2h-1a4 4 0 00-3.68 2.32L9.5 7H7v2h4z" />
                            </svg>
                          </div>
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
      </div>

      {/* Add Rider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Rider</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit((d) => createRiderMut.mutate(d as any))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Ali Khan"
                  className={`w-full rounded-lg bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-700'} px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle Type</label>
                <select
                  {...register('vehicle_type')}
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="truck">Truck</option>
                </select>
                {errors.vehicle_type && <p className="mt-1 text-xs text-red-500">{errors.vehicle_type.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
                  <input
                    {...register('current_lat', { setValueAs: v => v === "" ? null : parseFloat(v) })}
                    type="number"
                    step="any"
                    placeholder="33.6844"
                    className={`w-full rounded-lg bg-gray-800 border ${errors.current_lat ? 'border-red-500' : 'border-gray-700'} px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.current_lat && <p className="mt-1 text-xs text-red-500">{errors.current_lat.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
                  <input
                    {...register('current_lon', { setValueAs: v => v === "" ? null : parseFloat(v) })}
                    type="number"
                    step="any"
                    placeholder="73.0479"
                    className={`w-full rounded-lg bg-gray-800 border ${errors.current_lon ? 'border-red-500' : 'border-gray-700'} px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.current_lon && <p className="mt-1 text-xs text-red-500">{errors.current_lon.message}</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRiderMut.isPending}>
                  {createRiderMut.isPending ? 'Saving...' : 'Add Rider'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
