import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Camera, Building, User, Phone, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useUserData } from '@/hooks/useUserData';

// Define the user form schema
const userFormSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  role: z.string().optional(),
});

// Define the organization form schema
const organizationFormSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters' }),
  address: z.string().min(5, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  contact_email: z.string().email({ message: 'Please enter a valid email' }),
  contact_phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

const ProfileSection = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { profile, refetchProfile } = useUserData();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Initialize the user form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      role: '',
    },
  });

  // Initialize the organization form
  const organizationForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      contact_email: '',
      contact_phone: '',
    },
  });

  // Fetch user profile and organization data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Set values from profile data
        if (profile) {
          userForm.reset({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            phone: profile.phone || '',
            role: profile.role || '',
          });

          // If there's an organization_id, fetch organization details
          if (profile.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .single();

            if (orgError) {
              console.error('Error fetching organization:', orgError);
            } else if (orgData) {
              setOrganization(orgData);
              organizationForm.reset({
                name: orgData.name || '',
                address: orgData.address || '',
                city: orgData.city || '',
                state: orgData.state || '',
                contact_email: orgData.contact_email || '',
                contact_phone: orgData.contact_phone || '',
              });
            }
          }
        }

        // Get avatar image
        await fetchAvatar();
      } catch (error: any) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, profile]);

  // Fetch user avatar
  const fetchAvatar = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .storage
        .from('avatars')
        .list(user.id, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (data && data.length > 0) {
        const { data: url } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${data[0].name}`);

        setAvatarUrl(url.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  // Handle file upload
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    if (!user) return;

    const file = event.target.files[0];
    const fileSize = file.size / 1024 / 1024; // in MB
    
    if (fileSize > 2) {
      toast({
        title: 'Error',
        description: 'File size should not exceed 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Only accept image files
    if (!file.type.match('image.*')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast({
        title: 'Success',
        description: 'Profile picture updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle user form submission
  const onSubmitUserForm = async (values: UserFormValues) => {
    if (!user) return;
    setLoading(true);

    try {
      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          role: values.role,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await refetchProfile();
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle organization form submission
  const onSubmitOrgForm = async (values: OrganizationFormValues) => {
    if (!user || !profile?.organization_id) return;
    setLoading(true);

    try {
      // Update organization
      const { error } = await supabase
        .from('organizations')
        .update({
          name: values.name,
          address: values.address,
          city: values.city,
          state: values.state,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.organization_id);

      if (error) throw error;
      
      // Fetch updated organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
        
      setOrganization(orgData);
      
      toast({
        title: 'Success',
        description: 'Organization details updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const firstName = userForm.watch('first_name');
    const lastName = userForm.watch('last_name');
    
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    }
    
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Determine if organization details are available
  const hasOrgDetails = !!profile?.organization_id && !!organization;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage your personal details and organization information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-200">
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center cursor-pointer text-white">
                <Camera className="h-4 w-4" />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <p className="text-sm text-center">
              {user?.email}
            </p>
          </div>
          
          <div className="flex-1">
            <div className="space-y-1 mb-4">
              <h3 className="text-lg font-semibold">{userForm.watch('first_name')} {userForm.watch('last_name')}</h3>
              <p className="text-muted-foreground">{userForm.watch('role') || 'Role not set'}</p>
              
              {organization && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{organization.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {profile && profile.phone && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-black">
                  <Phone className="h-3 w-3 mr-1" />
                  {profile.phone}
                </div>
              )}
              
              {user && user.email && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-black">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="organization" disabled={!hasOrgDetails} className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              <span>Organization</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onSubmitUserForm)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input placeholder="Your role in the organization" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="organization">
            {hasOrgDetails ? (
              <Form {...organizationForm}>
                <form onSubmit={organizationForm.handleSubmit(onSubmitOrgForm)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={organizationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Organization email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={organizationForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter organization address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={organizationForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Organization phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Update Organization'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Organization Found</h3>
                <p className="text-muted-foreground mb-4">
                  You are not connected to any organization. Please register an organization first.
                </p>
                <Button asChild>
                  <a href="/register">Create Organization</a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
