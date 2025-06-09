import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateComplaintRequest, UpdateComplaintRequest, UpdateComplaintStatusRequest, ApiResponse, Complaint, PaginatedResponse } from '../types';

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('complaints')
      .select(`
        *,
        category:complaint_categories(*),
        user:users(id, first_name, last_name, email, apartment_number)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // If not admin, only show user's own complaints
    if (req.user?.role !== 'admin') {
      query = query.eq('user_id', req.user?.id);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Get paginated data and total count
    const { data: complaints, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get complaints error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaints'
      });
    }

    const response: ApiResponse<PaginatedResponse<Complaint>> = {
      success: true,
      data: {
        data: complaints || [],
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
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('complaints')
      .select(`
        *,
        category:complaint_categories(*),
        user:users(id, first_name, last_name, email, apartment_number)
      `)
      .eq('id', id);

    // If not admin, only show user's own complaint
    if (req.user?.role !== 'admin') {
      query = query.eq('user_id', req.user?.id);
    }

    const { data: complaint, error } = await query.single();

    if (error || !complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved successfully'
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, title, description, priority = 'medium' } = req.body as CreateComplaintRequest;
    
    let image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        user_id: req.user?.id,
        category_id,
        title,
        description,
        priority,
        image_url
      })
      .select(`
        *,
        category:complaint_categories(*),
        user:users(id, first_name, last_name, email, apartment_number)
      `)
      .single();

    if (error) {
      console.error('Create complaint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create complaint'
      });
    }

    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateComplaintRequest;

    // Check if complaint exists and user has permission
    const { data: existingComplaint, error: fetchError } = await supabase
      .from('complaints')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingComplaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Check permissions
    if (req.user?.role !== 'admin' && existingComplaint.user_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:complaint_categories(*),
        user:users(id, first_name, last_name, email, apartment_number)
      `)
      .single();

    if (error) {
      console.error('Update complaint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update complaint'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body as UpdateComplaintStatusRequest;

    // Only admins can update status
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const updateData: any = { status };
    
    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }
    
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:complaint_categories(*),
        user:users(id, first_name, last_name, email, apartment_number)
      `)
      .single();

    if (error) {
      console.error('Update complaint status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update complaint status'
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint status updated successfully'
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getComplaintCategories = async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabase
      .from('complaint_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Get complaint categories error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaint categories'
      });
    }

    res.json({
      success: true,
      data: categories,
      message: 'Complaint categories retrieved successfully'
    });
  } catch (error) {
    console.error('Get complaint categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};