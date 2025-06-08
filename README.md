# 🚗 Car Workshop Management System

A comprehensive management system for car workshops built with modern React and TypeScript. This system provides a complete solution for managing customers, vehicles, maintenance records, inventory, invoicing, and reporting.

## ✨ Features

### 🏢 Core Management
- **Customer Management** - Complete customer database with contact information
- **Vehicle Tracking** - Vehicle registration, history, and maintenance tracking
- **Maintenance Cards** - Detailed maintenance records and service history
- **Employee Management** - Staff management with role-based access control

### 📦 Inventory & Parts
- **Parts Management** - Main warehouse inventory tracking
- **Issue Requests** - Parts requisition and approval workflow
- **Secondary Warehouse** - Additional storage location management

### 💰 Financial Management
- **Outgoing Invoices** - Customer billing and payment tracking
- **Incoming Invoices** - Supplier and vendor invoice management
- **Return Invoices** - Product return and refund processing
- **External Technicians** - External service provider billing
- **Workshop Equipment** - Equipment purchase and maintenance costs
- **General Expenses** - Utilities and operational expenses

### 📊 Reporting & Analytics
- **Dashboard** - Real-time overview of workshop operations
- **Reports** - Comprehensive reporting system
- **Multi-language Support** - Arabic and English interface
- **Dark/Light Theme** - User preference themes

## 🛠 Tech Stack

- **React 18** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **React Router v6** - Modern routing solution
- **Heroicons** - Beautiful SVG icons
- **Headless UI** - Unstyled, accessible UI components

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yazanvi33/car-workshop-management-system.git
   cd car-workshop-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
car-workshop-management-system/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── Modal.tsx
│   ├── Sidebar.tsx
│   └── Table.tsx
├── pages/              # Application pages
│   ├── DashboardPage.tsx
│   ├── CustomersPage.tsx
│   ├── VehiclesPage.tsx
│   └── ...
├── context/            # React context providers
├── utils/              # Utility functions
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
└── App.tsx            # Main application component
```

## 🔧 Recent Updates & Fixes

This project has been updated to use the latest modern technologies:

### Dependencies Updated
- **React**: v17 → v18 (with new createRoot API)
- **React Router**: v5 → v6 (with nested routing)
- **Heroicons**: v1 → v2 (updated import paths)
- **TypeScript Types**: Updated to match React 18

### Issues Resolved
- ✅ Fixed Heroicons import errors
- ✅ Updated to React 18 createRoot API
- ✅ Migrated to React Router v6 structure
- ✅ Resolved TypeScript compilation errors
- ✅ Fixed CSS display issues
- ✅ Added missing CSS files

## 🌐 Multi-language Support

The application supports both Arabic and English:
- RTL (Right-to-Left) layout for Arabic
- LTR (Left-to-Right) layout for English
- Complete translation for all UI elements

## 🎨 Theming

- **Light Mode** - Clean, professional appearance
- **Dark Mode** - Easy on the eyes for extended use
- **System** - Automatically matches OS preference

## 🔐 Role-based Access Control

- **Admin** - Full system access
- **Accountant** - Financial and customer management
- **Technician** - Maintenance and parts management

## 📱 Responsive Design

Fully responsive design that works on:
- Desktop computers
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React ecosystem
- Icons by [Heroicons](https://heroicons.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [Headless UI](https://headlessui.com/)
