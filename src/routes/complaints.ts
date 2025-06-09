import { Router } from 'express';
import { 
  getComplaints, 
  getComplaint, 
  createComplaint, 
  updateComplaint, 
  updateComplaintStatus,
  getComplaintCategories 
} from '../controllers/complaintController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { 
  validateRequest, 
  createComplaintSchema, 
  updateComplaintSchema, 
  updateComplaintStatusSchema 
} from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/complaints/categories
 * @desc Get all complaint categories
 * @access Private
 */
router.get('/categories', authenticateToken, getComplaintCategories);

/**
 * @route GET /api/complaints
 * @desc Get complaints (all for admin, own for users)
 * @access Private
 */
router.get('/', authenticateToken, getComplaints);

/**
 * @route POST /api/complaints
 * @desc Create a new complaint
 * @access Private
 */
router.post(
  '/', 
  authenticateToken, 
  uploadImage.single('image'),
  validateRequest(createComplaintSchema), 
  createComplaint
);

/**
 * @route GET /api/complaints/:id
 * @desc Get complaint by ID
 * @access Private
 */
router.get('/:id', authenticateToken, getComplaint);

/**
 * @route PUT /api/complaints/:id
 * @desc Update complaint
 * @access Private (owner or admin)
 */
router.put(
  '/:id', 
  authenticateToken, 
  validateRequest(updateComplaintSchema), 
  updateComplaint
);

/**
 * @route PUT /api/complaints/:id/status
 * @desc Update complaint status (admin only)
 * @access Private (admin)
 */
router.put(
  '/:id/status', 
  authenticateToken, 
  requireAdmin,
  validateRequest(updateComplaintStatusSchema), 
  updateComplaintStatus
);

export default router;