import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateBookingRequest, ApproveBookingRequest, ApiResponse, Facility, FacilityBooking, PaginatedResponse } from '../types';

export const getFacilities = async (req: Request, res: Response) => {
  try {
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Get facilities error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch facilities'
      });
    }

    res.json({
      success: true,
      data: facilities,
      message: 'Facilities retrieved successfully'
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getFacilityBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { id: facilityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const date = req.query.date as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('facility_bookings')
      .select(`
        *,
        facility:facilities(*),
        user:users(id, first_name, last_name, email, apartment_number),
        approver:users!facility_bookings_approved_by_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('facility_id', facilityId)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    // If not admin, only show approved bookings and user's own bookings
    if (req.user?.role !== 'admin') {
      query = query.or(`status.eq.approved,user_id.eq.${req.user?.id}`);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('booking_date', date);
    }

    // Get paginated data and total count
    const { data: bookings, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get facility bookings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch facility bookings'
      });
    }

    const response: ApiResponse<PaginatedResponse<FacilityBooking>> = {
      success: true,
      data: {
        data: bookings || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get facility bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { facility_id, booking_date, start_time, end_time, purpose, notes } = req.body as CreateBookingRequest;

    // Check if facility exists and is active
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facility_id)
      .eq('is_active', true)
      .single();

    if (facilityError || !facility) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found or inactive'
      });
    }

    // Check if the booking time is within operating hours
    if (start_time < facility.operating_hours_start || end_time > facility.operating_hours_end) {
      return res.status(400).json({
        success: false,
        error: `Facility is only available between ${facility.operating_hours_start} and ${facility.operating_hours_end}`
      });
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('facility_bookings')
      .select('id')
      .eq('facility_id', facility_id)
      .eq('booking_date', booking_date)
      .in('status', ['approved', 'pending'])
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`);

    if (conflictError) {
      console.error('Conflict check error:', conflictError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check for booking conflicts'
      });
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Time slot is already booked or pending approval'
      });
    }

    // Set initial status based on facility requirements
    const initialStatus = facility.requires_approval ? 'pending' : 'approved';

    const { data: booking, error } = await supabase
      .from('facility_bookings')
      .insert({
        facility_id,
        user_id: req.user?.id,
        booking_date,
        start_time,
        end_time,
        purpose,
        notes,
        status: initialStatus,
        ...(initialStatus === 'approved' && {
          approved_by: req.user?.id,
          approved_at: new Date().toISOString()
        })
      })
      .select(`
        *,
        facility:facilities(*),
        user:users(id, first_name, last_name, email, apartment_number),
        approver:users!facility_bookings_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Create booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking'
      });
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: facility.requires_approval 
        ? 'Booking submitted for approval' 
        : 'Booking confirmed successfully'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const approveBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body as ApproveBookingRequest;

    // Only admins can approve bookings
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const updateData: any = {
      status,
      admin_notes,
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    };

    const { data: booking, error } = await supabase
      .from('facility_bookings')
      .update(updateData)
      .eq('id', id)
      .eq('status', 'pending') // Only pending bookings can be approved/rejected
      .select(`
        *,
        facility:facilities(*),
        user:users(id, first_name, last_name, email, apartment_number),
        approver:users!facility_bookings_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Approve booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status'
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not pending approval'
      });
    }

    res.json({
      success: true,
      data: booking,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('facility_bookings')
      .select(`
        *,
        facility:facilities(*),
        user:users(id, first_name, last_name, email, apartment_number),
        approver:users!facility_bookings_approved_by_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('user_id', req.user?.id)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Get paginated data and total count
    const { data: bookings, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get user bookings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user bookings'
      });
    }

    const response: ApiResponse<PaginatedResponse<FacilityBooking>> = {
      success: true,
      data: {
        data: bookings || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if booking exists and user has permission
    const { data: existingBooking, error: fetchError } = await supabase
      .from('facility_bookings')
      .select('user_id, status, booking_date, start_time')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check permissions - only booking owner or admin can cancel
    if (req.user?.role !== 'admin' && existingBooking.user_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if booking can be cancelled
    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled'
      });
    }

    // Check if booking is in the past
    const bookingDateTime = new Date(`${existingBooking.booking_date}T${existingBooking.start_time}`);
    if (bookingDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel past bookings'
      });
    }

    const { data: booking, error } = await supabase
      .from('facility_bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select(`
        *,
        facility:facilities(*),
        user:users(id, first_name, last_name, email, apartment_number),
        approver:users!facility_bookings_approved_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Cancel booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel booking'
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};