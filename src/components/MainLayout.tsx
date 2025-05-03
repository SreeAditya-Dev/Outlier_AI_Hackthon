
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const location = useLocation();
  
  // Don't show sidebar on auth page
  const isAuthPage = location.pathname === '/auth';

  useEffect(() => {
    // Check screen size on mount and when it changes
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);
      
      // Auto close sidebar on small screens
      if (smallScreen && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!smallScreen && !sidebarOpen && !isAuthPage) {
        setSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthPage]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setSidebarMobile(!sidebarMobile);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar toggleMobileSidebar={() => toggleMobileSidebar()} />
      <div className="flex">
        {!isAuthPage && (
          <>
            <div 
              className={`fixed top-0 left-0 z-40 h-full transition-all duration-300 ${
                sidebarOpen ? 'w-56' : 'w-16'
              } ${isSmallScreen ? 'hidden' : 'block'}`}
            >
              <Sidebar isOpen={sidebarOpen} isIconOnly={!sidebarOpen} />
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-24 -right-4 h-8 w-8 rounded-full border shadow-md z-50 bg-white dark:bg-gray-800"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Mobile sidebar overlay */}
            {sidebarMobile && isSmallScreen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={toggleMobileSidebar}
                ></div>
                <div className="fixed top-0 left-0 z-50 h-full w-56">
                  <Sidebar isOpen={true} />
                </div>
              </>
            )}
          </>
        )}
        <main className={`flex-1 p-4 md:p-6 pt-20 transition-all duration-300 relative top-[20px] ${
          !isAuthPage && !isSmallScreen ? (sidebarOpen ? 'ml-56' : 'ml-16') : 'ml-0'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
