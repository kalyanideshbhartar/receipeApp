# Project Documentation: Culinario

Culinario is a full-stack social recipe platform that combines traditional recipe management with modern social discovery.

## 🏗️ Architecture Overview

The application follows a modern decoupled architecture:

- **Frontend**: React 19 SPA (Single Page Application) built with Vite and TypeScript.
- **Backend**: Spring Boot 3.4 RESTful API providing stateless services.
- **Database**: PostgreSQL for persistent storage with GIN indexes for full-text search.
- **Media**: Cloudinary for image storage and delivery.
- **Authentication**: JWT-based stateless security.

---

## 📂 Core Entities & Schema

### User Management
- **User**: Stores credentials, profile info, reputation points, and enabled status.
- **Follow**: Manages chef-follower relationships.
- **VerificationToken**: Handles secure email verification flow before account activation.
- **PasswordResetToken**: Handles secure password recovery flows.

### Recipe System
- **Recipe**: The core entity with title, description, prep/cook time, and categories.
- **Ingredient & Step**: Child entities defining the recipe content.
- **RecipeImage**: Links to Cloudinary assets.
- **Category**: Enum-based categorization (Breakfast, Lunch, Dinner, etc.).

### Social Interaction
- **Like**: Atomic toggle for recipe appreciation.
- **Comment**: Supports threaded discussions and author verification checkmarks.
- **Rating**: 1-5 star reviews for recipes.
- **Bookmark**: Personal collections for users.

### Utilities
- **MealPlan**: Calendar-based planning for recipes.
- **ShoppingList**: Dynamic list generation from meal plans, with auto-categorization.
- **Notification**: Real-time alerts for social actions.

---

## 📡 API Reference

### Authentication (`/api/auth`)
- `POST /register`: Create a new account (initially disabled).
- `GET /verify-registration`: Verify email using unique token.
- `POST /login`: Generate JWT token (checked for verification status).
- `POST /forgot-password`: Send 6-digit reset code.
- `POST /reset-password`: Update password using code.
- `POST /change-password`: Update password for logged-in users.
- `DELETE /users/me`: Account deletion.

### Recipes (`/api/recipes`)
- `GET /recipes`: Retrieve recipes (cursor-based pagination).
- `GET /recipes/{id}`: Detailed view including ingredients/steps.
- `POST /recipes`: Create new recipe (authenticated).
- `PUT /recipes/{id}`: Update existing recipe.
- `DELETE /recipes/{id}`: Soft/Hard delete from system.
- `GET /recipes/search?q=...`: Full-text search across titles and descriptions.
- `GET /recipes/trending`: Top performing recipes by likes and ratings.

### Feeds (`/api/feed`)
- `GET /feed/explore`: Trending and newest recipes.
- `GET /feed/personalized`: Tailored content from followed users.

### Social (`/api/...`)
- `POST /recipes/{id}/like`: Toggle like status.
- `POST /bookmarks/{id}`: Toggle bookmark status.
- `POST /recipes/{id}/comments`: Add a (threaded) comment.
- `GET /users/{username}/followers`: List of followers.

---

## 🧪 Testing Strategy

The project maintains high stability through a dual-layered testing approach.

### Backend (JUnit 5 + Mockito)
- **Service Tests**: 36 unit tests covering all edge cases for User, Recipe, Bookmark, and MealPlan services.
- **Controller Tests**: Integration tests for Auth and Recipe endpoints.
- **Validation Tests**: Strict DTO check verified in `AuthValidationTest`.

### Frontend (Jest + React Testing Library)
- **Unit Tests**: Mocking Redux and Router to verify component behavior in `LoginPage` and `RecipeCard`.
- **Environment**: Configured with `ts-jest` and polyfills for JSDOM consistency.

---

## 🚀 Deployment

- **Docker**: The application is containerized with a `docker-compose.yml` defining `app` and `db` services.
- **Environment**: Controlled via `.env` file for secrets.
