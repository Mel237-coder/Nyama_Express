# Design Spec: Cart & Checkout Flow
Date: 2026-05-09
Status: Approved

## 1. Overview
The Cart and Checkout flow handles the final stages of the user journey: reviewing selected items, determining the precise delivery location via GPS, selecting a payment method, and finalizing the order.

## 2. User Interface & Experience

### 2.1 Cart Review Page (`/cart`)
- **Item Management**: 
  - List of items with price, quantity, and customization labels.
  - **Modification**: Clicking an item opens the `ItemCustomizerModal` for updates to quantity or options.
  - **Removal**: Swipe-to-delete or a remove icon to clear items.
- **Price Summary**:
  - Subtotal calculation.
  - Dynamic delivery fee based on the selected restaurant.
  - Total amount in XAF.
- **Empty State**: Call-to-action button redirecting to `/` when no items are present.

### 2.2 Checkout Flow (`/checkout`)
- **GPS-First Address Selection**:
  - Use browser `navigator.geolocation` to fetch current coordinates.
  - Map interface showing the current location.
  - Manual refinement field: "Add landmarks or specific instructions" (e.g., "Opposite the blue pharmacy").
  - "Save Address" toggle for future use.
- **Order Summary**: A collapsed list of items to confirm the order contents.
- **Payment Method Selector**:
  - Radio button group: [MTN MoMo, Orange Money, Cash on Delivery].
  - Conditional input fields: If MoMo or Orange is selected, show a phone number input field.
- **Order Submission**: "Place Order" button with a loading state while processing.

### 2.3 Confirmation & Tracking
- **Success Page**: Displays order confirmation, order ID, and estimated time of arrival (ETA).
- **Tracking Transition**: A "Track My Order" button that redirects to the real-time tracking view.

## 3. Technical Design

### 3.1 Data Flow
- **Cart State**: Managed via `useCart` hook.
- **Address Logic**: 
  - `Geolocation API` $\rightarrow$ Coordinates $\rightarrow$ `api.saveAddress`.
- **Payment Logic**:
  - API call to `POST /api/orders` with `paymentMethod` and `addressId`.
  - For MoMo/Orange, the backend triggers the provider's USSD push. The frontend polls the order status until payment is confirmed.

### 3.2 Guards & Edge Cases
- **Auth Guard**: User must be authenticated to access `/checkout`. Redirect to login if not.
- **Cart Validation**: Check if the cart is still valid (e.g., items are still available) before allowing payment.
- **GPS Failures**: If the user denies geolocation permissions, fallback to a manual address entry form.

## 4. Implementation Steps
1. Create `/cart` page with item review and `ItemCustomizerModal` integration.
2. Create `/checkout` page shell with Auth guard.
3. Implement the Geolocation-first address selector with map integration.
4. Implement the payment method selector and phone number inputs.
5. Wire up the "Place Order" action and payment polling logic.
6. Create the Order Success page and tracking link.
