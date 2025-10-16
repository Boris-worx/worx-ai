import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Menu, Building2, FileJson, Receipt, Bug, Moon, Sun } from 'lucide-react';
import { Separator } from './ui/separator';

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onBugReportClick: () => void;
}

export function MobileMenu({ activeTab, onTabChange, theme, onThemeChange, onBugReportClick }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate between pages and access settings
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Navigation */}
          <div className="space-y-2">
            <p className="px-2 text-xs text-muted-foreground uppercase tracking-wider">Navigation</p>
            <nav className="space-y-1">
              <Button
                variant={activeTab === 'tenants' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('tenants')}
                className="w-full justify-start"
              >
                <Building2 className="h-4 w-4 mr-3" />
                Tenants
              </Button>
              <Button
                variant={activeTab === 'modelschema' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('modelschema')}
                className="w-full justify-start"
              >
                <FileJson className="h-4 w-4 mr-3" />
                Transaction Onboarding
              </Button>
              <Button
                variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('transactions')}
                className="w-full justify-start"
              >
                <Receipt className="h-4 w-4 mr-3" />
                Data Plane
              </Button>
            </nav>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <p className="px-2 text-xs text-muted-foreground uppercase tracking-wider">Actions</p>
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => {
                  onBugReportClick();
                  setOpen(false);
                }}
                className="w-full justify-start"
              >
                <Bug className="h-4 w-4 mr-3" />
                Report a Bug
              </Button>
              <Button
                variant="ghost"
                onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                className="w-full justify-start"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-3" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-3" />
                    Light Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
