import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@tanstack/react-query';

// User profile interface
export interface UserProfile {
  id: string;
  organization_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// Organization interface
export interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  created_at?: string;
  updated_at?: string;
}

// Input data types
interface UserProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  role?: string;
  organization_id?: string;
}

interface OrganizationData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact_email: string;
  contact_phone: string;
}

export const useUserData = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Query for fetching user profile data
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError, 
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as unknown as UserProfile;
    },
    enabled: !!user,
  });

  // Query for fetching organization data if the user has an organization
  const {
    data: organization,
    isLoading: organizationLoading,
    error: organizationError,
    refetch: refetchOrganization
  } = useQuery({
    queryKey: ['organization', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;

      // Use any type to bypass TypeScript restrictions
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      return data as unknown as Organization;
    },
    enabled: !!profile?.organization_id,
  });

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UserProfileData) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          role: profileData.role,
          organization_id: profileData.organization_id,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    }
  });

  // Mutation for creating a new organization
  const createOrganizationMutation = useMutation({
    mutationFn: async (orgData: OrganizationData) => {
      if (!user) throw new Error("User not authenticated");

      // Use any type to bypass TypeScript restrictions
      const { data, error } = await (supabase as any)
        .from('organizations')
        .insert({
          name: orgData.name,
          address: orgData.address,
          city: orgData.city,
          state: orgData.state,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      
      return data as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    }
  });

  // Mutation for updating an organization
  const updateOrganizationMutation = useMutation({
    mutationFn: async ({ id, ...orgData }: OrganizationData & { id: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Use any type to bypass TypeScript restrictions
      const { error } = await (supabase as any)
        .from('organizations')
        .update({
          name: orgData.name,
          address: orgData.address,
          city: orgData.city,
          state: orgData.state,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    }
  });

  // Combined function to register an organization and update user profile
  const registerOrganization = async (orgData: OrganizationData, profileData: UserProfileData) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // First create the organization
      const newOrg = await createOrganizationMutation.mutateAsync(orgData);
      
      if (!newOrg || !newOrg.id) {
        throw new Error("Failed to create organization");
      }

      // Then update the user profile with the organization ID
      await updateProfileMutation.mutateAsync({
        ...profileData,
        organization_id: newOrg.id
      });
      
      // Refetch data
      await refetchProfile();
      
      return { success: true, organizationId: newOrg.id };
    } catch (error) {
      console.error('Error registering organization:', error);
      throw error;
    }
  };

  return {
    // Data
    user,
    profile,
    organization,
    
    // Loading states
    isLoading: authLoading || profileLoading,
    isLoadingOrganization: organizationLoading,
    
    // Errors
    profileError,
    organizationError,
    
    // Refetch functions
    refetchProfile,
    refetchOrganization,
    
    // Mutation functions
    updateProfile: updateProfileMutation.mutate,
    createOrganization: createOrganizationMutation.mutate,
    updateOrganization: updateOrganizationMutation.mutate,
    registerOrganization,
    
    // Mutation states
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingOrganization: createOrganizationMutation.isPending,
    isUpdatingOrganization: updateOrganizationMutation.isPending,
  };
}; 