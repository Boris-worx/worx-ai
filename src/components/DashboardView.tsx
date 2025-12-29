import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Tenant, DataSource, Transaction } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';

interface DashboardViewProps {
  tenants: Tenant[];
  dataSources: DataSource[];
  activeTenantId: string;
  isLoadingTenants: boolean;
  isLoadingDataSources: boolean;
  userRole: string;
  transactions?: Transaction[];
  onTabChange?: (tab: string) => void;
}

// Mock data for dashboard
const mockStats = {
  activeTenants: 5,
  activeTenantsChange: '-4.5%',
  activeTenantsChangeType: 'down' as const,
  
  totalTransactions: 10697,
  totalTransactionsChange: '+20%',
  totalTransactionsChangeType: 'up' as const,
  
  totalApplications: 12,
  totalApplicationsChange: '+15%',
  totalApplicationsChangeType: 'up' as const,
};

const mockMonthlyData = [
  { month: 'Jan', sales: 180, revenue: 40 },
  { month: 'Feb', sales: 200, revenue: 30 },
  { month: 'Mar', sales: 160, revenue: 80 },
  { month: 'Apr', sales: 170, revenue: 40 },
  { month: 'May', sales: 185, revenue: 70 },
  { month: 'Jun', sales: 165, revenue: 40 },
  { month: 'Jul', sales: 160, revenue: 100 },
  { month: 'Aug', sales: 230, revenue: 130 },
  { month: 'Sep', sales: 245, revenue: 145 },
  { month: 'Oct', sales: 220, revenue: 160 },
  { month: 'Nov', sales: 250, revenue: 180 },
  { month: 'Dec', sales: 248, revenue: 170 },
];

const mockQuarterlyData = [
  { period: 'Q1 2024', sales: 540, revenue: 150 },
  { period: 'Q2 2024', sales: 520, revenue: 150 },
  { period: 'Q3 2024', sales: 635, revenue: 375 },
  { period: 'Q4 2024', sales: 718, revenue: 510 },
];

const mockYearlyData = [
  { year: '2019', sales: 1450, revenue: 680 },
  { year: '2020', sales: 1680, revenue: 890 },
  { year: '2021', sales: 1920, revenue: 1050 },
  { year: '2022', sales: 2150, revenue: 1240 },
  { year: '2023', sales: 2380, revenue: 1420 },
  { year: '2024', sales: 2413, revenue: 1185 },
];

const mockSalesCategory = [
  { name: 'Affiliate Program', value: 900, color: '#3641F5', percentage: 48, products: 2040 },
  { name: 'Direct Buy', value: 700, color: '#7592FF', percentage: 33, products: 1402 },
  { name: 'Adsense', value: 850, color: '#DDEFF', percentage: 19, products: 510 },
];

const mockSchedule = [
  {
    date: 'Wed, 11 Jan',
    time: '09:20 AM',
    title: 'Business Analytics Press',
    description: 'Exploring the Future of Data-Driven +6 more'
  },
  {
    date: 'Fri, 15 Feb',
    time: '10:35 AM',
    title: 'Business Sprint',
    description: 'Techniques from Business Sprint +2 more'
  },
  {
    date: 'Thu, 18 Mar',
    time: '1:15 AM',
    title: 'Customer Review Meeting',
    description: 'Insights from the Customer Review Meeting +8 more'
  },
];

// Mock Customer transactions for Recent Data
const mockCustomerTransactions: Transaction[] = [
  {
    TxnId: 'txn-cust-001',
    TxnType: 'Customer',
    Txn: {
      CustomerId: 'CUST-12345',
      FirstName: 'John',
      LastName: 'Smith',
      Email: 'john.smith@example.com',
      Phone: '+1-555-0101',
      Status: 'Active',
      TotalOrders: 15,
      LifetimeValue: 2450.50
    },
    CreateTime: '2024-02-01T10:30:00Z',
    UpdateTime: '2024-02-02T08:15:00Z',
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
    CreateTime: '2024-12-21T08:30:00Z',
    UpdateTime: '2024-12-26T14:00:00Z',
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
    CreateTime: '2024-12-20T10:15:00Z',
    UpdateTime: '2024-12-25T11:30:00Z',
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
      EstimatedDelivery: '2024-12-30'
    },
    CreateTime: '2024-12-24T16:00:00Z',
    UpdateTime: '2024-12-27T06:45:00Z',
  },
];

// Mock data for transactions chart - showing counts by transaction type per month
const mockTransactionsData = [
  { month: 'Jan', Customer: 145, Invoice: 178, Order: 156, Quote: 98, Payment: 201, Product: 87, Location: 23, Shipment: 167 },
  { month: 'Feb', Customer: 167, Invoice: 189, Order: 145, Quote: 112, Payment: 189, Product: 92, Location: 19, Shipment: 178 },
  { month: 'Mar', Customer: 134, Invoice: 156, Order: 167, Quote: 89, Payment: 223, Product: 78, Location: 28, Shipment: 145 },
  { month: 'Apr', Customer: 156, Invoice: 167, Order: 134, Quote: 103, Payment: 198, Product: 81, Location: 22, Shipment: 156 },
  { month: 'May', Customer: 178, Invoice: 201, Order: 178, Quote: 124, Payment: 212, Product: 95, Location: 31, Shipment: 189 },
  { month: 'Jun', Customer: 145, Invoice: 178, Order: 156, Quote: 98, Payment: 201, Product: 89, Location: 25, Shipment: 167 },
  { month: 'Jul', Customer: 134, Invoice: 156, Order: 189, Quote: 87, Payment: 234, Product: 76, Location: 20, Shipment: 178 },
  { month: 'Aug', Customer: 189, Invoice: 223, Order: 201, Quote: 145, Payment: 256, Product: 103, Location: 38, Shipment: 212 },
  { month: 'Sep', Customer: 201, Invoice: 234, Order: 212, Quote: 156, Payment: 267, Product: 108, Location: 42, Shipment: 223 },
  { month: 'Oct', Customer: 178, Invoice: 212, Order: 189, Quote: 134, Payment: 245, Product: 98, Location: 35, Shipment: 201 },
  { month: 'Nov', Customer: 212, Invoice: 245, Order: 223, Quote: 167, Payment: 278, Product: 115, Location: 45, Shipment: 234 },
  { month: 'Dec', Customer: 203, Invoice: 240, Order: 218, Quote: 162, Payment: 273, Product: 112, Location: 43, Shipment: 229 },
];

// Mock data for Data Sources pie chart
const mockDataSourcesData = [
  { name: 'SQL Database', specifications: 45, color: '#6579FF' },
  { name: 'REST API', specifications: 32, color: '#B2BCFF' },
  { name: 'MongoDB', specifications: 28, color: '#8B98FF' },
  { name: 'File Storage', specifications: 15, color: '#D4DAFF' },
  { name: 'Others', specifications: 8, color: '#F1F3FF' },
];

const COLORS = ['#6579FF', '#B2BCFF', '#8B98FF', '#D4DAFF', '#F1F3FF'];

export function DashboardView({
  tenants,
  dataSources,
  activeTenantId,
  isLoadingTenants,
  isLoadingDataSources,
  userRole,
  transactions,
  onTabChange,
}: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Get recent transactions (first 5)
  const recentTransactions = transactions?.slice(0, 5) || mockCustomerTransactions.slice(0, 5);

  // Get chart data based on selected period
  const getChartData = () => {
    switch (chartPeriod) {
      case 'monthly':
        return mockMonthlyData.map(item => ({ name: item.month, Sales: item.sales, Revenue: item.revenue }));
      case 'quarterly':
        return mockQuarterlyData.map(item => ({ name: item.period, Sales: item.sales, Revenue: item.revenue }));
      case 'yearly':
        return mockYearlyData.map(item => ({ name: item.year, Sales: item.sales, Revenue: item.revenue }));
      default:
        return [];
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto">
      {/* Mock Data Banner */}
      

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Top Stats Cards */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {/* Active Tenants - First */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-3xl">
                  {mockStats.activeTenants}
                </h4>
                <button
                  onClick={() => onTabChange?.('tenants')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-end justify-between mt-4 sm:mt-5">
                <div>
                  <p className="text-gray-700 dark:text-gray-400">Active Tenants</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full text-xs ${
                    mockStats.activeTenantsChangeType === 'up'
                      ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500'
                      : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500'
                  }`}>
                    {mockStats.activeTenantsChange}
                  </span>
                  <span className="text-gray-500 text-xs dark:text-gray-400">last month</span>
                </div>
              </div>
            </div>

            {/* Total Transactions - Second */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-3xl">
                  {mockStats.totalTransactions.toLocaleString()}
                </h4>
                <button
                  onClick={() => onTabChange?.('transactions')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-end justify-between mt-4 sm:mt-5">
                <div>
                  <p className="text-gray-700 dark:text-gray-400">Total Transactions</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full text-xs ${
                    mockStats.totalTransactionsChangeType === 'up'
                      ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500'
                      : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500'
                  }`}>
                    {mockStats.totalTransactionsChange}
                  </span>
                  <span className="text-gray-500 text-xs dark:text-gray-400">last month</span>
                </div>
              </div>
            </div>

            {/* Total Applications - Third */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-3xl">
                  {mockStats.totalApplications}
                </h4>
                <button
                  onClick={() => onTabChange?.('applications')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-end justify-between mt-4 sm:mt-5">
                <div>
                  <p className="text-gray-700 dark:text-gray-400">Total Applications</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full text-xs ${
                    mockStats.totalApplicationsChangeType === 'up'
                      ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500'
                      : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500'
                  }`}>
                    {mockStats.totalApplicationsChange}
                  </span>
                  <span className="text-gray-500 text-xs dark:text-gray-400">last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Chart */}
        <div className="col-span-12 xl:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">Transactions</h3>
                <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">Transaction types distribution</p>
              </div>
              <button
                onClick={() => onTabChange?.('transactions')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-9 mb-6">
              <div className="flex items-start gap-2">
                <div>
                  <h4 className="text-base font-bold text-gray-800 dark:text-white/90 sm:text-xl">10,697</h4>
                  <span className="text-gray-500 text-xs dark:text-gray-400">Total Transactions</span>
                </div>
                <span className="mt-1.5 flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-500/15 dark:text-green-500">
                  +23.2%
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div>
                  <h4 className="text-base font-bold text-gray-800 dark:text-white/90 sm:text-xl">891</h4>
                  <span className="text-gray-500 text-xs dark:text-gray-400">Avg. Monthly Volume</span>
                </div>
                <span className="mt-1.5 flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 dark:bg-red-500/15 dark:text-red-500">
                  -12.3%
                </span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTransactionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="Customer" fill="#6579FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Invoice" fill="#B2BCFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Sources Pie Chart */}
        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">Data Sources</h3>
                <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">Distribution of data sources</p>
              </div>
              <button
                onClick={() => onTabChange?.('data-sources')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockDataSourcesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="specifications"
                  >
                    {mockDataSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Data Table */}
        <div className="col-span-12">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 px-6 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90">Recent Data</h3>
              </div>
              <button
                onClick={() => onTabChange?.('data-plane')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="px-6 pb-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No transactions available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Navigate to Data Plane to view transactions</p>
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full">
                  <thead className="px-6 py-3 border-t border-gray-100 border-y bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-500 sm:px-6 dark:text-gray-400">Transaction ID</td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">Type</td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">Details</td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">Status</td>
                      <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">Created</td>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction, index) => {
                      const txnData = transaction.Txn;
                      const txnType = transaction.TxnType;
                      
                      // Render info based on transaction type
                      const renderInfo = () => {
                        if (!txnData || typeof txnData !== 'object') {
                          return <div className="text-sm text-gray-500 dark:text-gray-500">No data</div>;
                        }

                        switch (txnType) {
                          case 'Customer':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.FirstName} {txnData.LastName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.Email}
                                </p>
                              </div>
                            );
                          
                          case 'Invoice':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.InvoiceNumber}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.CustomerName} • ${txnData.Amount?.toLocaleString()}
                                </p>
                              </div>
                            );
                          
                          case 'Order':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.OrderNumber}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.CustomerName} • {txnData.ItemCount} items
                                </p>
                              </div>
                            );
                          
                          case 'Quote':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.QuoteNumber}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.CustomerName} • ${txnData.Amount?.toLocaleString()}
                                </p>
                              </div>
                            );
                          
                          case 'Payment':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.PaymentReference}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.PaymentMethod} • ${txnData.Amount?.toLocaleString()}
                                </p>
                              </div>
                            );
                          
                          case 'Product':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.ProductName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.SKU} • ${txnData.Price?.toLocaleString()}
                                </p>
                              </div>
                            );
                          
                          case 'Location':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.LocationName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.Type} • {txnData.Manager}
                                </p>
                              </div>
                            );
                          
                          case 'Shipment':
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                                  {txnData.TrackingNumber}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {txnData.Carrier} • {txnData.Origin} → {txnData.Destination}
                                </p>
                              </div>
                            );
                          
                          default:
                            return (
                              <div className="text-sm text-gray-700 dark:text-gray-400 max-w-md truncate">
                                {Object.keys(txnData).slice(0, 3).join(', ')}
                              </div>
                            );
                        }
                      };

                      // Render status badge
                      const renderStatus = () => {
                        if (!txnData?.Status) {
                          return <span className="text-sm text-gray-500 dark:text-gray-500">-</span>;
                        }

                        const statusVariant = 
                          txnData.Status === 'Active' || txnData.Status === 'Paid' || txnData.Status === 'Completed' || txnData.Status === 'Shipped'
                            ? 'default'
                            : txnData.Status === 'Pending' || txnData.Status === 'In Transit' || txnData.Status === 'In Stock'
                            ? 'secondary'
                            : 'outline';

                        return (
                          <Badge variant={statusVariant} className="text-xs">
                            {txnData.Status}
                          </Badge>
                        );
                      };
                      
                      return (
                        <tr key={transaction.TxnId || index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className="block text-sm text-gray-700 dark:text-gray-400 font-mono">
                              {transaction.TxnId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <Badge variant="secondary" className="text-xs">
                              {transaction.TxnType || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            {renderInfo()}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            {renderStatus()}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                              {transaction.CreateTime 
                                ? new Date(transaction.CreateTime).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })
                                : 'N/A'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}