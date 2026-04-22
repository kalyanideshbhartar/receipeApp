# Project Status: Social Recipe App

## Status Checklist

### Backend Functional Requirements
- [x] User auth (Spring Security)
- [x] Follow system (follow/unfollow, follower/following counts)
- [x] Recipe CRUD (Create/Read/Delete implemented, Update is placeholder)
- [x] Recipe feed (Personalized feed implemented in repo but placeholder in service)
- [x] Explore feed (Public newest/popular)
- [x] Cloudinary photo upload (Signed URL generation implemented)
- [x] Search recipes (Title or ingredient)
- [ ] Like/unlike system (Check-then-insert pattern used, not UPSERT as requested)
- [ ] Comment system (Threaded replies MISSING)
- [x] Infinite scroll (Cursor-based pagination implemented)

### Frontend Functional Requirements
- [x] Auth pages (Login/Register)
- [x] Explore feed page
- [x] Multi-step recipe form
- [x] Cloudinary upload widget (client-side preview)
- [x] User profile page
- [x] Follow/unfollow buttons
- [x] Like buttons
- [x] Comment section (Flat, missing threaded replies)
- [x] Search page (Handled by FeedPage)
- [ ] BUG: ProfilePage expects .content from recipe list endpoints but service returns raw array

### Technical Requirements
- [ ] Docker Compose setup
- [ ] README.md with setup instructions
- [ ] Secrets in environment variables
- [ ] No sensitive credentials hardcoded

## Current Findings
- Root directory contains `backend`, `frontend`, [docker-compose.yml](file:///e:/ReceipeApp/docker-compose.yml), and [README.md](file:///e:/ReceipeApp/README.md).
- [README.md](file:///e:/ReceipeApp/README.md) appears to be a placeholder or very minimal.
