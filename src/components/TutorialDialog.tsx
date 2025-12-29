import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Building2, 
  Receipt, 
  Database, 
  AppWindow, 
  FileJson,
  ChevronRight,
  ChevronLeft,
  Home,
  Users,
  Lock,
  Globe,
  Key,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import { Separator } from './ui/separator';

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TutorialStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  tips?: string[];
  roles?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Welcome to NexusFlow RT',
    icon: <Home className="h-8 w-8" />,
    description: 'This is a management application for tenants and ERP transactions on the BFS platform with Cosmos DB API integration.',
    features: [
      'Role system: Portal.SuperUser, ViewOnlySuperUser, Admin, Developer, Viewer',
      'Multi-tenancy with global tenant support',
      'Complete data isolation between tenants',
      'Integration with BFS API and Apicurio Registry',
      'ETag support for optimistic locking'
    ],
    tips: [
      'Use the tenant selector in the top right corner to switch between tenants',
      'Global tenant has access to data from all tenants',
      'Each tab adapts to your role and access permissions'
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard - Overview',
    icon: <LayoutDashboard className="h-8 w-8" />,
    description: 'Get a comprehensive overview of your data and activities across all modules.',
    features: [
      'View total counts for Tenants, Transactions, Data Sources, and Capture Specs',
      'Interactive charts showing top Transaction Types',
      'Transaction distribution pie chart',
      'Data Sources breakdown by type',
      'Activity summary with visual progress bars'
    ],
    tips: [
      'Dashboard automatically updates when switching tenants',
      'Charts display only non-zero transaction types',
      'All numbers are formatted with thousand separators for readability',
      'Dashboard respects tenant isolation - you only see your data'
    ]
  },
  {
    id: 'tenants',
    title: 'Tenants - Tenant Management',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Manage vendors (tenants) and their configurations in the system.',
    features: [
      'Create new tenants with automatic TenantId generation',
      'Edit and delete existing tenants',
      'Import tenants from JSON/CSV files',
      'View detailed information for each tenant',
      'Export tenant data',
      'Switch between card and table views'
    ],
    roles: ['Portal.SuperUser', 'ViewOnlySuperUser'],
    tips: [
      'Only global users (SuperUser/ViewOnlySuperUser) can see all tenants',
      'Tenant-specific users only see their own tenant ("My Tenant" tab)',
      'TenantId is automatically generated from TenantName',
      'Import supports both JSON and CSV formats'
    ]
  },
  {
    id: 'transactions',
    title: 'Transaction Onboarding - Transaction Types',
    icon: <Receipt className="h-8 w-8" />,
    description: 'Define and manage transaction types and data models (Model Schemas).',
    features: [
      'Create new transaction types with JSON schemas',
      'Edit existing Model Schemas',
      'Manage transaction fields',
      'Protection of system types from modifications',
      'Compact display of data schemas',
      'Search and filter transaction types'
    ],
    roles: ['Portal.SuperUser', 'Admin', 'Developer'],
    tips: [
      'System types (LineType, Quote, Invoice, etc.) are protected from edits',
      'Model Schema defines the data structure for transactions',
      'Use JSON editor for precise schema configuration',
      'Each tenant has their own transaction types'
    ]
  },
  {
    id: 'datasources',
    title: 'Data Source Onboarding - Data Sources',
    icon: <FileJson className="h-8 w-8" />,
    description: 'Manage data sources and Data Capture Specifications with Apicurio Registry integration.',
    features: [
      'Create Data Capture Specifications',
      'Use templates from Apicurio Registry',
      'Auto-populate settings from JSON schemas',
      'Filter templates by groups (Bid Tools, BFS Online)',
      'Edit and delete data sources',
      'Link to transaction types in Data Plane'
    ],
    roles: ['Portal.SuperUser', 'Admin', 'Developer'],
    tips: [
      'Apicurio Templates are preloaded on application start',
      'Data Capture Spec becomes a Transaction Type in Data Plane',
      'Use templates from "Bid Tools Templates", "BFS Online Templates", "BFS Trend", and "Builder Profile" groups',
      'Templates automatically populate ModelSchemaId, SourceName, and other fields'
    ]
  },
  {
    id: 'applications',
    title: 'Applications - Application Management',
    icon: <AppWindow className="h-8 w-8" />,
    description: 'Manage applications and their configurations in the system.',
    features: [
      'Create new applications',
      'Edit application configurations',
      'Delete applications',
      'View detailed information for each application',
      'Link applications to tenants'
    ],
    roles: ['Portal.SuperUser', 'Admin', 'Developer'],
    tips: [
      'Applications are linked to specific tenants',
      'Each application can have its own settings and configurations',
      'Use applications to organize transactions by sources'
    ]
  },
  {
    id: 'dataplane',
    title: 'Data Plane - Data Plane',
    icon: <Database className="h-8 w-8" />,
    description: 'View and manage real transactional data from all sources.',
    features: [
      'View transactions by type (LineType, Quote, Invoice, etc.)',
      'Automatic column generation from real API data',
      'Configure column visibility (first 5 + Actions by default)',
      'Create new transactions',
      'Edit existing transactions',
      'Delete transactions',
      'Pagination with 100 records per page',
      'Skeleton loading for improved UX'
    ],
    roles: ['Portal.SuperUser', 'ViewOnlySuperUser', 'Admin', 'Developer', 'Viewer'],
    tips: [
      'Transaction type "LineType" loads by default',
      'Columns are dynamically generated from real data',
      'Use the column settings button to display additional fields',
      'Data is isolated by tenant - each tenant sees only their data',
      'Global tenant sees data from all tenants'
    ]
  },
  {
    id: 'roles',
    title: 'Role and Access System',
    icon: <Lock className="h-8 w-8" />,
    description: 'Understanding the role system and access permissions in the application.',
    features: [
      'Portal.SuperUser - full access to all features',
      'ViewOnlySuperUser - view all data without editing',
      'Admin - manage transactions and data sources',
      'Developer - create and edit transaction types',
      'Viewer - view-only access to Data Plane'
    ],
    tips: [
      '"Tenants" tab is accessible only to SuperUser and ViewOnlySuperUser',
      'Transaction Onboarding, Data Sources, and Applications tabs are accessible to SuperUser, Admin, Developer',
      'Data Plane tab is accessible to all roles',
      'Create/edit/delete permissions depend on role',
      'Tenant-specific users are locked to their tenant'
    ]
  },
  {
    id: 'tenantIsolation',
    title: 'Data Isolation Between Tenants',
    icon: <Globe className="h-8 w-8" />,
    description: 'How data isolation and the global tenant work.',
    features: [
      'Each tenant has isolated data',
      'Global tenant (TenantId: "global") - special tenant',
      'Global tenant sees data from ALL tenants',
      'Regular tenants see only their own data',
      'Tenant-specific users are locked to their tenant'
    ],
    tips: [
      'Use global tenant for system-wide administration',
      'Switch tenants via the selector in the top right corner',
      'When creating data, it is automatically linked to the active tenant',
      'Data from other tenants is completely isolated and invisible'
    ]
  },
  {
    id: 'apiIntegration',
    title: 'API Integration',
    icon: <Key className="h-8 w-8" />,
    description: 'Integration with BFS API and Apicurio Registry.',
    features: [
      'BFS API: https://dp-eastus-poc-txservices-apis.azurewebsites.net',
      'Apicurio Registry: https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io',
      'X-BFS-Auth authentication for BFS API',
      'ETag support for optimistic locking',
      'Automatic caching of Apicurio Templates'
    ],
    tips: [
      'Apicurio Templates are loaded on application start',
      'Real JSON schemas are used when creating Data Capture Specs',
      'ETag protects against conflicts during concurrent editing',
      'All API operations are logged to browser console'
    ]
  }
];

export function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
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
    onOpenChange(false);
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {step.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription className="mt-1">
                Step {currentStep + 1} of {tutorialSteps.length}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {/* Description */}
            <div>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Roles Badge */}
            {step.roles && step.roles.length > 0 && (
              <div>
                <h4 className="text-sm mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Available for roles:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {step.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Features */}
            <div>
              <h4 className="text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Main Features:
              </h4>
              <ul className="space-y-2">
                {step.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm mb-3">💡 Tips:</h4>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            {currentStep < tutorialSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}