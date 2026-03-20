# Authentication Flow

**Description**: The entry point to the system. Handles user identification, secure session creation via NextAuth, registration of new accounts, and access protection.

## Flow Steps

### 1. Entry & Session Check
*   **Action**: User navigates to the main application URL (e.g., `/`).
*   **System Check**: The app checks for an active session (token).
*   **Redirect**: If no session exists, the user is automatically redirected to `/auth/signin`.

### 2. Sign In (Login)
*   **Page**: `/auth/signin`
*   **UI Elements**:
    *   Email input field.
    *   Password input field.
    *   "Sign In" button.
    *   Links to "Sign Up" or "Forgot Password" (if enabled).
*   **Process**:
    *   User enters credentials.
    *   System validates them against the database (MongoDB).
*   **Outcome**:
    *   **Success**: Redirect to the **Dashboard** (`/`). Global state (Redux) is updated with user profile and roles (e.g., `GLOBAL_ADMIN`, `USER`).
    *   **Failure**: An error notification (toast or alert) appears indicating "Invalid email or password".

### 3. Sign Up (Registration)
*   **Page**: `/auth/signup`
*   **Action**: New users fill in their Name, Email, and Password to create an account.
*   **System Action**: Creates a new `User` record. Depending on configuration, the user might need email verification before logging in.

---

## Visual Reference

![Login Page Screenshot](./image/01-authentication.png)