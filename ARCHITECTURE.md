# Architecture Document: Green Valley Society Manager

## System Overview

The Green Valley Society Manager is a multi-tenant society management system that provides web and mobile interfaces for residents and administrators. The system uses a Django REST Framework backend with PostgreSQL 18 database, React TypeScript frontend, and Flutter mobile application.

## Architecture Principles

1. **Multi-Tenancy**: All society-scoped data is isolated by society membership
2. **Role-Based Access Control**: Five distinct roles with specific permissions
3. **API-First Design**: All business logic resides in the Django backend
4. **Security First**: JWT authentication, rate limiting, audit logging
5. **Mobile-Ready**: Shared API between web and mobile clients
6. **Test-Driven**: Comprehensive test coverage across all layers

## Technology Stack

### Backend
- **Language**: Python 3.12+
- **Framework**: Django 5.x
- **API Framework**: Django REST Framework 3.x
- **Database**: PostgreSQL 18
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Documentation**: drf-spectacular (OpenAPI 3.0)
- **Testing**: pytest, pytest-django, factory-boy
- **Environment Management**: django-environ

### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: axios
- **State Management**: React Context API
- **Testing**: Vitest, React Testing Library, MSW

### Mobile
- **Framework**: Flutter 3.x
- **Language**: Dart (null safety)
- **State Management**: Riverpod
- **HTTP Client**: Dio
- **Secure Storage**: flutter_secure_storage
- **Testing**: flutter test, integration tests

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL 18 (local) / Managed PostgreSQL (production)
- **Email**: SMTP (production) / Mailpit (development)
- **Reverse Proxy**: Nginx (production)

## System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React Web     │      │  Flutter Mobile │      │   API Docs      │
│   (Vite/TS)     │      │   (Dart)        │      │  (Swagger UI)   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                         │                         │
         │ HTTPS/JWT              │ HTTPS/JWT               │ HTTPS
         └────────────┬────────────┘                         │
                      │                                      │
         ┌────────────▼────────────┐                        │
         │   Nginx Reverse Proxy   │                        │
         │   (SSL Termination)     │                        │
         └────────────┬────────────┘                        │
                      │                                      │
         ┌────────────▼────────────┐                        │
         │   Django REST API       │◄───────────────────────┘
         │   (DRF + JWT)           │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   PostgreSQL 18         │
         │   (Multi-tenant Data)   │
         └─────────────────────────┘
```

## Django Backend Architecture

### Project Structure
```
backend/
├── manage.py
├── requirements.txt
├── pyproject.toml
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          # Common settings
│   │   ├── development.py   # Development settings
│   │   ├── test.py          # Test settings
│   │   └── production.py    # Production settings
│   ├── urls.py              # Root URL configuration
│   ├── asgi.py              # ASGI config
│   └── wsgi.py              # WSGI config
├── apps/
│   ├── common/              # Shared utilities
│   ├── accounts/            # User management
│   ├── societies/           # Society management
│   ├── units/               # Unit management
│   ├── residents/           # Resident management
│   ├── billing/             # Billing and payments
│   ├── expenses/            # Expense tracking
│   ├── notices/             # Notice board
│   ├── dashboard/           # Dashboard data
│   └── audit/               # Audit logging
├── tests/                   # Backend tests
└── scripts/                 # Management scripts
```

### Django Apps Breakdown

#### accounts/
- Custom User model (email-based authentication)
- JWT token management
- Google ID token verification
- Email OTP generation and verification
- Role-based permissions
- User profile management

#### societies/
- Society model and settings
- Society membership management
- Multi-tenancy enforcement
- Society configuration

#### units/
- Unit model with society scoping
- Unit CRUD operations
- Unit assignment to residents
- Unit status management

#### residents/
- Resident profiles
- Resident-unit relationships
- Resident contact information
- Resident permissions

#### billing/
- Bill generation
- Bill status management (pending/paid/overdue/partial)
- Late fee calculation
- Payment recording
- Bill-payment reconciliation
- Receipt generation

#### expenses/
- Expense categories
- Expense recording
- Expense reporting
- Budget tracking

#### notices/
- Notice creation and publishing
- Priority management (normal/urgent)
- Notice lifecycle (draft/published/archived)
- Target audience filtering

#### dashboard/
- Summary statistics
- Role-appropriate data aggregation
- Recent activity feeds
- Performance metrics

#### audit/
- Audit log model
- Sensitive action tracking
- Security event logging
- Compliance reporting

### Database Design

#### Custom User Model
```python
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Society membership and roles handled through separate models
```

#### Society Model
```python
class Society(models.Model):
    name = models.CharField(max_length=255)
    upi_id = models.CharField(max_length=255)
    payee_name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=255)
    ifsc = models.CharField(max_length=11)
    monthly_rate_per_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    late_fee_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    due_day_of_month = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Role Model
```python
class Role(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('society_admin', 'Society Admin'),
        ('accountant', 'Accountant'),
        ('manager', 'Manager'),
        ('resident', 'Resident'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'society']
```

#### Unit Model
```python
class Unit(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    unit_number = models.CharField(max_length=50)
    owner_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    floor = models.IntegerField()
    area_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['society', 'unit_number']
```

### Authentication Flow

#### Google Login
1. Client obtains Google ID token via Google Sign-In
2. Client sends ID token to `/api/v1/auth/google/`
3. Backend verifies token signature, issuer, audience, expiry
4. Backend creates/retrieves user account
5. Backend assigns appropriate role(s)
6. Backend returns JWT access + refresh tokens
7. Client stores tokens securely

#### Email OTP Login
1. Client sends email to `/api/v1/auth/otp/request/`
2. Backend validates email, applies rate limiting
3. Backend generates secure OTP, stores hash
4. Backend sends OTP via email (or console in dev)
5. Client sends email + OTP to `/api/v1/auth/otp/verify/`
6. Backend verifies OTP hash, expiry, attempt count
7. Backend creates/retrieves user account
8. Backend returns JWT access + refresh tokens

#### Token Refresh
1. Client sends refresh token to `/api/v1/auth/token/refresh/`
2. Backend validates refresh token
3. Backend returns new access + refresh tokens (rotation)
4. Client updates stored tokens

#### Logout
1. Client sends refresh token to `/api/v1/auth/logout/`
2. Backend blacklists/invalidates refresh token
3. Client clears local token storage

### API Design

#### URL Structure
```
/api/v1/
├── auth/
│   ├── google/          (POST)
│   ├── otp/
│   │   ├── request/     (POST)
│   │   └── verify/      (POST)
│   ├── token/
│   │   └── refresh/     (POST)
│   ├── logout/          (POST)
│   └── me/              (GET)
├── dashboard/
│   └── summary/         (GET)
├── societies/           (CRUD)
├── units/               (CRUD + filters)
├── residents/           (CRUD)
├── billing/
│   ├── bills/           (CRUD)
│   └── payments/        (CRUD)
├── expenses/            (CRUD + reports)
├── notices/             (CRUD)
├── visitors/            (CRUD)
├── amenities/           (CRUD)
├── bookings/            (CRUD)
├── sos-alerts/          (CRUD)
└── complaints/          (CRUD)
```

#### Response Format
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

#### Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  }
}
```

## React Frontend Architecture

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   └── layouts/      # Layout components
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── lib/
│   │   ├── apiClient.ts  # Axios instance
│   │   ├── tokenStorage.ts
│   │   └── utils.ts
│   ├── services/
│   │   ├── authApi.ts
│   │   ├── dashboardApi.ts
│   │   ├── billingApi.ts
│   │   └── ...
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

### State Management
- **AuthContext**: Authentication state, user info, auth methods
- **AppContext**: Application state, role switching, unit selection
- **Local State**: Component-level state with useState/useReducer

### API Client
- Axios instance with base URL from environment
- Request interceptor for JWT token attachment
- Response interceptor for 401 handling and token refresh
- Centralized error handling

### Token Storage Strategy
- **Access Token**: Memory (React state) - short-lived
- **Refresh Token**: HttpOnly cookie (preferred) or secure localStorage
- **Token Refresh**: Automatic on 401, single shared refresh promise

## Flutter Mobile Architecture

### Project Structure
```
mobile/
├── lib/
│   ├── app/
│   │   ├── app.dart
│   │   └── routes.dart
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart
│   │   │   └── interceptors.dart
│   │   ├── auth/
│   │   │   ├── auth_service.dart
│   │   │   └── token_storage.dart
│   │   ├── config/
│   │   │   └── env_config.dart
│   │   ├── storage/
│   │   │   └── secure_storage.dart
│   │   ├── errors/
│   │   │   └── exceptions.dart
│   │   └── widgets/
│   │       └── common_widgets.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── otp/
│   │   │   └── splash/
│   │   ├── dashboard/
│   │   ├── billing/
│   │   ├── payments/
│   │   ├── notices/
│   │   └── profile/
│   └── main.dart
├── .env.example
├── pubspec.yaml
└── README.md
```

### State Management
- **Riverpod**: Global state management
- **State Notifiers**: Feature-specific state logic
- **Providers**: Dependency injection

### Secure Storage
- **flutter_secure_storage**: Token storage
- **Access Token**: Secure storage
- **Refresh Token**: Secure storage
- **Biometric Authentication**: Optional enhancement

### API Integration
- **Dio**: HTTP client with interceptors
- **Token Refresh**: Automatic retry on 401
- **Error Handling**: Centralized exception handling

## Security Architecture

### Authentication Security
- **JWT Tokens**: Short-lived access tokens (15 min), longer refresh tokens (7 days)
- **Token Rotation**: Refresh tokens rotated on each use
- **Token Blacklisting**: Optional logout blacklisting
- **Secure Storage**: HttpOnly cookies or secure storage

### API Security
- **CORS**: Restricted to known origins
- **CSRF**: Disabled for JWT API, enabled for session-based admin
- **Rate Limiting**: OTP requests, login attempts
- **Input Validation**: Comprehensive serializer validation
- **SQL Injection**: ORM protection via Django

### Data Security
- **Society Isolation**: All queries scoped to user's society
- **Role-Based Access**: Permission checks on all endpoints
- **Audit Logging**: Sensitive operations logged
- **Encryption**: TLS for all communications
- **Secrets Management**: Environment variables, never in code

## Performance Considerations

### Database Optimization
- **Indexes**: On foreign keys, lookup fields
- **Query Optimization**: select_related/prefetch_related
- **Connection Pooling**: PgBouncer in production
- **Read Replicas**: Optional for scaling

### API Performance
- **Pagination**: Default page size, maximum limits
- **Caching**: Redis for expensive queries (optional)
- **Compression**: Gzip for API responses
- **CDN**: Static assets via CDN

### Frontend Performance
- **Code Splitting**: Route-based splitting
- **Lazy Loading**: Components and routes
- **Image Optimization**: Responsive images
- **Bundle Size**: Regular audits and optimization

## Deployment Architecture

### Development Environment
- **Docker Compose**: PostgreSQL, Mailpit, Redis (optional)
- **Hot Reload**: Django debug mode, Vite HMR
- **Local Environment**: Windows/Linux/macOS support

### Production Environment
- **Application Server**: Gunicorn with workers
- **Web Server**: Nginx reverse proxy
- **Database**: Managed PostgreSQL (AWS RDS, etc.)
- **Static Files**: Whitenoise or CDN
- **Media Files**: S3 or similar
- **Email**: SMTP service (SendGrid, AWS SES)
- **Monitoring**: Sentry, New Relic, or similar
- **Logging**: Structured JSON logs, log aggregation

## Assumptions and Constraints

### Assumptions
1. **Single Society per Instance**: Initial deployment supports one society, multi-society architecture prepared
2. **Email Provider**: Production requires SMTP configuration (SendGrid, AWS SES, etc.)
3. **Google OAuth**: Client requires Google Cloud Platform project setup
4. **Time Zone**: Asia/Kolkata as default time zone
5. **Currency**: INR as default currency
6. **Payment Gateway**: Manual payment recording initially, gateway integration later

### Constraints
1. **No Real-time Features**: Initial version doesn't include WebSocket support
2. **No File Uploads**: Initial version doesn't include document/image uploads
3. **Single Language**: English only initially
4. **Mobile Only**: No tablet-specific optimizations initially
5. **Offline Support**: No offline capability initially

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: WebSocket support for live updates
2. **File Uploads**: Document and image management
3. **Payment Gateway Integration**: Razorpay, Stripe, etc.
4. **Multi-language Support**: i18n implementation
5. **Advanced Reporting**: PDF exports, analytics
6. **Mobile Push Notifications**: FCM integration
7. **Offline Support**: PWA capabilities
8. **Advanced Permissions**: Granular permission system

### Scalability Considerations
1. **Microservices**: Potential split if complexity grows
2. **Message Queue**: Celery for background tasks
3. **Read Replicas**: Database scaling
4. **CDN**: Global static asset delivery
5. **Load Balancing**: Multiple application servers

---

**Document Status**: Draft - Pending Review
**Last Updated**: 2026-08-30
**Author**: Migration Planning Phase