# 🏢 NexusFlow - Multi-tenant ERP Management Platform

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Azure](https://img.shields.io/badge/Microsoft_Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)

A modern React/TypeScript enterprise platform for managing multi-tenant ERP transactions with Azure Cosmos DB integration, role-based access control, and comprehensive dashboard analytics.

## 🌐 Live Application

**Production URL:** [https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/](https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/)

## ✨ Key Features

### 📊 Dashboard (NEW)
- ✅ **Real-time Analytics** - Live statistics for tenants, transactions, and applications
- ✅ **Interactive Charts** - Transaction distribution and data source visualization
- ✅ **Quick Navigation** - One-click access to all sections from dashboard cards
- ✅ **Recent Activity** - Latest data plane entries with live updates
- ✅ **Visual Insights** - Pie charts and bar graphs for data analysis

### 🔐 Authentication & Security (NEW)
- ✅ **Custom Login System** - Email/password authentication with session management
- ✅ **Role-Based Access Control (RBAC)** - 5 role levels (SuperUser, ViewOnlySuperUser, Admin, Developer, Viewer)
- ✅ **Section-Level Permissions** - Granular access to Tenants, Transactions, and Data Plane
- ✅ **Secure Sessions** - LocalStorage-based session with auto-logout
- ✅ **Azure AD Integration** - Optional Microsoft authentication support

### 🏗️ Tenant Management
- ✅ **View All Tenants** - List all tenants from Cosmos DB with filtering
- ✅ **Global Tenant Support** - Special "Global" tenant with access to all data
- ✅ **Tenant Isolation** - Complete data segregation between tenants
- ✅ **Create Tenant** - Add new tenants with auto-generated IDs
- ✅ **Edit Tenant** - Update tenant information with ETag concurrency control
- ✅ **Delete Tenant** - Remove tenants with confirmation dialog
- ✅ **Import JSON** - Bulk import from Postman Collections or JSON files
- ✅ **Tenant Switching** - Quick switch between tenants in header

### 📋 Transaction Onboarding
- ✅ **Model Schema Management** - Define transaction types with JSON Schema validation
- ✅ **Protected Types** - System types (Customer, Location, Quote) cannot be deleted
- ✅ **Schema Validation** - Real-time JSON Schema validation
- ✅ **Quick Templates** - Pre-filled schemas for common transaction types
- ✅ **Visual Schemas** - JSON editor with syntax highlighting

### 📡 Data Source Onboarding
- ✅ **Apicurio Integration** - Connect to Apicurio Registry for schema management
- ✅ **Data Capture Specifications** - Define how data is captured and transformed
- ✅ **BFS Online Integration** - Multiple transaction type support (INV, INV1, QUOTE)
- ✅ **Real-time Sync** - Auto-sync with Apicurio Registry
- ✅ **CRUD Operations** - Full create, read, update, delete functionality

### 🏢 Applications
- ✅ **Application Registry** - Manage ERP applications and their configurations
- ✅ **Tenant Association** - Link applications to specific tenants
- ✅ **API Integration** - Real-time sync with backend APIs
- ✅ **Status Tracking** - Monitor application health and status

### 📊 Data Plane
- ✅ **Quote Support** - Full CRUD for Quote transactions with 18+ fields
- ✅ **Customer/Location** - Manage ERP entities with validation
- ✅ **Pagination** - Efficient data loading with 10 rows per page
- ✅ **Column Customization** - Show/hide columns, persist preferences
- ✅ **Advanced Search** - Filter and search across all fields
- ✅ **Expandable Rows** - View full JSON details in-line
- ✅ **Real-time Updates** - Auto-refresh after operations

### 🎨 UI/UX Features
- ✅ **Collapsible Sidebar** - Maximize workspace with icon-only mode
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Skeleton Loaders** - Smooth loading states
- ✅ **Toast Notifications** - Real-time feedback for all operations
- ✅ **Empty States** - Helpful guidance when no data is present
- ✅ **Interactive Tutorial** - Step-by-step onboarding guide

### 🔧 Developer Features
- ✅ **Mock Data Mode** - Test without API connection
- ✅ **API Debugging Tools** - Built-in request/response inspection
- ✅ **Error Handling** - Graceful error messages and recovery
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **Component Library** - Reusable shadcn/ui components

## 🚀 Quick Start

### Login Credentials

The application supports multiple user roles:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| superuser | super123 | Portal.SuperUser | All sections (Full CRUD) |
| viewonlysuperuser | viewsuper123 | Portal.ViewOnlySuperUser | All sections (Read-only) |
| admin | admin123 | Portal.Admin | Transactions + Data Plane |
| developer | dev123 | Portal.Developer | Transactions + Data Plane |
| viewer | view123 | Portal.Viewer | Transactions + Data Plane (Read-only) |

### Prerequisites

- Node.js 18+ or modern web browser
- BFS API access (or use built-in mock data mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexusflow-portal.git
   cd nexusflow-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API (Optional)**
   
   Edit `/lib/api.ts`:
   ```typescript
   const API_BASE_URL = "https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/1.0";
   const AUTH_HEADER_VALUE = "your-api-key-here";
   const DEMO_MODE = false; // Set to true for demo mode with mock data
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

6. **Login**
   - Use credentials from the table above
   - Email format: `username@company.com` (username part is what matters)
   - Example: `superuser@company.com` / `super123`

## 📖 Usage Guide

### Dashboard Overview

After login, you'll see the Dashboard with:
- **Top Stats Cards** - Active Tenants, Total Transactions, Total Applications (click → to navigate)
- **Transactions Chart** - Visual distribution of transaction types
- **Data Sources Chart** - Pie chart showing data source breakdown
- **Recent Data Table** - Latest data plane entries

### Navigation

The application has 6 main sections:

1. **Dashboard** - Analytics and overview
2. **Tenants** - Tenant management (SuperUser only)
3. **Transaction Onboarding** - Define transaction types and schemas
4. **Data Source Onboarding** - Connect and configure data sources
5. **Applications** - Manage ERP applications
6. **Data Plane** - View and manage transaction data

### Working with Tenants

**View Tenants:**
- Navigate to "Tenants" tab
- All tenants load automatically from API

**Create Tenant:**
1. Click **"Add New Tenant"**
2. Enter tenant name
3. System generates unique TenantId (format: `Tenant_{number}`)
4. Click **"Create Tenant"**

**Switch Tenant:**
- Use the tenant selector in the top bar
- Select "Global" to see all data across tenants
- Select specific tenant to see only their data

**Global Tenant:**
- Has special permission to view all tenant data
- Can manage all transactions and configurations
- Identified by TenantId: "Global"

### Transaction Types

**Create Schema:**
1. Go to "Transaction Onboarding"
2. Click **"Create Model Schema"**
3. Fill in Transaction Type and JSON Schema
4. System validates schema in real-time
5. Click **"Create"**

**Protected Types:**
- Customer, Location, Quote cannot be deleted
- These are system-critical transaction types
- Can be edited but not removed

### Data Sources

**Connect to Apicurio:**
1. Go to "Data Source Onboarding"
2. Click **"Create Data Source"**
3. Configure Apicurio connection details
4. Add Data Capture Specifications
5. Map fields to transaction types

**Supported Transaction Types:**
- BFS Online INV
- BFS Online INV1
- BFS Online QUOTE
- Custom types via schema

### Data Plane Operations

**View Data:**
- Navigate to "Data Plane"
- Select transaction type from dropdown
- Data loads automatically with pagination

**Customize View:**
1. Click column selector (grid icon)
2. Check/uncheck columns to show/hide
3. Click **"Apply"** to save preferences
4. Settings persist across sessions

**Create Transaction:**
1. Click **"Create Transaction"**
2. Fill in required fields
3. System validates based on schema
4. Click **"Submit"**

**Search & Filter:**
- Use search box to filter by any field
- Results update in real-time
- Pagination maintains across searches

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript 5** - Type safety and IntelliSense
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Headless accessible components
- **Lucide React** - Beautiful icon library
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### Backend Integration
- **Azure Cosmos DB** - NoSQL database
- **Azure Static Web Apps** - Hosting platform
- **REST API** - BFS Platform APIs
- **Apicurio Registry** - Schema registry
- **Fetch API** - Modern HTTP client

### Build Tools
- **Vite** - Lightning-fast build tool
- **ESM** - Modern JavaScript modules
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

### State Management
- **React Context** - Authentication state
- **LocalStorage** - Session persistence
- **Custom Hooks** - Reusable logic

## 📁 Project Structure

```
nexusflow-portal/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── DashboardView.tsx      # Dashboard with analytics
│   ├── LoginView.tsx          # Custom login page
│   ├── TenantsView.tsx        # Tenant management
│   ├── ModelSchemaView.tsx    # Transaction schemas
│   ├── DataSourcesView.tsx    # Data source configuration
│   ├── ApplicationsView.tsx   # Application registry
│   ├── TransactionsView.tsx   # Data plane CRUD
│   ├── Sidebar.tsx            # Collapsible navigation
│   ├── TopBar.tsx             # Header with tenant selector
│   ├── AuthContext.tsx        # Authentication provider
│   └── ...                    # Other components
├── lib/
│   ├── api.ts                 # API client
│   ├── mockData.ts            # Demo data
│   ├── apicurio.ts            # Apicurio integration
│   ├── azure-auth.ts          # Azure AD integration
│   └── dataCache.ts           # Client-side caching
├── styles/
│   └── globals.css            # Tailwind configuration
├── App.tsx                    # Main application
└── README.md                  # This file
```

## 🔧 Configuration

### API Settings

Located in `/lib/api.ts`:

```typescript
// Production API Endpoint
const API_BASE_URL = "https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/1.0";

// Authentication
const AUTH_HEADER_KEY = "X-BFS-Auth";
const AUTH_HEADER_VALUE = "your-api-key-here";

// Mode
const DEMO_MODE = false; // true = mock data, false = real API
```

### Apicurio Settings

Located in `/lib/apicurio.ts`:

```typescript
const APICURIO_BASE_URL = "https://your-apicurio-url.com/apis/registry/v3";
const APICURIO_GROUP_ID = "BFS-Online";
```

### Environment Variables (Recommended for Production)

Create `.env` file:
```env
VITE_API_URL=https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/1.0
VITE_BFS_API_KEY=your-api-key-here
VITE_APICURIO_URL=https://your-apicurio-url.com/apis/registry/v3
```

Update configuration files to use:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL;
const AUTH_HEADER_VALUE = import.meta.env.VITE_BFS_API_KEY;
```

## 🌐 API Endpoints

### Tenant APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1.0/tenants` | List all tenants |
| GET | `/1.0/tenants/{id}` | Get single tenant |
| POST | `/1.0/tenants` | Create tenant |
| PUT | `/1.0/tenants/{id}` | Update tenant |
| DELETE | `/1.0/tenants/{id}` | Delete tenant |

### Transaction APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1.0/transactions/{type}` | List transactions by type |
| GET | `/1.0/transactions/{type}/{id}` | Get single transaction |
| POST | `/1.0/transactions/{type}` | Create transaction |
| PUT | `/1.0/transactions/{type}/{id}` | Update transaction |
| DELETE | `/1.0/transactions/{type}/{id}` | Delete transaction |

### Data Source APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1.0/datasources` | List data sources |
| POST | `/1.0/datasources` | Create data source |
| PUT | `/1.0/datasources/{id}` | Update data source |
| DELETE | `/1.0/datasources/{id}` | Delete data source |

### Application APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1.0/applications` | List applications |
| POST | `/1.0/applications` | Create application |
| PUT | `/1.0/applications/{id}` | Update application |
| DELETE | `/1.0/applications/{id}` | Delete application |

### Required Headers
- `X-BFS-Auth`: API authentication key
- `If-Match`: ETag value (for PUT/DELETE)
- `Content-Type`: application/json

## 🔐 Role-Based Access Control

### Role Hierarchy

```
Portal.SuperUser (Level 5)
├── Full access to all sections
├── Can manage tenants
├── Can create/edit/delete all resources
└── Can switch between any tenant

Portal.ViewOnlySuperUser (Level 4)
├── Read-only access to all sections
├── Can view all tenants
└── Cannot modify any resources

Portal.Admin (Level 3)
├── Access to Transactions and Data Plane
├── Can create/edit/delete transactions
└── Limited to assigned tenant

Portal.Developer (Level 2)
├── Access to Transactions and Data Plane
├── Can create/edit transactions
└── Cannot delete

Portal.Viewer (Level 1)
├── Read-only access to Transactions and Data Plane
├── Can view but not modify
└── Limited to assigned tenant
```

### Section-Level Permissions

| Role | Tenants | Transactions | Data Plane |
|------|---------|--------------|------------|
| SuperUser | ✅ Full | ✅ Full | ✅ Full |
| ViewOnlySuperUser | ✅ View | ✅ View | ✅ View |
| Admin | ❌ | ✅ Full | ✅ Full |
| Developer | ❌ | ✅ Edit | ✅ Edit |
| Viewer | ❌ | ✅ View | ✅ View |

## 📚 Documentation

### Core Documentation
- **[User Stories](USER_STORIES.md)** - Complete feature specifications
- **[Tech Stack Details](TECH_STACK.md)** - Technical architecture
- **[API Connection Info](API_CONNECTION_INFO.md)** - API setup guide
- **[Testing Guide](TESTING_GUIDE.md)** - How to test the application
- **[CORS Setup](CORS_SETUP_FOR_API_ADMIN.md)** - For API administrators

### Feature Documentation
- **[Dashboard Guide](DASHBOARD_GUIDE.md)** - Dashboard features
- **[Authentication Guide](AZURE_AD_INTEGRATION.md)** - Login and RBAC
- **[Tenant Isolation](TENANT_ISOLATION_RU.md)** - Multi-tenancy architecture
- **[Import Formats](IMPORT_FORMATS_GUIDE.md)** - Supported JSON formats
- **[Column Filters](COLUMN_FILTERS_FEATURE.md)** - Data table customization

### API Documentation
- **[Quote API Guide (RU)](QUOTE_TEST_RU.md)** - Quick start in Russian
- **[Quote Cheatsheet](QUOTE_CHEATSHEET.md)** - Fast reference
- **[Apicurio Integration](APICURIO_INTEGRATION.md)** - Schema registry setup
- **[Data Sources Guide](DATASOURCES_README_RU.md)** - Data source configuration

### Tutorial Documentation
- **[Interactive Tutorial](TUTORIAL_README.md)** - In-app tutorial system
- **[Data Plane Tutorial](DATA_PLANE_TUTORIAL_RU.md)** - Data plane walkthrough
- **[Role Testing Guide](HOW_TO_TEST_AZURE_ROLES.md)** - Test different roles

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for type safety
- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE/Code-component-6015-355.tsx) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful, accessible UI components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautifully crafted icon library
- **Recharts** - Composable charting library
- **Azure** - Cloud platform and hosting
- **Apicurio** - Schema registry solution

## 📞 Support

For help and support:
- 📧 Email: support@worxai.com
- 🐛 Issues: [GitHub Issues](../../issues)
- 💬 Discussions: [GitHub Discussions](../../discussions)
- 📖 Docs: [Documentation Index](INDEX_DOCUMENTATION_RU.md)

## 🗺️ Roadmap

### Completed ✅
- ✅ Dashboard with analytics and charts
- ✅ Custom authentication system with RBAC
- ✅ Multi-tenant architecture with isolation
- ✅ Transaction management (Data Plane)
- ✅ Quote API support with 18+ fields
- ✅ Customer/Location management
- ✅ Model Schema with JSON validation
- ✅ Data Source onboarding with Apicurio
- ✅ Application registry
- ✅ Column customization and persistence
- ✅ Collapsible sidebar with logo split
- ✅ Dark mode support
- ✅ Interactive tutorial system
- ✅ Import/Export functionality
- ✅ Real-time API synchronization
- ✅ Responsive mobile design

### In Progress 🚧
- 🚧 QuotePacks support (waiting for API)
- 🚧 QuoteDetails support (waiting for API)
- 🚧 Composition functionality
- 🚧 Advanced filtering and sorting
- 🚧 Azure AD B2C integration

### Planned 📅
- 📅 Transaction Builder workflow enhancements
- 📅 Bulk operations (multi-select)
- 📅 Export to Excel/CSV
- 📅 Audit log and history tracking
- 📅 API usage analytics dashboard
- 📅 Real-time notifications
- 📅 Advanced search with query builder
- 📅 Custom report generation
- 📅 Webhook integrations
- 📅 Mobile app (React Native)

## 📊 Statistics

- **Components:** 50+ React components
- **API Endpoints:** 20+ REST endpoints
- **User Roles:** 5 role levels
- **Transaction Types:** 10+ supported types
- **Data Sources:** Apicurio, BFS Online, Custom
- **Languages:** TypeScript (95%), CSS (5%)
- **Bundle Size:** < 500KB (gzipped)
- **Performance:** Lighthouse score 95+

---

**Built with ❤️ for Enterprise Data Management**

**Version:** 2.0.0  
**Last Updated:** December 28, 2025  
**Production URL:** [https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/](https://worxai-efarbbc8a8chdme0.centralus-01.azurewebsites.net/)
