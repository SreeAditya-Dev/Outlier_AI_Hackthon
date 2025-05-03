import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MapPin, Plus, Loader2, FileEdit, Trash2 } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { Location } from '@/types/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Form schema for location
const locationSchema = z.object({
  name: z.string().min(2, { message: 'Location name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string().min(2, { message: 'City name is required.' }),
  state: z.string().min(2, { message: 'State name is required.' }),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  is_toll_plaza: z.boolean().default(false),
  is_warehouse: z.boolean().default(false),
});

type LocationFormValues = z.infer<typeof locationSchema>;

const LocationManager = () => {
  const queryClient = useQueryClient();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  // Form for location
  const locationForm = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      latitude: undefined,
      longitude: undefined,
      is_toll_plaza: false,
      is_warehouse: false,
    },
  });

  // Reset form on dialog open/close
  React.useEffect(() => {
    if (isDialogOpen && editingLocation) {
      locationForm.reset({
        name: editingLocation.name,
        address: editingLocation.address || '',
        city: editingLocation.city,
        state: editingLocation.state,
        latitude: editingLocation.latitude,
        longitude: editingLocation.longitude,
        is_toll_plaza: editingLocation.is_toll_plaza || false,
        is_warehouse: editingLocation.is_warehouse || false,
      });
    } else if (!isDialogOpen) {
      setEditingLocation(null);
      locationForm.reset({
        name: '',
        address: '',
        city: '',
        state: '',
        latitude: undefined,
        longitude: undefined,
        is_toll_plaza: false,
        is_warehouse: false,
      });
    }
  }, [isDialogOpen, editingLocation, locationForm]);

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!profile?.organization_id,
  });

  // Create/Update location mutation
  const mutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      if (!profile?.organization_id) {
        throw new Error('Organization ID is missing');
      }
      
      const locationData = {
        organization_id: profile.organization_id,
        name: values.name,
        address: values.address,
        city: values.city,
        state: values.state,
        latitude: values.latitude,
        longitude: values.longitude,
        is_toll_plaza: values.is_toll_plaza,
        is_warehouse: values.is_warehouse,
      };

      if (editingLocation) {
        // Update existing location
        const { data, error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new location
        const { data, error } = await supabase
          .from('locations')
          .insert(locationData)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(editingLocation ? 'Location updated successfully' : 'Location added successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save location');
    },
  });

  // Delete location mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted successfully');
      setIsDeleteDialogOpen(false);
      setLocationToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });

  // Form submission
  const onSubmit = (values: LocationFormValues) => {
    mutation.mutate(values);
  };

  // Handle edit
  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (locationToDelete) {
      deleteMutation.mutate(locationToDelete.id);
    }
  };

  // Generate location type badges
  const getLocationBadges = (location: Location) => {
    const badges = [];
    
    if (location.is_warehouse) {
      badges.push(
        <Badge key="warehouse" variant="secondary" className="bg-blue-500 mr-2">
          Warehouse
        </Badge>
      );
    }
    
    if (location.is_toll_plaza) {
      badges.push(
        <Badge key="toll" variant="outline" className="bg-yellow-500 text-black">
          Toll Plaza
        </Badge>
      );
    }
    
    if (!location.is_warehouse && !location.is_toll_plaza) {
      badges.push(
        <Badge key="regular" variant="outline">
          Regular
        </Badge>
      );
    }
    
    return badges;
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
                <p className="mb-4">You need to set up your organization before managing locations.</p>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Location Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage your locations</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Locations</CardTitle>
            <CardDescription>
              View and manage all registered locations in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : locations && locations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City, State</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{location.address || '-'}</TableCell>
                      <TableCell>{`${location.city}, ${location.state}`}</TableCell>
                      <TableCell>
                        {location.latitude && location.longitude
                          ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                          : 'Not set'
                        }
                      </TableCell>
                      <TableCell>
                        {getLocationBadges(location)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(location)}>
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(location)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Locations Added Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first location to start planning routes</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Location Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
              <DialogDescription>
                Enter the details of the location you want to add to your organization.
              </DialogDescription>
            </DialogHeader>
            <Form {...locationForm}>
              <form onSubmit={locationForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={locationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Warehouse North" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={locationForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={locationForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={locationForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={locationForm.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.000001" placeholder="e.g., 19.076" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={locationForm.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.000001" placeholder="e.g., 72.877" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={locationForm.control}
                    name="is_warehouse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Warehouse</FormLabel>
                          <FormDescription>
                            Mark as a warehouse location
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={locationForm.control}
                    name="is_toll_plaza"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Toll Plaza</FormLabel>
                          <FormDescription>
                            Mark as a toll plaza
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 
                      (editingLocation ? 'Update Location' : 'Add Location')
                    }
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the location "<span className="font-bold">{locationToDelete?.name}</span>"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 
                  'Delete Location'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default LocationManager; 