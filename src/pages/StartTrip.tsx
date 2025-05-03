import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, TruckIcon, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { Route, Location, Vehicle, TravelHistoryItem } from '@/types/supabase';
import Map from '@/components/Map';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema for starting a trip
const tripSchema = z.object({
  start_date: z.date({
    required_error: "Start date is required",
  }),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in 24-hour format (HH:MM)",
  }),
  planned_end_date: z.date({
    required_error: "Planned end date is required",
  }),
  planned_end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Planned end time must be in 24-hour format (HH:MM)",
  }),
  planned_fuel_cost: z.coerce.number().min(0, {
    message: "Planned fuel cost must be a non-negative number",
  }),
  planned_toll_cost: z.coerce.number().min(0, {
    message: "Planned toll cost must be a non-negative number",
  }),
  notes: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;

const StartTrip = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Form with default values
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      start_date: new Date(),
      start_time: format(new Date(), 'HH:mm'),
      planned_end_date: addHours(new Date(), 5),
      planned_end_time: format(addHours(new Date(), 5), 'HH:mm'),
      planned_fuel_cost: 0,
      planned_toll_cost: 0,
      notes: '',
    },
  });

  // Fetch route details
  const { data: route, isLoading: isRouteLoading, error: routeError } = useQuery({
    queryKey: ['route', routeId],
    queryFn: async () => {
      if (!routeId) throw new Error('Route ID is missing');
      
      const { data, error } = await (supabase as any)
        .from('routes')
        .select(`
          *,
          origin:origin_id (
            id, name, address, city, state, latitude, longitude
          ),
          destination:destination_id (
            id, name, address, city, state, latitude, longitude
          ),
          vehicle:vehicle_id (
            id, registration_number, type, max_weight, fuel_type, status
          )
        `)
        .eq('id', routeId)
        .single();
      
      if (error) {
        console.error("Error fetching route:", error);
        throw error;
      }
      
      console.log("Retrieved route data:", data);
      return data as Route & { 
        origin: Location, 
        destination: Location,
        vehicle: Vehicle
      };
    },
    enabled: !!routeId,
  });

  // Create travel history mutation
  const mutation = useMutation({
    mutationFn: async (values: TripFormValues) => {
      if (!profile?.organization_id || !user?.id || !route) {
        throw new Error('Required data is missing');
      }
      
      // Create start and end datetime strings
      const startDatetime = `${format(values.start_date, 'yyyy-MM-dd')}T${values.start_time}:00`;
      const plannedEndDatetime = `${format(values.planned_end_date, 'yyyy-MM-dd')}T${values.planned_end_time}:00`;
      
      const travelHistoryData = {
        organization_id: profile.organization_id,
        user_id: user.id,
        route_id: route.id,
        vehicle_id: route.vehicle_id,
        origin_id: route.origin_id,
        destination_id: route.destination_id,
        
        planned_start_time: startDatetime,
        planned_end_time: plannedEndDatetime,
        actual_start_time: startDatetime, // Set actual start time to now
        
        planned_distance: route.distance_km,
        planned_fuel_cost: values.planned_fuel_cost,
        planned_toll_cost: values.planned_toll_cost,
        
        status: 'IN_PROGRESS',
        notes: values.notes
      };

      const { data, error } = await supabase
        .from('travel_history')
        .insert(travelHistoryData)
        .select('*')
        .single();
      
      if (error) throw error;

      // Update the route status
      await (supabase as any)
        .from('routes')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', route.id);
      
      // Update the vehicle status
      await (supabase as any)
        .from('vehicles')
        .update({ status: 'On Route' })
        .eq('id', route.vehicle_id);
      
      return data as TravelHistoryItem;
    },
    onSuccess: (data) => {
      toast.success('Trip started successfully');
      navigate(`/travel/${data.id}/complete`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start trip');
    },
  });

  // Set locations when route data is loaded
  useEffect(() => {
    if (route) {
      setOriginLocation(route.origin);
      setDestinationLocation(route.destination);
      setVehicle(route.vehicle);
      
      // Set default planned costs based on distance
      if (route.distance_km) {
        // Estimate 5 rupees per km for fuel
        const estimatedFuelCost = Math.round(route.distance_km * 5);
        form.setValue('planned_fuel_cost', estimatedFuelCost);
        
        // Estimate 2 rupees per km for toll (simple estimate)
        const estimatedTollCost = Math.round(route.distance_km * 2);
        form.setValue('planned_toll_cost', estimatedTollCost);
      }
    }
  }, [route, form]);

  // Form submission
  const onSubmit = (values: TripFormValues) => {
    // Ensure start datetime is before end datetime
    const startDateTime = new Date(`${format(values.start_date, 'yyyy-MM-dd')}T${values.start_time}`);
    const endDateTime = new Date(`${format(values.planned_end_date, 'yyyy-MM-dd')}T${values.planned_end_time}`);
    
    if (startDateTime >= endDateTime) {
      toast.error('Start time must be before end time');
      return;
    }
    
    mutation.mutate(values);
  };

  // Loading state
  if (isUserLoading || isRouteLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="w-full max-w-md text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading route information...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (routeError) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load route information. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigate('/routes')}>
              Return to Routes
            </Button>
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
                <p className="mb-4">You need to set up your organization before starting trips.</p>
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
          <h1 className="text-3xl font-bold">Start Trip</h1>
          <p className="text-muted-foreground">Begin a new journey based on your planned route</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
                <CardDescription>
                  Enter information to begin your trip on route {routeId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Start Time */}
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input type="time" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Planned End Date */}
                      <FormField
                        control={form.control}
                        name="planned_end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Planned End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Planned End Time */}
                      <FormField
                        control={form.control}
                        name="planned_end_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned End Time</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input type="time" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Planned Fuel Cost */}
                      <FormField
                        control={form.control}
                        name="planned_fuel_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned Fuel Cost (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Planned Toll Cost */}
                      <FormField
                        control={form.control}
                        name="planned_toll_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned Toll Cost (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Additional information about this trip" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate(`/routes`)}
                        className="mr-2"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting Trip...
                          </>
                        ) : (
                          <>
                            <TruckIcon className="mr-2 h-4 w-4" />
                            Start Trip
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>Preview of your route</CardDescription>
              </CardHeader>
              <CardContent>
                {isRouteLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : routeError ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load route details. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : route && originLocation && destinationLocation ? (
                  <div className="h-[300px] rounded-md overflow-hidden">
                    {originLocation.latitude && originLocation.longitude && 
                    destinationLocation.latitude && destinationLocation.longitude ? (
                      <Map 
                        waypoints={[
                          { 
                            latitude: originLocation.latitude, 
                            longitude: originLocation.longitude,
                            name: originLocation.name || 'Origin'
                          },
                          { 
                            latitude: destinationLocation.latitude, 
                            longitude: destinationLocation.longitude,
                            name: destinationLocation.name || 'Destination'
                          }
                        ]} 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Location coordinates missing</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted">
                    <div className="text-center p-4">
                      <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Route information not available
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {route && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Origin</h3>
                      <p>{route.origin?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{route.origin?.address}, {route.origin?.city}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Destination</h3>
                      <p>{route.destination?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{route.destination?.address}, {route.destination?.city}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold">Distance</h3>
                        <p>{route.distance_km ? `${route.distance_km} km` : 'Unknown'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Est. Duration</h3>
                        <p>{route.estimated_time_mins ? `${Math.floor(route.estimated_time_mins / 60)}h ${route.estimated_time_mins % 60}m` : 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Vehicle</h3>
                      <p>{route.vehicle?.registration_number || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{route.vehicle?.type}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Cargo</h3>
                      <p>{route.cargo_type || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{route.cargo_weight ? `${route.cargo_weight} tons` : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StartTrip; 