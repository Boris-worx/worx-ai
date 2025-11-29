import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { PreloadState } from '../lib/useDataPreloader';

interface PreloadIndicatorProps {
  state: PreloadState;
  onRetry?: () => void;
}

export function PreloadIndicator({ state, onRetry }: PreloadIndicatorProps) {
  const [dots, setDots] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Animate dots
  useEffect(() => {
    if (!state.isPreloading) return;

    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [state.isPreloading]);

  // Fade in animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (state.isComplete && !state.error) {
    return null; // Hide when complete
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`w-full max-w-md p-8 mx-4 bg-card rounded-lg shadow-lg border transition-all duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <svg width="64" height="64" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M79.5452 0H16.4548C7.36707 0 0 7.36811 0 16.4571V79.5429C0 88.6319 7.36706 96 16.4548 96H79.5452C88.6329 96 96 88.6319 96 79.5429V16.4571C96 7.36812 88.6329 0 79.5452 0Z" fill="url(#paint0_linear_preload)"/>
            <path d="M58.5836 59.5607V66.7565C58.5836 67.6492 57.8702 68.366 56.9818 68.366H39.1867C38.2983 68.366 37.5848 67.6492 37.5848 66.7565V59.5607C37.5848 58.668 36.8714 57.9512 35.983 57.9512H26.9778V77.4148C26.9778 78.3075 27.6912 79.0243 28.5796 79.0243H67.6023C68.4907 79.0243 69.2041 78.3075 69.2041 77.4148V57.9512H60.1989C59.3105 57.9512 58.597 58.668 58.597 59.5607" fill="white"/>
            <path d="M80.5582 55.3558L49.0326 16.9722C48.3983 16.1963 47.1838 16.1963 46.5495 16.9722L15.0239 55.3558C14.1736 56.3993 14.9159 57.9512 16.2654 57.9512H26.6165L46.5495 33.7358C47.1972 32.9598 48.3983 32.9598 49.0326 33.7358L68.9656 57.9512H79.3301C80.6797 57.9512 81.422 56.3993 80.5717 55.3558" fill="white"/>
            <defs>
              <linearGradient id="paint0_linear_preload" x1="50.3855" y1="-0.546216" x2="50.3855" y2="96.0033" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E11837"/>
                <stop offset="0.34" stopColor="#DC1734"/>
                <stop offset="0.73" stopColor="#CD152D"/>
                <stop offset="1" stopColor="#C01327"/>
              </linearGradient>
            </defs>
          </svg>
          
          <h2 className="text-xl font-semibold text-center text-foreground mb-2">
            Paradigm Transaction Gateway
          </h2>
          
          {state.error ? (
            <p className="text-sm text-destructive text-center">
              Loading completed with errors
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {state.isPreloading ? `${state.currentTask}${dots}` : 'Ready'}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {state.isPreloading && (
          <div className="mb-6 space-y-2">
            <Progress value={state.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{state.currentTask}</span>
              <span>{Math.round(state.progress)}%</span>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {state.isPreloading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {state.error && (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {state.error}
              </AlertDescription>
            </Alert>
            
            {onRetry && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {state.isPreloading && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Initializing tenants, applications, and data sources...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
