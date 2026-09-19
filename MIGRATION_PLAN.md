# Migration Plan: Green Valley Society Manager

## Executive Summary

This document outlines the migration of the Green Valley Society Manager from a Supabase-based frontend-only application to a robust full-stack architecture with Django REST Framework, PostgreSQL 18, and a Flutter mobile application.

## Current State Assessment

### Existing Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (BaaS) - direct client-side access
- **Authentication**: Supabase Auth (Google OAuth + Email OTP)
- **Database**: Supabase PostgreSQL (managed)
- **Mobile**: None currently (Flutter to be added)

### Current Domain Models
- SocietySettings (society configuration, payment details)
- Unit (residential units with owners)
- Bill (monthly maintenance bills)
- Payment (payment records)
- Expense (society expenses)
- Notice (announcements)
- Visitor (visitor management)
- Amenity (facility booking)
- Booking (amenity reservations)
- SosAlert (emergency alerts)
- Complaint (resident complaints)

### Current UI Pages
- Dashboard (admin/resident views)
- Billing (bill generation and management)
- Payments (payment recording and UPI QR codes)
- Expenses (expense tracking and reports)
- Notices (digital notice board)
- Units (unit management)
- Visitors (visitor management)
- Amenities (facility booking)
- SOS (emergency alerts)
- Complaints (issue tracking)
- Assistant (AI assistant)
- Settings (society configuration)

### Current Authentication Flow
- Google OAuth via Supabase
- Email OTP via Supabase
- Session management via Supabase client
- Role-based UI switching (admin/resident)

## Target Architecture

### New Technology Stack
- **Backend**: Python Django + Django REST Framework
- **Database**: PostgreSQL 18 (self-hosted)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (preserved)
- **Mobile**: Flutter (new)
- **Authentication**: Django JWT + Google ID token verification + Email OTP
- **API Documentation**: OpenAPI/Swagger (drf-spectacular)

### Repository Structure
```
E:\Navyanaman_app\
├── frontend/          # Existing React app (moved from root)
├── backend/           # Django project (new)
├── mobile/            # Flutter app (new)
├── docs/              # Documentation (new)
├── docker-compose.yml # Local development (new)
├── Makefile           # Development commands (new)
├── .env.example       # Environment variables template (new)
└── README.md          # Updated documentation
```

## Migration Phases

### Phase 1: Planning and Setup (Current)
- [x] Repository inspection
- [x] Current architecture analysis
- [x] Domain model identification
- [x] Create migration planning documents
- [ ] Set up project structure
- [ ] Create Docker configuration
- [ ] Set up environment variable templates

### Phase 2: Django Backend Foundation
- [ ] Initialize Django project with PostgreSQL 18
- [ ] Configure environment-specific settings (dev/test/prod)
- [ ] Implement custom User model (email-based)
- [ ] Set up Django REST Framework
- [ ] Configure CORS for local development
- [ ] Set up JWT authentication (djangorestframework-simplejwt)
- [ ] Configure OpenAPI documentation (drf-spectacular)
- [ ] Create database migrations for base models

### Phase 3: Authentication System
- [ ] Implement Google ID token verification endpoint
- [ ] Implement Email OTP request endpoint
- [ ] Implement Email OTP verification endpoint
- [ ] Implement JWT token refresh endpoint
- [ ] Implement logout endpoint
- [ ] Implement /me/ endpoint for current user profile
- [ ] Add rate limiting for OTP requests
- [ ] Add audit logging for authentication events
- [ ] Write authentication tests

### Phase 4: Domain Models and APIs
- [ ] Implement Society model and settings
- [ ] Implement Unit model with society scoping
- [ ] Implement Bill model with automatic status updates
- [ ] Implement Payment model with bill reconciliation
- [ ] Implement Expense model with category tracking
- [ ] Implement Notice model with priority system
- [ ] Implement Visitor model with status workflow
- [ ] Implement Amenity and Booking models
- [ ] Implement SosAlert model
- [ ] Implement Complaint model
- [ ] Add society-scoped queryset filtering
- [ ] Implement role-based permissions
- [ ] Create API serializers and viewsets
- [ ] Add pagination, filtering, and ordering

### Phase 5: React Frontend Migration
- [ ] Move React app to frontend/ directory
- [ ] Remove Supabase client dependency
- [ ] Create API client with axios
- [ ] Implement token storage mechanism
- [ ] Update AuthContext for Django API
- [ ] Update Login page for new authentication
- [ ] Remove/update AuthCallback page
- [ ] Create API service modules (auth, dashboard, billing, etc.)
- [ ] Update all pages to use Django APIs
- [ ] Implement 401 handling with token refresh
- [ ] Add loading and error states
- [ ] Test all existing functionality

### Phase 6: Flutter Mobile Application
- [ ] Initialize Flutter project
- [ ] Set up project structure (feature-first)
- [ ] Implement state management (Riverpod/Bloc)
- [ ] Create API client with Dio
- [ ] Implement secure token storage
- [ ] Create authentication screens
- [ ] Implement Google Sign-In integration
- [ ] Implement Email OTP flow
- [ ] Create dashboard screen
- [ ] Create domain screens (notices, bills, payments, etc.)
- [ ] Implement role-based navigation
- [ ] Add responsive design
- [ ] Write Flutter tests

### Phase 7: Testing and Quality Assurance
- [ ] Backend model tests
- [ ] Backend serializer tests
- [ ] Backend API endpoint tests
- [ ] Authentication and authorization tests
- [ ] Society isolation tests
- [ ] React component tests
- [ ] React integration tests
- [ ] Flutter unit tests
- [ ] Flutter widget tests
- [ ] Flutter integration tests
- [ ] End-to-end testing

### Phase 8: Documentation and Deployment
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Write API_CONTRACT.md
- [ ] Create deployment guide (DEPLOYMENT.md)
- [ ] Create local development setup guide
- [ ] Create seed data management command
- [ ] Add Docker Compose for local development
- [ ] Create Makefile for common commands
- [ ] Update README.md
- [ ] Create implementation report

## Risk Assessment

### High Risks
1. **Data Migration**: Existing Supabase data needs to be migrated to PostgreSQL
2. **Authentication Breaking Changes**: Users will need to re-authenticate
3. **API Compatibility**: React frontend changes may introduce bugs
4. **Flutter Learning Curve**: New mobile platform requires expertise

### Medium Risks
1. **Role-Based Access**: Complex permission system needs thorough testing
2. **Society Isolation**: Multi-tenancy requires careful implementation
3. **Real-time Features**: Current real-time features may need alternative approach
4. **Performance**: Django API performance vs Supabase direct access

### Mitigation Strategies
1. **Data Migration**: Create export/import scripts from Supabase
2. **Authentication**: Implement both systems temporarily during transition
3. **API Compatibility**: Keep React UI changes minimal and well-tested
4. **Flutter**: Start with core features and expand gradually
5. **Testing**: Comprehensive test coverage before deployment
6. **Rollback Plan**: Keep Supabase backup during transition

## Data Migration Strategy

### Supabase to PostgreSQL Migration
1. Export data from Supabase tables
2. Transform data to match Django models
3. Import to PostgreSQL using Django management commands
4. Verify data integrity
5. Update foreign key relationships
6. Test with migrated data

### Mapping Table
| Supabase Table | Django Model | Notes |
|---------------|---------------|-------|
| society_settings | SocietySettings | Direct mapping |
| units | Unit | Add society foreign key |
| bills | Bill | Add society foreign key |
| payments | Payment | Add society foreign key |
| expenses | Expense | Add society foreign key |
| notices | Notice | Add society foreign key |
| visitors | Visitor | Add society foreign key |
| amenities | Amenity | Add society foreign key |
| bookings | Booking | Add society foreign key |
| sos_alerts | SosAlert | Add society foreign key |
| complaints | Complaint | Add society foreign key |
| auth.users | CustomUser | Migration to Django User model |

## Timeline Estimation

- **Phase 1**: 1-2 days
- **Phase 2**: 3-4 days
- **Phase 3**: 4-5 days
- **Phase 4**: 7-10 days
- **Phase 5**: 5-7 days
- **Phase 6**: 7-10 days
- **Phase 7**: 5-7 days
- **Phase 8**: 2-3 days

**Total Estimated Time**: 34-48 days

## Success Criteria

1. ✅ All existing React functionality preserved
2. ✅ Django API with comprehensive test coverage (>80%)
3. ✅ Flutter mobile app with core features working
4. ✅ Authentication system secure and functional
5. ✅ Society data isolation enforced
6. ✅ Role-based access control implemented
7. ✅ API documentation complete
8. ✅ Local development environment reproducible
9. ✅ Deployment guide complete
10. ✅ Data migration successful

## Next Steps

1. Review and approve this migration plan
2. Set up the new repository structure
3. Begin Phase 2: Django Backend Foundation
4. Create detailed implementation tasks in TASK_STATUS.md

---

**Document Status**: Draft - Pending Review
**Last Updated**: 2026-08-30
**Author**: Migration Planning Phase