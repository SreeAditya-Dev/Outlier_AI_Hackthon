import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from '@/hooks/useUserData';
import { Route, Location, Vehicle } from '@/types/supabase';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, MapPin, Edit, Eye, Play, Ban, Clock, Truck, Package } from 'lucide-react';
import Map from '@/components/Map';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Form schema for route editing
const routeEditSchema = z.object({
  cargo_weight: z.coerce.number().min(0.1, { message: 'Cargo weight must be greater than 0.' }),
  cargo_type: z.string().min(1, { message: 'Cargo type is required.' }),
  vehicle_id: z.string().min(1, { message: 'Vehicle is required.' }),
});

type RouteEditFormValues = z.infer<typeof routeEditSchema>;

interface EnrichedRoute extends Route {
  origin?: Location;
  destination?: Location;
  vehicle?: Vehicle;
}

const CARGO_TYPES = [
  'Food & Beverages',
  'Electronics',
  'Furniture',
  'Clothing & Textiles',
  'Construction Materials',
  'Chemicals',
  'Agricultural Products',
  'Automotive Parts',
  'Machinery',
  'Medical Supplies',
  'Other'
];

const RouteManager = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [selectedRoute, setSelectedRoute] = useState<EnrichedRoute | null>(null);
  const [viewingRoute, setViewingRoute] = useState<EnrichedRoute | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch routes
  const { data: routes, isLoading, refetch } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await (supabase as any)
        .from('routes')
        .select(`
          *,
          origin:origin_id (id, name, address, city, state, latitude, longitude),
          destination:destination_id (id, name, address, city, state, latitude, longitude),
          vehicle:vehicle_id (id, registration_number, type, max_weight, fuel_type, status)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data as EnrichedRoute[];
    },
    enabled: !!profile?.organization_id && !!user?.id,
  });

  // Fetch vehicles for the dropdown
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-routes'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'Available');
      
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!profile?.organization_id,
  });

  // Form for editing route
  const form = useForm<RouteEditFormValues>({
    resolver: zodResolver(routeEditSchema),
    defaultValues: {
      cargo_weight: 0,
      cargo_type: '',
      vehicle_id: '',
    }
  });

  // Update form values when selected route changes
  useEffect(() => {
    if (selectedRoute) {
      form.reset({
        cargo_weight: selectedRoute.cargo_weight || 0,
        cargo_type: selectedRoute.cargo_type || '',
        vehicle_id: selectedRoute.vehicle_id || '',
      });
    }
  }, [selectedRoute, form]);

  // Update route mutation
  const updateMutation = useMutation({
    mutationFn: async (values: RouteEditFormValues) => {
      if (!selectedRoute?.id) {
        throw new Error('No route selected');
      }
      
      const updateData: Record<string, any> = {
        cargo_weight: values.cargo_weight,
        cargo_type: values.cargo_type,
        vehicle_id: values.vehicle_id,
        updated_at: new Date().toISOString()
      };

      // Add notes conditionally if it exists in the form values
      if (values.notes) {
        updateData.description = values.notes;
      }

      console.log('Updating route with data:', updateData);

      const { data, error } = await (supabase as any)
        .from('routes')
        .update(updateData)
        .eq('id', selectedRoute.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      return data as Route;
    },
    onSuccess: () => {
      toast.success('Route updated successfully');
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update route');
    },
  });

  // Handle edit dialog open
  const handleEditRoute = (route: EnrichedRoute) => {
    setSelectedRoute(route);
    setIsEditDialogOpen(true);
  };

  // Handle view dialog open
  const handleViewRoute = (route: EnrichedRoute) => {
    setViewingRoute(route);
    setIsViewDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: RouteEditFormValues) => {
    updateMutation.mutate(values);
  };

  // Get status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    switch (status) {
      case 'PLANNED':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planned</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format duration from minutes
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Handle start trip button
  const handleStartTrip = (routeId: string) => {
    navigate(`/route/${routeId}/start`);
  };

  // Handle cancel route
  const cancelRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      const { data, error } = await supabase
        .from('routes')
        .update({ status: 'CANCELLED' })
        .eq('id', routeId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Route;
    },
    onSuccess: () => {
      toast.success('Route cancelled successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel route');
    },
  });

  // Loading state
  if (isLoading || isUserLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="w-full max-w-md text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading routes...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 relative top-[20px]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Routes</h1>
            <p className="text-muted-foreground">
              Manage and track your planned routes
            </p>
          </div>
          <Button onClick={() => navigate('/create-route')}>
            Create New Route
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Routes</CardTitle>
            <CardDescription>
              View and manage routes you've created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!routes || routes.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Routes Found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't created any routes yet.
                </p>
                <Button onClick={() => navigate('/create-route')}>
                  Create Your First Route
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>{route.origin?.name || 'Unknown'}</TableCell>
                      <TableCell>{route.destination?.name || 'Unknown'}</TableCell>
                      <TableCell>{route.distance_km ? `${route.distance_km.toFixed(1)} km` : 'N/A'}</TableCell>
                      <TableCell>{formatDuration(route.estimated_time_mins)}</TableCell>
                      <TableCell>{route.vehicle?.registration_number || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(route.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleViewRoute(route)}
                            title="View Route"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {route.status === 'PLANNED' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEditRoute(route)}
                                title="Edit Route"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleStartTrip(route.id)}
                                title="Start Trip"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => 
                                  confirm('Are you sure you want to cancel this route?') && 
                                  cancelRouteMutation.mutate(route.id)
                                }
                                title="Cancel Route"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Route Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Route Details</DialogTitle>
            <DialogDescription>
              Viewing route from {viewingRoute?.origin?.name} to {viewingRoute?.destination?.name}
            </DialogDescription>
          </DialogHeader>
          
          {viewingRoute && (
            <div className="grid gap-6">
              <div className="h-[300px] bg-slate-100 rounded-md overflow-hidden">
                {viewingRoute.origin && viewingRoute.destination && (
                  <Map
                    start={`${viewingRoute.origin.name}, ${viewingRoute.origin.city}, ${viewingRoute.origin.state}`}
                    destination={`${viewingRoute.destination.name}, ${viewingRoute.destination.city}, ${viewingRoute.destination.state}`}
                    selectedRoute={{
                      id: 1,
                      name: 'Primary Route',
                      isRecommended: true,
                      distance: viewingRoute.distance_km || 0,
                      duration: viewingRoute.estimated_time_mins || 0,
                      tollCost: 0,
                      fuelCost: 0,
                      tolls: [],
                      timeSaved: 0,
                      weather: 'Clear'
                    }}
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Origin</h3>
                  <p>{viewingRoute.origin?.name}</p>
                  <p className="text-sm text-muted-foreground">{viewingRoute.origin?.address}</p>
                  <p className="text-sm text-muted-foreground">{viewingRoute.origin?.city}, {viewingRoute.origin?.state}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Destination</h3>
                  <p>{viewingRoute.destination?.name}</p>
                  <p className="text-sm text-muted-foreground">{viewingRoute.destination?.address}</p>
                  <p className="text-sm text-muted-foreground">{viewingRoute.destination?.city}, {viewingRoute.destination?.state}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Estimated Duration</p>
                    <p>{formatDuration(viewingRoute.estimated_time_mins)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Distance</p>
                    <p>{viewingRoute.distance_km ? `${viewingRoute.distance_km.toFixed(1)} km` : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vehicle</p>
                    <p>{viewingRoute.vehicle?.registration_number || 'N/A'} ({viewingRoute.vehicle?.type || 'N/A'})</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cargo</p>
                    <p>{viewingRoute.cargo_type || 'N/A'} - {viewingRoute.cargo_weight ? `${viewingRoute.cargo_weight} tons` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            {viewingRoute?.status === 'PLANNED' && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleStartTrip(viewingRoute.id);
              }}>
                Start Trip
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update the details of your route
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registration_number} ({vehicle.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cargo_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cargo type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARGO_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cargo_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo Weight (tons)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default RouteManager; 