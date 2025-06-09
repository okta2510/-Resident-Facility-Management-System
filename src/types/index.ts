export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'resident';
  apartment_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: 'admin' | 'resident';
  apartment_number?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  image_url?: string;
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  category?: ComplaintCategory;
  user?: Omit<User, 'password_hash'>;
}

export interface CreateComplaintRequest {
  category_id: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateComplaintRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
}

export interface UpdateComplaintStatusRequest {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  requires_approval: boolean;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FacilityBooking {
  id: string;
  facility_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  purpose?: string;
  notes?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  facility?: Facility;
  user?: Omit<User, 'password_hash'>;
  approver?: Omit<User, 'password_hash'>;
}

export interface CreateBookingRequest {
  facility_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  notes?: string;
}

export interface ApproveBookingRequest {
  status: 'approved' | 'rejected';
  admin_notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}