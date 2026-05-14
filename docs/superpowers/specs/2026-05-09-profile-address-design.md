# Design Spec: User Profile & Address Book
Date: 2026-05-09
Status: Approved

## 1. Overview
The User Profile and Address Book system allows users to manage their personal identity, application preferences, and a semantic library of saved delivery locations. This reduces friction during the checkout process by eliminating the need for repeated address entry.

## 2. User Interface & Experience

### 2.1 Profile Dashboard (`/profile`)
- **Identity Header**:
  - Profile picture, full name, and verified phone number.
- **Settings Menu**: A list of navigation items:
  - **Account**: Edit name, email, and photo.
  - **Payment**: Set a default MoMo/Orange Money phone number.
  - **Preferences**: Language toggle (FR/EN) and notification settings.
- **Session Management**: Secure "Logout" action.

### 2.2 Address Book (`/profile/addresses`)
- **Saved Locations List**:
  - Cards displaying the label (e.g., "Home"), the coordinates-derived address, and a "Default" indicator.
  - Actions: Edit and Delete options for each address.
- **Hybrid Address Creation Flow**:
  - **Capture**: "Use My Current Location" button utilizing the Geolocation API.
  - **Labeling**: A selection/input for the address label (Home, Work, Other).
  - **Refinement**: A text field for delivery landmarks (e.g., "Opposite the blue pharmacy").
  - **Saving**: Final confirmation that persists the address to the database.

## 3. Technical Design

### 3.1 Data Flow
- **Profile Management**: `GET /api/users/me` and `PATCH /api/users/me`.
- **Address Book**: 
  - `GET /api/users/me/addresses` for the list.
  - `POST /api/addresses` to save a new location.
  - `DELETE /api/addresses/[id]` to remove a location.
  - `PATCH /api/addresses/[id]` to mark as default or edit details.
- **State Integration**: The `useAuth` hook provides the current user identity, and the `useLanguage` hook handles the preference toggle.

### 3.2 Guards & Edge Cases
- **Auth Guard**: Middleware or hook-level redirection to `/login` for unauthenticated access.
- **GPS Fallback**: If `navigator.geolocation` is disabled or denied, the user is presented with a manual address entry form.
- **Duplicate Labels**: Validation to prevent multiple addresses with the same label (e.g., two "Home" addresses).

## 4. Implementation Steps
1. Create the `/profile` main page with the identity header and settings menu.
2. Implement the account settings and payment preference forms.
3. Create the `/profile/addresses` list view with delete/edit functionality.
4. Build the "Add Address" hybrid flow (GPS capture $\rightarrow$ Labeling $\rightarrow$ Refinement).
5. Integrate saved addresses into the `/checkout` flow to allow one-click address selection.
6. Implement the logout functionality.
