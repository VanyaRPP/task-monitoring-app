# Dashboard & Navigation

**Description**: The central hub of the application. It provides high-level metrics, quick access to core modules, and an onboarding tour for new users.

## Overview

The Dashboard (`/`) dynamically adjusts its content based on the user's role (Admin vs. Regular User).

### Key Widgets & Areas
1.  **Welcome Section**: Displays a greeting and general system status.
2.  **Active Tasks**: A widget showing pending or "In Progress" maintenance tasks requiring attention.
3.  **Financial Summaries** (Admin Only):
    *   **Profits**: A chart or summary card showing net income for the current period.
    *   **Payments**: Overview of recent debit/credit operations.
4.  **Quick Links**: Cards to navigate to **Domains** (Service Providers) and **Real Estate** (Companies).

## Navigation Structure (Menu)

The main navigation bar (sidebar or top header) contains the following modules:

*   **Payments**: Billing operations and history.
*   **Real Estate (Companies)**: Management of tenants and physical objects.
*   **Domains (Service Providers)**: Management of service provider entities.
*   **Services**: Configuration of tariffs (electricity, water, rent).
*   **Profile**: User settings and personal information.
*   **Bank** (Admin only): Bank transaction reconciliation.
*   **Profits** (Admin only): Financial analysis.

## Onboarding Tour

When a user visits the dashboard for the first time, an automated **Tour** is triggered:
1.  **Welcome**: Introduces the interface.
2.  **Payments**: Highlights where to manage bills.
3.  **Companies**: Points to the tenant management section.
4.  **Service Providers**: Explains the "Domain" concept.
5.  **Services**: Shows where to set up pricing/tariffs.
6.  **Profile**: Shows where to edit user details.
7.  **Admin Features**: If the user is an admin, highlights Bank and Profit sections.

---

## Visual Reference

> ![Dashboard Widgets](./image/02-dashboard.png)