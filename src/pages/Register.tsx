import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MainLayout from '@/components/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, User, Truck, ArrowRight } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';

// Form schema for organization registration
const organizationSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string().min(2, { message: 'City name is required.' }),
  state: z.string().min(2, { message: 'State name is required.' }),
  contact_email: z.string().email({ message: 'Invalid email address.' }),
  contact_phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
});

// Form schema for user profile
const userProfileSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;
type UserProfileFormValues = z.infer<typeof userProfileSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, registerOrganization, isCreatingOrganization, isUpdatingProfile } = useUserData();
  const [activeTab, setActiveTab] = useState('organization');
  const [formStep, setFormStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form for organization
  const organizationForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      contact_email: '',
      contact_phone: '',
    },
  });

  // Form for user profile
  const userProfileForm = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      role: 'admin', // Default role
    },
  });

  // Update profile form when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      userProfileForm.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        role: profile.role || 'admin',
      });
    }
  }, [profile, userProfileForm]);

  // Organization form submission
  const onSubmitOrganization = async (values: OrganizationFormValues) => {
    if (!user) {
      toast.error('You must be logged in to register an organization');
      return;
    }

    setIsSubmitting(true);
    try {
      // Store organization data for next step
      setFormStep(1);
      setActiveTab('profile');
      
      // Pre-populate the userProfileForm with existing profile data if available
      if (profile) {
        userProfileForm.reset({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          role: profile.role || 'admin',
        });
      }
      
      toast.success('Organization information saved. Please complete your profile details.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process organization data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combined form submission
  const onSubmitUserProfile = async (profileValues: UserProfileFormValues) => {
    if (!user) {
      toast.error('You must be logged in to register an organization');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get organization data from the first form
      const orgData = organizationForm.getValues();
      
      // Use the registerOrganization function from useUserData hook
      const result = await registerOrganization(orgData, profileValues);
      
      if (result.success) {
        toast.success('Registration completed successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error completing registration:', error);
      toast.error(error.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center">
          <div className="w-full max-w-md text-center">
            <p>Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If user already has a profile with organization, redirect to dashboard
  if (profile && profile.organization_id) {
    navigate('/dashboard');
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Complete Your Registration</h1>
          <p className="text-muted-foreground mt-2">
            Set up your organization and profile to get started
          </p>
        </div>

        <div className="w-full max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="organization" disabled={formStep > 0}>
                <Building2 className="mr-2 h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="profile" disabled={formStep < 1}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Information</CardTitle>
                  <CardDescription>
                    Enter the details of your transportation company
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...organizationForm}>
                    <form onSubmit={organizationForm.handleSubmit(onSubmitOrganization)} className="space-y-6">
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="contact@organization.com" {...field} />
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
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={organizationForm.control}
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

                        <FormField
                          control={organizationForm.control}
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
                          control={organizationForm.control}
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
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Continue to Profile'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Complete your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...userProfileForm}>
                    <form onSubmit={userProfileForm.handleSubmit(onSubmitUserProfile)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={userProfileForm.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userProfileForm.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userProfileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userProfileForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                                  {...field}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="dispatcher">Dispatcher</option>
                                  <option value="driver">Driver</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || isCreatingOrganization || isUpdatingProfile}
                      >
                        {isSubmitting || isCreatingOrganization || isUpdatingProfile 
                          ? 'Completing Registration...' 
                          : 'Complete Registration'
                        }
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register; 