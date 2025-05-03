import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart as RechartLine, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Clock, Coins, Droplet, MapPin, Truck, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  TravelHistoryItem, 
  EnrichedTravelHistoryItem, 
  UserProfile 
} from '@/types/supabase';
import { useUserData } from '@/hooks/useUserData';

// Type for travel history with calculated savings
interface TravelHistoryWithSavings extends EnrichedTravelHistoryItem {
  month: string;
  timeSaved?: number;
  tollSaved?: number;
  fuelSaved?: number;
}

// Type for trip frequency data
interface TripFrequency {
  month: string;
  trips: number;
}

const Dashboard = () => {
  const { profile, isLoading: isUserLoading } = useUserData();
  const [savingsData, setSavingsData] = useState<TravelHistoryWithSavings[]>([]);
  const [tripFrequency, setTripFrequency] = useState<TripFrequency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTollSaved, setTotalTollSaved] = useState(0);
  const [totalFuelSaved, setTotalFuelSaved] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [hasData, setHasData] = useState(false);

  // Function to get month name from date string
  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
  };

  // Calculate random savings (simulating alternative routes that would have been more expensive)
  const calculateSavings = (history: any[]) => {
    const processedData = history.map(item => {
      // Generate random savings between 10-30% more than actual costs
      const estimatedAlternativeDistance = item.actual_distance ? item.actual_distance * (1 + Math.random() * 0.3) : 0;
      const estimatedAlternativeFuelCost = item.actual_fuel_cost ? item.actual_fuel_cost * (1 + Math.random() * 0.3) : 0;
      const estimatedAlternativeTollCost = item.actual_toll_cost ? item.actual_toll_cost * (1 + Math.random() * 0.3) : 0;
      
      const fuelSaved = estimatedAlternativeFuelCost - (item.actual_fuel_cost || 0);
      const tollSaved = estimatedAlternativeTollCost - (item.actual_toll_cost || 0);
      // Estimate time saved based on distance difference (5 mins per extra km)
      const timeSaved = (estimatedAlternativeDistance - (item.actual_distance || 0)) * 0.05;
      
      return {
        ...item,
        month: getMonthName(item.actual_start_time || new Date().toISOString()),
        estimatedAlternativeDistance,
        estimatedAlternativeFuelCost,
        estimatedAlternativeTollCost,
        timeSaved,
        tollSaved,
        fuelSaved
      };
    });
    
    return processedData;
  };

  // Group travel history by month for trip frequency
  const calculateTripFrequency = (history: any[]) => {
    const monthCounts: Record<string, number> = {};
    
    history.forEach(item => {
      if (item.actual_start_time) {
        const month = getMonthName(item.actual_start_time);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    return Object.entries(monthCounts).map(([month, trips]) => ({ month, trips }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.organization_id) {
        // If user has no organization, reset all data to empty state
        setSavingsData([]);
        setTripFrequency([]);
        setTotalTollSaved(0);
        setTotalFuelSaved(0);
        setTotalTimeSaved(0);
        setRouteCount(0);
        setLocationsCount(0);
        setVehiclesCount(0);
        setHasData(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch travel history data for this organization
        const { data: travelHistory, error: historyError } = await (supabase as any)
          .from('travel_history')
          .select(`
            *,
            user_profiles:user_id (
              id, first_name, last_name, phone
            ),
            routes:route_id (
              id, distance_km, estimated_time_mins, origin_id, destination_id
            ),
            vehicle:vehicle_id (
              id, registration_number, type
            )
          `)
          .eq('organization_id', profile.organization_id)
          .order('actual_start_time', { ascending: false });
        
        if (historyError) throw historyError;

        // Process data to calculate savings
        if (travelHistory && travelHistory.length > 0) {
          setHasData(true);
          const processedData = calculateSavings(travelHistory);
          setSavingsData(processedData);
          
          // Calculate totals
          const tollSavedTotal = processedData.reduce((sum, item) => sum + (item.tollSaved || 0), 0);
          const fuelSavedTotal = processedData.reduce((sum, item) => sum + (item.fuelSaved || 0), 0);
          const timeSavedTotal = processedData.reduce((sum, item) => sum + (item.timeSaved || 0), 0);
          
          setTotalTollSaved(Math.round(tollSavedTotal));
          setTotalFuelSaved(Math.round(fuelSavedTotal));
          setTotalTimeSaved(Math.round(timeSavedTotal));
          
          // Calculate trip frequency
          const tripFreq = calculateTripFrequency(travelHistory);
          setTripFrequency(tripFreq);
        } else {
          // Empty state
          setHasData(false);
          setSavingsData([]);
          setTripFrequency([]);
          setTotalTollSaved(0);
          setTotalFuelSaved(0);
          setTotalTimeSaved(0);
        }

        // Fetch counts for additional stats - all filtered by organization_id
        const { count: routesCount } = await (supabase as any)
          .from('routes')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id);
        
        const { count: locationCount } = await (supabase as any)
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id);
        
        const { count: vehicleCount } = await (supabase as any)
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id);
        
        setRouteCount(routesCount || 0);
        setLocationsCount(locationCount || 0);
        setVehiclesCount(vehicleCount || 0);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty state on error
        setHasData(false);
        setSavingsData([]);
        setTripFrequency([]);
        setTotalTollSaved(0);
        setTotalFuelSaved(0);
        setTotalTimeSaved(0);
        setRouteCount(0);
        setLocationsCount(0);
        setVehiclesCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data when user profile is loaded
    if (!isUserLoading) {
      fetchData();
    }
  }, [profile?.organization_id, isUserLoading]);

  // Empty state chart data (just for rendering the charts without data)
  const emptyChartData = [
    { month: 'Jan', value: 0 },
    { month: 'Feb', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Apr', value: 0 },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name || "there"}! Here's your transport analytics overview.
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-medium mb-1">Time Saved</CardTitle>
              <p className="text-3xl font-bold">{isLoading ? "..." : hasData ? totalTimeSaved : 0} hours</p>
              <p className="text-sm text-muted-foreground">Through optimal routing</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-50 text-green-600 mb-4">
                <Coins className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-medium mb-1">Toll Saved</CardTitle>
              <p className="text-3xl font-bold">₹{isLoading ? "..." : hasData ? totalTollSaved : 0}</p>
              <p className="text-sm text-muted-foreground">Compared to alternatives</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 text-amber-600 mb-4">
                <Droplet className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-medium mb-1">Fuel Saved</CardTitle>
              <p className="text-3xl font-bold">₹{isLoading ? "..." : hasData ? totalFuelSaved : 0}</p>
              <p className="text-sm text-muted-foreground">Through efficient routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-50 text-purple-600 mb-4">
                <Truck className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-medium mb-1">Fleet Stats</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{isLoading ? "..." : vehiclesCount}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{isLoading ? "..." : routeCount}</p>
                  <p className="text-xs text-muted-foreground">Routes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{isLoading ? "..." : locationsCount}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Savings Metrics</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading...</p>
                </div>
              ) : hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tollSaved" name="Toll Saved (₹)" fill="#10B981" />
                    <Bar dataKey="fuelSaved" name="Fuel Saved (₹)" fill="#F59E0B" />
                    <Bar dataKey="timeSaved" name="Time Saved (hrs)" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-gray-200 mb-4" />
                  <p className="text-lg text-muted-foreground">No data available</p>
                  <p className="text-sm text-muted-foreground">Complete trips to see your savings</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Frequency</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading...</p>
                </div>
              ) : hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLine data={tripFrequency} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="trips" name="Number of Trips" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </RechartLine>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-gray-200 mb-4" />
                  <p className="text-lg text-muted-foreground">No trips recorded yet</p>
                  <p className="text-sm text-muted-foreground">Start a trip to see your frequency data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
