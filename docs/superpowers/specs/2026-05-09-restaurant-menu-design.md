# Design Spec: Restaurant Detail & Menu Flow
Date: 2026-05-09
Status: Approved

## 1. Overview
The Restaurant Detail and Menu flow is the core conversion path of the FoodApp Cameroun web application. It allows users to explore a restaurant's offerings, customize their food items, and add them to their cart for checkout.

## 2. User Interface & Experience

### 2.1 Page Structure
- **Hero Section**: 
  - Cover image background.
  - Floating logo badge.
  - Primary labels: Name, Star Rating, Delivery Fee.
- **Restaurant Info**: 
  - Collapsible/Expandable section.
  - Fields: Description, Full Address, Operational Hours.
- **Category Navigation**: 
  - Sticky horizontal list of menu categories.
  - Clicking a category scrolls the menu body to the corresponding section.
- **Menu Body**: 
  - Grouped by categories.
  - Item cards: Image, Name, Description, Price, "Add" button.

### 2.2 Item Customization (Modal)
When an item is selected, a modal opens with:
- **Item Details**: High-res image, name, and base price.
- **Required Options**: Single-select groups (e.g., Size: Small, Medium, Large).
- **Optional Add-ons**: Multi-select list (e.g., Extra Sauce +100 FCFA).
- **Quantity Control**: Increment/Decrement selector.
- **Dynamic Pricing**: The modal footer updates the total cost in real-time as options are selected.
- **Action**: "Add to Cart" button.

### 2.3 Cart Integration (Floating Bar)
- **Trigger**: Appears when `cart.items.length > 0`.
- **Position**: Sticky bottom, above `BottomNav`.
- **Content**: Total items count and cumulative price in FCFA.
- **Navigation**: Redirects to `/cart`.

## 3. Technical Design

### 3.1 Data Flow
- **Fetch**: `GET /api/restaurants/[id]` (and related menu items/categories).
- **State**:
  - `useLanguage`: For i18n strings.
  - `useCart`: To manage the global cart state.
- **Logic**: 
  - Verify `restaurantId` in cart matches the current page. If not, trigger a "Clear Cart" confirmation modal.

### 3.2 Edge Cases & Error Handling
- **Closed Restaurant**: If `isActive === false`, display a "Closed" banner and disable all "Add" buttons.
- **Empty Menu**: Show a friendly "Menu coming soon" empty state.
- **Network Errors**: Implement skeleton loaders and error boundaries for API failures.

## 4. Implementation Steps
1. Create the `[id].tsx` dynamic route.
2. Implement the Hero and Info sections.
3. Develop the Category Navigation and Menu List.
4. Build the Item Customization Modal.
5. Integrate the Floating Cart Bar.
6. Wire up `useCart` logic and restaurant switching guards.
