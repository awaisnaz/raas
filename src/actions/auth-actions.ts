'use server';

import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { signIn, signOut as authSignOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loginSchema, registerSchema } from '@/lib/validations';

// Login action
export async function login(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validatedData = loginSchema.safeParse(rawData);

    if (!validatedData.success) {
      // Get the first field error with specific message
      const fieldErrors = validatedData.error.format();
      
      // Check for specific field errors and return detailed messages
      if (fieldErrors.email?._errors?.[0]) {
        return { error: `Email: ${fieldErrors.email._errors[0]}` };
      }
      if (fieldErrors.password?._errors?.[0]) {
        return { error: `Password: ${fieldErrors.password._errors[0]}` };
      }
      
      // Fallback to general error
      return { error: 'Invalid login data. Please check all fields.' };
    }

    // Attempt to sign in
    try {
      await signIn('credentials', {
        email: validatedData.data.email,
        password: validatedData.data.password,
        redirect: false,
      });

      return { success: true };
    } catch (error) {
      if ((error as Error).message.includes('CredentialsSignin')) {
        return { error: 'Invalid email or password' };
      }
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// Register action
export async function register(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validatedData = registerSchema.safeParse(rawData);

    if (!validatedData.success) {
      // Get the first field error with specific message
      const fieldErrors = validatedData.error.format();
      
      // Check for specific field errors and return detailed messages
      if (fieldErrors.name?._errors?.[0]) {
        return { error: `Name: ${fieldErrors.name._errors[0]}` };
      }
      if (fieldErrors.email?._errors?.[0]) {
        return { error: `Email: ${fieldErrors.email._errors[0]}` };
      }
      if (fieldErrors.password?._errors?.[0]) {
        return { error: `Password: ${fieldErrors.password._errors[0]}` };
      }
      if (fieldErrors.confirmPassword?._errors?.[0]) {
        return { error: `Confirm Password: ${fieldErrors.confirmPassword._errors[0]}` };
      }
      
      // Fallback to general error
      return { error: 'Invalid registration data. Please check all fields.' };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.data.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Hash password
    const hashedPassword = await hash(validatedData.data.password, 10);

    // Create user
    await prisma.user.create({
      data: {
        name: validatedData.data.name,
        email: validatedData.data.email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// Sign out action
export async function signOut() {
  await authSignOut();
  redirect('/login');
}