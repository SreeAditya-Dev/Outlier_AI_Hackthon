import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Ride from "./pages/Ride";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavbarWrapper from "./components/NavbarWrapper";
import { ThemeProvider } from "./context/ThemeContext";
import Register from './pages/Register';
import VehicleManager from './pages/VehicleManager';
import LocationManager from './pages/LocationManager';
import CreateRoute from './pages/CreateRoute';
import RouteManager from './pages/RouteManager';
import StartTrip from './pages/StartTrip';
import CompleteTrip from './pages/CompleteTrip';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="system" storageKey="lastmile-theme">
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NavbarWrapper />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ride" element={<ProtectedRoute><Ride /></ProtectedRoute>} />

              {/* New routes for the data entry components - all protected */}
              <Route path="/vehicles" element={<ProtectedRoute><VehicleManager /></ProtectedRoute>} />
              <Route path="/locations" element={<ProtectedRoute><LocationManager /></ProtectedRoute>} />
              <Route path="/routes" element={<ProtectedRoute><RouteManager /></ProtectedRoute>} />
              <Route path="/create-route" element={<ProtectedRoute><CreateRoute /></ProtectedRoute>} />
              <Route path="/route/:routeId/start" element={<ProtectedRoute><StartTrip /></ProtectedRoute>} />
              <Route path="/travel/:tripId/complete" element={<ProtectedRoute><CompleteTrip /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
