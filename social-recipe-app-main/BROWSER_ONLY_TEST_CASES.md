# Browser-Based Test Cases (Social Recipe App)

This document outlines the core functional flows that can be verified directly in the browser (Chrome/Edge/Firefox). This guide focuses on **User Flows** and **Admin Flows**.

---

## 🚀 Getting Started

1.  **Backend**: Ensure the Spring Boot backend is running (Port 8082).
2.  **Frontend**: Ensure the React application is running (Port 5173).
3.  **Database**: Ensure PostgreSQL is running and seeded.

---

## 👤 User Flow (Standard User)

### 1. Authentication & Onboarding
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1.1 | Visit `/register` and fill the form. | Success toast shown; Redirected to login. |
| 1.2 | Visit `/login` with valid credentials. | Redirected to `/feed`; User details visible in Navbar. |
| 1.3 | Click "Forgot Password" on login page. | OTP sent to email (Check console if in Dev Mode). |
| 1.4 | Enter 6-digit OTP and new password. | Password updated; Login with new credentials successful. |

### 2. Discovering Content
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 2.1 | Scroll through the **Global Feed**. | Recipes from all users appear dynamically. |
| 2.2 | Use the **Search Bar** (e.g., search "Pasta"). | Results filter in real-time using full-text search. |
| 2.3 | Click on a **Category Chip** (e.g., "Italian"). | Feed filters to show only Italian recipes. |
| 2.4 | Navigate to "Communities" and join a group. | Community-specific recipes become available. |

### 3. Recipe Interactions
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 3.1 | Click on a Recipe Card to view details. | Full view opens with ingredients and instructions. |
| 3.2 | Click the **Like (Heart)** icon. | Counter increments; Heart turns red. |
| 3.3 | Post a **Comment** on a recipe. | Comment appears instantly; Author receives notification. |
| 3.4 | Click **Bookmark**. | Recipe added to "Bookmarked" list in user profile. |

### 4. Creating & Managing Content
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 4.1 | Click **"Create Recipe"** button (Navbar). | Modal opens; Image upload to Cloudinary works. |
| 4.2 | Click **"Edit"** on your own recipe. | Redirected to Edit page; Values prepopulated. |
| 4.3 | Click **"Delete"** on your own recipe. | Confirmation dialog shown; Recipe removed from feed. |

### 5. Utility Features
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 5.1 | Add a recipe to **Meal Planner**. | Recipe appears on the selected day in Weekly View. |
| 5.2 | Generate **Shopping List** from planner. | Ingredients aggregated; Checkboxes working for shopping mode. |
| 5.3 | Navigate to **Settings** and update bio. | Profile updated; Changes reflected in public profile view. |

---

## 🛡️ Admin Flow (Staff User)

> **Requirement**: Log in with an account having `ROLE_ADMIN`.

### 1. Administrative Dashboard (`/admin`)
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1.1 | View Dashboard Statistics. | Real-time counts for Total Users and Total Recipes shown. |
| 1.2 | View **Administrative Audit Logs**. | List of recent actions (merges, blocks, premium overrides) visible. |

### 2. User Moderation
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 2.1 | Click **"Restrict" (Block)** on a user. | User's status changes to "Restricted"; They cannot log in. |
| 2.2 | Click **"Premium Override"**. | Manually grant 30/90 days of Premium access to any user. |

### 3. Content Moderation
| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 3.1 | Search for a reported recipe in Admin view. | Recipe title and author identified. |
| 3.2 | Click **"Delete"** (Admin-level). | Recipe removed globally; Audit log entry created. |
| 3.3 | Toggle **"Premium" flag** on any recipe. | Recipe highlighted with "Premium" ribbon on global feed. |

---

## 💎 Premium Subscription Flow (Stripe)

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1.1 | Click **"Go Premium"** in Sidebar/Profile. | Redirected to Stripe Checkout; ₹499 amount shown. |
| 1.2 | Complete test payment (Card 4242...). | Redirected back with `success` param; Ribbon added to profile. |
| 1.3 | Access a "Premium Only" recipe. | Content is visible (previously blocked by paywall). |
