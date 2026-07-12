# TransitOps - Phase 2: Registries

This document summarizes the work completed during **Phase 2: Registries** of the TransitOps platform. The focus of this phase was to implement fully functional, real-time management consoles for Vehicles and Drivers, replacing the placeholder pages.

---

## 1. New UI Components Introduced

To support the forms and statuses across the registries, several new glassmorphic UI components were created in `src/components/ui/`:

- **`Modal.tsx`**: A fully responsive, accessible, backdrop-blur modal component that traps scroll and closes on the Escape key. It serves as the container for all data entry forms.
- **`Badge.tsx`**: Status pills with variant colors (`success`, `warning`, `danger`, `info`, `neutral`) for displaying vehicle and driver statuses dynamically.
- **`Select.tsx`**: A styled, custom native select component built to match the aesthetics of the existing `Input` fields.

---

## 2. Vehicle Registry (`src/pages/Vehicles.tsx`)

The Vehicle Registry was completely overhauled to support full CRUD (Create, Read, Update, Delete) capabilities:

- **Real-Time Data**: Subscribes to the `vehicles` collection using the `subscribeToCollection` service.
- **Data Table**: Displays a responsive table of all vehicles, showing plate numbers, makes, models, years, types, statuses, and mileages.
- **Status Indicators**: Utilizes the `Badge` component to visually indicate if a vehicle is `available`, `on_trip`, `maintenance`, or `retired`.
- **Forms (Add/Edit)**: Integrates the `Modal` component with a comprehensive form to capture all required specifications (e.g., Cargo Capacity, Fuel Type, Insurance Expiry).
- **Deletion**: Allows for the deletion of vehicles with a native confirmation prompt.

---

## 3. Driver Profiles (`src/pages/Drivers.tsx`)

The Driver Profiles page was implemented with advanced management features and assignment linking:

- **Dual Real-Time Subscription**: Subscribes to both the `drivers` and `vehicles` collections to ensure real-time updates and to map assigned vehicles accurately.
- **Data Table**: Displays driver contact details, license information, statuses, and assigned vehicles.
- **Intelligent License Tracking**: The system actively computes the difference between the current date and the license expiry date. 
  - Drivers with an **expired** license receive a red warning badge.
  - Drivers whose license expires **within 30 days** receive an amber warning badge.
- **Vehicle Assignment**: When adding or editing a driver, the form provides a dropdown to assign an available vehicle to them.
- **Forms (Add/Edit)**: Integrates the `Modal` component with a form capturing details like License Class and License Number.
- **Deletion**: Allows for the deletion of drivers with a native confirmation prompt.

---

## 4. Data Layer & Integrations

- All dates entered through the UI are appropriately parsed and saved into the database using ISO strings.
- The `formatDateField` helper from `src/services/db.ts` is used universally in the UI to safely parse both `Date` strings and `FirebaseTimestamp` objects into standard JavaScript `Date` objects for calculations and display.
- The UI gracefully falls back to the dual-mode architecture (Mock Local Storage / Firebase) depending on the configuration in the `.env` file without requiring any changes to the UI code.
