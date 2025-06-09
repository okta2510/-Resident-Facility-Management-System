import { Router } from 'express';
import { 
  getFacilities, 
  getFacilityBookings, 
  createBooking, 
  approveBooking,
  getUserBookings,
  cancelBooking
} from '../controllers/facilityController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { 
  validateRequest, 
  createBookingSchema, 
  approveBookingSchema 
} from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/facilities
 * @desc Get all active facilities
 * @access Private
 */
router.get('/', authenticateToken, getFacilities);

/**
 * @route GET /api/facilities/:id/bookings
 * @desc Get facility bookings
 * @access Private
 */
router.get('/:id/bookings', authenticateToken, getFacilityBookings);

/**
 * @route POST /api/facilities/:id/bookings
 * @desc Create a new booking for a facility
 * @access Private
 */
router.post(
  '/:id/bookings', 
  authenticateToken, 
  validateRequest(createBookingSchema), 
  createBooking
);

/**
 * @route GET /api/bookings/my
 * @desc Get current user's bookings
 * @access Private
 */
router.get('/bookings/my', authenticateToken, getUserBookings);

/**
 * @route PUT /api/bookings/:id/approve
 * @desc Approve or reject a booking (admin only)
 * @access Private (admin)
 */
router.put(
  '/bookings/:id/approve', 
  authenticateToken, 
  requireAdmin,
  validateRequest(approveBookingSchema), 
  approveBooking
);

/**
 * @route PUT /api/bookings/:id/cancel
 * @desc Cancel a booking
 * @access Private (owner or admin)
 */
router.put('/bookings/:id/cancel', authenticateToken, cancelBooking);

export default router;