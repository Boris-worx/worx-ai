import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector or data-tour-id
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string; // Optional action hint (e.g., "Click here", "Try this")
  highlight?: boolean; // Whether to highlight the element
}

interface InteractiveTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: TutorialStep[];
  tabName: string;
}

export function InteractiveTutorial({ 
  open, 
  onOpenChange, 
  steps,
  tabName 
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = steps[currentStep];

  // Calculate tooltip position based on highlighted element and desired position
  const calculateTooltipPosition = useCallback((element: HTMLElement, position: string = 'bottom') => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 400;
    const tooltipHeight = 200; // approximate
    const gap = 16; // gap between element and tooltip

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      case 'center':
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Keep tooltip within viewport bounds
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return { top, left };
  }, []);

  // Update highlight and tooltip position when step changes
  useEffect(() => {
    if (!open) {
      setHighlightedElement(null);
      return;
    }

    // If step has no target selector (like intro/outro steps), center the tooltip
    if (!step.targetSelector) {
      setHighlightedElement(null);
      // Use calculateTooltipPosition for consistent center positioning
      const centerPosition = calculateTooltipPosition(
        document.body, // dummy element, won't be used for 'center' position
        'center'
      );
      setTooltipPosition(centerPosition);
      return;
    }

    const findElement = () => {
      // Try data-tour-id first
      let element = document.querySelector(`[data-tour-id="${step.targetSelector}"]`) as HTMLElement;
      
      // Fallback to CSS selector
      if (!element) {
        element = document.querySelector(step.targetSelector) as HTMLElement;
      }

      if (element) {
        setHighlightedElement(element);
        const position = calculateTooltipPosition(element, step.position || 'bottom');
        setTooltipPosition(position);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
        // Center tooltip if element not found
        const centerPosition = calculateTooltipPosition(
          document.body, // dummy element, won't be used for 'center' position
          'center'
        );
        setTooltipPosition(centerPosition);
      }
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(findElement, 100);
    return () => clearTimeout(timeout);
  }, [open, currentStep, step, calculateTooltipPosition]);

  // Update position on window resize
  useEffect(() => {
    if (!open) return;

    const handleResize = () => {
      if (highlightedElement) {
        // Recalculate position for highlighted elements
        const position = calculateTooltipPosition(highlightedElement, step.position || 'bottom');
        setTooltipPosition(position);
      } else if (!step.targetSelector) {
        // Recalculate center position for intro/outro steps
        const centerPosition = calculateTooltipPosition(
          document.body, // dummy element, won't be used for 'center' position
          'center'
        );
        setTooltipPosition(centerPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [highlightedElement, step.position, step.targetSelector, calculateTooltipPosition, open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setHighlightedElement(null);
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!open) return null;

  // Calculate highlighted element position for spotlight
  const highlightRect = highlightedElement?.getBoundingClientRect();

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      {/* Spotlight overlay */}
      {step.highlight && highlightedElement && highlightRect && (
        <>
          {/* SVG overlay with cutout */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#spotlight-mask)"
            />
          </svg>
          
          {/* Highlighted element border */}
          <div
            className="absolute border-2 border-primary rounded-lg shadow-lg shadow-primary/50 animate-pulse"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Tooltip/Guide card */}
      <div
        className="absolute bg-background border border-border rounded-lg shadow-xl p-6 transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          pointerEvents: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {tabName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <h3 className="font-semibold text-lg">{step.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.action && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{step.action}</span>
            </div>
          )}
        </div>

        {/* Progress indicators */}
        <div className="flex gap-1 mt-6 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
          >
            Skip Tutorial
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button size="sm" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleClose}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}