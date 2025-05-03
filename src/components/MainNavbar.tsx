import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Menu, X, User, Settings, LogOut, LayoutDashboard, ChevronDown, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/useUserData';

const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();
  const { profile } = useUserData();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    const email = user.email;
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white dark:bg-gray-900 shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-logistics-600" />
            <span className="text-xl font-bold dark:text-white">Last Mile</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className={`px-4 py-2 mx-1 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-logistics-600 dark:text-logistics-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-logistics-600 dark:hover:text-logistics-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Button or User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === "/dashboard"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === "/history"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  History
                </Link>
                <Link
                  to="/ride"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === "/ride" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Ride
                </Link>
                
                {/* New navigation items for data management */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      ["/vehicles", "/locations", "/create-route"].includes(location.pathname)
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}>
                      Management <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/vehicles">Vehicles</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/locations">Locations</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/routes">Routes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-route">Create Route</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Add Register link if user doesn't have an organization */}
                {isAuthenticated && !profile?.organization_id && (
                  <Link
                    to="/register"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === "/register"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center">
                      <Building2 className="mr-1 h-4 w-4" />
                      Register Org
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <Button asChild className="bg-logistics-600 hover:bg-logistics-700 dark:bg-logistics-500 dark:hover:bg-logistics-600">
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 mt-4 py-2 rounded-lg shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-2 p-2">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className={`px-4 py-3 rounded-md text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-logistics-50 dark:bg-logistics-900/50 text-logistics-600 dark:text-logistics-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/history"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    History
                  </Link>
                  <Link
                    to="/ride"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Ride
                  </Link>
                  
                  {/* Management section */}
                  <div className="px-4 py-1 mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Management
                  </div>
                  
                  <Link
                    to="/vehicles"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Vehicles
                  </Link>
                  
                  <Link
                    to="/locations"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Locations
                  </Link>
                  
                  <Link
                    to="/routes"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    My Routes
                  </Link>
                  
                  <Link
                    to="/create-route"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Create Route
                  </Link>
                  
                  {/* Add Register link if user doesn't have an organization */}
                  {isAuthenticated && !profile?.organization_id && (
                    <Link
                      to="/register"
                      className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Register Org
                    </Link>
                  )}
                  
                  <Link
                    to="/settings"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-md text-sm font-medium text-red-600 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </button>
                </>
              ) : (
                <Button asChild className="m-2 bg-logistics-600 hover:bg-logistics-700 dark:bg-logistics-500 dark:hover:bg-logistics-600">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNavbar;
