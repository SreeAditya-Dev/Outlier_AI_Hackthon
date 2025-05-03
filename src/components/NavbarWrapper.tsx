import React from 'react';
import { useLocation } from 'react-router-dom';
import MainNavbar from './MainNavbar';
import { ResizableNavbar } from './ResizableNavbar';

const NavbarWrapper: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Pages that should use the resizable navbar
  const landingPages = ['/', '/about', '/features', '/pricing'];
  
  // Check if current path is a landing page
  const isLandingPage = landingPages.includes(path);
  
  return isLandingPage ? <ResizableNavbar /> : <MainNavbar />;
};

export default NavbarWrapper;
