# 🏢 BFS Tenant Management Platform

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Azure](https://img.shields.io/badge/Microsoft_Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)

A modern React/TypeScript web application for managing supplier tenants and ERP transactions on the BFS platform with Azure Cosmos DB integration.

## ✨ Features

### 🏗️ Tenant Management
- ✅ **View All Tenants** - List all tenants from Cosmos DB
- ✅ **Create Tenant** - Add new tenants with auto-generated IDs
- ✅ **Edit Tenant** - Update tenant information with ETag concurrency control
- ✅ **Delete Tenant** - Remove tenants with confirmation dialog
- ✅ **View Details** - See complete tenant information and metadata
- ✅ **Import JSON** - Bulk import from Postman Collections or JSON files

### 📊 Smart Features
- 🔄 **Real-time API Sync** - Auto-load data from Azure Cosmos DB
- 📥 **Flexible Import** - Supports multiple JSON formats (Postman Collection, arrays, API responses)
- 🔍 **Search & Filter** - Quick search across tenant data
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

### 🔐 API Integration
- ✅ **Secure Authentication** - X-BFS-Auth header-based authentication
- ✅ **ETag Support** - Optimistic concurrency control for updates
- ✅ **CORS Ready** - Configured for cross-origin requests
- ✅ **Error Handling** - Graceful error messages and recovery

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ or modern web browser
- BFS API access (or use demo mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bfs-tenant-management.git
   cd bfs-tenant-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API (Optional)**
   
   Edit `/lib/api.ts`:
   ```typescript
   const API_BASE_URL = "https://your-api-url.azurewebsites.net/1.0";
   const AUTH_HEADER_VALUE = "your-api-key-here";
   const DEMO_MODE = false; // Set to true for demo mode
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📖 Usage

### View Tenants
- Click **"Load from API"** to fetch tenants from Cosmos DB
- Tenants are automatically loaded on app start (if API is configured)

### Create Tenant
1. Click **"Add New Tenant"**
2. Enter tenant name
3. System generates unique TenantId
4. Click **"Create Tenant"**

### Edit Tenant
1. Click **"Edit"** on any tenant
2. Modify tenant name
3. Click **"Update Tenant"**
4. System handles ETag validation automatically

### Delete Tenant
1. Click **"Delete"** on any tenant
2. Confirm deletion in dialog
3. Tenant is removed from Cosmos DB

### Import from JSON
1. Click **"Import JSON"**
2. Upload one of these formats:
   - Postman Collection (extracts from request bodies)
   - Simple array: `[{ "TenantName": "Company A" }]`
   - API response: `{ "data": { "tenants": [...] } }`
   - Single tenant: `{ "TenantName": "Company A" }`
3. Click **"Import Tenants"**

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Headless component primitives
- **Lucide React** - Icons

### Backend Integration
- **Azure Cosmos DB** - Database
- **REST API** - BFS Platform APIs
- **Fetch API** - HTTP requests

### Build Tools
- **Vite** - Build tool and dev server
- **ESM** - Modern JavaScript modules

## 📁 Project Structure

```
bfs-tenant-management/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── TenantsView.tsx  # Main tenant management view
│   ├── TenantDetail.tsx # Tenant details dialog
│   ├── TenantEditForm.tsx # Edit tenant dialog
│   ├── TenantImportDialog.tsx # JSON import dialog
│   └── DataTable.tsx    # Reusable data table
├── lib/
│   └── api.ts          # API client and functions
├── styles/
│   └── globals.css     # Tailwind CSS configuration
├── App.tsx             # Main application component
└── README.md           # This file
```

## 🔧 Configuration

### API Settings

Located in `/lib/api.ts`:

```typescript
// API Endpoint
const API_BASE_URL = "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0";

// Authentication
const AUTH_HEADER_KEY = "X-BFS-Auth";
const AUTH_HEADER_VALUE = "your-api-key-here";

// Mode
const DEMO_MODE = false; // true = mock data, false = real API
```

### Environment Variables (Recommended for Production)

Create `.env` file:
```env
VITE_API_URL=https://your-api-url.azurewebsites.net/1.0
VITE_BFS_API_KEY=your-api-key-here
```

Update `/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL;
const AUTH_HEADER_VALUE = import.meta.env.VITE_BFS_API_KEY;
```

## 🌐 API Endpoints

The application uses these BFS Platform API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1.0/tenants` | List all tenants |
| GET | `/1.0/tenants/{id}` | Get single tenant |
| POST | `/1.0/tenants` | Create tenant |
| PUT | `/1.0/tenants/{id}` | Update tenant |
| DELETE | `/1.0/tenants/{id}` | Delete tenant |

### Required Headers
- `X-BFS-Auth`: API authentication key
- `If-Match`: ETag value (for PUT/DELETE)
- `Content-Type`: application/json

## 📚 Documentation

Additional documentation available in the repository:

- **[API Connection Info](API_CONNECTION_INFO.md)** - API setup and configuration
- **[CORS Setup Guide](CORS_SETUP_FOR_API_ADMIN.md)** - For API administrators
- **[Import Formats Guide](IMPORT_FORMATS_GUIDE.md)** - Supported JSON formats
- **[User Stories](USER_STORIES.md)** - Complete feature specifications
- **[Tech Stack Details](TECH_STACK.md)** - Technical architecture

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE/Code-component-6015-355.tsx) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Headless component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Icon library
- **Azure Cosmos DB** - Database platform

## 📞 Support

For issues, questions, or contributions:
- Open an [Issue](../../issues)
- Submit a [Pull Request](../../pulls)
- Check [Documentation](API_CONNECTION_INFO.md)

## 🗺️ Roadmap

- [ ] Transaction management features
- [ ] Transaction Builder workflow
- [ ] Advanced filtering and sorting
- [ ] Export to multiple formats
- [ ] User authentication and roles
- [ ] Audit log and history
- [ ] Batch operations
- [ ] API usage analytics

---

**Built with ❤️ for the BFS Platform**
