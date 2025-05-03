import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  toggleMobileSidebar: () => void;
}

const Navbar = ({ toggleMobileSidebar }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

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

  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    const email = user.email;
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 fixed w-full z-50">
      <div className="flex justify-between items-center mx-auto">
        <Link to="/" className="flex items-center space-x-3">
          <Truck className="h-8 w-8 text-logistics-600" />
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            Last Mile
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button variant="link" asChild className="dark:text-gray-300">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="link" asChild className="dark:text-gray-300">
                <Link to="/create-route">Plan Route</Link>
              </Button>
              <Button variant="link" asChild className="dark:text-gray-300">
                <Link to="/history">History</Link>
              </Button>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserInitials()}`} alt="User avatar" />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="link" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 w-full py-2 px-4 pt-2 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="flex flex-col space-y-2">
            {user ? (
              <>
                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                </Button>
                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/ride" onClick={() => setIsMenuOpen(false)}>Plan Route</Link>
                </Button>
                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/history" onClick={() => setIsMenuOpen(false)}>History</Link>
                </Button>

                <div className="py-1 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Management
                </div>

                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/vehicles" onClick={() => setIsMenuOpen(false)}>Vehicles</Link>
                </Button>
                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/locations" onClick={() => setIsMenuOpen(false)}>Locations</Link>
                </Button>
                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/routes" onClick={() => setIsMenuOpen(false)}>Routes</Link>
                </Button>

                <Button variant="ghost" className="justify-start dark:text-gray-300" asChild>
                  <Link to="/settings" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-red-600"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
