# SmartAI Logistics 🚀

**AI-Powered E-Commerce & Real-Time Delivery Optimization Platform**  
*Inspired by hyper-local quick-commerce leaders like Blinkit, Zepto, and Flipkart.*

SmartAI Logistics is a modern full-stack application connecting customers, products, multi-stop delivery couriers, dynamic traffic/weather simulations, and AI-driven route optimization in a single responsive web platform.

---

## 🌟 Key Features

### 1. 🛒 Quick-Commerce Storefront & Checkout
- **Rich Product Catalog**: Filter by category (Groceries, Produce, Dairy, Beverages, Electronics, Household), search in real time, sort by price/rating, and check real-time stock levels.
- **Cart & Dynamic Pricing**: Coupon discounts (`SMARTAI50`, `WELCOME100`), free delivery thresholds, packaging fee calculations, and delivery address selection.
- **Instant Secure Ordering**: Generates order confirmation with a unique 4-digit customer verification OTP for secure handover.
- **Digital Tax Invoice**: Generates compliant GST tax invoices with itemized rates, taxes, customer details, and print/PDF support.

### 2. 🗺️ Dual Map Engine & Real-Time Vehicle Tracking
- **Google Maps Platform Integration**: Built using the modern `@vis.gl/react-google-maps` SDK with `AdvancedMarkerElement`, vector styling, native `google.maps.TrafficLayer`, and roadmap/satellite/terrain options.
- **Leaflet / OpenStreetMap Fallback**: Seamless one-click toggle between Google Maps and OpenStreetMap with full feature parity.
- **Live Moving Vehicle Simulation**:
  - Continuous waypoint interpolation along route polylines.
  - Automatic compass bearing calculation for realistic vehicle heading rotation.
  - Animated radar pulse beacon and trailing green progress trail.
  - Selectable vehicle models: **Scooter (🛵)**, **Motorbike (🏍️)**, **Car (🚗)**, and **Electric Van (🚐)**.
  - Playback controls: Pause/Resume, Reset, Speed Multipliers (**1x, 2x, 5x, 10x**), and Auto-Follow Camera mode.

### 3. 🧠 Smart Traffic & Environmental Physics Engine
- **Corridor Traffic Classification**:
  - Automatically segments polylines into color-coded traffic zones:
    - 🟢 **Emerald**: Free Flow (35-45 km/h)
    - 🟡 **Amber**: Moderate Congestion (22-28 km/h)
    - 🟠 **Orange-Red**: Heavy Traffic (12-18 km/h)
    - 🔴 **Dark Crimson**: Severe Gridlock (5-8 km/h)
- **Active Traffic Incidents & Bottlenecks**:
  - Visual interactive incident pins along the corridor (e.g., *Waterlogged Underpass*, *Metro Construction Blockade*, *Broken Down Bus*).
  - Calculates specific minute delay impacts and pinpoints whether a detour is recommended.
- **Dynamic Speed Throttling (`calculateDynamicSpeed`)**:
  - Vehicle transit speed realistically decelerates in real time as the vehicle enters rain, fog, high traffic corridors, or bottlenecks.
  - Top-left telemetry HUD displays live throttled speed and current corridor condition.
- **Environmental Physics & Weather Telemetry**:
  - **Road Friction Index** (e.g., 0.65 in heavy rain, 0.45 in thunderstorms).
  - **Braking Distance Multiplier** (+20% to +45% in wet conditions).
  - **Atmospheric Visibility** (km) & ambient temperature tracking.
- **AI Smart Detour Routing**:
  - Automatically pre-computes an elevated bypass route avoiding waterlogging and gridlocked arterial roads.
  - Delivery partners can review the AI recommendation and toggle **"Apply AI Detour"** to instantly update routing coordinates and map paths.
- **Auto-Detect Environmental Intelligence**:
  - Built-in `/api/simulation/auto-detect` endpoint detects circadian peak hours (morning/evening rush hour) and environmental weather hazards to dynamically recalibrate the simulation.

### 4. 🤖 Gemini AI Dispatch Reasoning Engine
- Uses the modern `@google/genai` TypeScript SDK (Gemini 3.8 Flash).
- Explains why a delivery sequence was selected, highlighting priority deadlines, road congestion bottlenecks, and weather risks.
- Provides actionable driver recommendations and safety checklists.

### 5. 🛣️ Intelligent Route Optimization
- Integrates Open Source Routing Machine (OSRM) with geometric fallback algorithms.
- Implements Traveling Salesperson Problem (TSP) heuristics to sequence multi-stop deliveries based on distance, priority (Normal vs 15-min Express), and time windows.
- Compares optimized paths against unoptimized baseline (FIFO) routes.

### 6. ⚡ Live Environmental & Traffic Simulation Tuner
- Real-time adjustments to traffic density: **LOW**, **MEDIUM**, **HIGH**, and **SEVERE** (triggering dynamic delay multipliers).
- Dynamic weather conditions: **CLEAR**, **CLOUDY**, **RAIN**, **THUNDERSTORM**, and **FOG** with realistic travel hazard adjustments.
- Instant recalculation of ETAs, route polylines, and fuel telemetry.

### 7. ⛽ Fuel & Eco Efficiency Telemetry
- Monitors fuel consumption (L/100km) for internal combustion engines and energy usage (kWh/100km) for electric vehicles.
- Computes money saved based on configurable fuel prices (₹/L or $/gal).
- Estimates CO₂ emissions offset by route optimization and green EV fleets.

### 8. 👥 Role-Based Portals
- **Customer Portal**: Browse catalog, order items, track live courier movement with traffic segments & incidents on the map, and view past orders & receipts.
- **Delivery Partner Portal**: View assigned delivery stops, toggle online/offline availability, monitor fuel savings, inspect AI route reasoning, apply smart detours, and verify deliveries using OTP codes.
- **Operations Admin Portal**: High-level operational KPIs (gross revenue, average delivery time, active fleet, CO₂ offset), order management, product stock catalog, and fleet telemetry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Maps & Routing** | `@vis.gl/react-google-maps`, Leaflet, OpenStreetMap, OSRM API |
| **AI / LLM** | `@google/genai` (Gemini 3.8 Flash) |
| **Backend** | Node.js, Express, Vite middleware (`server.ts`) |
| **Build & Tooling** | Vite, esbuild, TypeScript compiler (`tsc`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone <repository-url>
cd smartai-logistics
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Google Gemini API Key for server-side AI dispatch explanations
GEMINI_API_KEY="your_gemini_api_key_here"

# Google Maps Platform API Key for client-side map rendering
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
```

> **Note**: If `VITE_GOOGLE_MAPS_API_KEY` is not provided, the app will seamlessly run using the included Maps Demo Key or the built-in Leaflet / OpenStreetMap engine.

### 3. Running the Development Server
Start the full-stack server (Express + Vite) on port 3000:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Production Build
Compile the client application and bundle the backend server:
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── server.ts                  # Express server entry point & Vite middleware setup
├── server/
│   ├── api.ts                 # Full REST API endpoints (Auth, Products, Orders, Fleet, Simulation)
│   ├── db.ts                  # In-memory database with sample Bengaluru fulfillment data
│   ├── gemini.ts              # Gemini 3.8 Flash AI logistics reasoning service
│   └── routing.ts             # OSRM routing, TSP sequence optimizer, and fuel calculations
├── src/
│   ├── App.tsx                # Main application orchestrator and view switcher
│   ├── main.tsx               # Client React DOM entry point
│   ├── types.ts               # Shared TypeScript domain models and interfaces
│   ├── context/
│   │   ├── AuthContext.tsx    # User session, login, registration, and role switching state
│   │   └── CartContext.tsx    # Basket items, totals, discount coupons, and checkout
│   ├── services/
│   │   └── api.ts             # Typed frontend API client communicating with /api/*
│   ├── utils/
│   │   └── geoAnimation.ts    # Haversine distance, compass bearing, and polyline interpolation
│   └── components/
│       ├── common/
│       │   ├── Navbar.tsx             # Navigation bar with role switcher and simulation status
│       │   ├── LiveDeliveryMap.tsx    # Dual-engine map wrapper (Google Maps vs Leaflet)
│       │   ├── GoogleDeliveryMap.tsx  # @vis.gl/react-google-maps with animated moving vehicle
│       │   ├── LeafletMap.tsx         # Leaflet/OSM map with animated moving vehicle
│       │   ├── AuthModal.tsx          # Login & registration dialog
│       │   └── SimulationModal.tsx    # Real-time traffic, weather, and fuel tuner
│       ├── customer/
│       │   ├── CustomerHome.tsx       # Storefront product showcase with search & filters
│       │   ├── CustomerOrdersView.tsx # Order history list with receipt launcher
│       │   ├── OrderTrackingView.tsx  # Live map tracking with step progress & courier details
│       │   ├── CartModal.tsx          # Cart drawer with address selector & checkout
│       │   └── ProductDetailModal.tsx # Detailed product specifications modal
│       ├── delivery/
│       │   ├── DeliveryDashboard.tsx  # Courier dispatch board with multi-stop route map
│       │   ├── AIRecommendationCard.tsx# Gemini AI reasoning card
│       │   ├── FuelTrackerCard.tsx    # Fuel & energy savings calculator card
│       │   └── DeliveryConfirmationModal.tsx # OTP validation and proof of delivery
│       ├── admin/
│       │   ├── AdminDashboard.tsx     # Operations control center with KPIs and tabs
│       │   ├── OrderManagement.tsx    # Orders dispatch list with partner assignment
│       │   ├── ProductManagement.tsx  # Catalog stock editor (create, edit, delete)
│       │   └── FleetManagement.tsx    # Fleet courier telemetry and EV status
│       └── receipt/
│           └── DigitalReceiptModal.tsx# Formatted printable GST tax invoice
├── metadata.json              # Platform application metadata
└── package.json               # Dependencies and scripts
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate existing user |
| `POST` | `/api/auth/register` | Register a new user |
| `GET` | `/api/products` | Retrieve product catalog with search & category filters |
| `POST` | `/api/products` | Create a new catalog item (Admin) |
| `PUT` | `/api/products/:id` | Update product details or stock units (Admin) |
| `DELETE`| `/api/products/:id` | Remove a product (Admin) |
| `GET` | `/api/orders` | List orders (filtered by customer privacy rules) |
| `POST` | `/api/orders` | Place a new order with generated OTP |
| `PATCH`| `/api/orders/:id/status` | Update delivery milestone status |
| `POST` | `/api/orders/:id/confirm`| Verify customer OTP and complete handover |
| `GET` | `/api/fleet` | Retrieve delivery courier status, location, and telemetry |
| `GET` | `/api/fleet/:id/route` | Compute AI-optimized route & fuel statistics |
| `GET` | `/api/simulation` | Fetch current simulated weather, traffic, and fuel prices |
| `POST` | `/api/simulation` | Update simulation conditions in real time |
| `GET` | `/api/analytics` | Fetch operational KPIs and revenue summaries |

---

## 🧪 Interactive Walkthrough & Demo Guide

1. **Place an Order (Customer)**:
   - Browse the catalog, add products like "Fresh Farm Milk" or "Organic Alphonso Mangoes" to your basket.
   - Click **Cart**, apply promo code `SMARTAI50`, and click **Place Delivery Order**.
   - Note the assigned order ID and the 4-digit OTP.
2. **Live Map & Vehicle Movement**:
   - In the **Live Tracking** view, watch the scooter/car traverse the map in real time towards your destination.
   - Use the playback controls to speed up (2x, 5x, 10x) or switch vehicle models.
   - Toggle between **Google Maps** and **Leaflet / OSM**.
3. **Dispatch & Handover (Delivery Partner)**:
   - Use the role switcher in the top navigation bar to switch to **Delivery Partner (Rohan)**.
   - View your assigned stops, inspect the **Gemini AI Dispatch Reasoning**, and check your **Fuel & Energy Savings**.
   - Advance status from *Assigned* to *Confirm Pickup* to *Start Transit*.
   - Click **Verify & Handover**, input the customer's 4-digit OTP, and mark the order as delivered.
4. **Operations & Simulation (Admin)**:
   - Switch to **Admin Portal** to monitor revenue, order fulfillment rates, and fleet couriers.
   - Click **Tune Traffic & Weather Simulation**, change traffic to **HIGH** or weather to **RAIN**, and observe real-time transit multipliers adjust automatically.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
