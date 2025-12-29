import { Tenant, DataSource, Transaction } from './api';

// Mock Tenants
export const MOCK_TENANTS: Tenant[] = [
  {
    TenantId: 'tenant-001',
    TenantName: 'Acme Corporation',
    Description: 'Global technology solutions provider',
    CreateTime: '2024-01-15T10:30:00Z',
    UpdateTime: '2024-01-20T14:22:00Z',
    _etag: 'mock-etag-1'
  },
  {
    TenantId: 'tenant-002',
    TenantName: 'Northwind Traders',
    Description: 'International trading company',
    CreateTime: '2024-01-18T09:15:00Z',
    UpdateTime: '2024-01-25T11:45:00Z',
    _etag: 'mock-etag-2'
  },
  {
    TenantId: 'tenant-003',
    TenantName: 'Contoso Ltd',
    Description: 'Enterprise software solutions',
    CreateTime: '2024-02-01T08:00:00Z',
    UpdateTime: '2024-02-10T16:30:00Z',
    _etag: 'mock-etag-3'
  },
  {
    TenantId: 'tenant-004',
    TenantName: 'Fabrikam Inc',
    Description: 'Manufacturing and distribution',
    CreateTime: '2024-02-05T12:20:00Z',
    UpdateTime: '2024-02-15T10:10:00Z',
    _etag: 'mock-etag-4'
  },
  {
    TenantId: 'tenant-005',
    TenantName: 'Adventure Works',
    Description: 'Outdoor equipment retailer',
    CreateTime: '2024-02-10T14:45:00Z',
    UpdateTime: '2024-02-20T09:30:00Z',
    _etag: 'mock-etag-5'
  }
];

// Mock Data Sources
export const MOCK_DATA_SOURCES: DataSource[] = [
  {
    DatasourceId: 'ds-001',
    DatasourceName: 'SAP ECC Production',
    DatasourceType: 'SAP',
    TenantId: 'tenant-001',
    Description: 'Production SAP ECC system',
    CreateTime: '2024-01-16T10:00:00Z',
    UpdateTime: '2024-01-22T15:30:00Z',
    _etag: 'ds-etag-1'
  },
  {
    DatasourceId: 'ds-002',
    DatasourceName: 'Oracle Financials',
    DatasourceType: 'Oracle',
    TenantId: 'tenant-002',
    Description: 'Oracle financial management system',
    CreateTime: '2024-01-19T11:20:00Z',
    UpdateTime: '2024-01-26T13:45:00Z',
    _etag: 'ds-etag-2'
  },
  {
    DatasourceId: 'ds-003',
    DatasourceName: 'Microsoft Dynamics 365',
    DatasourceType: 'Dynamics',
    TenantId: 'tenant-003',
    Description: 'Dynamics 365 CRM and ERP',
    CreateTime: '2024-02-02T09:30:00Z',
    UpdateTime: '2024-02-12T14:20:00Z',
    _etag: 'ds-etag-3'
  },
  {
    DatasourceId: 'ds-004',
    DatasourceName: 'SAP S/4HANA Cloud',
    DatasourceType: 'SAP',
    TenantId: 'tenant-004',
    Description: 'SAP S/4HANA cloud instance',
    CreateTime: '2024-02-06T13:00:00Z',
    UpdateTime: '2024-02-16T11:15:00Z',
    _etag: 'ds-etag-4'
  },
  {
    DatasourceId: 'ds-005',
    DatasourceName: 'NetSuite ERP',
    DatasourceType: 'NetSuite',
    TenantId: 'tenant-005',
    Description: 'NetSuite cloud ERP system',
    CreateTime: '2024-02-11T15:45:00Z',
    UpdateTime: '2024-02-21T10:30:00Z',
    _etag: 'ds-etag-5'
  },
  {
    DatasourceId: 'ds-006',
    DatasourceName: 'SAP ARIBA',
    DatasourceType: 'SAP',
    TenantId: 'tenant-001',
    Description: 'SAP ARIBA procurement platform',
    CreateTime: '2024-02-15T08:20:00Z',
    UpdateTime: '2024-02-25T16:10:00Z',
    _etag: 'ds-etag-6'
  }
];

// Mock Transactions - Realistic data for Dashboard
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    TxnId: 'txn-cust-001',
    TxnType: 'Customer',
    Txn: {
      CustomerId: 'CUST-12345',
      FirstName: 'John',
      LastName: 'Smith',
      Email: 'john.smith@acme.com',
      Phone: '+1-555-0101',
      Status: 'Active',
      TotalOrders: 15,
      LifetimeValue: 2450.50
    },
    CreateTime: '2024-02-01T10:30:00Z',
    UpdateTime: '2024-02-02T08:15:00Z',
    _etag: 'txn-etag-001'
  },
  {
    TxnId: 'txn-inv-002',
    TxnType: 'Invoice',
    Txn: {
      InvoiceId: 'INV-98765',
      InvoiceNumber: 'INV-2024-001',
      CustomerId: 'CUST-12346',
      CustomerName: 'Sarah Johnson',
      Amount: 1850.00,
      Currency: 'USD',
      Status: 'Paid',
      DueDate: '2024-02-15',
      Items: 5
    },
    CreateTime: '2024-02-01T14:20:00Z',
    UpdateTime: '2024-02-01T16:45:00Z',
    _etag: 'txn-etag-002'
  },
  {
    TxnId: 'txn-ord-003',
    TxnType: 'Order',
    Txn: {
      OrderId: 'ORD-55432',
      OrderNumber: 'ORD-2024-156',
      CustomerId: 'CUST-12347',
      CustomerName: 'Michael Brown',
      TotalAmount: 5680.75,
      Currency: 'USD',
      Status: 'Completed',
      ShippingAddress: '123 Main St, New York, NY',
      ItemCount: 12
    },
    CreateTime: '2024-02-02T09:10:00Z',
    UpdateTime: '2024-02-02T14:30:00Z',
    _etag: 'txn-etag-003'
  },
  {
    TxnId: 'txn-quo-004',
    TxnType: 'Quote',
    Txn: {
      QuoteId: 'QUO-77889',
      QuoteNumber: 'QUO-2024-089',
      CustomerId: 'CUST-12348',
      CustomerName: 'Emily Davis',
      Amount: 8450.00,
      Currency: 'USD',
      Status: 'Pending',
      ValidUntil: '2024-02-20',
      ProductCount: 8
    },
    CreateTime: '2024-02-02T11:00:00Z',
    UpdateTime: '2024-02-02T13:20:00Z',
    _etag: 'txn-etag-004'
  },
  {
    TxnId: 'txn-pay-005',
    TxnType: 'Payment',
    Txn: {
      PaymentId: 'PAY-33221',
      PaymentReference: 'PAY-2024-0455',
      CustomerId: 'CUST-12349',
      CustomerName: 'David Wilson',
      Amount: 12340.25,
      Currency: 'USD',
      Status: 'Completed',
      PaymentMethod: 'Wire Transfer',
      TransactionDate: '2024-02-03'
    },
    CreateTime: '2024-02-03T15:45:00Z',
    UpdateTime: '2024-02-03T16:00:00Z',
    _etag: 'txn-etag-005'
  },
  {
    TxnId: 'txn-prod-006',
    TxnType: 'Product',
    Txn: {
      ProductId: 'PROD-88992',
      SKU: 'SKU-2024-TECH-001',
      ProductName: 'Premium Laptop Pro 15"',
      Category: 'Electronics',
      Price: 2499.99,
      Currency: 'USD',
      Status: 'In Stock',
      Quantity: 45,
      Supplier: 'TechCorp Inc.'
    },
    CreateTime: '2024-02-03T08:30:00Z',
    UpdateTime: '2024-02-04T14:00:00Z',
    _etag: 'txn-etag-006'
  },
  {
    TxnId: 'txn-loc-007',
    TxnType: 'Location',
    Txn: {
      LocationId: 'LOC-44556',
      LocationName: 'Downtown Store NYC',
      Address: '456 Broadway, New York, NY 10013',
      Type: 'Retail',
      Status: 'Active',
      Manager: 'Jennifer Martinez',
      EmployeeCount: 24
    },
    CreateTime: '2024-02-04T10:15:00Z',
    UpdateTime: '2024-02-05T11:30:00Z',
    _etag: 'txn-etag-007'
  },
  {
    TxnId: 'txn-ship-008',
    TxnType: 'Shipment',
    Txn: {
      ShipmentId: 'SHIP-66778',
      TrackingNumber: 'TRK-2024-US-9988776',
      OrderId: 'ORD-55432',
      Carrier: 'FedEx',
      Status: 'In Transit',
      Origin: 'Los Angeles, CA',
      Destination: 'New York, NY',
      EstimatedDelivery: '2024-02-10'
    },
    CreateTime: '2024-02-05T16:00:00Z',
    UpdateTime: '2024-02-06T06:45:00Z',
    _etag: 'txn-etag-008'
  },
  {
    TxnId: 'txn-cust-009',
    TxnType: 'Customer',
    Txn: {
      CustomerId: 'CUST-67890',
      FirstName: 'Amanda',
      LastName: 'Rodriguez',
      Email: 'amanda.r@northwind.com',
      Phone: '+1-555-0202',
      Status: 'Active',
      TotalOrders: 8,
      LifetimeValue: 1250.00
    },
    CreateTime: '2024-02-06T09:20:00Z',
    UpdateTime: '2024-02-07T10:15:00Z',
    _etag: 'txn-etag-009'
  },
  {
    TxnId: 'txn-inv-010',
    TxnType: 'Invoice',
    Txn: {
      InvoiceId: 'INV-98766',
      InvoiceNumber: 'INV-2024-002',
      CustomerId: 'CUST-67890',
      CustomerName: 'Amanda Rodriguez',
      Amount: 3200.00,
      Currency: 'USD',
      Status: 'Pending',
      DueDate: '2024-02-25',
      Items: 3
    },
    CreateTime: '2024-02-07T11:30:00Z',
    UpdateTime: '2024-02-08T09:00:00Z',
    _etag: 'txn-etag-010'
  }
];

// Mock function to get all tenants
export async function getMockTenants(): Promise<Tenant[]> {
  return [...MOCK_TENANTS];
}

// Mock function to get data sources by tenant
export async function getMockDataSources(tenantId?: string): Promise<DataSource[]> {
  if (!tenantId || tenantId === 'global') {
    return [...MOCK_DATA_SOURCES];
  }
  return MOCK_DATA_SOURCES.filter(ds => ds.TenantId === tenantId);
}

// Mock function to get transactions
export async function getMockTransactions(tenantId?: string): Promise<Transaction[]> {
  if (!tenantId || tenantId === 'global') {
    return [...MOCK_TRANSACTIONS];
  }
  return MOCK_TRANSACTIONS.filter(txn => txn.TenantId === tenantId);
}

// Mock transaction types
export const MOCK_TRANSACTION_TYPES = [
  'PurchaseOrder',
  'Invoice',
  'Payment',
  'Receipt',
  'Journal',
  'CreditNote',
  'DebitNote',
  'GoodsReceipt'
];

// Mock Transaction Type Models (for Transaction Onboarding)
export interface TransactionTypeModel {
  id: string;
  TenantId: string;
  TransactionType: string;
  ModelName: string;
  Schema: any;
  CreateTime: string;
  UpdateTime: string;
  _etag: string;
}

export const MOCK_TRANSACTION_TYPE_MODELS: TransactionTypeModel[] = [
  {
    id: 'model-001',
    TenantId: 'tenant-001',
    TransactionType: 'Customer',
    ModelName: 'CustomerModel',
    Schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' }
      }
    },
    CreateTime: '2024-01-15T10:00:00Z',
    UpdateTime: '2024-01-20T15:00:00Z',
    _etag: 'model-etag-1'
  },
  {
    id: 'model-002',
    TenantId: 'tenant-001',
    TransactionType: 'LineType',
    ModelName: 'LineTypeModel',
    Schema: {
      type: 'object',
      properties: {
        lineId: { type: 'string' },
        quantity: { type: 'number' },
        price: { type: 'number' }
      }
    },
    CreateTime: '2024-01-16T11:00:00Z',
    UpdateTime: '2024-01-21T14:00:00Z',
    _etag: 'model-etag-2'
  },
  {
    id: 'model-003',
    TenantId: 'tenant-001',
    TransactionType: 'Location',
    ModelName: 'LocationModel',
    Schema: {
      type: 'object',
      properties: {
        locationId: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' }
      }
    },
    CreateTime: '2024-01-17T09:00:00Z',
    UpdateTime: '2024-01-22T16:00:00Z',
    _etag: 'model-etag-3'
  },
  {
    id: 'model-004',
    TenantId: 'tenant-001',
    TransactionType: 'Quote',
    ModelName: 'QuoteModel',
    Schema: {
      type: 'object',
      properties: {
        quoteId: { type: 'string' },
        amount: { type: 'number' },
        validUntil: { type: 'string' }
      }
    },
    CreateTime: '2024-01-18T12:00:00Z',
    UpdateTime: '2024-01-23T13:00:00Z',
    _etag: 'model-etag-4'
  },
  {
    id: 'model-005',
    TenantId: 'tenant-001',
    TransactionType: 'ReasonCode',
    ModelName: 'ReasonCodeModel',
    Schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        description: { type: 'string' }
      }
    },
    CreateTime: '2024-01-19T10:00:00Z',
    UpdateTime: '2024-01-24T11:00:00Z',
    _etag: 'model-etag-5'
  },
  {
    id: 'model-006',
    TenantId: 'tenant-001',
    TransactionType: 'ServiceRequest',
    ModelName: 'ServiceRequestModel',
    Schema: {
      type: 'object',
      properties: {
        requestId: { type: 'string' },
        serviceType: { type: 'string' },
        priority: { type: 'string' }
      }
    },
    CreateTime: '2024-01-20T14:00:00Z',
    UpdateTime: '2024-01-25T10:00:00Z',
    _etag: 'model-etag-6'
  }
];

// Mock Applications
export interface Application {
  id: string;
  TenantId: string;
  ApplicationName: string;
  Description: string;
  Version: string;
  Status: string;
  CreateTime: string;
  UpdateTime: string;
  _etag: string;
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    TenantId: 'tenant-001',
    ApplicationName: 'NexusFlow BigTools',
    Description: 'Enterprise resource planning application',
    Version: '2.5.0',
    Status: 'Active',
    CreateTime: '2024-01-10T08:00:00Z',
    UpdateTime: '2024-02-15T12:00:00Z',
    _etag: 'app-etag-1'
  },
  {
    id: 'app-002',
    TenantId: 'tenant-002',
    ApplicationName: 'BFS Online',
    Description: 'Online financial services platform',
    Version: '1.8.3',
    Status: 'Active',
    CreateTime: '2024-01-12T09:00:00Z',
    UpdateTime: '2024-02-18T14:00:00Z',
    _etag: 'app-etag-2'
  },
  {
    id: 'app-003',
    TenantId: 'tenant-003',
    ApplicationName: 'NexusFlow Analytics',
    Description: 'Business intelligence and analytics',
    Version: '3.1.2',
    Status: 'Active',
    CreateTime: '2024-01-14T10:00:00Z',
    UpdateTime: '2024-02-20T11:00:00Z',
    _etag: 'app-etag-3'
  }
];

// Mock data by transaction type for Data Plane
// Using consistent structure: ID (random), id, arnum2, name, entby, entdate
const firstNames = ['JOHN', 'JANE', 'MICHAEL', 'EMILY', 'DAVID', 'SARAH', 'JAMES', 'LAURA', 'CARLOS', 'ANNA', 'ROBERT', 'MARIA', 'WILLIAM', 'LINDA', 'RICHARD'];
const lastNames = ['SMITH', 'DOE', 'BROWN', 'JOHNSON', 'WILSON', 'TAYLOR', 'ANDERSON', 'THOMAS', 'MARTINEZ', 'LEE', 'GARCIA', 'RODRIGUEZ', 'DAVIS', 'MILLER', 'MOORE'];
const entbyUsers = ['abc1234', 'def5678', 'ghi9012', 'jkl3456', 'mno7890', 'pqr2468', 'stu1357', 'vwx8642', 'yz0123', 'lmn4567'];

// Helper to generate random ID
const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const MOCK_DATA_BY_TYPE: Record<string, any[]> = {
  'Customer': Array.from({ length: 26 }, (_, i) => {
    const arnum = 700101 + i;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    return {
      ID: generateRandomId(),
      id: `goodbuy:${arnum}|${lastName}_${firstName}`,
      arnum2: arnum,
      name: `${firstName} ${lastName}`,
      entby: entbyUsers[i % entbyUsers.length],
      entdate: new Date(1970 + (i * 2), (i * 3) % 12, (i * 5) % 28 + 1).toISOString().split('T')[0]
    };
  }),
  'LineType': Array.from({ length: 22 }, (_, i) => {
    const arnum = 800101 + i;
    const firstName = firstNames[(i + 5) % firstNames.length];
    const lastName = lastNames[(i + 3) % lastNames.length];
    return {
      ID: generateRandomId(),
      id: `linetype:${arnum}|${lastName}_${firstName}`,
      arnum2: arnum,
      name: `${firstName} ${lastName}`,
      entby: entbyUsers[(i + 2) % entbyUsers.length],
      entdate: new Date(1975 + (i * 2), (i * 4) % 12, (i * 7) % 28 + 1).toISOString().split('T')[0]
    };
  }),
  'Location': Array.from({ length: 34 }, (_, i) => {
    const arnum = 900101 + i;
    const firstName = firstNames[(i + 7) % firstNames.length];
    const lastName = lastNames[(i + 2) % lastNames.length];
    return {
      ID: generateRandomId(),
      id: `location:${arnum}|${lastName}_${firstName}`,
      arnum2: arnum,
      name: `${firstName} ${lastName}`,
      entby: entbyUsers[(i + 4) % entbyUsers.length],
      entdate: new Date(1980 + (i * 1), (i * 2) % 12, (i * 3) % 28 + 1).toISOString().split('T')[0]
    };
  }),
  'Quote': Array.from({ length: 7088 }, (_, i) => {
    const quoteNum = 133114 - i; // Start from 133114 and count down
    return {
      ID: generateRandomId(),
      id: `Quote:${quoteNum}`,
      'quote Id': quoteNum,
      'customer Id': i % 3 === 0 ? 63495 : 2,
      'service Request Id': 50403 + (i % 6),
      'is Published': false
    };
  }),
  'ReasonCode': Array.from({ length: 15 }, (_, i) => {
    const arnum = 600101 + i;
    const firstName = firstNames[(i + 10) % firstNames.length];
    const lastName = lastNames[(i + 5) % lastNames.length];
    return {
      ID: generateRandomId(),
      id: `reasoncode:${arnum}|${lastName}_${firstName}`,
      arnum2: arnum,
      name: `${firstName} ${lastName}`,
      entby: entbyUsers[(i + 6) % entbyUsers.length],
      entdate: new Date(1985 + i, (i * 5) % 12, (i * 9) % 28 + 1).toISOString().split('T')[0]
    };
  }),
  'ServiceRequest': Array.from({ length: 3512 }, (_, i) => {
    const arnum = 500101 + i;
    const firstName = firstNames[(i + 3) % firstNames.length];
    const lastName = lastNames[(i + 8) % lastNames.length];
    return {
      ID: generateRandomId(),
      id: `servicerequest:${arnum}|${lastName}_${firstName}`,
      arnum2: arnum,
      name: `${firstName} ${lastName}`,
      entby: entbyUsers[(i + 1) % entbyUsers.length],
      entdate: new Date(1990 + Math.floor(i / 200), (i * 6) % 12, (i * 11) % 28 + 1).toISOString().split('T')[0]
    };
  })
};

// Get mock transaction type models
export async function getMockTransactionTypeModels(tenantId?: string): Promise<TransactionTypeModel[]> {
  if (!tenantId || tenantId === 'global') {
    return [...MOCK_TRANSACTION_TYPE_MODELS];
  }
  return MOCK_TRANSACTION_TYPE_MODELS.filter(m => m.TenantId === tenantId);
}

// Get mock applications
export async function getMockApplications(tenantId?: string): Promise<Application[]> {
  if (!tenantId || tenantId === 'global') {
    return [...MOCK_APPLICATIONS];
  }
  return MOCK_APPLICATIONS.filter(app => app.TenantId === tenantId);
}

// Get mock data by transaction type
export async function getMockDataByType(type: string, tenantId?: string): Promise<any[]> {
  const rawData = MOCK_DATA_BY_TYPE[type] || [];
  
  // Transform to Transaction structure with Txn wrapper
  return rawData.map((item, index) => ({
    TxnId: item.ID || item.id || `${type}-${index}`,
    TxnType: type,
    Txn: item, // Wrap the actual data in Txn field
    CreateTime: new Date().toISOString(),
    UpdateTime: new Date().toISOString(),
    _etag: `etag-${index}`
  }));
}

// Get unique transaction types from mock data
export function getMockTransactionTypes(): string[] {
  return Object.keys(MOCK_DATA_BY_TYPE);
}

// Get count by transaction type
export function getMockCountByType(type: string): number {
  return MOCK_DATA_BY_TYPE[type]?.length || 0;
}

// Mock Model Schemas for Transaction Onboarding
// In-memory storage for model schemas (simulates database)
let MOCK_MODEL_SCHEMAS_STORE: any[] = [
  {
    id: 'schema-quote-1',
    model: 'Quote',
    version: 1,
    state: 'active',
    semver: '1.1.0',
    jsonSchema: {
      "$id": "Quote",
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Quote",
      "type": "object",
      "required": ["quote Id"],
      "properties": {
        "quote Id": { "type": "integer" },
        "customer Id": { "type": "integer" },
        "service Request Id": { "type": "integer" },
        "is Published": { "type": "boolean" }
      }
    },
    CreateTime: '2024-01-18T12:00:00Z',
    UpdateTime: '2024-12-20T10:00:00Z',
    _etag: 'etag-quote-1'
  },
  {
    id: 'schema-customer-1',
    model: 'Customer',
    version: 1,
    state: 'active',
    semver: '1.0.0',
    jsonSchema: {
      "$id": "Customer",
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Customer",
      "type": "object",
      "required": ["arnum2", "name"],
      "properties": {
        "id": { "type": "string" },
        "arnum2": { "type": "integer" },
        "name": { "type": "string" },
        "entby": { "type": "string" },
        "entdate": { "type": "string", "format": "date" }
      }
    },
    CreateTime: '2024-01-15T10:00:00Z',
    UpdateTime: '2024-12-15T14:00:00Z',
    _etag: 'etag-customer-1'
  },
  {
    id: 'schema-location-1',
    model: 'Location',
    version: 1,
    state: 'active',
    semver: '1.0.0',
    jsonSchema: {
      "$id": "Location",
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "Location",
      "type": "object",
      "required": ["arnum2", "name"],
      "properties": {
        "id": { "type": "string" },
        "arnum2": { "type": "integer" },
        "name": { "type": "string" },
        "entby": { "type": "string" },
        "entdate": { "type": "string", "format": "date" }
      }
    },
    CreateTime: '2024-01-17T09:00:00Z',
    UpdateTime: '2024-12-17T11:00:00Z',
    _etag: 'etag-location-1'
  }
];

// Get mock model schemas
export async function getMockModelSchemas(): Promise<any[]> {
  // Return a copy to prevent external modifications
  return [...MOCK_MODEL_SCHEMAS_STORE];
}

// Create mock model schema
export async function createMockModelSchema(schema: any): Promise<any> {
  const newSchema = {
    ...schema,
    id: `schema-${schema.model.toLowerCase()}-${Date.now()}`,
    CreateTime: new Date().toISOString(),
    UpdateTime: new Date().toISOString(),
    _etag: `etag-${Date.now()}`
  };
  MOCK_MODEL_SCHEMAS_STORE.push(newSchema);
  console.log('✅ Mock schema created:', newSchema.model);
  return newSchema;
}

// Update mock model schema
export async function updateMockModelSchema(id: string, schema: any): Promise<any> {
  const index = MOCK_MODEL_SCHEMAS_STORE.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('Schema not found');
  }
  
  const updatedSchema = {
    ...MOCK_MODEL_SCHEMAS_STORE[index],
    ...schema,
    UpdateTime: new Date().toISOString(),
    _etag: `etag-${Date.now()}`
  };
  MOCK_MODEL_SCHEMAS_STORE[index] = updatedSchema;
  console.log('✅ Mock schema updated:', updatedSchema.model);
  return updatedSchema;
}

// Delete mock model schema
export async function deleteMockModelSchema(id: string): Promise<void> {
  const index = MOCK_MODEL_SCHEMAS_STORE.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('Schema not found');
  }
  
  // Soft delete - mark as deleted instead of removing
  MOCK_MODEL_SCHEMAS_STORE[index].state = 'deleted';
  MOCK_MODEL_SCHEMAS_STORE[index].UpdateTime = new Date().toISOString();
  console.log('✅ Mock schema deleted:', MOCK_MODEL_SCHEMAS_STORE[index].model);
}