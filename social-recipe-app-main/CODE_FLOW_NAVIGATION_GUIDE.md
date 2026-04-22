# Code Flow & Navigation Guide: Social Recipe App

This document provides a technical map of how navigation and data requests flow through the application layers.

---

## 🧭 1. Frontend Navigation Flow (React)

The frontend uses **React Router** for managing transitions between views.

### 🛣️ Route Configuration (`App.tsx`)
*   **Public Routes**: accessible by everyone (`/login`, `/register`, `/feed`, `/recipes/:id`).
*   **Protected Routes (`PrivateRoute`)**: requires a valid JWT. Includes `/planner`, `/shopping`, `/settings`, and `/recipes/:id/edit`.
*   **Admin Routes (`AdminRoute`)**: requires a valid JWT AND the `ROLE_ADMIN` role. Includes `/admin`.

### 🔗 Navigation Components
*   **Navbar**: The primary desktop navigation for switching between Feed, Planner, Shopping, and Profile.
*   **MobileBottomNav**: A persistent bottom bar for mobile users, optimized for thumb reach.
*   **GlobalActivityTicker**: A scrolling notification bar at the top showing real-time platform activity.

### 📦 State-Driven Navigation
*   **Auth Context**: The app checks the user's authentication and role status globally. If a user tries to access a protected page without a token, the `PrivateRoute` component automatically redirects them to `/login`.

---

## 📡 2. Backend Request Execution Flow (Spring Boot)

When a request is sent from the frontend to the backend, it follows a strict **Layered Architecture** path:

### Step 1: Security Interception (`JwtAuthenticationFilter`)
The request first hits the **Security Filter Chain**. 
*   It extracts the `Authorization: Bearer <TOKEN>` header.
*   It validates the JWT.
*   If valid, it sets the user context in the `SecurityContextHolder`.

### Step 2: Controller Layer (`@RestController`)
*   **Role**: Handles the HTTP request mapping and input validation.
*   **Flow**: Controller receives a **DTO** (e.g., `RecipeRequest`). It uses `@Valid` to ensure data integrity before calling the Service.

### Step 3: Service Layer (`@Service`)
*   **Role**: Where all business logic lives.
*   **Flow**: The Service coordinates tasks (e.g., in `RecipeServiceImpl.java`, it checks if the user is restricted, calculates reputation points, and manages transactions).

### Step 4: Repository Layer (`@Repository`)
*   **Role**: Interface with the PostgreSQL database.
*   **Flow**: Uses **Spring Data JPA** to execute save/find queries.

### Step 5: Data Return (DTO Mapping)
*   The Service maps the **Entity** (database object) back into a **Response DTO** (e.g., `RecipeResponse`) to prevent leaking internal database IDs or passwords.

---

## 🏗️ 3. Directory Navigation (Where is the code?)

| Layer | Frontend Path | Backend Path |
| :--- | :--- | :--- |
| **Logic** | `src/services/` | `src/main/java/com/bluepal/service/` |
| **Routes/Pages** | `src/pages/` | `src/main/java/com/bluepal/controller/` |
| **Data Models** | `src/store/` | `src/main/java/com/bluepal/dto/` |
| **UI Components** | `src/components/` | N/A |
| **Database Ops** | N/A | `src/main/java/com/bluepal/repository/` |

---

## 🛠️ 4. API Documentation (Swagger)
For a visual "hands-on" flow of the API, use the live documentation:
**[http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)**Test cases and Assessment details
Akriti Kumari
/
Inbox



Murali Lakamraju
 
From:
murali.lakamraju@bluepal.com
To:
syamsundar.panga@bluepal.com
,
ankit.kumar@bluepal.com
,
akriti.kumari@bluepal.com
,
abhijeet.mishra@bluepal.com
,
dinesh.pradhan@bluepal.com
and 3 more...

Tue, Mar 17 at 5:14 PM

Hi everyone,

For the individual projects assigned to you, the assessment will be done based on several factors

Problem understanding

Solution design and architecture

This provides a complete list of every endpoint, required parameters, and response formats.
