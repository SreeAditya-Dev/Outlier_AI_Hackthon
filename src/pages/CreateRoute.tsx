import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, MapPin, Info, ArrowRight, TruckIcon, Package, CalculatorIcon } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { Location, Vehicle, Route } from '@/types/supabase';
import Map from '@/components/Map';

// Form schema for route creation
const routeSchema = z.object({
  origin_id: z.string().min(1, { message: 'Origin location is required.' }),
  destination_id: z.string().min(1, { message: 'Destination location is required.' }),
  vehicle_id: z.string().min(1, { message: 'Vehicle is required.' }),
  cargo_weight: z.coerce.number().min(0.1, { message: 'Cargo weight must be greater than 0.' }),
  cargo_type: z.string().min(1, { message: 'Cargo type is required.' }),
});

type RouteFormValues = z.infer<typeof routeSchema>;

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

const CreateRoute = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin_id: '',
      destination_id: '',
      vehicle_id: '',
      cargo_weight: 0,
      cargo_type: '',
    },
  });

  // Fetch locations
  const { data: locations, isLoading: isLocationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await (supabase as any)
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
      return data as unknown as Location[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch vehicles
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await (supabase as any)
        .from('vehicles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'Available');
      
      if (error) throw error;
      return data as unknown as Vehicle[];
    },
    enabled: !!profile?.organization_id,
  });

  // Create route mutation
  const mutation = useMutation({
    mutationFn: async (values: RouteFormValues) => {
      if (!profile?.organization_id || !user?.id) {
        throw new Error('Organization ID or User ID is missing');
      }
      
      // Calculate estimated distance and time if not already set
      let distance = estimatedDistance;
      let time = estimatedTime;
      
      if (!distance || !time) {
        // Use a simple calculation for demo purposes
        // In a real app, you'd use a routing service API
        const origin = locations?.find(loc => loc.id === values.origin_id);
        const destination = locations?.find(loc => loc.id === values.destination_id);
        
        if (origin?.latitude && origin.longitude && destination?.latitude && destination.longitude) {
          distance = calculateDistance(
            origin.latitude, 
            origin.longitude, 
            destination.latitude, 
            destination.longitude
          );
          
          // Estimate time: assume average speed of 60 km/h
          time = Math.round(distance / 60 * 60); // minutes
        }
      }
      
      // Auto-generate route name based on locations
      const origin = locations?.find(loc => loc.id === values.origin_id);
      const destination = locations?.find(loc => loc.id === values.destination_id);
      const routeName = origin && destination 
        ? `${origin.name} to ${destination.name}`
        : `New Route`;
      
      console.log("Creating route with name:", routeName);
      
      const routeData = {
        organization_id: profile.organization_id,
        user_id: user.id,
        origin_id: values.origin_id,
        destination_id: values.destination_id,
        vehicle_id: values.vehicle_id,
        cargo_weight: values.cargo_weight,
        cargo_type: values.cargo_type,
        distance_km: distance || 0,
        estimated_time_mins: time || 0,
        status: 'PLANNED',
        name: routeName
      };

      // Debug log for the data being sent
      console.log("Sending route data to Supabase:", routeData);

      const { data, error } = await (supabase as any)
        .from('routes')
        .insert(routeData)
        .select('*')
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      return data as Route;
    },
    onSuccess: (data) => {
      toast.success('Route created successfully');
      navigate(`/route/${data.id}/start`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create route');
    },
  });

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return Math.round(distance * 10) / 10;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Watch for changes in the form values
  const originId = form.watch('origin_id');
  const destinationId = form.watch('destination_id');
  const vehicleId = form.watch('vehicle_id');
  
  // Update locations and distances when form values change
  useEffect(() => {
    if (locations && originId) {
      const origin = locations.find(loc => loc.id === originId) || null;
      setOriginLocation(origin);
    } else {
      setOriginLocation(null);
    }
  }, [locations, originId]);
  
  useEffect(() => {
    if (locations && destinationId) {
      const destination = locations.find(loc => loc.id === destinationId) || null;
      setDestinationLocation(destination);
    } else {
      setDestinationLocation(null);
    }
  }, [locations, destinationId]);
  
  useEffect(() => {
    if (vehicles && vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId) || null;
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
    }
  }, [vehicles, vehicleId]);
  
  // Calculate estimated distance and time when both locations are selected
  useEffect(() => {
    if (originLocation?.latitude && originLocation.longitude && 
        destinationLocation?.latitude && destinationLocation.longitude) {
      const distance = calculateDistance(
        originLocation.latitude, 
        originLocation.longitude, 
        destinationLocation.latitude, 
        destinationLocation.longitude
      );
      setEstimatedDistance(distance);
      
      // Estimate time: assume average speed of 60 km/h
      const time = Math.round(distance / 60 * 60); // minutes
      setEstimatedTime(time);
    } else {
      setEstimatedDistance(null);
      setEstimatedTime(null);
    }
  }, [originLocation, destinationLocation]);

  // Form submission
  const onSubmit = (values: RouteFormValues) => {
    if (values.origin_id === values.destination_id) {
      toast.error('Origin and destination must be different locations');
      return;
    }
    
    const selectedVehicle = vehicles?.find(v => v.id === values.vehicle_id);
    if (selectedVehicle && values.cargo_weight > selectedVehicle.max_weight) {
      toast.error(`Cargo weight exceeds vehicle maximum capacity of ${selectedVehicle.max_weight} tons`);
      return;
    }
    
    mutation.mutate(values);
  };

  // Format time in hours and minutes
  const formatTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Loading state
  if (isUserLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="w-full max-w-md text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If no organization is set up, redirect to register
  if (!profile?.organization_id) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
                <p className="mb-4">You need to set up your organization before creating routes.</p>
                <Button asChild>
                  <a href="/register">Set Up Organization</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Route</h1>
          <p className="text-muted-foreground">Plan and save a new transportation route</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
                <CardDescription>Enter information about the route you want to create</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Location Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="origin_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Origin Location</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select origin location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLocationsLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Loading...
                                    </div>
                                  ) : locations && locations.length > 0 ? (
                                    locations.map(location => (
                                      <SelectItem key={location.id} value={location.id}>
                                        {location.name}, {location.city}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-center">
                                      No locations found. Please add some first.
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="destination_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destination Location</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select destination location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLocationsLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Loading...
                                    </div>
                                  ) : locations && locations.length > 0 ? (
                                    locations.map(location => (
                                      <SelectItem key={location.id} value={location.id}>
                                        {location.name}, {location.city}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-center">
                                      No locations found. Please add some first.
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Cargo Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="vehicle_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehicle</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isVehiclesLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Loading...
                                    </div>
                                  ) : vehicles && vehicles.length > 0 ? (
                                    vehicles.map(vehicle => (
                                      <SelectItem key={vehicle.id} value={vehicle.id}>
                                        {vehicle.registration_number} ({vehicle.type})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-center">
                                      No available vehicles found. Please add some first.
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              {selectedVehicle && (
                                <FormDescription>
                                  Max capacity: {selectedVehicle.max_weight} tons
                                </FormDescription>
                              )}
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
                        
                        <FormField
                          control={form.control}
                          name="cargo_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select cargo type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CARGO_TYPES.map(type => (
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
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={mutation.isPending || isLocationsLoading || isVehiclesLoading}
                        className="w-full md:w-auto"
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Route...
                          </>
                        ) : (
                          <>
                            Create Route
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Route Preview</CardTitle>
                <CardDescription>Preview of your route on the map</CardDescription>
              </CardHeader>
              <CardContent>
                {originLocation && destinationLocation && originLocation.latitude && originLocation.longitude && 
                 destinationLocation.latitude && destinationLocation.longitude ? (
                  <div className="h-[300px] rounded-md overflow-hidden">
                    <Map 
                      waypoints={[
                        { 
                          latitude: originLocation.latitude, 
                          longitude: originLocation.longitude,
                          name: originLocation.name
                        },
                        { 
                          latitude: destinationLocation.latitude, 
                          longitude: destinationLocation.longitude,
                          name: destinationLocation.name 
                        }
                      ]} 
                    />
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center border rounded-md bg-gray-50 dark:bg-gray-800">
                    <div className="text-center p-4">
                      <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Select origin and destination locations to see the route
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Route Estimates</CardTitle>
                <CardDescription>Distance and time estimates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h4 className="font-medium">Distance</h4>
                      <p className="text-2xl font-bold">
                        {estimatedDistance ? `${estimatedDistance} km` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CalculatorIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <h4 className="font-medium">Estimated Time</h4>
                      <p className="text-2xl font-bold">
                        {formatTime(estimatedTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md mt-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        These are estimated values. Actual distance and travel time may vary based on road conditions, 
                        traffic, and the actual route taken.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateRoute; 