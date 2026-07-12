# TransitOps - Proposed Additional Features

This document outlines the advanced features and enhancements planned for future phases of the TransitOps platform. These additions aim to increase automation, improve operational visibility, and provide a world-class user experience.

---

## 1. Live Fleet Map
- **Description**: A real-time geographical tracking dashboard for the entire fleet.
- **Capabilities**:
  - Integration with vehicle telematics or driver mobile devices to stream live GPS location data.
  - An interactive map interface (e.g., Google Maps or Mapbox) displaying active vehicles, current routes, and traffic conditions.
  - Geo-fencing alerts that notify dispatchers if a vehicle deviates from its planned route or enters a restricted zone.

## 2. Predictive Maintenance & Vehicle Health Score
- **Vehicle Health Score**:
  - A dynamic, algorithmic score (0-100) assigned to every vehicle.
  - Calculations based on age, current mileage, recent breakdown frequency, and upcoming maintenance requirements.
  - Detailed drill-down views displaying estimated engine wear, tire degradation, and fluid levels.
- **Predictive Maintenance**:
  - Leverages historical maintenance logs to forecast when a vehicle is likely to need servicing *before* a breakdown occurs.
  - Automated generation of maintenance schedules to minimize operational downtime.

## 3. OCR Document Scanner
- **Description**: An automated tool to digitize and ingest physical operational documents (fuel receipts, toll invoices, maintenance bills, etc.).
- **Capabilities**:
  - Uses Optical Character Recognition (OCR) via device cameras or file uploads to extract text, dates, and financial amounts.
  - Auto-populates the "Add Expense" or "Add Fuel Log" forms, drastically reducing manual data entry errors and saving time for drivers and managers.

## 4. Vehicle Document Management
- **Description**: A secure, centralized digital filing cabinet for all vehicle-related paperwork.
- **Capabilities**:
  - Storage for digital copies of vehicle registrations, insurance policies, border permits, and safety inspection certificates.
  - Deep linking of documents directly to specific vehicle profiles.
  - Cloud storage integration (via Firebase Storage) allowing secure viewing and downloading from anywhere on the platform.

## 5. Automated Email Reminders
- **Description**: A proactive notification engine to ensure absolute compliance and prevent expired licenses or insurances.
- **Capabilities**:
  - Background jobs (e.g., Firebase Cloud Functions) that continuously scan the database for impending expiration dates.
  - Automated email dispatch to both the specific Driver and the Fleet Manager at 30-day, 15-day, and 5-day intervals prior to the expiration of a Driver's License or Vehicle Insurance.

## 6. Charts and Visual Analytics
- **Description**: A rich, interactive analytics dashboard for upper management to understand fleet economics at a glance.
- **Capabilities**:
  - Interactive graphing (using libraries like Recharts or Chart.js) for tracking monthly operational expenses, fuel consumption trends, and overall fleet utilization rates.
  - Visual breakdown of maintenance costs versus revenue generation per vehicle.

## 7. PDF Export
- **Description**: The ability to generate professional, downloadable reports instantly.
- **Capabilities**:
  - One-click export of data tables, driver logs, financial reports, and analytics dashboards into formatted PDF documents.
  - Essential for compliance reporting, tax filings, and stakeholder presentations.

## 8. Advanced Search, Filter, and Sorting
- **Description**: Enhanced data grid controls across all platform registries and operation tables.
- **Capabilities**:
  - Multi-criteria advanced filtering (e.g., "Show all *Available* *Trucks* with *Mileage < 50,000*").
  - Click-to-sort column headers and global text search bars to instantly locate specific drivers, vehicles, or trip manifests within massive datasets.

## 9. Dark Mode / Light Mode Toggle
- **Description**: User-preference-driven interface theming.
- **Capabilities**:
  - While the current design utilizes a premium dark-glassmorphism aesthetic, this feature introduces a formal theme switcher (Light / Dark / System Default).
  - Dynamic Tailwind color variable swapping to ensure maximum accessibility and comfortable viewing across different lighting conditions and personal preferences.
