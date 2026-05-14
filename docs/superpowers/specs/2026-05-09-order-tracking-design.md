# Design Spec: Order Tracking & Real-Time Logistics
Date: 2026-05-09
Status: Approved

## 1. Overview
The Order Tracking flow provides a high-fidelity, real-time visual representation of an order's journey from the restaurant to the user's doorstep. It leverages Socket.io for live GPS streaming and dynamic UI transitions based on the order's lifecycle.

## 2. User Interface & Experience

### 2.1 The Tracking Page (`/orders/[id]`)
- **Dynamic Header**:
  - Changes style based on status: `PREPARING` (Orange), `OUT_FOR_DELIVERY` (Green), `DELIVERED` (Blue).
  - Displays the order ID and current estimated time of arrival (ETA).
- **The Live Map**:
  - **Engine**: Leaflet.js.
  - **Markers**:
    - Static Restaurant marker.
    - Static Destination marker.
    - Dynamic Driver marker (motorcycle icon) that updates position in real-time.
  - **Behavior**: Smooth interpolation of marker movement to prevent "jumping" during GPS updates.

### 2.2 Status-Driven UI Stages
- **Stage 1: Preparing**
  - Visual: Pulsing animation at the restaurant location.
  - Status: "Your meal is being prepared 🍳".
- **Stage 2: Out for Delivery**
  - Visual: Driver marker starts moving toward the destination.
  - **Driver Card**: A bottom-sheet overlay containing:
    - Driver profile (Name, Photo, Rating).
    - "Call" button (triggers `tel:`).
    - "Message" button (opens real-time chat).
- **Stage 3: Arrived**
  - Visual: Map zooms in on the destination.
  - Overlay: "Your food has arrived! 🛵" with a "Confirm Receipt" button.

### 2.3 Real-Time Communication
- **Socket.io Events**:
  - `order:subscribe`: Client joins the order-specific room.
  - `delivery:location_update`: Updates the Driver Marker coordinates.
  - `order:status_changed`: Triggers the UI stage transition.
  - `chat:message`: Sends/Receives real-time messages.

## 3. Technical Design

### 3.1 Data Flow
- **Initial Load**: `GET /api/orders/[id]` to get initial status and coordinates.
- **Real-time Stream**: WebSocket connection to `websocket-gateway` for live updates.
- **Fallback**: If WebSocket fails, poll `/api/deliveries/tracking/[id]` every 30s.

### 3.2 Guards & Performance
- **Auth Guard**: Verify `User.id === Order.userId` before allowing access.
- **Performance**: 
  - Use `requestAnimationFrame` for marker transitions.
  - Use `L.marker` with a custom icon and avoid re-rendering the entire map on every coordinate update.

## 4. Implementation Steps
1. Create the dynamic page `/orders/[id].tsx`.
2. Implement the Leaflet map with static markers and the `DeliveryTracking` data.
3. Integrate Socket.io to handle `delivery:location_update` and `order:status_changed`.
4. Develop the status-driven UI stages (Preparing $\rightarrow$ Delivery $\rightarrow$ Arrived).
5. Build the Driver Card with "Call" and "Chat" functionality.
6. Implement the "Confirm Receipt" flow and redirect to the order history.
