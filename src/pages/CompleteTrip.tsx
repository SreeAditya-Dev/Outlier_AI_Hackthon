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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Loader2, TruckIcon, MapPin, AlertTriangle, CheckCircle2, StarIcon, Fuel, ReceiptText, StopCircle, InfoIcon } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { TravelHistoryItem, Route, Location, Vehicle } from '@/types/supabase';
import Map from '@/components/Map';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema for completing a trip
const completeSchema = z.object({
  actual_end_time: z.string().min(1, 'End time is required'),
  actual_distance: z.number().min(0, 'Distance cannot be negative'),
  actual_fuel_cost: z.number().min(0, 'Fuel cost cannot be negative'),
  actual_toll_cost: z.number().min(0, 'Toll cost cannot be negative'),
  fuel_consumed: z.number().min(0, 'Fuel consumed cannot be negative'),
  status: z.enum(['COMPLETED', 'CANCELLED', 'DELAYED']),
  delay_minutes: z.number().optional(),
  delay_reason: z.string().optional(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

type CompleteFormValues = z.infer<typeof completeSchema>;

const CompleteTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [rating, setRating] = useState(5);

  // Form with default values
  const form = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      actual_end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      actual_distance: 0,
      actual_fuel_cost: 0,
      actual_toll_cost: 0,
      fuel_consumed: 0,
      status: 'COMPLETED',
      delay_minutes: 0,
      delay_reason: '',
      rating: 5,
      feedback: '',
    },
  });

  // Watch status field to control conditional fields
  const watchStatus = form.watch('status');

  // Fetch trip details
  const { data: trip, isLoading: isTripLoading, error: tripError } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error('Trip ID is missing');
      
      const { data, error } = await supabase
        .from('travel_history')
        .select(`
          *,
          routes:route_id (
            id, name, distance_km, estimated_time_mins, cargo_type, cargo_weight
          ),
          origin_location:origin_id (
            id, name, address, city, state, latitude, longitude
          ),
          destination_location:destination_id (
            id, name, address, city, state, latitude, longitude
          ),
          vehicle:vehicle_id (
            id, registration_number, type, max_weight, fuel_type
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      
      // Check if the trip is in progress
      if (data.status !== 'IN_PROGRESS') {
        throw new Error('This trip is already completed or cancelled');
      }
      
      return data as TravelHistoryItem & { 
        routes: Route,
        origin_location: Location,
        destination_location: Location,
        vehicle: Vehicle
      };
    },
    enabled: !!tripId,
  });

  // Update travel history mutation
  const mutation = useMutation({
    mutationFn: async (values: CompleteFormValues) => {
      if (!trip) {
        throw new Error('Trip data is missing');
      }
      
      // Calculate delay if status is DELAYED
      let delay = values.delay_minutes;
      if (values.status === 'DELAYED') {
        if (trip.planned_end_time && values.actual_end_time) {
          const plannedEnd = parseISO(trip.planned_end_time);
          const actualEnd = parseISO(values.actual_end_time);
          delay = differenceInMinutes(actualEnd, plannedEnd);
          delay = delay > 0 ? delay : 0;
        }
      }
      
      const updateData = {
        actual_end_time: values.actual_end_time,
        actual_distance: values.actual_distance,
        actual_fuel_cost: values.actual_fuel_cost,
        actual_toll_cost: values.actual_toll_cost,
        fuel_consumed: values.fuel_consumed,
        status: values.status,
        delay_minutes: values.status === 'DELAYED' ? delay : null,
        delay_reason: values.status === 'DELAYED' ? values.delay_reason : null,
        rating: values.rating,
        feedback: values.feedback,
      };

      const { data, error } = await supabase
        .from('travel_history')
        .update(updateData)
        .eq('id', trip.id)
        .select('*')
        .single();
      
      if (error) throw error;

      // Update the route status
      await supabase
        .from('routes')
        .update({ status: values.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED' })
        .eq('id', trip.route_id);
      
      // Update the vehicle status back to available
      await supabase
        .from('vehicles')
        .update({ status: 'Available' })
        .eq('id', trip.vehicle_id);
      
      return data as TravelHistoryItem;
    },
    onSuccess: () => {
      toast.success('Trip completed successfully');
      navigate('/routes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete trip');
    },
  });

  // Set default form values from trip data
  useEffect(() => {
    if (trip) {
      setOriginLocation(trip.origin_location);
      setDestinationLocation(trip.destination_location);

      // Set default values based on trip data
      form.setValue('actual_distance', trip.routes.distance_km || 0);
      form.setValue('actual_fuel_cost', trip.planned_fuel_cost || 0);
      form.setValue('actual_toll_cost', trip.planned_toll_cost || 0);
      
      // Estimate fuel consumed based on distance (simple calculation)
      // Assuming 10 km/liter and average fuel price of 100 rupees/liter
      if (trip.routes.distance_km) {
        const estimatedFuelConsumed = trip.routes.distance_km / 10; // Liters
        form.setValue('fuel_consumed', Math.round(estimatedFuelConsumed * 10) / 10);
      }
    }
  }, [trip, form]);

  // Form submission
  const onSubmit = (values: CompleteFormValues) => {
    if (!trip) return;
    
    // Validate that actual end time is after start time
    const startTime = trip.actual_start_time ? new Date(trip.actual_start_time) : new Date();
    const endTime = new Date(values.actual_end_time);
    
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }
    
    mutation.mutate(values);
  };

  // Star rating component
  const StarRating = () => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const { control, setValue } = useForm();

    const handleRatingChange = (newRating: number) => {
      setRating(newRating);
      setValue('rating', newRating);
    };

    return (
      <div className="flex items-center space-x-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="focus:outline-none"
          >
            <StarIcon
              className={`w-6 h-6 ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Function to calculate savings between planned and actual costs
  const calculateSavings = (planned: number = 0, actual: number = 0) => {
    return planned - actual;
  };

  // Cost comparison card component
  const CostComparisonCard = () => {
    if (!trip) return null;

    // Get form values
    const actualFuelCost = parseFloat(form.watch('actual_fuel_cost') || '0');
    const actualTollCost = parseFloat(form.watch('actual_toll_cost') || '0');
    const actualDistance = parseFloat(form.watch('actual_distance') || '0');
    const fuelConsumed = parseFloat(form.watch('fuel_consumed') || '0');

    // Calculate savings
    const fuelSaved = calculateSavings(trip?.planned_fuel_cost, actualFuelCost);
    const tollSaved = calculateSavings(trip?.planned_toll_cost, actualTollCost);
    const totalSaved = fuelSaved + tollSaved;

    // Calculate efficiency metrics
    const plannedDistance = trip?.planned_distance || trip?.routes?.distance_km || 0;
    const distanceDiff = plannedDistance > 0 ? ((actualDistance - plannedDistance) / plannedDistance) * 100 : 0;

    // Calculate fuel efficiency (km/l)
    const fuelEfficiency = fuelConsumed > 0 ? actualDistance / fuelConsumed : 0;
    const expectedFuelEfficiency = trip?.vehicle?.fuel_efficiency || 0;
    const efficiencyDiff = expectedFuelEfficiency > 0 
      ? ((fuelEfficiency - expectedFuelEfficiency) / expectedFuelEfficiency) * 100 
      : 0;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>Compare planned vs actual trip costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Fuel Cost Comparison */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="font-medium">Fuel Cost</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {fuelSaved > 0 ? (
                      <span className="text-green-600">₹{fuelSaved.toFixed(2)} saved</span>
                    ) : fuelSaved < 0 ? (
                      <span className="text-red-600">₹{Math.abs(fuelSaved).toFixed(2)} extra</span>
                    ) : (
                      <span>On target</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Planned: ₹{trip?.planned_fuel_cost?.toFixed(2) || '0'}</span>
                <span className="mx-1">vs</span>
                <span>Actual: ₹{actualFuelCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Toll Cost Comparison */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ReceiptText className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">Toll Cost</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {tollSaved > 0 ? (
                      <span className="text-green-600">₹{tollSaved.toFixed(2)} saved</span>
                    ) : tollSaved < 0 ? (
                      <span className="text-red-600">₹{Math.abs(tollSaved).toFixed(2)} extra</span>
                    ) : (
                      <span>On target</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Planned: ₹{trip?.planned_toll_cost?.toFixed(2) || '0'}</span>
                <span className="mx-1">vs</span>
                <span>Actual: ₹{actualTollCost.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
              <p className="text-sm text-muted-foreground">Total</p>
              <div className="flex items-center justify-center mt-1">
                <p className="font-medium">
                  {totalSaved > 0 ? (
                    <span className="text-green-600">₹{totalSaved.toFixed(2)} saved</span>
                  ) : totalSaved < 0 ? (
                    <span className="text-red-600">₹{Math.abs(totalSaved).toFixed(2)} extra spent</span>
                  ) : (
                    <span>On budget</span>
                  )}
                </p>
              </div>
            </div>

            {/* Efficiency Metrics */}
            {fuelConsumed > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Efficiency Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Distance Accuracy:</span>
                    <span className={`text-sm font-medium ${Math.abs(distanceDiff) < 5 ? 'text-green-600' : 'text-amber-600'}`}>
                      {distanceDiff > 0 ? '+' : ''}{distanceDiff.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fuel Efficiency:</span>
                    <span className="text-sm font-medium">{fuelEfficiency.toFixed(2)} km/l</span>
                  </div>
                  {expectedFuelEfficiency > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Efficiency vs Expected:</span>
                      <span className={`text-sm font-medium ${efficiencyDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {efficiencyDiff > 0 ? '+' : ''}{efficiencyDiff.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (isUserLoading || isTripLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="w-full max-w-md text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading trip information...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (tripError) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {tripError instanceof Error 
                ? tripError.message 
                : 'Failed to load trip information. Please try again later.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigate('/history')}>
              Return to History
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If no user is loading but profile info is still missing
  if (!isUserLoading && !profile?.organization_id) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
                <p className="mb-4">You need to set up your organization before completing trips.</p>
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
          <h1 className="text-3xl font-bold">Complete Trip</h1>
          <p className="text-muted-foreground">Record actual trip metrics for your journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
                <CardDescription>
                  Enter information to complete your trip
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Form fields section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Actual End Time */}
                      <FormField
                        control={form.control}
                        name="actual_end_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Actual End Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Actual Distance */}
                      <FormField
                        control={form.control}
                        name="actual_distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Actual Distance (km)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Actual Fuel Cost */}
                      <FormField
                        control={form.control}
                        name="actual_fuel_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Actual Fuel Cost (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Actual Toll Cost */}
                      <FormField
                        control={form.control}
                        name="actual_toll_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Actual Toll Cost (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      {/* Fuel Consumed */}
                      <FormField
                        control={form.control}
                        name="fuel_consumed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Consumed (liters)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trip Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              <SelectItem value="DELAYED">Delayed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Conditional fields based on status */}
                    {watchStatus === 'DELAYED' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="delay_minutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delay (minutes)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="delay_reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Delay</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <FormLabel>Trip Rating</FormLabel>
                        <FormDescription>How would you rate this trip experience?</FormDescription>
                        <StarRating />
                      </div>

                      <FormField
                        control={form.control}
                        name="feedback"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feedback (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional comments or suggestions..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate('/history')}
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
                            Completing Trip...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Complete Trip
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
            {/* Cost Comparison Card */}
            <CostComparisonCard />
            
            <Card>
              <CardHeader>
                <CardTitle>Route Information</CardTitle>
                <CardDescription>Details about the trip route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Route Map */}
                  {originLocation && destinationLocation && (
                    originLocation.latitude && originLocation.longitude && 
                    destinationLocation.latitude && destinationLocation.longitude ? (
                      <div className="h-[200px] rounded-md overflow-hidden">
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
                      <div className="h-[200px] flex items-center justify-center border rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="text-center p-4">
                          <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Route map not available</p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Trip Details */}
                  {trip && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Origin:</span>
                        <span className="font-medium">{trip.origin_location?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Destination:</span>
                        <span className="font-medium">{trip.destination_location?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="font-medium">{trip.vehicle?.registration_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Time:</span>
                        <span className="font-medium">
                          {trip.actual_start_time ? format(new Date(trip.actual_start_time), 'MMM dd, HH:mm') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cargo:</span>
                        <span className="font-medium">
                          {trip.routes.cargo_type ? `${trip.routes.cargo_type} (${trip.routes.cargo_weight} tons)` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20">
                    <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle>Trip Completion</AlertTitle>
                    <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                      After completion, the vehicle will be marked as "Available" and 
                      the trip will be added to your travel history.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CompleteTrip; 