
import React from 'react';
import { Link } from 'react-router-dom';
import { ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <ZapOff className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Route Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for couldn't be located on our map. Let's get you back on the right route.
        </p>
        <Button asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
