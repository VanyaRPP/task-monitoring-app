# Data Setup: Entities Configuration

**Description**: Before any billing or task management can occur, the system's "static" data must be populated. This flow is typically performed by a **Global Admin** or **Domain Admin**.

## 1. Create Domain (Service Provider)
This entity represents the company providing the services (e.g., the Property Management Firm).

*   **Location**: `/domain` page.
*   **Action**: Click the **Add** button (visible to Admins).
*   **Modal Form Fields**:
    *   **Name**: Official legal name of the organization.
    *   **Currency**: Default currency (e.g., `UAH`, `USD`). Affects invoice language (English for non-UAH).
    *   **Bank Details**:
        *   `IBAN`: International Bank Account Number.
        *   `Bank Name`: Name of the bank.
        *   `SWIFT`: Bank identifier code.
    *   **Admin Contacts**: List of email addresses that will receive system notifications.
    *   **Description/Footer**: Legal text or signatory info displayed at the bottom of the "Service Acceptance Act".
*   **System Action**: Validates unique name -> `POST /api/domain`.

## 2. Create Real Estate (Tenants/Objects)
These are the clients or physical objects that will receive invoices.

*   **Location**: `/real-estate` page.
*   **Action**: Click **Add** button.
*   **Form Fields**:
    *   **Company Name**: Name of the tenant or object.
    *   **Domain**: Dropdown to link this object to a Service Provider.
    *   **Street**: Physical location grouping.
    *   **Description**: Contract details (e.g., "Director Ivanenko I.I., acting on the basis of..."). Appears in the invoice header.
    *   **Bank Details**: Tenant's billing information (for reference).
    *   **Admin Emails**: Email addresses where the PDF invoices will be sent.
*   **System Action**: `POST /api/real-estate`.

## 3. Configure Services (Tariffs)
This sets the pricing model for a specific month.

*   **Location**: `/service` page.
*   **Action**: Click **Add** to open the creation modal.
*   **Form Fields** (from `createServiceForm.ts`):
    1.  **Provider**: Select the Domain.
    2.  **Date**: Select Month/Year (e.g., "Jan 2026").
    3.  **Tariffs**:
        *   `Утримання приміщень` (Rent): Price per m².
        *   `Електроенергія` (Electricity): Price per kW.
        *   `Всього водопостачання` (Water): Price per m³.
        *   `Вивіз сміття` (Garbage): Fixed price.
        *   `Inflation`: Percentage add-on.
    4.  **Description**: Text field.
*   **System Action**: `POST /api/service`. This record acts as the "Price List" for the selected month.

## 4. Categories & Streets
Additional helper entities used for filtering and classification.

*   **Streets** (`/streets`):
    *   Used to group Real Estate objects physically.
    *   Admin enters `Title` and `City`.
    *   API: `POST /api/streets`.
*   **Categories** (`/categories`):
    *   Used to tag Tasks (e.g., "Plumbing", "Security").
    *   API: `POST /api/categories`.

---

## Visual Reference

> ![Add Domain Modal](./image/03-data-setup-domain.png)

> ![Add Service Form](./image/03-data-setup-services.png)