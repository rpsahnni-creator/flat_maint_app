# API Contract: Green Valley Society Manager

## Base URL
- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.example.com/api/v1`

## Authentication

All endpoints except authentication endpoints require JWT authentication via `Authorization: Bearer <access_token>` header.

### Response Format

#### Success Response
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

#### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

#### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Invalid or missing credentials
- `PERMISSION_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## Authentication Endpoints

### POST /auth/google/
Authenticate user using Google ID token.

**Request:**
```json
{
  "id_token": "google_id_token_string"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "display_name": "John Doe",
      "phone_number": "+91XXXXXXXXXX",
      "roles": [
        {
          "society_id": "society_id",
          "role": "society_admin",
          "society_name": "Green Valley"
        }
      ]
    }
  }
}
```

**Errors:**
- 400: Invalid token format
- 401: Token verification failed
- 429: Too many requests

---

### POST /auth/otp/request/
Request OTP for email authentication.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "OTP sent successfully",
    "expires_in": 600
  }
}
```

**Errors:**
- 400: Invalid email format
- 429: Too many OTP requests (rate limited)

**Notes:**
- OTP expires in 10 minutes
- Rate limited per email and IP
- In development, OTP logged to console

---

### POST /auth/otp/verify/
Verify OTP and authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "display_name": "John Doe",
      "phone_number": null,
      "roles": [
        {
          "society_id": "society_id",
          "role": "resident",
          "society_name": "Green Valley"
        }
      ]
    }
  }
}
```

**Errors:**
- 400: Invalid OTP format
- 401: Invalid or expired OTP
- 429: Too many verification attempts

**Notes:**
- Maximum 3 verification attempts per OTP
- New OTP invalidates previous OTP

---

### POST /auth/token/refresh/
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "new_jwt_access_token",
    "refresh_token": "new_jwt_refresh_token"
  }
}
```

**Errors:**
- 401: Invalid or expired refresh token

**Notes:**
- Implements token rotation
- Old refresh token invalidated

---

### POST /auth/logout/
Logout user and invalidate refresh token.

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Errors:**
- 401: Invalid refresh token

---

### GET /auth/me/
Get current authenticated user profile.

**Response (200 OK):**
```json
{
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "display_name": "John Doe",
    "phone_number": "+91XXXXXXXXXX",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "roles": [
      {
        "society_id": "society_id",
        "role": "society_admin",
        "society_name": "Green Valley"
      }
    ],
    "permissions": [
      "manage_units",
      "manage_billing",
      "manage_expenses",
      "view_reports"
    ]
  }
}
```

**Errors:**
- 401: Not authenticated

---

## Dashboard Endpoints

### GET /dashboard/summary/
Get dashboard summary for authenticated user.

**Query Parameters:**
- `society_id` (optional): Filter by society (for multi-society users)

**Response (200 OK):**
```json
{
  "data": {
    "society_name": "Green Valley",
    "period": {
      "month": 8,
      "year": 2024
    },
    "counts": {
      "total_units": 100,
      "paid_units": 75,
      "pending_units": 20,
      "overdue_units": 5
    },
    "financials": {
      "total_billed": 300000.00,
      "total_collected": 225000.00,
      "total_expenses": 150000.00,
      "net_balance": 75000.00,
      "collection_rate": 75.0
    },
    "recent_payments": [
      {
        "id": "payment_id",
        "amount": 3000.00,
        "method": "upi",
        "paid_at": "2024-08-30T10:30:00Z",
        "unit_number": "A-101"
      }
    ],
    "recent_notices": [
      {
        "id": "notice_id",
        "title": "Water Tank Maintenance",
        "priority": "urgent",
        "created_at": "2024-08-29T15:00:00Z"
      }
    ],
    "sos_alerts": [
      {
        "id": "alert_id",
        "unit_number": "B-205",
        "alert_type": "medical",
        "status": "active",
        "created_at": "2024-08-30T09:15:00Z"
      }
    ]
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

## Society Endpoints

### GET /societies/
List societies (for super_admin only).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `search` (optional): Search by name

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "society_id",
      "name": "Green Valley",
      "created_at": "2024-01-01T00:00:00Z",
      "active_units": 100
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 1
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not super_admin

---

### GET /societies/{id}/
Get society details.

**Response (200 OK):**
```json
{
  "data": {
    "id": "society_id",
    "name": "Green Valley",
    "upi_id": "society@upi",
    "payee_name": "Green Valley Society",
    "bank_name": "HDFC Bank",
    "account_number": "XXXXXXXXXX",
    "ifsc": "HDFC0001234",
    "monthly_rate_per_sqft": 3.00,
    "late_fee_per_day": 5.00,
    "due_day_of_month": 10,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-08-30T00:00:00Z"
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not society member
- 404: Society not found

---

### PUT /societies/{id}/
Update society settings (society_admin only).

**Request:**
```json
{
  "name": "Green Valley Society",
  "upi_id": "society@upi",
  "payee_name": "Green Valley Society",
  "bank_name": "HDFC Bank",
  "account_number": "XXXXXXXXXX",
  "ifsc": "HDFC0001234",
  "monthly_rate_per_sqft": 3.50,
  "late_fee_per_day": 5.00,
  "due_day_of_month": 10
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "society_id",
    "name": "Green Valley Society",
    "upi_id": "society@upi",
    "payee_name": "Green Valley Society",
    "bank_name": "HDFC Bank",
    "account_number": "XXXXXXXXXX",
    "ifsc": "HDFC0001234",
    "monthly_rate_per_sqft": 3.50,
    "late_fee_per_day": 5.00,
    "due_day_of_month": 10,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-08-30T12:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Not society_admin
- 404: Society not found

---

## Unit Endpoints

### GET /units/
List units (filtered by user's society).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `search` (optional): Search by unit number or owner name
- `floor` (optional): Filter by floor
- `is_active` (default: true)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "unit_id",
      "unit_number": "A-101",
      "owner_name": "John Doe",
      "phone": "+91XXXXXXXXXX",
      "floor": 1,
      "area_sqft": 1200.00,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "current_bill": {
        "status": "paid",
        "amount": 3600.00
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /units/
Create new unit (society_admin/manager only).

**Request:**
```json
{
  "unit_number": "A-102",
  "owner_name": "Jane Smith",
  "phone": "+91XXXXXXXXXX",
  "floor": 1,
  "area_sqft": 1150.00
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "unit_id",
    "unit_number": "A-102",
    "owner_name": "Jane Smith",
    "phone": "+91XXXXXXXXXX",
    "floor": 1,
    "area_sqft": 1150.00,
    "is_active": true,
    "created_at": "2024-08-30T12:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions
- 409: Unit number already exists

---

### GET /units/{id}/
Get unit details.

**Response (200 OK):**
```json
{
  "data": {
    "id": "unit_id",
    "unit_number": "A-101",
    "owner_name": "John Doe",
    "phone": "+91XXXXXXXXXX",
    "floor": 1,
    "area_sqft": 1200.00,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-08-30T00:00:00Z",
    "bills": [
      {
        "id": "bill_id",
        "period_month": 8,
        "period_year": 2024,
        "total_amount": 3600.00,
        "status": "paid"
      }
    ]
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not authorized for this unit
- 404: Unit not found

---

### PUT /units/{id}/
Update unit details (society_admin/manager only).

**Request:**
```json
{
  "owner_name": "John Doe Updated",
  "phone": "+91YYYYYYYYYY",
  "floor": 1,
  "area_sqft": 1250.00,
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "unit_id",
    "unit_number": "A-101",
    "owner_name": "John Doe Updated",
    "phone": "+91YYYYYYYYYY",
    "floor": 1,
    "area_sqft": 1250.00,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-08-30T12:30:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Unit not found

---

### DELETE /units/{id}/
Deactivate unit (society_admin only).

**Response (204 No Content):**

**Errors:**
- 401: Not authenticated
- 403: Not society_admin
- 404: Unit not found

---

## Billing Endpoints

### GET /billing/bills/
List bills (filtered by user's society and role).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `unit_id` (optional): Filter by unit
- `status` (optional): Filter by status (pending/paid/overdue/partial)
- `period_month` (optional): Filter by month
- `period_year` (optional): Filter by year

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "bill_id",
      "unit_id": "unit_id",
      "unit_number": "A-101",
      "owner_name": "John Doe",
      "period_month": 8,
      "period_year": 2024,
      "base_amount": 3600.00,
      "late_fee": 0.00,
      "total_amount": 3600.00,
      "due_date": "2024-08-10",
      "status": "paid",
      "created_at": "2024-08-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /billing/bills/generate/
Generate monthly bills for all active units (society_admin/accountant only).

**Request:**
```json
{
  "period_month": 9,
  "period_year": 2024
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Bills generated successfully",
    "generated_count": 95,
    "skipped_count": 5,
    "bills": [
      {
        "id": "bill_id",
        "unit_id": "unit_id",
        "unit_number": "A-101",
        "period_month": 9,
        "period_year": 2024,
        "base_amount": 3600.00,
        "late_fee": 0.00,
        "total_amount": 3600.00,
        "due_date": "2024-09-10",
        "status": "pending"
      }
    ]
  }
}
```

**Errors:**
- 400: Invalid period or already generated
- 401: Not authenticated
- 403: Insufficient permissions

---

### GET /billing/bills/{id}/
Get bill details.

**Response (200 OK):**
```json
{
  "data": {
    "id": "bill_id",
    "unit_id": "unit_id",
    "unit_number": "A-101",
    "owner_name": "John Doe",
    "period_month": 8,
    "period_year": 2024,
    "base_amount": 3600.00,
    "late_fee": 50.00,
    "total_amount": 3650.00,
    "due_date": "2024-08-10",
    "status": "overdue",
    "created_at": "2024-08-01T00:00:00Z",
    "payments": [
      {
        "id": "payment_id",
        "amount": 2000.00,
        "method": "upi",
        "paid_at": "2024-08-15T10:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not authorized for this bill
- 404: Bill not found

---

### GET /billing/payments/
List payments (filtered by user's society and role).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `unit_id` (optional): Filter by unit
- `bill_id` (optional): Filter by bill
- `method` (optional): Filter by payment method
- `from_date` (optional): Filter by date range
- `to_date` (optional): Filter by date range

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "payment_id",
      "bill_id": "bill_id",
      "unit_id": "unit_id",
      "unit_number": "A-101",
      "owner_name": "John Doe",
      "amount": 3600.00,
      "method": "upi",
      "reference_no": "1234567890",
      "paid_at": "2024-08-05T14:30:00Z",
      "created_at": "2024-08-05T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 50
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /billing/payments/
Record payment (society_admin/accountant only).

**Request:**
```json
{
  "bill_id": "bill_id",
  "unit_id": "unit_id",
  "amount": 3600.00,
  "method": "upi",
  "reference_no": "1234567890"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "payment_id",
    "bill_id": "bill_id",
    "unit_id": "unit_id",
    "amount": 3600.00,
    "method": "upi",
    "reference_no": "1234567890",
    "paid_at": "2024-08-30T15:00:00Z",
    "created_at": "2024-08-30T15:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Unit or bill not found

---

## Expense Endpoints

### GET /expenses/
List expenses (filtered by user's society).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `category` (optional): Filter by category
- `from_date` (optional): Filter by date range
- `to_date` (optional): Filter by date range

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "expense_id",
      "category": "Electricity",
      "description": "Monthly electricity bill",
      "amount": 15000.00,
      "expense_date": "2024-08-25",
      "created_at": "2024-08-25T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 30
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /expenses/
Create expense (society_admin/accountant only).

**Request:**
```json
{
  "category": "Electricity",
  "description": "Monthly electricity bill",
  "amount": 15000.00,
  "expense_date": "2024-08-25"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "expense_id",
    "category": "Electricity",
    "description": "Monthly electricity bill",
    "amount": 15000.00,
    "expense_date": "2024-08-25",
    "created_at": "2024-08-25T10:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### DELETE /expenses/{id}/
Delete expense (society_admin/accountant only).

**Response (204 No Content):**

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Expense not found

---

### GET /expenses/report/
Get expense report (society_admin/accountant only).

**Query Parameters:**
- `from_date` (required): Start date
- `to_date` (required): End date
- `group_by` (optional): category (default)

**Response (200 OK):**
```json
{
  "data": {
    "period": {
      "from": "2024-08-01",
      "to": "2024-08-31"
    },
    "total_expenses": 50000.00,
    "by_category": [
      {
        "category": "Electricity",
        "amount": 15000.00,
        "percentage": 30.0
      },
      {
        "category": "Water",
        "amount": 10000.00,
        "percentage": 20.0
      }
    ]
  }
}
```

**Errors:**
- 400: Invalid date range
- 401: Not authenticated
- 403: Insufficient permissions

---

## Notice Endpoints

### GET /notices/
List notices (filtered by user's society).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `priority` (optional): Filter by priority (normal/urgent)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "notice_id",
      "title": "Water Tank Maintenance",
      "body": "There will be water tank maintenance on...",
      "priority": "urgent",
      "created_at": "2024-08-29T15:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /notices/
Create notice (society_admin/manager only).

**Request:**
```json
{
  "title": "Water Tank Maintenance",
  "body": "There will be water tank maintenance on August 31st from 10 AM to 2 PM.",
  "priority": "urgent"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "notice_id",
    "title": "Water Tank Maintenance",
    "body": "There will be water tank maintenance on August 31st from 10 AM to 2 PM.",
    "priority": "urgent",
    "created_at": "2024-08-30T10:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### DELETE /notices/{id}/
Delete notice (society_admin/manager only).

**Response (204 No Content):**

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Notice not found

---

## Visitor Endpoints

### GET /visitors/
List visitors (filtered by user's society).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `status` (optional): Filter by status
- `host_unit_id` (optional): Filter by host unit

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "visitor_id",
      "visitor_name": "John Visitor",
      "purpose": "Delivery",
      "host_unit_id": "unit_id",
      "host_unit_number": "A-101",
      "entry_time": "2024-08-30T10:00:00Z",
      "exit_time": null,
      "status": "checked_in",
      "created_at": "2024-08-30T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 25
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /visitors/
Create visitor entry (security/manager only).

**Request:**
```json
{
  "visitor_name": "John Visitor",
  "purpose": "Delivery",
  "host_unit_id": "unit_id"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "visitor_id",
    "visitor_name": "John Visitor",
    "purpose": "Delivery",
    "host_unit_id": "unit_id",
    "entry_time": "2024-08-30T10:00:00Z",
    "exit_time": null,
    "status": "checked_in",
    "created_at": "2024-08-30T10:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### PUT /visitors/{id}/
Update visitor status (security/manager only).

**Request:**
```json
{
  "status": "checked_out",
  "exit_time": "2024-08-30T12:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "visitor_id",
    "visitor_name": "John Visitor",
    "purpose": "Delivery",
    "host_unit_id": "unit_id",
    "entry_time": "2024-08-30T10:00:00Z",
    "exit_time": "2024-08-30T12:00:00Z",
    "status": "checked_out",
    "created_at": "2024-08-30T10:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Visitor not found

---

## Amenity Endpoints

### GET /amenities/
List amenities (filtered by user's society).

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "amenity_id",
      "name": "Community Hall",
      "description": "Air-conditioned hall for events",
      "capacity": 100,
      "hourly_rate": 500.00,
      "is_active": true
    }
  ]
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /amenities/
Create amenity (society_admin only).

**Request:**
```json
{
  "name": "Tennis Court",
  "description": "Flood-lit tennis court",
  "capacity": 4,
  "hourly_rate": 200.00
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "amenity_id",
    "name": "Tennis Court",
    "description": "Flood-lit tennis court",
    "capacity": 4,
    "hourly_rate": 200.00,
    "is_active": true
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### GET /bookings/
List amenity bookings (filtered by user's society and role).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `amenity_id` (optional): Filter by amenity
- `unit_id` (optional): Filter by unit
- `booking_date` (optional): Filter by date

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "booking_id",
      "amenity_id": "amenity_id",
      "amenity_name": "Community Hall",
      "unit_id": "unit_id",
      "unit_number": "A-101",
      "booking_date": "2024-09-15",
      "start_time": "18:00",
      "end_time": "21:00",
      "status": "confirmed",
      "created_at": "2024-08-30T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 10
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /bookings/
Create booking (resident only for own unit, admin for any).

**Request:**
```json
{
  "amenity_id": "amenity_id",
  "unit_id": "unit_id",
  "booking_date": "2024-09-15",
  "start_time": "18:00",
  "end_time": "21:00"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "booking_id",
    "amenity_id": "amenity_id",
    "unit_id": "unit_id",
    "booking_date": "2024-09-15",
    "start_time": "18:00",
    "end_time": "21:00",
    "status": "confirmed",
    "created_at": "2024-08-30T10:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error or time slot unavailable
- 401: Not authenticated
- 403: Insufficient permissions

---

## SOS Alert Endpoints

### GET /sos-alerts/
List SOS alerts (filtered by user's society).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `status` (optional): Filter by status (active/resolved)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "alert_id",
      "unit_id": "unit_id",
      "unit_number": "B-205",
      "alert_type": "medical",
      "message": "Medical emergency in unit B-205",
      "status": "active",
      "created_at": "2024-08-30T09:15:00Z",
      "resolved_at": null
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 5
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /sos-alerts/
Create SOS alert (resident only for own unit).

**Request:**
```json
{
  "alert_type": "medical",
  "message": "Medical emergency"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "alert_id",
    "unit_id": "unit_id",
    "unit_number": "A-101",
    "alert_type": "medical",
    "message": "Medical emergency",
    "status": "active",
    "created_at": "2024-08-30T10:00:00Z",
    "resolved_at": null
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### PUT /sos-alerts/{id}/resolve/
Resolve SOS alert (society_admin/manager only).

**Response (200 OK):**
```json
{
  "data": {
    "id": "alert_id",
    "unit_id": "unit_id",
    "unit_number": "B-205",
    "alert_type": "medical",
    "message": "Medical emergency in unit B-205",
    "status": "resolved",
    "created_at": "2024-08-30T09:15:00Z",
    "resolved_at": "2024-08-30T10:30:00Z"
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Alert not found

---

## Complaint Endpoints

### GET /complaints/
List complaints (filtered by user's society and role).

**Query Parameters:**
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `unit_id` (optional): Filter by unit

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "complaint_id",
      "unit_id": "unit_id",
      "unit_number": "A-101",
      "category": "plumbing",
      "description": "Leaking tap in bathroom",
      "status": "open",
      "created_at": "2024-08-30T08:00:00Z",
      "resolved_at": null
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Insufficient permissions

---

### POST /complaints/
Create complaint (resident only for own unit).

**Request:**
```json
{
  "category": "plumbing",
  "description": "Leaking tap in bathroom"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "complaint_id",
    "unit_id": "unit_id",
    "unit_number": "A-101",
    "category": "plumbing",
    "description": "Leaking tap in bathroom",
    "status": "open",
    "created_at": "2024-08-30T08:00:00Z",
    "resolved_at": null
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions

---

### PUT /complaints/{id}/
Update complaint status (society_admin/manager only).

**Request:**
```json
{
  "status": "resolved"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "complaint_id",
    "unit_id": "unit_id",
    "unit_number": "A-101",
    "category": "plumbing",
    "description": "Leaking tap in bathroom",
    "status": "resolved",
    "created_at": "2024-08-30T08:00:00Z",
    "resolved_at": "2024-08-30T14:00:00Z"
  }
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Complaint not found

---

## Testing Endpoints

### POST /test/setup/
Setup test data (development only).

**Request:**
```json
{
  "society_name": "Test Society",
  "units_count": 10
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Test data created successfully",
    "society_id": "society_id",
    "admin_user_id": "user_id"
  }
}
```

**Errors:**
- 403: Not in development environment

---

## Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| POST /auth/otp/request/ | 3 per email | 1 hour |
| POST /auth/otp/verify/ | 5 per email | 15 minutes |
| POST /auth/google/ | 10 per IP | 1 hour |
| All other endpoints | 100 per user | 1 minute |

---

## Pagination

All list endpoints support pagination:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Response includes pagination metadata in `meta` field.

---

## Filtering and Sorting

Most list endpoints support:
- Filtering via query parameters
- Sorting via `ordering` parameter (e.g., `ordering=-created_at`)
- Search via `search` parameter where applicable

---

## Webhooks (Future)

Planned webhook support for:
- Payment received
- SOS alert created
- Complaint created
- Notice published

---

**Document Status**: Draft - Pending Review
**Last Updated**: 2026-08-30
**Author**: Migration Planning Phase