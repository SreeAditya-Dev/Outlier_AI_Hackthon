import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, Calendar, MapPin, TrendingUp, Filter, Search, PieChart, Download, Map as MapIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartPie,
  Pie,
  Cell
} from 'recharts';
import { 
  Location, 
  Route, 
  UserProfile, 
  TravelHistoryItem, 
  EnrichedTravelHistoryItem, 
  ChartDataItem,
  Vehicle 
} from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#D35400'];

// Main History component
const History = () => {
  const [selectedTab, setSelectedTab] = useState("routes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<EnrichedTravelHistoryItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  
  // Fetch travel history from Supabase
  const { data: travelHistory, isLoading, error } = useQuery({
    queryKey: ['travelHistory'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        console.log('Fetching travel history for user:', user.id);

        // Query travel history with proper relationships according to the database schema
        const { data, error } = await supabase
          .from('travel_history')
          .select(`
            *,
            routes:route_id (
              id,
              organization_id,
              user_id,
              origin_id, 
              destination_id,
              vehicle_id,
              cargo_weight,
              cargo_type,
              distance_km,
              estimated_time_mins,
              status
            ),
            origin_location:origin_id (
              id,
              organization_id,
              name,
              address,
              city,
              state,
              latitude,
              longitude
            ),
            destination_location:destination_id (
              id,
              organization_id,
              name,
              address,
              city,
              state,
              latitude,
              longitude
            ),
            vehicle:vehicle_id (
              id,
              organization_id,
              registration_number,
              type,
              max_weight,
              fuel_type,
              status
            ),
            user_profiles:user_id (
              id, 
              organization_id,
              first_name,
              last_name,
              phone,
              role
            )
          `)
          .eq('user_id', user.id)
          .order('actual_start_time', { ascending: false });
        
        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }

        console.log('Raw travel history data:', data);
        
        if (!data || data.length === 0) {
          console.warn('No travel history found for user:', user.id);
          
          // Try to check if there's any travel_history data at all (for debugging)
          const { data: sampleData, error: sampleError } = await supabase
            .from('travel_history')
            .select('id, user_id')
            .limit(5);
            
          console.log('Sample travel_history data:', sampleData);
          
          // Also check if user profile exists
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          console.log('User profile:', userProfile);
          
          return [];
        }
        
        // Transform data to match our EnrichedTravelHistoryItem type
        const enrichedData: EnrichedTravelHistoryItem[] = data.map((item: any) => {
          // Ensure vehicle has name property for UI (using registration_number)
          if (item.vehicle && !item.vehicle.name) {
            item.vehicle.name = item.vehicle.registration_number;
          }
          
          // Ensure user_profiles has name property for UI
          if (item.user_profiles && !item.user_profiles.name) {
            item.user_profiles.name = `${item.user_profiles.first_name} ${item.user_profiles.last_name}`.trim();
          }
          
          // Create the enriched item with proper structure
          const enrichedItem: EnrichedTravelHistoryItem = {
            ...item,
            // Keep references to related entities
            routes: item.routes,
            origin_location: item.origin_location,
            destination_location: item.destination_location,
            vehicle: item.vehicle,
            user_profiles: item.user_profiles
          };
          
          return enrichedItem;
        });
        
        console.log('Enriched data:', enrichedData);
        return enrichedData;
      } catch (err) {
        console.error("Error fetching travel history:", err);
        throw new Error(`Could not get travel history: ${(err as Error).message}`);
      }
    }
  });
  
  // Process and filter history data when it changes
  useEffect(() => {
    if (travelHistory && travelHistory.length > 0) {
      let filtered = [...travelHistory];
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => {
          return (
            // Origin/destination location names
            item.origin_location?.name?.toLowerCase().includes(term) ||
            item.destination_location?.name?.toLowerCase().includes(term) ||
            // User name
            (item.user_profiles ? `${item.user_profiles.first_name} ${item.user_profiles.last_name}`.toLowerCase().includes(term) : false) ||
            // Cargo type
            item.routes?.cargo_type?.toLowerCase().includes(term)
          );
        });
      }
      
      setFilteredHistory(filtered);
      
      // Prepare chart data
      const monthlyData: Record<string, ChartDataItem> = {};
      
      travelHistory.forEach(item => {
        if (item.actual_start_time) {
          const monthYear = format(new Date(item.actual_start_time), 'MMM yyyy');
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: monthYear,
              distance: 0,
              fuelCost: 0,
              tollCost: 0,
              count: 0
            };
          }
          
          // Use actual costs, falling back to planned costs if not available
          const tollCost = item.actual_toll_cost !== null && item.actual_toll_cost !== undefined 
            ? item.actual_toll_cost 
            : (item.planned_toll_cost || 0);
          
          const fuelCost = item.actual_fuel_cost !== null && item.actual_fuel_cost !== undefined
            ? item.actual_fuel_cost
            : (item.planned_fuel_cost || 0);
          
          // Calculate distance using direct properties first, then nested route if needed
          const distance = 
            item.actual_distance || 
            item.planned_distance || 
            (item.routes?.distance_km) || 0;
          
          monthlyData[monthYear].distance += distance;
          monthlyData[monthYear].fuelCost += fuelCost;
          monthlyData[monthYear].tollCost += tollCost;
          monthlyData[monthYear].count += 1;
        }
      });
      
      // Convert to array and sort by month
      const chartDataArray = Object.values(monthlyData).sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      });
      
      setChartData(chartDataArray);
    } else {
      setFilteredHistory([]);
      setChartData([]);
    }
  }, [travelHistory, searchTerm]);
  
  // Function to find location name by ID
  const getLocationName = (location: Location | null | undefined) => {
    if (!location) return 'Unknown';
    return location.name ? 
      `${location.name}${location.city ? `, ${location.city}` : ''}${location.state ? `, ${location.state}` : ''}` 
      : 'Unknown';
  };

  // Function to get vehicle name/registration
  const getVehicleName = (vehicle: Vehicle | null | undefined) => {
    if (!vehicle) return 'Unknown';
    return vehicle.registration_number || 'Unknown Vehicle';
  };

  // Function to format date and time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Function to format duration in hours and minutes
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading travel history...</span>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 px-4">
          <div className="text-center text-red-500 p-4 min-h-[400px] flex flex-col justify-center">
            <p className="text-lg">Error loading travel history. Please try again later.</p>
            <p className="text-sm mt-2">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 relative top-[10px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold dark:text-white">Travel History</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            View your past routes, analyze patterns, and optimize future trips
          </p>
        </div>

        {/* Add alerts for debugging issues */}
        {!isLoading && !error && filteredHistory.length === 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="text-amber-800 font-medium">No travel history found</h3>
            <p className="text-amber-700 text-sm">
              We couldn't find any travel history associated with your account. This could be because:
            </p>
            <ul className="list-disc list-inside text-amber-700 text-sm mt-2">
              <li>You haven't completed any trips yet</li>
              <li>You may need to create a travel history record first</li>
              <li>There might be a permission issue with your account</li>
            </ul>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="routes">Past Routes</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search routes or locations"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="ml-2">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsContent value="routes" className="space-y-6">
            {filteredHistory.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Past Routes</CardTitle>
                  <CardDescription>
                    Your completed routes and associated costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Origin → Destination</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item) => {
                        // Use actual costs, falling back to planned costs if not available
                        const tollCost = item.actual_toll_cost !== null && item.actual_toll_cost !== undefined 
                          ? item.actual_toll_cost 
                          : (item.planned_toll_cost || 0);
                        
                        const fuelCost = item.actual_fuel_cost !== null && item.actual_fuel_cost !== undefined
                          ? item.actual_fuel_cost
                          : (item.planned_fuel_cost || 0);
                        
                        const totalCost = tollCost + fuelCost;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">
                                {item.actual_start_time 
                                  ? format(new Date(item.actual_start_time), 'MMM d, yyyy') 
                                  : 'N/A'
                                }
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {item.actual_start_time 
                                  ? format(new Date(item.actual_start_time), 'h:mm a') 
                                  : 'N/A'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="text-sm flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                                  {getLocationName(item.origin_location)}
                                </div>
                                <div className="text-sm flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-red-600 dark:text-red-400" />
                                  {getLocationName(item.destination_location)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.actual_distance 
                                ? `${item.actual_distance.toFixed(1)} km` 
                                : item.planned_distance
                                  ? `${item.planned_distance.toFixed(1)} km (planned)`
                                  : item.routes?.distance_km 
                                    ? `${item.routes.distance_km.toFixed(1)} km (route)`
                                    : 'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              {item.actual_start_time && item.actual_end_time ? (
                                formatDuration(
                                  (new Date(item.actual_end_time).getTime() - 
                                   new Date(item.actual_start_time).getTime()) / 60000
                                )
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.status === 'COMPLETED' ? 'default' : 
                                  item.status === 'CANCELLED' ? 'destructive' :
                                  item.status === 'DELAYED' ? 'secondary' : 'outline'
                                }
                                className={`capitalize ${
                                  item.status === 'COMPLETED' ? 'bg-green-500 text-white' : 
                                  item.status === 'CANCELLED' ? '' :
                                  item.status === 'DELAYED' ? 'bg-yellow-500 text-white' : ''
                                }`}
                              >
                                {(item.status || 'Unknown').toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                ₹{totalCost.toLocaleString('en-IN', {
                                  maximumFractionDigits: 0
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {tollCost > 0 ? 
                                  `Toll: ₹${tollCost.toLocaleString('en-IN', {
                                    maximumFractionDigits: 0
                                  })} | ` : ''}
                                Fuel: ₹{fuelCost.toLocaleString('en-IN', {
                                  maximumFractionDigits: 0
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg dark:border-gray-700">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium dark:text-white mb-2">No travel history found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm 
                    ? `No results found for "${searchTerm}". Try a different search term.` 
                    : "You haven't taken any trips yet. Once you start traveling, your history will appear here."}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            {chartData.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Distance Traveled</CardTitle>
                      <CardDescription>
                        Total distance in kilometers per month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                borderColor: '#374151', 
                                color: '#F9FAFB' 
                              }}
                              formatter={(value: any) => [`${value.toFixed(1)} km`, 'Distance']}
                            />
                            <Legend />
                            <Bar 
                              dataKey="distance" 
                              name="Distance (km)" 
                              fill="#3B82F6" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Transportation Cost Analysis</CardTitle>
                      <CardDescription>
                        Monthly breakdown of toll and fuel expenses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                borderColor: '#374151', 
                                color: '#F9FAFB' 
                              }}
                              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
                            />
                            <Legend />
                            <Bar 
                              dataKey="tollCost" 
                              name="Toll Costs" 
                              stackId="a" 
                              fill="#EF4444" 
                              radius={[4, 4, 0, 0]} 
                            />
                            <Bar 
                              dataKey="fuelCost" 
                              name="Fuel Costs" 
                              stackId="a" 
                              fill="#10B981" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trip Frequency</CardTitle>
                      <CardDescription>
                        Number of trips taken each month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                borderColor: '#374151', 
                                color: '#F9FAFB' 
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Number of Trips" 
                              fill="#8B5CF6" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Per Kilometer</CardTitle>
                      <CardDescription>
                        Average transportation cost per kilometer traveled
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={chartData.map(item => ({
                              ...item,
                              costPerKm: item.distance > 0 
                                ? (item.tollCost + item.fuelCost) / item.distance 
                                : 0
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                borderColor: '#374151', 
                                color: '#F9FAFB' 
                              }}
                              formatter={(value: any) => [`₹${value.toFixed(2)}/km`, 'Cost']}
                            />
                            <Bar 
                              dataKey="costPerKm" 
                              name="₹/km" 
                              fill="#EC4899" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg dark:border-gray-700">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium dark:text-white mb-2">No analytics available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete some trips to see detailed analytics and insights about your travel patterns.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default History;
