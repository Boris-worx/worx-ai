import { TutorialStep } from './InteractiveTutorial';

// Tenants Tab Tutorial
export const tenantsTutorialSteps: TutorialStep[] = [
  {
    id: 'tenants-intro',
    title: 'Welcome to Tenants Management',
    description: 'This tab allows you to manage all supplier tenants in the system. You can create, edit, and delete tenants, as well as import them from files. Let\'s explore the key features!',
    position: 'center'
  },
  {
    id: 'tenants-selector',
    title: 'Tenant Selector',
    description: 'Use this dropdown to switch between tenants. The Global tenant has access to all data, while specific tenants only see their own data. This ensures complete data isolation.',
    targetSelector: 'tenant-selector',
    position: 'bottom',
    action: 'Try switching between different tenants',
    highlight: true
  },
  {
    id: 'tenants-create',
    title: 'Create New Tenant',
    description: 'Click this button to create a new tenant. You\'ll need to provide a Tenant Name, and the system will automatically generate a unique TenantId for you.',
    targetSelector: 'create-tenant-btn',
    position: 'bottom',
    action: 'Click here to create a new tenant',
    highlight: true
  },
  {
    id: 'tenants-import',
    title: 'Import Tenants',
    description: 'You can bulk import tenants from JSON or CSV files. This is useful when migrating data or setting up multiple tenants at once.',
    targetSelector: 'import-tenant-btn',
    position: 'bottom',
    action: 'Click to see import options',
    highlight: true
  },
  {
    id: 'tenants-view-toggle',
    title: 'Switch Between Views',
    description: 'Toggle between card view and table view. Card view is great for browsing, while table view is better for detailed information and bulk operations.',
    targetSelector: 'view-toggle-btn',
    position: 'left',
    action: 'Try switching between views',
    highlight: true
  },
  {
    id: 'tenants-search',
    title: 'Search Tenants',
    description: 'Use the search bar to quickly find tenants by name or ID. The search is instant and filters results as you type.',
    targetSelector: 'search-tenants',
    position: 'bottom',
    action: 'Try searching for a tenant',
    highlight: true
  },
  {
    id: 'tenants-actions',
    title: 'Tenant Actions',
    description: 'Each tenant card or row has action buttons. You can view details, edit information, or delete tenants. Edit and delete actions are only available to SuperUser role.',
    targetSelector: 'tenant-card',
    position: 'right',
    action: 'Hover over a tenant to see available actions',
    highlight: true
  },
  {
    id: 'tenants-complete',
    title: 'You\'re All Set!',
    description: 'You now know how to manage tenants. Remember: only global users (SuperUser/ViewOnlySuperUser) can see all tenants. Tenant-specific users will only see their "My Tenant" tab.',
    position: 'center'
  }
];

// Transactions Tab (Model Schema) Tutorial
export const transactionsTutorialSteps: TutorialStep[] = [
  {
    id: 'transactions-intro',
    title: 'Welcome to Transaction Onboarding',
    description: 'This tab lets you define and manage transaction types (Model Schemas). These schemas define the structure and fields for different transaction types in your system.',
    position: 'center'
  },
  {
    id: 'transactions-create',
    title: 'Create Transaction Type',
    description: 'Click here to create a new Model Schema. You\'ll define the transaction type name, fields, and data structure using JSON format.',
    targetSelector: 'create-modelschema-btn',
    position: 'bottom',
    action: 'Click to create a new transaction type',
    highlight: true
  },
  {
    id: 'transactions-search',
    title: 'Search Transaction Types',
    description: 'Quickly find transaction types by name or ID. This is especially useful when you have many different transaction types defined.',
    targetSelector: 'search-modelschema',
    position: 'bottom',
    action: 'Try searching for a transaction type',
    highlight: true
  },
  {
    id: 'transactions-protected',
    title: 'Protected System Types',
    description: 'Notice the shield icon on some transaction types? These are system types (like LineType, Quote, Invoice) that are protected from editing or deletion to maintain system integrity.',
    targetSelector: 'modelschema-table',
    position: 'right',
    action: 'Look for the shield icons in the table',
    highlight: false
  },
  {
    id: 'transactions-view-schema',
    title: 'View Schema Details',
    description: 'Click the eye icon to view the complete JSON schema for any transaction type. This shows you all fields, data types, and validation rules.',
    targetSelector: 'modelschema-table',
    position: 'right',
    action: 'Click the eye icon on any row',
    highlight: true
  },
  {
    id: 'transactions-edit',
    title: 'Edit Transaction Types',
    description: 'Use the edit button to modify transaction type definitions. You can add new fields, change data types, or update validation rules. Remember: protected types cannot be edited.',
    targetSelector: 'modelschema-table',
    position: 'right',
    action: 'Click edit on a non-protected type',
    highlight: true
  },
  {
    id: 'transactions-tenant-isolation',
    title: 'Tenant Isolation',
    description: 'Transaction types are tenant-specific. Each tenant has their own set of Model Schemas. When you switch tenants, you\'ll see different transaction types.',
    targetSelector: 'tenant-selector',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'transactions-complete',
    title: 'Ready to Go!',
    description: 'You now understand how to manage transaction types. These schemas will be used in Data Source Onboarding and Data Plane for actual transaction data.',
    position: 'center'
  }
];

// Data Sources Tab Tutorial
export const dataSourcesTutorialSteps: TutorialStep[] = [
  {
    id: 'datasources-intro',
    title: 'Welcome to Data Source Onboarding',
    description: 'Here you manage Data Capture Specifications - the bridge between your data sources and transaction types. You can use templates from Apicurio Registry for quick setup.',
    position: 'center'
  },
  {
    id: 'datasources-create',
    title: 'Create Data Capture Spec',
    description: 'Click here to create a new Data Capture Specification. You can start from scratch or use a template from Apicurio Registry to auto-populate fields.',
    targetSelector: 'create-datasource-btn',
    position: 'bottom',
    action: 'Click to create a new data source',
    highlight: true
  },
  {
    id: 'datasources-templates',
    title: 'Apicurio Templates',
    description: 'When creating a new spec, you\'ll see templates from "Bid Tools Templates" and "BFS Online Templates" groups. These templates automatically fill in ModelSchemaId, SourceName, and field mappings.',
    targetSelector: 'create-datasource-btn',
    position: 'bottom',
    action: 'Templates are loaded from Apicurio Registry at startup',
    highlight: false
  },
  {
    id: 'datasources-search',
    title: 'Search Data Sources',
    description: 'Use the search to filter Data Capture Specifications by name, source, or model schema. This helps you quickly find the spec you need.',
    targetSelector: 'search-datasource',
    position: 'bottom',
    action: 'Try searching for a data source',
    highlight: true
  },
  {
    id: 'datasources-table',
    title: 'Data Source Information',
    description: 'The table shows key information: ModelSchemaId (transaction type), SourceName, and field mappings. Each spec defines how external data maps to your transaction types.',
    targetSelector: 'datasources-table',
    position: 'top',
    highlight: true
  },
  {
    id: 'datasources-tenant-isolation',
    title: 'Tenant Isolation',
    description: 'Data sources are tenant-specific. Each tenant has their own data sources. Switch tenants to view different data sources.',
    targetSelector: 'tenant-selector',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'datasources-dataplane',
    title: 'Link to Data Plane',
    description: 'Once created, Data Capture Specifications become available as Transaction Types in the Data Plane tab. This is where your actual transaction data will be stored and managed.',
    position: 'center'
  },
  {
    id: 'datasources-complete',
    title: 'All Set!',
    description: 'You can now create and manage data sources. Remember to check the Data Plane tab to see your specs in action!',
    position: 'center'
  }
];

// Applications Tab Tutorial
export const applicationsTutorialSteps: TutorialStep[] = [
  {
    id: 'applications-intro',
    title: 'Welcome to Applications',
    description: 'Manage applications and their configurations. Applications help organize your transactions by source and provide additional context for data management.',
    position: 'center'
  },
  {
    id: 'applications-create',
    title: 'Create Application',
    description: 'Click here to create a new application. You can define application name, configuration, and link it to specific tenants.',
    targetSelector: 'create-application-btn',
    position: 'bottom',
    action: 'Click to create a new application',
    highlight: true
  },
  {
    id: 'applications-search',
    title: 'Search Applications',
    description: 'Use the search bar to quickly find applications by name, ID, version, or description. The search filters results in real-time.',
    targetSelector: 'search-applications',
    position: 'bottom',
    action: 'Try searching for an application',
    highlight: true
  },
  {
    id: 'applications-table',
    title: 'Application List',
    description: 'View all applications with their configurations. Each application can have custom settings and is linked to a specific tenant for proper data isolation.',
    targetSelector: 'applications-table',
    position: 'top',
    highlight: true
  },
  {
    id: 'applications-tenant-isolation',
    title: 'Tenant Isolation',
    description: 'Applications are tenant-specific. Each tenant has their own set of applications. Switch tenants to view different applications.',
    targetSelector: 'tenant-selector',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'applications-complete',
    title: 'Done!',
    description: 'You can now create and manage applications. Use them to organize your transaction sources effectively.',
    position: 'center'
  }
];

// Data Plane Tab Tutorial
export const dataPlaneTutorialSteps: TutorialStep[] = [
  {
    id: 'dataplane-intro',
    title: 'Welcome to Data Plane',
    description: 'This is where you view and manage actual transaction data. All transactions from your data sources are displayed here, organized by transaction type.',
    position: 'center'
  },
  {
    id: 'dataplane-types-list',
    title: 'Transaction Types List',
    description: 'Browse all available transaction types organized by Data Source. Each type shows the count of transactions. Click a type to view its data.',
    targetSelector: 'transaction-types-list',
    position: 'right',
    action: 'Browse available transaction types',
    highlight: true
  },
  {
    id: 'dataplane-datasource-filter',
    title: 'Filter by Data Source',
    description: 'Filter the transaction types list by Data Source. This helps you focus on specific data sources when you have many types.',
    targetSelector: 'datasource-filter',
    position: 'bottom',
    action: 'Select a data source to filter types',
    highlight: true
  },
  {
    id: 'dataplane-search-types',
    title: 'Search Transaction Types',
    description: 'Quickly find transaction types by name. The search filters the types list in real-time as you type.',
    targetSelector: 'search-types',
    position: 'bottom',
    action: 'Try searching for a transaction type',
    highlight: true
  },
  {
    id: 'dataplane-type-selector',
    title: 'Current Transaction Type',
    description: 'The currently selected transaction type is displayed here. All data shown in the table belongs to this type.',
    targetSelector: 'transaction-type-selector',
    position: 'bottom',
    action: 'This shows your active transaction type',
    highlight: true
  },
  {
    id: 'dataplane-create',
    title: 'Create Transaction',
    description: 'Click here to create a new transaction of the selected type. The transaction will be automatically linked to your active tenant.',
    targetSelector: 'create-transaction-btn',
    position: 'bottom',
    action: 'Click to create a new transaction',
    highlight: true
  },
  {
    id: 'dataplane-tenant-selector',
    title: 'Tenant Selector',
    description: 'Switch between tenants to view their transaction data. Each tenant\'s data is completely isolated for security.',
    targetSelector: 'tenant-selector',
    position: 'bottom',
    action: 'Click to switch tenants (if you have access)',
    highlight: true
  },
  {
    id: 'dataplane-columns',
    title: 'Dynamic Columns',
    description: 'Columns are automatically generated from real API data. By default, you see the first 5 columns plus Actions. Click here to show/hide additional columns.',
    targetSelector: 'column-selector-btn',
    position: 'left',
    action: 'Click to customize visible columns',
    highlight: true
  },
  {
    id: 'dataplane-search',
    title: 'Search Transactions',
    description: 'Search through transactions by any field value. The search filters results in real-time as you type.',
    targetSelector: 'search-transactions',
    position: 'bottom',
    action: 'Try searching for specific transactions',
    highlight: true
  },
  {
    id: 'dataplane-table',
    title: 'Transactions Table',
    description: 'View all transactions of the selected type. Each row represents one transaction with its data fields and action buttons.',
    targetSelector: 'transactions-table',
    position: 'top',
    action: 'Browse transaction data',
    highlight: true
  },
  {
    id: 'dataplane-complete',
    title: 'You\'re Ready!',
    description: 'You now know how to work with transaction data in the Data Plane. Remember: data is always isolated by tenant for security and privacy.',
    position: 'center'
  }
];

// Map tab IDs to tutorial steps
export const tutorialStepsMap: Record<string, TutorialStep[]> = {
  'tenants': tenantsTutorialSteps,
  'modelschema': transactionsTutorialSteps,
  'datasources': dataSourcesTutorialSteps,
  'applications': applicationsTutorialSteps,
  'transactions': dataPlaneTutorialSteps
};

// Get tutorial steps for a specific tab
export function getTutorialSteps(tabId: string): TutorialStep[] {
  return tutorialStepsMap[tabId] || [];
}

// Get tutorial name for a tab
export function getTutorialName(tabId: string): string {
  const names: Record<string, string> = {
    'tenants': 'Tenants',
    'modelschema': 'Transaction Onboarding',
    'datasources': 'Data Source Onboarding',
    'applications': 'Applications',
    'transactions': 'Data Plane'
  };
  return names[tabId] || 'Tutorial';
}