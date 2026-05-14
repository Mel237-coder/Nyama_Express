# Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full cart review and checkout flow, including GPS-based address selection and multi-provider payment integration.

**Architecture:** The flow is split into two main pages: `/cart` for item management and `/checkout` for the payment and delivery funnel. All state is synchronized via the `useCart` and `useAuth` hooks.

**Tech Stack:** Next.js 14, React, Tailwind CSS, Browser Geolocation API, Lucide React.

---

## File Structure

- Create: `apps/web/src/pages/cart.tsx` - Cart review and management page.
- Create: `apps/web/src/pages/checkout.tsx` - Single-page checkout funnel.
- Create: `apps/web/src/components/checkout/AddressSelector.tsx` - GPS-based location picker.
- Create: `apps/web/src/components/checkout/PaymentSelector.tsx` - Payment method radio group and phone inputs.
- Create: `apps/web/src/components/checkout/OrderSummary.tsx` - Final review of items and costs.
- Create: `apps/web/src/pages/order-success.tsx` - Order confirmation and tracking link.

---

### Task 1: Cart Review Page

**Files:**
- Create: `apps/web/src/pages/cart.tsx`
- Modify: `apps/web/src/components/restaurant/ItemCustomizerModal.tsx` (Export `CustomizerDetails`)

- [ ] **Step 1: Export types from `ItemCustomizerModal.tsx`**
  Add `export` to `interface MenuItem` and `interface CustomizerDetails`.

- [ ] **Step 2: Implement basic Cart page layout**
  Create `apps/web/src/pages/cart.tsx` with a list of items from `useCart`.

- [ ] **Step 3: Integrate `ItemCustomizerModal` into Cart**
  Allow users to click an item to open the customizer and update the cart.

- [ ] **Step 4: Implement Price Summary**
  Add a bottom section showing:
  - Subtotal
  - Delivery Fee (from `useCart` or `api`)
  - Total (XAF)

- [ ] **Step 5: Add "Proceed to Checkout" button**
  Link to `/checkout` and ensure the cart is not empty.

- [ ] **Step 6: Commit**
  `git commit -m "feat(web): implement cart review page with customization"`

---

### Task 2: Checkout Shell & Auth Guard

**Files:**
- Create: `apps/web/src/pages/checkout.tsx`

- [ ] **Step 1: Create the page shell with Auth Guard**
  Use `useAuth` to check if user is logged in. If not, redirect to login.

- [ ] **Step 2: Implement basic layout structure**
  Set up a vertical flow: Address $\rightarrow$ Summary $\rightarrow$ Payment $\rightarrow$ Place Order.

- [ ] **Step 3: Commit**
  `git commit -m "feat(web): add checkout page shell and auth guard"`

---

### Task 3: GPS-First Address Selection

**Files:**
- Create: `apps/web/src/components/checkout/AddressSelector.tsx`
- Modify: `apps/web/src/pages/checkout.tsx`

- [ ] **Step 1: Implement Geolocation logic**
  Use `navigator.geolocation.getCurrentPosition` to get coordinates.

- [ ] **Step 2: Create the Address UI**
  - Display "Get Current Location" button.
  - Show a simple map placeholder (or Leaflet if available) centered on coordinates.
  - Add a text input for "Additional delivery instructions".

- [ ] **Step 3: Handle permission denial**
  Provide a fallback manual address form if the user denies GPS access.

- [ ] **Step 4: Integrate into `/checkout`**
  Ensure the selected address is stored in the checkout state.

- [ ] **Step 5: Commit**
  `git commit -m "feat(web): implement GPS-first address selection"`

---

### Task 4: Order Summary & Payment Selection

**Files:**
- Create: `apps/web/src/components/checkout/OrderSummary.tsx`
- Create: `apps/web/src/components/checkout/PaymentSelector.tsx`
- Modify: `apps/web/src/pages/checkout.tsx`

- [ ] **Step 1: Implement `OrderSummary`**
  A compact list of items and the final price.

- [ ] **Step 2: Implement `PaymentSelector`**
  - Radio group for: `MTN MoMo`, `Orange Money`, `Cash`.
  - Show a phone number input field only when MoMo or Orange is selected.

- [ ] **Step 3: Integrate into `/checkout`**
  Manage the state for `paymentMethod` and `paymentPhone`.

- [ ] **Step 4: Commit**
  `git commit -m "feat(web): add order summary and payment selection"`

---

### Task 5: Order Placement & Polling

**Files:**
- Modify: `apps/web/src/pages/checkout.tsx`
- Create: `apps/web/src/pages/order-success.tsx`

- [ ] **Step 1: Implement "Place Order" handler**
  Call `api.createOrder` with: `items`, `address`, `paymentMethod`, and `paymentPhone`.

- [ ] **Step 2: Implement Payment Polling**
  If payment is MoMo/Orange, show a "Waiting for confirmation..." loading state and poll the order status API.

- [ ] **Step 3: Create `order-success.tsx`**
  Display order ID, success message, and a "Track Order" button.

- [ ] **Step 4: Final Integration**
  Redirect user to `/order-success` upon successful payment/confirmation.

- [ ] **Step 5: Commit**
  `git commit -m "feat(web): implement order placement and success flow"`
