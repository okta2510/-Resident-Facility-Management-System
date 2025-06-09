import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { supabase } from '../config/database';
import { CreateUserRequest, LoginRequest, ApiResponse, AuthResponse } from '../types';

export const register = async (req: Request<{}, ApiResponse<AuthResponse>, CreateUserRequest>, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone, role = 'resident', apartment_number } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role,
        apartment_number
      })
      .select('id, email, first_name, last_name, phone, role, apartment_number, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN as any || '7d'
    };

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      signOptions
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const login = async (req: Request<{}, ApiResponse<AuthResponse>, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN as any || '7d'
    };

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      signOptions
    );

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    res.json({
      success: true,
      data: req.user,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};