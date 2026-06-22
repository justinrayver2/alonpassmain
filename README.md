# Alonpass - Ferry Ticketing System

Alonpass is a web-based ticketing and reservation system built for modern, efficient port operations. It supports role-based access for Customers, Cashiers, and Administrators.

## Current Features
- **Customer Dashboard**: Users can view ferry schedules, make reservations, and manage their bookings.
- **Group Bookings**: Support for unlimited multi-passenger reservations under a single master ticket, with dynamic pax counters for Regular, Student, Senior, and PWD.
- **Cashier Dashboard**: Port staff can manage Walk-in tickets, verify passenger counts with exact pax breakdowns, and mark reservations as Paid/Collected.
- **Admin Dashboard**: System administrators can monitor real-time analytics, manage ferry schedules, and broadcast system-wide announcements to all users.
- **Role-Based Access Control**: Secure login flows specifically designed for the different operational needs of the port.
- **Coast Guard Manifesting**: Dynamic collection of passenger names during group bookings to comply with maritime manifest regulations.

---

## 🚀 Future Innovations & Roadmap

This section serves as a backlog of high-impact features to be implemented in future iterations of the system, specifically tailored to improve manual port operations without requiring advanced scanning hardware.

### 1. Export Manifest to PDF
* **The Problem**: The Coast Guard requires a printed, physical piece of paper listing all passengers before a boat can depart. Currently, cashiers write this by hand.
* **The Solution**: Build a "Download Manifest" button on the Admin Dashboard. With one click, the system compiles all "Paid" passengers for a specific schedule and generates a beautifully formatted, printable PDF manifest complete with ticket numbers and headcount totals.

### 2. Real Database Integration (Backend)
* **The Problem**: The app currently runs on in-memory mock data, meaning data resets on refresh.
* **The Solution**: Integrate a backend database (e.g., Firebase, Supabase, or PostgreSQL + Node.js) so reservations are saved permanently and data syncs across multiple cashier terminals in real-time.

### 3. Payment Gateway Integration
* **The Problem**: Currently, all tickets require cash payment at the cashier booth, causing long lines.
* **The Solution**: Integrate online payment gateways (GCash, Maya, PayMongo, or Stripe) so customers can fully pay for their tickets from home.

### 4. Weather Alerts & Auto-Suspension
* **The Problem**: When typhoons hit, cashiers have to manually inform angry customers that routes are cancelled.
* **The Solution**: Integrate a live Weather API. If a storm signal is raised, the system automatically flashes a red banner on the Customer dashboard and locks out new bookings for affected routes.

### 5. Automated Seat Allocation (Optional)
* **The Problem**: Passengers scramble for seats once boarding begins.
* **The Solution**: If the vessel has fixed seating, the system can auto-assign seat numbers upon payment, preventing chaos at the boarding gate.
