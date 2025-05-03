import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for your data structures
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

interface MapProps {
  start?: string;
  destination?: string;
  selectedRoute?: Route;
  vehicleType?: string;
  goodsType?: string;
  weight?: string;
  waypoints?: Waypoint[];
  style?: React.CSSProperties;
}

interface Waypoint {
  latitude: number;
  longitude: number;
  name?: string;
}

// Using a placeholder token - in a production app, this would be an environment variable
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYmxpdHpqYiIsImEiOiJjbTEweDAzb20wOGhiMnRwZGNqZ2NsdXF6In0.DhETe3EckUcqEAvDDQsfLA';

const Map = ({ start, destination, selectedRoute, vehicleType, goodsType, weight, waypoints, style }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>(MAPBOX_ACCESS_TOKEN);
  const [error, setError] = useState<string | null>(null);

  // Function to convert address to coordinates
  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=in&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      } else {
        throw new Error(`Could not find coordinates for ${address}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  // Function to get route between two points
  const getRoute = async (startCoords: number[], endCoords: number[]) => {
    try {
      setLoadingRoute(true);
      const query = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?alternatives=true&geometries=geojson&steps=true&access_token=${mapboxToken}`;
      const response = await fetch(query);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data.routes;
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error("Route error:", error);
      throw error;
    } finally {
      setLoadingRoute(false);
    }
  };

  // Initialize map with waypoints
  const initMapWithWaypoints = async () => {
    if (!waypoints || waypoints.length < 2 || !mapContainer.current || !map.current || !mapLoaded) return;

    try {
      // Get coordinates
      const startCoords: [number, number] = [waypoints[0].longitude, waypoints[0].latitude];
      const endCoords: [number, number] = [waypoints[waypoints.length - 1].longitude, waypoints[waypoints.length - 1].latitude];

      // Remove existing elements
      const existingStartMarker = document.querySelector('.start-marker');
      const existingEndMarker = document.querySelector('.end-marker');
      if (existingStartMarker) existingStartMarker.remove();
      if (existingEndMarker) existingEndMarker.remove();

      // Make sure to properly remove the route source and layer if they exist
      try {
        if (map.current?.getLayer('route-layer')) {
          map.current.removeLayer('route-layer');
        }
        if (map.current?.getSource('route')) {
          map.current.removeSource('route');
        }
      } catch (e) {
        console.log('Error removing existing route layers:', e);
      }

      // Create markers
      const startMarkerElement = document.createElement('div');
      startMarkerElement.className = 'start-marker';
      startMarkerElement.style.width = '25px';
      startMarkerElement.style.height = '25px';
      startMarkerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMwMDdiZmYiIGQ9Ik0xMiAwYy02LjYyMyAwLTEyIDUuMzc3LTEyIDEyczUuMzc3IDEyIDEyIDEyIDEyLTUuMzc3IDEyLTEyLTUuMzc3LTEyLTEyLTEyeiIvPjxwYXRoIGQ9Ik0xMyAxMnYtMmgtMnYyaC0ydjJoMnYyaDJ2LTJoMnYtMmgtMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+)';
      startMarkerElement.style.backgroundSize = '100%';
      
      const endMarkerElement = document.createElement('div');
      endMarkerElement.className = 'end-marker';
      endMarkerElement.style.width = '25px';
      endMarkerElement.style.height = '25px';
      endMarkerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNlNzFkMzYiIGQ9Ik0xMiAwYy02LjYyMyAwLTEyIDUuMzc3LTEyIDEyczUuMzc3IDEyIDEyIDEyIDEyLTUuMzc3IDEyLTEyLTUuMzc3LTEyLTEyLTEyeiIvPjxwYXRoIGQ9Ik0xOCA4aC0xMnY4aDEyeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)';
      endMarkerElement.style.backgroundSize = '100%';

      // Add markers to the map
      new mapboxgl.Marker(startMarkerElement)
        .setLngLat(startCoords)
        .setPopup(new mapboxgl.Popup().setText(waypoints[0].name || 'Start'))
        .addTo(map.current);
      
      new mapboxgl.Marker(endMarkerElement)
        .setLngLat(endCoords)
        .setPopup(new mapboxgl.Popup().setText(waypoints[waypoints.length - 1].name || 'End'))
        .addTo(map.current);

      // Get route
      const routes = await getRoute(startCoords, endCoords);
      const routeGeometry = routes[0].geometry;

      // Add the route to the map
      try {
        // Check again if source already exists before adding
        if (!map.current?.getSource('route')) {
          map.current?.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeGeometry
            }
          });
        }
        
        if (!map.current?.getLayer('route-layer')) {
          map.current?.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981', // Success green color
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
        }
      } catch (e) {
        console.error('Error adding route source/layer:', e);
      }

      // Fit the map to show all waypoints with padding
      const bounds = new mapboxgl.LngLatBounds()
        .extend(startCoords)
        .extend(endCoords);

      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15
      });

    } catch (error) {
      console.error("Error setting up waypoints:", error);
      setError("Failed to display route on map");
    }
  };

  // Update the map when the start/destination/route changes
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize the map if it hasn't been initialized yet
    if (!map.current) {
      mapboxgl.accessToken = mapboxToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [80.2706, 13.0827], // Default to Chennai
        zoom: 6
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error("Mapbox error:", e);
        setError("There was an error loading the map. Please check your connection.");
      });
    }
    
    // If using waypoints, handle that logic in a different function
    if (waypoints && waypoints.length >= 2) {
      if (mapLoaded) {
        initMapWithWaypoints();
      }
      return;
    }
    
    // Add markers and route once map is loaded
    if (mapLoaded && map.current && start && destination && selectedRoute) {
      const loadRouteAndMarkers = async () => {
        try {
          // Remove existing markers and routes
          const existingStartMarker = document.querySelector('.start-marker');
          const existingEndMarker = document.querySelector('.end-marker');
          if (existingStartMarker) existingStartMarker.remove();
          if (existingEndMarker) existingEndMarker.remove();

          // Make sure to properly remove the route source and layer if they exist
          try {
            if (map.current?.getLayer('route-layer')) {
              map.current.removeLayer('route-layer');
            }
            if (map.current?.getSource('route')) {
              map.current.removeSource('route');
            }
            
            if (map.current?.getLayer('tolls-layer')) {
              map.current.removeLayer('tolls-layer');
            }
            if (map.current?.getSource('tolls')) {
              map.current.removeSource('tolls');
            }
          } catch (e) {
            console.log('Error removing existing map layers:', e);
          }

          // Get coordinates for both addresses
          const startCoords = await geocodeAddress(start);
          const endCoords = await geocodeAddress(destination);
          
          // Create start marker element
          const startMarkerElement = document.createElement('div');
          startMarkerElement.className = 'start-marker';
          startMarkerElement.style.width = '25px';
          startMarkerElement.style.height = '25px';
          startMarkerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMwMDdiZmYiIGQ9Ik0xMiAwYy02LjYyMyAwLTEyIDUuMzc3LTEyIDEyczUuMzc3IDEyIDEyIDEyIDEyLTUuMzc3IDEyLTEyLTUuMzc3LTEyLTEyLTEyeiIvPjxwYXRoIGQ9Ik0xMyAxMnYtMmgtMnYyaC0ydjJoMnYyaDJ2LTJoMnYtMmgtMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+)';
          startMarkerElement.style.backgroundSize = '100%';
          
          // Create end marker element
          const endMarkerElement = document.createElement('div');
          endMarkerElement.className = 'end-marker';
          endMarkerElement.style.width = '25px';
          endMarkerElement.style.height = '25px';
          endMarkerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNlNzFkMzYiIGQ9Ik0xMiAwYy02LjYyMyAwLTEyIDUuMzc3LTEyIDEyczUuMzc3IDEyIDEyIDEyIDEyLTUuMzc3IDEyLTEyLTUuMzc3LTEyLTEyLTEyeiIvPjxwYXRoIGQ9Ik0xOCA4aC0xMnY4aDEyeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)';
          endMarkerElement.style.backgroundSize = '100%';

          // Add markers to the map
          new mapboxgl.Marker(startMarkerElement)
            .setLngLat(startCoords)
            .addTo(map.current);
          
          new mapboxgl.Marker(endMarkerElement)
            .setLngLat(endCoords)
            .addTo(map.current);

          // Get real routes from Mapbox API
          const routes = await getRoute(startCoords, endCoords);

          // Use the first route as our selected route
          const routeGeometry = routes[0].geometry;
          
          // Add the route to the map
          try {
            // Check again if source already exists before adding
            if (!map.current?.getSource('route')) {
              map.current?.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: routeGeometry
                }
              });
            }
            
            if (!map.current?.getLayer('route-layer')) {
              map.current?.addLayer({
                id: 'route-layer',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': selectedRoute.isRecommended ? '#10b981' : '#0e8fe0',
                  'line-width': 6,
                  'line-opacity': 0.8
                }
              });
            }
          } catch (e) {
            console.error('Error adding route source/layer:', e);
          }
          
          // Add toll points if the route has tolls
          if (selectedRoute.tolls && selectedRoute.tolls.length > 0) {
            // Generate some points along the route for tolls
            const routeLength = routeGeometry.coordinates.length;
            const tollPoints = selectedRoute.tolls.map((toll: Toll, index: number) => {
              // Position tolls evenly along the route
              const position = Math.floor((index + 1) * routeLength / (selectedRoute.tolls.length + 1));
              return {
                type: 'Feature',
                properties: {
                  name: toll.name,
                  cost: toll.cost
                },
                geometry: {
                  type: 'Point',
                  coordinates: routeGeometry.coordinates[position]
                }
              };
            });
            
            map.current?.addSource('tolls', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: tollPoints as any
              }
            });
            
            map.current?.addLayer({
              id: 'tolls-layer',
              type: 'circle',
              source: 'tolls',
              paint: {
                'circle-radius': 6,
                'circle-color': '#f97316',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }
            });
            
            // Add popup for toll information
            map.current?.on('click', 'tolls-layer', (e) => {
              if (!e.features || e.features.length === 0) return;
              
              const coordinates = (e.features[0].geometry as any).coordinates.slice();
              const { name, cost } = e.features[0].properties;
              
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`<strong>${name}</strong><br>Cost: ₹${cost}`)
                .addTo(map.current!);
            });
            
            // Change cursor on hover
            map.current?.on('mouseenter', 'tolls-layer', () => {
              if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            
            map.current?.on('mouseleave', 'tolls-layer', () => {
              if (map.current) map.current.getCanvas().style.cursor = '';
            });
          }
          
          // Fit the map to the route bounds with padding
          const bounds = new mapboxgl.LngLatBounds()
            .extend(startCoords)
            .extend(endCoords);
        
          map.current.fitBounds(bounds, {
            padding: 80,
            maxZoom: 15
          });
        } catch (error) {
          console.error("Error loading route:", error);
          setError('Failed to load route information. Please try again later.');
          toast({
            title: "Map Error",
            description: "There was a problem loading the route.",
            variant: "destructive"
          });
        }
      };
      
      loadRouteAndMarkers();
    }
  }, [start, destination, selectedRoute, mapLoaded, mapboxToken, toast, waypoints]);

  useEffect(() => {
    // When the waypoints change, try to initialize the map with waypoints
    if (waypoints && waypoints.length >= 2 && mapLoaded && map.current) {
      initMapWithWaypoints();
    }
  }, [waypoints, mapLoaded]);
  
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }}>
        {error && (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}
        {loadingRoute && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow-md px-4 py-2">
              <p>Loading route...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
