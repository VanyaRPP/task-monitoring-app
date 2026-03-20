# Monthly Billing Cycle

**Description**: The recurring process where administrators generate bills for tenants. This flow involves selecting a tenant, entering their consumption (meter readings), and generating the final debit record.

## Process Flow

### 1. Initiate Payment
*   Navigate to the **Payments** module (`/payment`).
*   Click the **Add Payment** button.
*   A form modal opens.

### 2. Context Selection (Cascading Logic)
*   **Select Domain**: User chooses the Service Provider.
*   **Select Street**: Filter locations belonging to that domain.
*   **Select Month**: Choose the billing period (e.g., "March 2026").
*   **Select Company**: The list of companies is filtered based on the Domain and Street selected (see `CompanySelect` component).

### 3. Enter Meter Readings & Calculations
Once the context is set, the system loads the **Service (Tariffs)** for that month and the **Previous Meter Readings** for that company.

*   **Electricity / Water**:
    *   Field: `Current Amount` (User enters this).
    *   Display: `Last Amount` (Read-only).
    *   Calculation: `(Current - Last) * Price_Per_Unit`.
    *   **Losses**: If configured, transmission losses are added to the total.
*   **Fixed Services**:
    *   Rent, Maintenance, and Garbage collection costs are pre-filled based on the Company's area ($m^2$) and the Service tariff.
    *   Users can override these if necessary (a "Changed" flag is set).

### 4. Review & Save
*   **Totals**: The form displays the calculated subtotal and total sum.
*   **Action**: Click **Save/Add**.
*   **Backend Process**:
    1.  A **Payment** record (Debit) is created.
    2.  A corresponding **Profit** record is generated for financial tracking.
    3.  The system increments the invoice number sequence.

### 5. Automated Validation
*   The system prevents entering a `Current Amount` lower than `Last Amount` (unless a meter reset is flagged).
*   Ensures a Tariff (Service) exists for the selected month before allowing data entry.

---

## Visual Reference

> ![Payment Form Context](./image/04-monthly-billing-cycle.png)
