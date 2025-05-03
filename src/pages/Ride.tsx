import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/MainLayout';
import Map from '@/components/Map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map as MapIcon, 
  Route, 
  Clock, 
  Banknote, 
  Fuel,
  ThumbsUp,
  CloudRain,
  Sun,
  Cloud,
  Loader2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';

interface Toll {
  name: string;
  cost: number;
}
interface Route {
  id: number;
  name: string;
  isRecommended: boolean;
  distance: number;
  duration: number;
  tollCost: number;
  fuelCost: number;
  tolls: Toll[];
  timeSaved: number;
  weather: string;
}

// Mock route options based on route type
const routeOptions: Record<string, Route[]> = {
  default: [
    {
      id: 1,
      name: 'Route 1 (Recommended)',
      isRecommended: true,
      distance: 325,
      duration: 5.5,
      tollCost: 750,
      fuelCost: 2100,
      tolls: [
        { name: 'Chennai Bypass Toll Plaza', cost: 245 },
        { name: 'Paranur Toll Plaza', cost: 205 },
        { name: 'Vikravandi Toll Gate', cost: 300 }
      ],
      timeSaved: 2.1,
      weather: 'Clear',
    },
    {
      id: 2,
      name: 'Route 2',
      isRecommended: false,
      distance: 342,
      duration: 6.8,
      tollCost: 620,
      fuelCost: 2340,
      tolls: [
        { name: 'Chennai Peripheral Toll', cost: 220 },
        { name: 'Tindivanam Toll Gate', cost: 400 }
      ],
      timeSaved: 0.8,
      weather: 'Rain',
    },
    {
      id: 3,
      name: 'Route 3',
      isRecommended: false,
      distance: 358,
      duration: 7.6,
      tollCost: 540,
      fuelCost: 2450,
      tolls: [
        { name: 'Chennai East Coast Toll', cost: 180 },
        { name: 'Mamallapuram Toll Gate', cost: 160 },
        { name: 'Pondicherry North Toll', cost: 200 }
      ],
      timeSaved: 0,
      weather: 'Cloudy',
    }
  ],
  'lorry': [
    {
      id: 1,
      name: 'Route 1 (Recommended)',
      isRecommended: true,
      distance: 318,
      duration: 5.2,
      tollCost: 720,
      fuelCost: 1900,
      tolls: [
        { name: 'Chennai Bypass Toll Plaza', cost: 220 },
        { name: 'Paranur Toll Plaza', cost: 200 },
        { name: 'Vikravandi Toll Gate', cost: 300 }
      ],
      timeSaved: 1.8,
      weather: 'Clear',
    },
    {
      id: 2,
      name: 'Route 2',
      isRecommended: false,
      distance: 335,
      duration: 6.2,
      tollCost: 580,
      fuelCost: 2100,
      tolls: [
        { name: 'Chennai Peripheral Toll', cost: 180 },
        { name: 'Tindivanam Toll Gate', cost: 400 }
      ],
      timeSaved: 0.8,
      weather: 'Cloudy',
    },
  ],
  'truck': [
    {
      id: 1,
      name: 'Route 1 (Recommended)',
      isRecommended: true,
      distance: 325,
      duration: 5.5,
      tollCost: 750,
      fuelCost: 2100,
      tolls: [
        { name: 'Chennai Bypass Toll Plaza', cost: 245 },
        { name: 'Paranur Toll Plaza', cost: 205 },
        { name: 'Vikravandi Toll Gate', cost: 300 }
      ],
      timeSaved: 2.1,
      weather: 'Clear',
    },
    {
      id: 2,
      name: 'Route 2',
      isRecommended: false,
      distance: 342,
      duration: 6.8,
      tollCost: 620,
      fuelCost: 2340,
      tolls: [
        { name: 'Chennai Peripheral Toll', cost: 220 },
        { name: 'Tindivanam Toll Gate', cost: 400 }
      ],
      timeSaved: 0.8,
      weather: 'Rain',
    },
  ],
  '10wheeler': [
    {
      id: 1,
      name: 'Route 1 (Recommended)',
      isRecommended: true,
      distance: 358,
      duration: 6.2,
      tollCost: 980,
      fuelCost: 2800,
      tolls: [
        { name: 'Chennai Eastern Ring Road', cost: 300 },
        { name: 'Chengalpattu Plaza', cost: 280 },
        { name: 'Trichy Highway Toll', cost: 400 }
      ],
      timeSaved: 1.5,
      weather: 'Clear',
    },
    {
      id: 2,
      name: 'Route 2',
      isRecommended: false,
      distance: 372,
      duration: 7.1,
      tollCost: 850,
      fuelCost: 3000,
      tolls: [
        { name: 'Chennai Bypass Toll Plaza', cost: 350 },
        { name: 'Ulundurpet Toll Gate', cost: 500 }
      ],
      timeSaved: 0.6,
      weather: 'Cloudy',
    },
  ],
  '14wheeler': [
    {
      id: 1,
      name: 'Route 1 (Recommended)',
      isRecommended: true,
      distance: 382,
      duration: 7.5,
      tollCost: 1200,
      fuelCost: 3500,
      tolls: [
        { name: 'Chennai Heavy Vehicle Corridor', cost: 400 },
        { name: 'Kanchipuram Truck Plaza', cost: 350 },
        { name: 'Madurai North Gate', cost: 450 }
      ],
      timeSaved: 2.3,
      weather: 'Clear',
    },
    {
      id: 2,
      name: 'Route 2',
      isRecommended: false,
      distance: 410,
      duration: 9.2,
      tollCost: 980,
      fuelCost: 3800,
      tolls: [
        { name: 'Chennai Outer Ring Road', cost: 380 },
        { name: 'Salem Heavy Vehicle Plaza', cost: 600 }
      ],
      timeSaved: 0.5,
      weather: 'Rain',
    },
  ],
};

const vehicleTypes = [
  { value: 'lorry', label: 'Lorry (< 3.5 Tons)' },
  { value: 'truck', label: 'Truck (3.5 - 12 Tons)' },
  { value: '10wheeler', label: '10-Wheeler (12 - 25 Tons)' },
  { value: '14wheeler', label: '14-Wheeler (> 25 Tons)' }
];

const goodsTypes = [
  { value: 'construction', label: 'Construction Materials' },
  { value: 'food', label: 'Food & Perishables' },
  { value: 'machinery', label: 'Machinery & Equipment' },
  { value: 'others', label: 'Others' }
];

// Popular routes
const popularRoutes = [
  { from: 'Chennai, Tamil Nadu', to: 'Madurai, Tamil Nadu' },
  { from: 'Mumbai, Maharashtra', to: 'Pune, Maharashtra' },
  { from: 'Delhi, NCR', to: 'Jaipur, Rajasthan' },
  { from: 'Bangalore, Karnataka', to: 'Hyderabad, Telangana' },
];

const Ride = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>('');
  const [goodsType, setGoodsType] = useState('');
  const [weight, setWeight] = useState<number[]>([10]);
  const [showRoutes, setShowRoutes] = useState(false);
  
  // Fetch vehicles from Supabase
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch locations from Supabase for origin/destination selection
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleFindRoutes = () => {
    setIsLoading(true);
    toast({
      title: "Finding optimal routes",
      description: "Analyzing traffic, tolls, and weather conditions...",
    });
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      // Get routes based on vehicle type
      const vehicleRoutes = routeOptions[vehicleType as keyof typeof routeOptions] || routeOptions.default;
      setSelectedRoute(vehicleRoutes[0]);
      setShowRoutes(true);
      setIsLoading(false);
      
      toast({
        title: "Routes found",
        description: `Found ${vehicleRoutes.length} routes for your journey`,
      });
    }, 1500);
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    
    toast({
      title: "Route Selected",
      description: `You've selected ${route.name}`,
      duration: 2000,
    });
  };

  const handleSelectPopularRoute = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
    
    toast({
      title: "Popular route selected",
      description: `${from} to ${to}`,
      duration: 2000,
    });
  };

  const getWeatherIcon = (weather: string) => {
    switch(weather) {
      case 'Clear':
        return <Sun className="h-5 w-5 text-amber-500" />;
      case 'Rain':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <div className="lg:w-1/3 p-4 overflow-y-auto">
          <Tabs defaultValue="plan" className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="plan">Plan Route</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="plan" className="flex-grow">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Route Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <Select value={origin} onValueChange={setOrigin}>
                        <SelectTrigger id="origin">
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingLocations ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading...</span>
                            </div>
                          ) : locations && locations.length > 0 ? (
                            locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}{location.city ? `, ${location.city}` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No locations found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Select value={destination} onValueChange={setDestination}>
                        <SelectTrigger id="destination">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingLocations ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading...</span>
                            </div>
                          ) : locations && locations.length > 0 ? (
                            locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}{location.city ? `, ${location.city}` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No locations found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-type">Vehicle Type</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger id="vehicle-type">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingVehicles ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading...</span>
                            </div>
                          ) : vehicles && vehicles.length > 0 ? (
                            vehicles.map(vehicle => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} - {vehicle.type}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No vehicles found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {vehicleType && vehicles && (
                      <div className="rounded-lg border p-3 text-sm">
                        {(() => {
                          const vehicle = vehicles.find(v => v.id === vehicleType);
                          if (!vehicle) return null;
                          
                          return (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>Max Weight:</div>
                                <div className="font-medium">{vehicle.max_weight} tons</div>
                                
                                {vehicle.fuel_efficiency && (
                                  <>
                                    <div>Fuel Efficiency:</div>
                                    <div className="font-medium">{vehicle.fuel_efficiency} km/L</div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="goods-type">Goods Type</Label>
                      <Select value={goodsType} onValueChange={setGoodsType}>
                        <SelectTrigger id="goods-type">
                          <SelectValue placeholder="Select goods type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="food">Food & Beverages</SelectItem>
                          <SelectItem value="construction">Construction Materials</SelectItem>
                          <SelectItem value="machinery">Machinery</SelectItem>
                          <SelectItem value="chemicals">Chemicals</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label htmlFor="weight">Cargo Weight (tons)</Label>
                        <span className="text-sm text-muted-foreground">{weight[0]} tons</span>
                      </div>
                      <Slider
                        id="weight"
                        min={1}
                        max={40}
                        step={1}
                        value={weight}
                        onValueChange={setWeight}
                      />
                    </div>
                  </div>
                  
                  <Button
                    className="w-full mt-6"
                    onClick={handleFindRoutes}
                    disabled={!origin || !destination || !vehicleType || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding Routes...
                      </>
                    ) : (
                      <>Find Routes</>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {showRoutes && (
                <Card className={isMobile ? "" : "sticky top-20"}>
                  <CardHeader>
                    <CardTitle className="text-lg">Route Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {routeOptions.default.map((route) => (
                      <div 
                        key={route.id}
                        onClick={() => handleSelectRoute(route)}
                        className={`route-card cursor-pointer p-3 border rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedRoute?.id === route.id ? 'ring-2 ring-primary border-transparent' : ''
                        } ${route.isRecommended ? 'bg-logistics-50 dark:bg-logistics-900/20' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium flex items-center">
                            {route.name}
                            {route.isRecommended && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-logistics-100 dark:bg-logistics-900/50 px-2 py-0.5 text-xs font-medium text-logistics-800 dark:text-logistics-300">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Best
                              </span>
                            )}
                          </div>
                          {getWeatherIcon(route.weather)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <MapIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{route.distance} km</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{route.duration} hours</span>
                          </div>
                          <div className="flex items-center">
                            <Banknote className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>₹{route.tollCost} toll</span>
                          </div>
                          <div className="flex items-center">
                            <Fuel className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>₹{route.fuelCost} fuel</span>
                          </div>
                        </div>
                        
                        {route.timeSaved > 0 && (
                          <div className="mt-2 text-xs font-medium text-logistics-700 dark:text-logistics-400">
                            Save {route.timeSaved} hours compared to longest route
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card className="h-[calc(100vh-170px)]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Route Map</CardTitle>
                {selectedRoute && (
                  <div className="text-sm font-medium">
                    {origin.split(',')[0]} → {destination.split(',')[0]} ({selectedRoute.distance} km)
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              <Map 
                start={origin}
                destination={destination}
                selectedRoute={selectedRoute}
                vehicleType={vehicleType}
                goodsType={goodsType}
                weight={weight[0].toString()}
              />
              
              {selectedRoute && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                  <div className="text-sm font-medium mb-2">Toll Information</div>
                  <div className="space-y-2">
                    {selectedRoute.tolls.map((toll: Toll, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{toll.name}</span>
                        <span className="font-medium">₹{toll.cost}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between text-sm font-medium">
                      <span>Total Toll</span>
                      <span>₹{selectedRoute.tollCost}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Ride;
