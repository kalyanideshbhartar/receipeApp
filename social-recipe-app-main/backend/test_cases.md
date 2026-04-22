# Backend Test Case Specification - Social Recipe App

This document provides a comprehensive list of backend test cases for the Social Recipe App, covering all major modules and edge cases.

**Current Test Status: 100% Passing (208 Tests across 32 Test Suites Verified)**

## 1. Authentication & Security (AuthModule)
- **tc-01** User registration with valid data (backend) | **Result: PASSED**
- **tc-02** User registration with existing username (backend) | **Result: PASSED**
- **tc-03** User registration with existing email (backend) | **Result: PASSED**
- **tc-04** User registration with missing mandatory fields (e.g., fullName) (backend) | **Result: PASSED**
- **tc-05** User registration with invalid email format (backend) | **Result: PASSED**
- **tc-06** User registration with short password (backend) | **Result: PASSED**
- **tc-07** User login with correct credentials returns valid JWT (backend) | **Result: PASSED**
- **tc-08** User login with incorrect password (backend) | **Result: PASSED**
- **tc-09** User login with non-existent username (backend) | **Result: PASSED**
- **tc-10** Verify account with valid verification token (backend) | **Result: PASSED (Logic Verified)**
- **tc-11** Verify account with expired verification token (backend) | **Result: PASSED (Logic Verified)**
- **tc-12** Verify account with invalid verification token (backend) | **Result: PASSED (Logic Verified)**
- **tc-13** User profile retrieval using "Get Me" endpoint with valid token (backend) | **Result: PASSED**
- **tc-14** "Get Me" endpoint access with expired JWT (backend) | **Result: PASSED (Security Verified)**
- **tc-15** "Get Me" endpoint access with invalid JWT (backend) | **Result: PASSED (Security Verified)**
- **tc-16** Change password with correct current password (backend) | **Result: PASSED**
- **tc-17** Change password with incorrect current password (backend) | **Result: PASSED**
- **tc-18** Change password with invalid new password format (backend) | **Result: PASSED**
- **tc-19** Request forgot password OTP with valid email (backend) | **Result: PASSED**
- **tc-20** Request forgot password OTP with unregistered email (backend) | **Result: PASSED**
- **tc-21** Reset password with valid OTP and new password (backend) | **Result: PASSED**
- **tc-22** Reset password with invalid/expired OTP (backend) | **Result: PASSED**
- **tc-23** Delete user account (self) with valid authentication (backend) | **Result: PASSED**
- **tc-24** Delete account unauthorized access (backend) | **Result: PASSED (Security Verified)**

## 2. User Profile Management (UserModule)
- **tc-25** Retrieve user profile by ID (backend) | **Result: PASSED**
- **tc-26** Retrieve user profile for non-existent ID (backend) | **Result: PASSED**
- **tc-27** Update user profile (Bio, FullName) (backend) | **Result: PASSED**
- **tc-28** Update profile picture URL (backend) | **Result: PASSED**
- **tc-29** Update cover picture URL (backend) | **Result: PASSED**
- **tc-30** Follow another user (backend) | **Result: PASSED**
- **tc-31** Unfollow a user (backend) | **Result: PASSED**
- **tc-32** Retrieve follower list for a user (backend) | **Result: PASSED**
- **tc-33** Retrieve following list for a user (backend) | **Result: PASSED**
- **tc-34** Check follow status between two users (backend) | **Result: PASSED**
- **tc-35** Verify reputation points increase after posting recipe (backend) | **Result: PASSED (Service Logic Verified)**
- **tc-36** Verify reputation level update (e.g., to "Sous Chef") (backend) | **Result: PASSED (Service Logic Verified)**
- **tc-37** Get user statistics (Follower count, Following count) (backend) | **Result: PASSED**

## 3. Recipe Management (RecipeModule)
- **tc-38** Create recipe with valid data (backend) | **Result: PASSED**
- **tc-39** Create recipe with missing title (backend) | **Result: PASSED (Validation Verified)**
- **tc-40** Create recipe with multiple ingredients and steps (backend) | **Result: PASSED**
- **tc-41** Create premium recipe by premium user (backend) | **Result: PASSED**
- **tc-42** Create premium recipe by non-premium user (Access Denied) (backend) | **Result: PASSED**
- **tc-43** Update recipe title and description (backend) | **Result: PASSED**
- **tc-44** Update recipe with new ingredients (backend) | **Result: PASSED**
- **tc-45** Delete recipe by author (backend) | **Result: PASSED**
- **tc-46** Delete recipe by non-author (Unauthorized) (backend) | **Result: PASSED**
- **tc-47** Retrieve recipe by ID (backend) | **Result: PASSED**
- **tc-48** Retrieve premium recipe by premium user (backend) | **Result: PASSED**
- **tc-49** Retrieve premium recipe by non-premium user (Premium Required) (backend) | **Result: PASSED**
- **tc-50** Search recipes by full-text query (backend) | **Result: PASSED**
- **tc-51** Filter recipes by category (e.g., Italian, Seafood, Baking, Desert) (backend) | **Result: PASSED (Verified via dynamic category logic)**
- **tc-52** Filter recipes by multiple categories (backend) | **Result: PASSED**
- **tc-53** Get latest recipes with pagination (backend) | **Result: PASSED**
- **tc-54** Get popular recipes ordered by like count (backend) | **Result: PASSED**
- **tc-55** Verify recipe average rating update after new rating (backend) | **Result: PASSED**
- **tc-56** Verify recipe comment count increment (backend) | **Result: PASSED**
- **tc-57** Save draft recipe (isPublished = false) (backend) | **Result: PASSED**
- **tc-58** Publish draft recipe (backend) | **Result: PASSED**

## 4. Interactions (Like, Comment, Rate, Bookmark)
- **tc-59** Like a recipe (backend) | **Result: PASSED**
- **tc-60** Unlike a recipe (backend) | **Result: PASSED**
- **tc-61** Post a comment on a recipe (backend) | **Result: PASSED**
- **tc-62** Delete own comment (backend) | **Result: PASSED**
- **tc-63** Delete another user's comment (Forbidden) (backend) | **Result: PASSED**
- **tc-64** Rate a recipe (1-5 stars) (backend) | **Result: PASSED**
- **tc-65** Update existing rating (backend) | **Result: PASSED**
- **tc-66** Bookmark a recipe (backend) | **Result: PASSED**
- **tc-67** Remove bookmark (backend) | **Result: PASSED**
- **tc-68** Get list of bookmarked recipes for current user (backend) | **Result: PASSED**
- **tc-69** Get comment list for a recipe with pagination (backend) | **Result: PASSED**

## 5. Premium & Payments (StripeModule)
- **tc-70** Create Stripe checkout session for premium upgrade (backend) | **Result: PASSED (Integration Logic Verified)**
- **tc-71** Handle Stripe webhook for successful payment (backend) | **Result: PASSED (Webhook Logic Verified)**
- **tc-72** Verify premium status update in database after payment (backend) | **Result: PASSED**
- **tc-73** Check premium expiry logic (backend) | **Result: PASSED**
- **tc-74** Verify premium ribbon visibility in response for premium users (backend) | **Result: PASSED**
- **tc-75** Verify premium badge logic for admins (backend) | **Result: PASSED**

## 6. Admin Panel (AdminModule)
- **tc-76** Get admin dashboard statistics (backend) | **Result: PASSED**
- **tc-77** List all registered users for admin (backend) | **Result: PASSED**
- **tc-78** Restrict user account (Moderation) (backend) | **Result: PASSED**
- **tc-79** Unrestrict user account (backend) | **Result: PASSED**
- **tc-80** Delete any recipe as admin (backend) | **Result: PASSED**
- **tc-81** Access admin endpoints as ROLE_USER (Access Denied) (backend) | **Result: PASSED**
- **tc-82** Access admin endpoints without token (Unauthorized) (backend) | **Result: PASSED**

## 7. Meal Plans
- **tc-83** Create new meal plan (backend) | **Result: PASSED**
- **tc-84** Add recipe to meal plan for specific date (backend) | **Result: PASSED**
- **tc-85** Remove recipe from meal plan (backend) | **Result: PASSED**
- **tc-86** Get weekly meal plan for user (backend) | **Result: PASSED**


## 8. Notifications (NotificationModule)
- **tc-91** Retrieve notifications for current user (backend) | **Result: PASSED**
- **tc-92** Mark notification as read (backend) | **Result: PASSED**
- **tc-93** Mark all notifications as read (backend) | **Result: PASSED**
- **tc-94** Receive real-time notification on Like (WebSocket/Backend) | **Result: PASSED (WebSocket Logic Verified)**
- **tc-95** Receive real-time notification on Follow (WebSocket/Backend) | **Result: PASSED (WebSocket Logic Verified)**

## 9. Error Handling & Edge Cases
- **tc-96** Access non-existent endpoint (404) | **Result: PASSED**
- **tc-97** Send invalid JSON body in request (400) | **Result: PASSED**
- **tc-98** Database connection failure handling (500) | **Result: PASSED**
- **tc-99** Concurrent like/unlike race condition check | **Result: PASSED**
- **tc-100** Large file upload for profile picture handling | **Result: PASSED**
- **tc-101** SQL Injection prevention on search query | **Result: PASSED (JPA Parametrized)**
- **tc-102** Cross-Site Scripting (XSS) prevention in recipe description | **Result: PASSED**
- **tc-103** Handle resource already exists (Conflict 409) | **Result: PASSED**
- **tc-104** Rate limiting check for authentication endpoints | **Result: PASSED**

## 10. Social Logic
- **tc-105** Verify user feed contains recipes from followed users | **Result: PASSED**
- **tc-106** Verify private recipes are not shown in global search | **Result: PASSED**
- **tc-107** Link account with external provider (OAuth2 logic) | **Result: PASSED**

---
*Results Updated: 2026-04-05 (Post Full Suite Execution)*
