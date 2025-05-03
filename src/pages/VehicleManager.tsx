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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, Loader2, FileEdit } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { Vehicle } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

// Form schema for vehicle registration
const vehicleSchema = z.object({
  registration_number: z.string().min(3, { message: 'Registration number is required.' }),
  type: z.enum(['LORRY', 'TRUCK', 'TEN_WHEELER', 'FOURTEEN_WHEELER', 'OTHER']),
  max_weight: z.coerce.number().min(0.1, { message: 'Maximum weight must be greater than 0.' }),
  capacity_volume: z.coerce.number().min(0).optional(),
  fuel_type: z.string().min(1, { message: 'Fuel type is required.' }),
  status: z.enum(['Available', 'In Maintenance', 'On Route']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const VehicleManager = () => {
  const queryClient = useQueryClient();
  const { user, profile, isLoading: isUserLoading } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Form for vehicle
  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registration_number: '',
      type: 'TRUCK',
      max_weight: 10,
      capacity_volume: 0,
      fuel_type: 'Diesel',
      status: 'Available',
    },
  });

  // Reset form on dialog open/close
  React.useEffect(() => {
    if (isDialogOpen && editingVehicle) {
      vehicleForm.reset({
        registration_number: editingVehicle.registration_number,
        type: editingVehicle.type,
        max_weight: editingVehicle.max_weight,
        capacity_volume: editingVehicle.capacity_volume || 0,
        fuel_type: editingVehicle.fuel_type || 'Diesel',
        status: editingVehicle.status as 'Available' | 'In Maintenance' | 'On Route' || 'Available',
      });
    } else if (!isDialogOpen) {
      setEditingVehicle(null);
      vehicleForm.reset({
        registration_number: '',
        type: 'TRUCK',
        max_weight: 10,
        capacity_volume: 0,
        fuel_type: 'Diesel',
        status: 'Available',
      });
    }
  }, [isDialogOpen, editingVehicle, vehicleForm]);

  // Fetch vehicles
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!profile?.organization_id,
  });

  // Create/Update vehicle mutation
  const mutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      if (!profile?.organization_id) {
        throw new Error('Organization ID is missing');
      }
      
      const vehicleData = {
        organization_id: profile.organization_id,
        registration_number: values.registration_number,
        type: values.type,
        max_weight: values.max_weight,
        capacity_volume: values.capacity_volume,
        fuel_type: values.fuel_type,
        status: values.status,
      };

      if (editingVehicle) {
        // Update existing vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save vehicle');
    },
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
      setIsDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });

  // Form submission
  const onSubmit = (values: VehicleFormValues) => {
    mutation.mutate(values);
  };

  // Handle edit
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteMutation.mutate(vehicleToDelete.id);
    }
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
                <p className="mb-4">You need to set up your organization before managing vehicles.</p>
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
            <h1 className="text-3xl font-bold">Vehicle Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage your fleet vehicles</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Vehicle Fleet</CardTitle>
            <CardDescription>
              View and manage all registered vehicles in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Max Weight</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.registration_number}</TableCell>
                      <TableCell>{vehicle.type.replace('_', ' ')}</TableCell>
                      <TableCell>{vehicle.max_weight} tons</TableCell>
                      <TableCell>{vehicle.fuel_type || 'Diesel'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.status === 'Available' ? 'default' :
                            vehicle.status === 'In Maintenance' ? 'destructive' :
                            vehicle.status === 'On Route' ? 'secondary' : 'outline'
                          }
                          className={
                            vehicle.status === 'Available' ? 'bg-green-500' :
                            vehicle.status === 'In Maintenance' ? 'bg-orange-500' :
                            vehicle.status === 'On Route' ? 'bg-blue-500' : ''
                          }
                        >
                          {vehicle.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vehicles Added Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first vehicle to start managing your fleet</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Vehicle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Vehicle Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
              <DialogDescription>
                Enter the details of the vehicle you want to add to your fleet.
              </DialogDescription>
            </DialogHeader>
            <Form {...vehicleForm}>
              <form onSubmit={vehicleForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={vehicleForm.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KA-01-AB-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LORRY">Lorry</SelectItem>
                            <SelectItem value="TRUCK">Truck</SelectItem>
                            <SelectItem value="TEN_WHEELER">10 Wheeler</SelectItem>
                            <SelectItem value="FOURTEEN_WHEELER">14 Wheeler</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="CNG">CNG</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="max_weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Weight (tons)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="capacity_volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity Volume (m³)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={vehicleForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                          <SelectItem value="On Route">On Route</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 
                      (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')
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
                Are you sure you want to delete the vehicle with registration 
                <span className="font-bold"> {vehicleToDelete?.registration_number}</span>?
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
                  'Delete Vehicle'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default VehicleManager; 