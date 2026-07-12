# TransitOps - Project Documentation & Roadmap

**TransitOps** is a modern, serverless-ready fleet management and transport operations platform. Designed with a premium dark-glassmorphism aesthetic, it provides robust tools for managing vehicles, drivers, dispatch routing, maintenance, fuel logs, and financial analytics.

This document serves as the comprehensive summary of everything accomplished in the initial MVP hackathon (Phases 1-4) and outlines the strategic roadmap for future development (Phase 5+).

---

## Part 1: What Has Been Built (Phases 1 - 4)

The platform is fully functional in a standalone browser environment using a sophisticated mock-database layer that perfectly mirrors Firebase Firestore's asynchronous and real-time subscription behavior.

### 1. Core Architecture & Foundation
* **Tech Stack:** React, TypeScript, Vite, Tailwind CSS (v3), Lucide Icons.
* **Database Layer (`src/services/db.ts`):** 
  * A dual-mode data layer. When `VITE_USE_MOCK_FIREBASE=true`, it uses `localStorage` with a real-time event subscriber system.
  * Ensures components react instantly to data changes (like real Firestore `onSnapshot`).
  * Features `getMockTransaction` to mirror Firestore's atomic `runTransaction`.
* **Authentication & RBAC:**
  * Context-based session management (`AuthContext`).
  * Strict Role-Based Access Control enforcing permissions for `admin`, `manager`, `operator`, and `driver` roles.
  * Protected routes (`RouteGuard`) prevent unauthorized URL access, and UI components conditionally render based on the active user's permissions.

### 2. Fleet & Personnel Registries
* **Vehicles Registry (`Vehicles.tsx`):**
  * Full CRUD (Create, Read, Update, Delete) for fleet assets.
  * Validates license plate uniqueness to prevent duplicate entries.
  * Tracks operational status (`available`, `on_trip`, `maintenance`).
* **Drivers Registry (`Drivers.tsx`):**
  * Manages driver profiles, contact information, and CDL details.
  * **Compliance Alerts:** Automatically flags drivers with expired or soon-to-expire (≤30 days) commercial licenses using dynamic UI badges.
  * Supports assigning a default vehicle to a driver.

### 3. Operations, Dispatch & Maintenance
* **Trips & Dispatch (`Trips.tsx`):**
  * **3-Step Dispatch Wizard:** A guided flow to plan route (Origin/Destination), define cargo, and assign resources.
  * **Atomic Validation:** Validates that the assigned vehicle's weight capacity can handle the cargo load *before* allowing dispatch.
  * Marks both the vehicle and the driver as `on_trip` upon dispatch, automatically locking them out of other concurrent trips.
  * Trip completion captures actual distance and fuel used.
* **Maintenance Logs (`Maintenance.tsx`):**
  * Facility to schedule routine servicing, inspections, or breakdown repairs.
  * Scheduling maintenance atomically locks the vehicle status to `maintenance`, preventing dispatchers from assigning it to new trips.
  * Releasing the vehicle post-maintenance tracks the total cost.

### 4. Finance, Analytics & Exports
* **Fuel Logs (`Fuel.tsx`):**
  * Tracks refuelling events, calculating total costs based on liters and price-per-liter.
  * Updates vehicle odometer readings automatically upon logging fuel.
* **Expenses & Billing (`Expenses.tsx`):**
  * Tracks operational costs (tolls, parking, fines).
  * **Approval Workflow:** Expenses submitted by operators/drivers start as `pending`. Only `admin` and `manager` roles can mark them as `approved` or `rejected`.
* **Reports & Analytics (`Reports.tsx`):**
  * Integrates `recharts` for rich visual analytics.
  * Stacked Bar Chart: Visualizes the monthly distribution of fuel vs. maintenance vs. other expenses.
  * Line Chart: Tracks distance travelled against total operational cost.
  * Computes critical fleet KPIs, including the **Cost per Kilometer**.
* **Exports (`export.ts`):**
  * Generates raw CSV data dumps for fuel and expense records.
  * Integrates `jspdf` and `jspdf-autotable` to generate professional, formatted PDF reports of monthly financial aggregates.

---

## Part 2: What's Next (Phase 5 & Future Enhancements)

With the core mechanics, data relations, and UI/UX completely established, the platform is ready to evolve from an MVP into a production-grade enterprise application. 

### Priority 1: Backend Integration (Firebase Live Mode)
* **Action:** Toggle off the mock layer and configure real Firebase credentials.
* **Details:** 
  * Enable Firebase Authentication (Email/Password & SSO).
  * Deploy Firestore Security Rules to enforce the RBAC logic at the database level (ensuring security even if the client is bypassed).
  * **Impact:** Enables true cross-device synchronization and persistent cloud storage.

### Priority 2: Geospatial & Live Map Routing 🗺️
* **Action:** Integrate `Leaflet` or the `Google Maps API`.
* **Details:**
  * Add a "Command Center" map view to the Dashboard.
  * Geocode Origin and Destination strings into actual coordinates to draw polylines on the map.
  * (Future) Integrate mobile GPS to track driver locations in real-time.

### Priority 3: Progressive Web App (PWA) Support 📱
* **Action:** Implement `vite-plugin-pwa`.
* **Details:**
  * Add a `manifest.json` and service workers.
  * **Impact:** Allows drivers to install the TransitOps portal directly to their iOS/Android home screens, providing a native app experience, offline caching, and faster load times in areas with poor cellular reception.

### Priority 4: Notifications & Webhooks 🔔
* **Action:** Build a notification center and alerting system.
* **Details:**
  * Generate in-app alerts for critical events (e.g., "Vehicle ABC requires maintenance," "Expense report pending approval").
  * Integrate third-party webhooks (e.g., Slack/Discord or Twilio SMS) to notify dispatchers of emergency vehicle breakdowns.

### Priority 5: Theming & Localization
* **Action:** Expand the UI design system.
* **Details:**
  * While the current Dark-Glassmorphism theme is highly premium, adding a light mode toggle ensures accessibility in bright, outdoor environments (critical for drivers).
  * Integrate `react-i18next` to support multiple languages (e.g., English and Spanish) for a diverse workforce.

---

**Conclusion:** 
TransitOps successfully proves its viability as a comprehensive, modern transport management tool. By completing Phases 1-4, we have secured the architectural foundation and business logic. Executing the Phase 5 roadmap will transition the application into a market-ready product.
