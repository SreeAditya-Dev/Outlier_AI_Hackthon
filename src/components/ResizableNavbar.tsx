"use client";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck, Settings, LogOut, LayoutDashboard, Building2, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo as BaseNavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export function ResizableNavbar() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { profile } = useUserData();
  const { toast } = useToast();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Features", link: "/features" },
    { name: "Pricing", link: "/pricing" },
  ];

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

  // Custom NavbarLogo component that uses the project's logo
  const NavbarLogo = () => {
    return (
      <Link
        to="/"
        className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
      >
        <Truck className="h-8 w-8 text-logistics-600" />
        <span className="font-medium text-black dark:text-white">Last Mile</span>
      </Link>
    );
  };

  return (
    <div className="relative w-full">
      {/* Spacer to prevent content from being hidden behind the fixed navbar */}
      <div className="h-24"></div>

      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navLinks} />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NavbarButton as={Link} to="/dashboard" variant="secondary">
                  Dashboard
                </NavbarButton>
                <NavbarButton as={Link} to="/auth" variant="primary">
                  My Account
                </NavbarButton>
              </>
            ) : (
              <>
                <NavbarButton as={Link} to="/auth" variant="secondary">
                  Login
                </NavbarButton>
                <NavbarButton as={Link} to="/auth" variant="primary">
                  Get Started
                </NavbarButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navLinks.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                to={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  History
                </Link>
                <Link
                  to="/ride"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Vehicles
                </Link>

                <Link
                  to="/locations"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Locations
                </Link>

                <Link
                  to="/routes"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  My Routes
                </Link>

                <Link
                  to="/create-route"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Create Route
                </Link>

                {/* Add Register link if user doesn't have an organization */}
                {isAuthenticated && !profile?.organization_id && (
                  <Link
                    to="/register"
                    className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Register Org
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="px-4 py-3 rounded-md text-sm font-medium flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-md text-sm font-medium text-red-600 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </button>
              </>
            ) : (
              <div className="flex w-full flex-col gap-4">
                <NavbarButton
                  as={Link}
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="secondary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
                <NavbarButton
                  as={Link}
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Get Started
                </NavbarButton>
              </div>
            )}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
