# Resident Facility Management System

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Complaints
- `GET /api/complaints/categories` - Get complaint categories
- `GET /api/complaints` - Get complaints (filtered by role)
- `POST /api/complaints` - Create complaint (with image upload)
- `GET /api/complaints/:id` - Get specific complaint
- `PUT /api/complaints/:id` - Update complaint
- `PUT /api/complaints/:id/status` - Update status (admin only)

### Facilities & Bookings
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/:id/bookings` - Get facility bookings
- `POST /api/facilities/:id/bookings` - Create booking
- `GET /api/facilities/bookings/my` - Get user's bookings
- `PUT /api/facilities/bookings/:id/approve` - Approve booking (admin)
- `PUT /api/facilities/bookings/:id/cancel` - Cancel booking

## API Documentation

### Authentication

#### Register
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "08123456789",
    "role": "resident",
    "apartment_number": "A-101"
  }
  ```
- **Response:**
  - `201 Created` on success
  - `409 Conflict` if email exists
  - `400` for validation errors

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response:**
  - `200 OK` with JWT token
  - `401 Unauthorized` on failure

#### Get Profile
- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  - `200 OK` with user profile

---

### Complaints

#### Get Complaint Categories
- **GET** `/api/complaints/categories`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** List of categories

#### Get Complaints
- **GET** `/api/complaints`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page`, `limit`, `status`, `priority`
- **Response:** Paginated complaints

#### Create Complaint
- **POST** `/api/complaints`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `category_id` (uuid, required)
  - `title` (string, required)
  - `description` (string, required)
  - `priority` (string, optional)
  - `image` (file, optional)
- **Response:**
  - `201 Created` on success

#### Get Complaint by ID
- **GET** `/api/complaints/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Complaint details

#### Update Complaint
- **PUT** `/api/complaints/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "title": "Updated title",
    "description": "Updated description",
    "priority": "high",
    "admin_notes": "Optional admin notes"
  }
  ```
- **Response:** Updated complaint

#### Update Complaint Status (Admin Only)
- **PUT** `/api/complaints/:id/status`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "resolved",
    "admin_notes": "Issue fixed"
  }
  ```
- **Response:** Updated complaint status

---

### Facilities & Bookings

#### Get Facilities
- **GET** `/api/facilities`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** List of facilities

#### Get Facility Bookings
- **GET** `/api/facilities/:id/bookings`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page`, `limit`, `status`, `date`
- **Response:** Paginated bookings

#### Create Booking
- **POST** `/api/facilities/:id/bookings`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "facility_id": "uuid",
    "booking_date": "2025-06-10",
    "start_time": "10:00",
    "end_time": "12:00",
    "purpose": "Meeting",
    "notes": "Optional notes"
  }
  ```
- **Response:**
  - `201 Created` on success
  - `409 Conflict` if time slot is taken

#### Get User Bookings
- **GET** `/api/facilities/bookings/my`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page`, `limit`, `status`
- **Response:** Paginated user bookings

#### Approve/Reject Booking (Admin Only)
- **PUT** `/api/facilities/bookings/:id/approve`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "approved",
    "admin_notes": "Approved for use"
  }
  ```
- **Response:** Updated booking

#### Cancel Booking
- **PUT** `/api/facilities/bookings/:id/cancel`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Cancelled booking

---

### Authentication
- All endpoints except `/api/auth/register` and `/api/auth/login` require a valid JWT in the `Authorization` header.
- Use the token from login/register responses for authenticated requests.

---

For more details, see the code or contact the maintainer.

## Database Schema

### Tables
- **users** - User accounts with role management
- **complaint_categories** - Predefined complaint types
- **complaints** - Complaint tickets with status tracking
- **facilities** - Available facilities and their settings
- **facility_bookings** - Booking records with approval workflow

### Key Features
- Row Level Security (RLS) for data isolation
- Automatic timestamp updates
- Comprehensive indexing for performance
- Foreign key constraints for data integrity

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure your Supabase credentials
   - Set JWT secret and other environment variables

3. **Database Setup**
   - Connect to Supabase using the "Connect to Supabase" button
   - The migration will automatically create all necessary tables

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```