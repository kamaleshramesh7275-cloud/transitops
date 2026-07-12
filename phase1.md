# TransitOps - Phase 1: Foundation Deliverables

This document summarizes all the work done during **Phase 1: Foundation** of the TransitOps platform. It acts as a single point of reference for all configuration files, services, types, layouts, components, and pages created.

---

## 1. Directory Structure Introduced
The following directory structure has been created and populated:
```text
transitops/
├── tailwind.config.js       # Tailwind CSS configurations
├── postcss.config.js        # PostCSS directives
├── vite.config.ts           # Vite application settings
├── index.html               # Entry HTML with Outfit & Inter Google Fonts
├── .env.example             # Firebase environmental variable templates
├── .env                     # Local environment file triggering mock mode
├── src/
│   ├── App.tsx              # Application Routing & AuthContext mounting
│   ├── main.tsx             # Root entry React mounter
│   ├── index.css            # Tailwind directives + frosted-glass components
│   ├── types/
│   │   └── index.ts         # Document schemas (Vehicles, Trips, Drivers, etc.)
│   ├── context/
│   │   └── AuthContext.tsx  # React context state for authenticated session
│   ├── components/
│   │   ├── RouteGuard.tsx   # Role protection routes (Public, Protected, RoleRoute)
│   │   ├── Layout.tsx       # Collapsible sidebar, mobile header, active states
│   │   └── ui/
│   │       ├── Button.tsx   # Reusable button with variants, sizes & spinner loading
│   │       └── Input.tsx    # Styled text inputs showing validation warnings
│   ├── services/
│   │   ├── firebase.ts      # Cloud Firebase SDK initialization
│   │   ├── db.ts            # Firestore operations & localStorage fallback mock DB
│   │   └── auth.ts          # Firebase Auth & Mock Auth validation routines
│   └── pages/
│       ├── Login.tsx        # Modern glassmorphic login screen + demo account links
│       ├── Dashboard.tsx    # Fleet KPI metrics & real-time trip monitors
│       ├── DriverPortal.tsx # Mobile-responsive view for assigned drivers
│       ├── Vehicles.tsx     # Registry placeholder (for Phase 2)
│       ├── Drivers.tsx      # Registry placeholder (for Phase 2)
│       ├── Trips.tsx        # Operations placeholder (for Phase 3)
│       ├── Maintenance.tsx  # Operations placeholder (for Phase 3)
│       ├── Fuel.tsx         # Finance placeholder (for Phase 4)
│       ├── Expenses.tsx     # Finance placeholder (for Phase 4)
│       └── Reports.tsx      # Reports & Analytics placeholder (for Phase 4)
```

---

## 2. Configuration Profiles

### Tailwind Config: `tailwind.config.js`
Custom themes, custom colors for dark mode (`brand-dark`, `brand-card`, `brand-border`, `brand-text`, etc.), custom frosted glass shadow parameters, and `Outfit` / `Inter` font alignments.

### Global Styles: `src/index.css`
Injects Tailwind base components, sets up customized scrollbars, and includes utility classes:
- `.glassmorphism`: Semi-transparent blur card with dynamic borders.
- `.glassmorphism-light`: Softer translucent backdrops.
- `.animate-pulse-soft`: Slow pulsing loop for operational indicators.

---

## 3. Database Schemas (`src/types/index.ts`)
Strict type interfaces designed for the serverless Firestore schemas:
- **`UserDoc`**: Represents users (Admin, Manager, Operator, Driver).
- **`VehicleDoc`**: Track states (`available`, `on_trip`, `maintenance`, `retired`).
- **`DriverDoc`**: Expirations and status updates (`available`, `on_trip`, `suspended`, `off_duty`).
- **`TripDoc`**: Payload weight limits, origin coordinates, status flags.
- **`MaintenanceLogDoc`**, **`FuelLogDoc`**, **`ExpenseDoc`**: Track operational expenditures.

---

## 4. Transparent Mock & Real Services

To make testing immediate and easy without requiring immediate Firebase configurations, the service layer implements a **Dual Mode Fallback**:
- **Firebase mode** activates if environment variables (`VITE_FIREBASE_API_KEY`, etc.) are configured.
- **Mock mode** triggers automatically as fallback, saving and pulling all documents from `localStorage`.
- **`db.ts`** prepopulates a mock dataset (four users, four vehicles, four drivers, three trips, and three expenses/logs) and incorporates an **Observer subscription pattern** mimicking Firestore `onSnapshot` real-time listeners.

---

## 5. Security & Authentication Flow
- **`RouteGuard.tsx`** provides route gates:
  - `PublicRoute`: Only accessed if logged out (Login).
  - `ProtectedRoute`: Accessible if logged in, filterable by allowed roles. Drivers are automatically redirected to `/driver-portal`, and administration roles (Admin, Manager, Operator) to `/dashboard`.
- **`Login.tsx`** includes **Quick Login Demo Cards** so you can click any role (Admin, Manager, Operator, Driver) to log in instantly.

---

## 6. How to Start and Verify
1. Make sure node modules are installed:
   ```powershell
   npm install
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open `http://localhost:5173/` in your browser.
4. Try logging in as the different roles to verify how the sidebar layout dynamically responds!
