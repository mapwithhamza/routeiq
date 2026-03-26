import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { ridersApi, deliveriesApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function Riders() {
  const queryClient = useQueryClient();
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | ''>('');

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
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Riders</h1>
        <p className="mt-1 text-gray-400">Track and manage your delivery fleet.</p>
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
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedRider === rider.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{rider.name}</h3>
                      <p className="text-xs text-gray-400">{rider.vehicle_type || 'Unknown vehicle'}</p>
                    </div>
                    <Badge variant={rider.is_active ? 'success' : 'default'}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
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
    </div>
  );
}
