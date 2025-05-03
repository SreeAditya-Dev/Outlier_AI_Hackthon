import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/ThemeContext';
import { Building, Moon, Sun, User, Wrench } from 'lucide-react';
import ProfileSection from '@/components/profile/ProfileSection';
import { useUserData } from '@/hooks/useUserData';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { setTheme, theme } = useTheme();
  const { profile, isLoading } = useUserData();

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <MainLayout>
      <div className="container py-10 relative top-[30px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-1" disabled={!profile?.organization_id}>
              <Building className="h-4 w-4" />
              <span>Organization</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Details about your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-8 w-4/5" />
                  </div>
                ) : profile?.organization_id ? (
                  <OrganizationDetails organizationId={profile.organization_id} />
                ) : (
                  <div className="text-center py-6">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Organization Found</h3>
                    <p className="text-muted-foreground">
                      You are not connected to any organization.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Label htmlFor="theme-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark theme
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      id="theme-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={handleThemeChange}
                    />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Organization details component
const OrganizationDetails = ({ organizationId }: { organizationId: string }) => {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchOrganizationDetails = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();
        
        if (error) throw error;
        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationDetails();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          Unable to load organization details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Organization Name</h3>
          <p className="text-base">{organization.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Contact Email</h3>
          <p className="text-base">{organization.contact_email}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
        <p className="text-base">{organization.address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">City</h3>
          <p className="text-base">{organization.city}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">State</h3>
          <p className="text-base">{organization.state}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Contact Phone</h3>
          <p className="text-base">{organization.contact_phone}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
