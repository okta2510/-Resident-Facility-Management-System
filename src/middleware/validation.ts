import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().min(2).required(),
  last_name: Joi.string().min(2).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'resident').default('resident'),
  apartment_number: Joi.string().optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const createComplaintSchema = Joi.object({
  category_id: Joi.string().uuid().required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

export const updateComplaintSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  admin_notes: Joi.string().max(1000).optional()
});

export const updateComplaintStatusSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
  admin_notes: Joi.string().max(1000).optional()
});

export const createBookingSchema = Joi.object({
  facility_id: Joi.string().uuid().required(),
  booking_date: Joi.date().iso().min('now').required(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  purpose: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional()
});

export const approveBookingSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  admin_notes: Joi.string().max(1000).optional()
});