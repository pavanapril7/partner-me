'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormSuccess } from '@/components/ui/form-success';
import { ButtonLoader } from '@/components/ui/loading';
import { 
  usernamePasswordRegistrationSchema, 
  mobileRegistrationSchema 
} from '@/schemas/auth.schema';
import { z } from 'zod';

interface RegistrationFormProps {
  onCredentialRegister?: (username: string, password: string, email?: string) => Promise<void>;
  onMobileRegister?: (mobileNumber: string) => Promise<void>;
  onSuccess?: () => void;
  showTerms?: boolean;
}

type RegistrationMethod = 'credentials' | 'mobile';

// Email validation schema (optional field)
const emailSchema = z.string().email('Invalid email address').optional().or(z.literal(''));

/**
 * Registration Form Component
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2, 5.4
 * 
 * Features:
 * - Tab switching between credential and mobile registration
 * - Form validation using Zod schemas
 * - Error display for validation and API errors
 * - Password confirmation field
 * - Optional email field for credential registration
 * - Success callback for post-registration actions
 * - Improved validation feedback and error messages
 * - Keyboard navigation support (Enter key handling)
 */
export function RegistrationForm({ 
  onCredentialRegister, 
  onMobileRegister,
  onSuccess,
  showTerms = false
}: RegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<RegistrationMethod>('credentials');
  
  // Credential registration state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialSuccess, setCredentialSuccess] = useState(false);
  
  // Mobile registration state
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileErrors, setMobileErrors] = useState<Record<string, string>>({});
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileSuccess, setMobileSuccess] = useState(false);
  
  // Network error retry state
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);

  // Refs for keyboard navigation
  const usernameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input when tab changes
  useEffect(() => {
    if (activeTab === 'credentials') {
      usernameRef.current?.focus();
    } else {
      mobileRef.current?.focus();
    }
  }, [activeTab]);

  // Handle credential registration
  const handleCredentialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialErrors({});
    setCredentialSuccess(false);
    setLastFailedAction(null);
    
    // Check password confirmation
    if (password !== confirmPassword) {
      setCredentialErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    try {
      // Validate username and password
      usernamePasswordRegistrationSchema.parse({ username, password });
      
      // Validate email if provided
      if (email) {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          setCredentialErrors({ email: 'Invalid email address' });
          return;
        }
      }
      
      setCredentialLoading(true);
      await onCredentialRegister?.(username, password, email || undefined);
      
      // Show success state
      setCredentialSuccess(true);
      
      // Clear form on success
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Call success callback (after a brief delay to show success message)
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setCredentialErrors(errors);
      } else if (error instanceof Error) {
        // Improved error messages with specific handling
        const errorMessage = error.message;
        if (errorMessage.includes('username') && errorMessage.includes('already')) {
          setCredentialErrors({ 
            username: 'This username is already taken. Please choose a different one.' 
          });
        } else if (errorMessage.includes('email') && errorMessage.includes('already')) {
          setCredentialErrors({ 
            email: 'This email is already registered. Please use a different one or try logging in.' 
          });
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch') || errorMessage.toLowerCase().includes('connection')) {
          setCredentialErrors({ 
            general: 'Connection error. Please check your internet connection and try again.' 
          });
          // Store the action for retry
          setLastFailedAction(() => () => handleCredentialRegister(e));
        } else {
          setCredentialErrors({ 
            general: errorMessage || 'Registration failed. Please try again.' 
          });
        }
      }
    } finally {
      setCredentialLoading(false);
    }
  };

  // Handle mobile registration
  const handleMobileRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileErrors({});
    setMobileSuccess(false);
    setLastFailedAction(null);
    
    try {
      // Validate mobile number
      mobileRegistrationSchema.parse({ mobileNumber });
      
      setMobileLoading(true);
      await onMobileRegister?.(mobileNumber);
      
      // Show success state
      setMobileSuccess(true);
      
      // Clear form on success
      setMobileNumber('');
      
      // Call success callback (after a brief delay to show success message)
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setMobileErrors(errors);
      } else if (error instanceof Error) {
        // Improved error messages with specific handling
        const errorMessage = error.message;
        if (errorMessage.includes('mobile') && errorMessage.includes('already')) {
          setMobileErrors({ 
            mobileNumber: 'This mobile number is already registered. Please use a different one or try logging in.' 
          });
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch') || errorMessage.toLowerCase().includes('connection')) {
          setMobileErrors({ 
            general: 'Connection error. Please check your internet connection and try again.' 
          });
          // Store the action for retry
          setLastFailedAction(() => () => handleMobileRegister(e));
        } else {
          setMobileErrors({ 
            general: errorMessage || 'Registration failed. Please try again.' 
          });
        }
      }
    } finally {
      setMobileLoading(false);
    }
  };

  // Retry last failed action
  const handleRetry = async () => {
    if (lastFailedAction) {
      await lastFailedAction();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, formType: 'credential' | 'mobile') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formType === 'credential') {
        handleCredentialRegister(e as unknown as React.FormEvent);
      } else {
        handleMobileRegister(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Escape') {
      // Clear errors on Escape
      if (formType === 'credential') {
        setCredentialErrors({});
      } else {
        setMobileErrors({});
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl">Register</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Create an account using your preferred method
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RegistrationMethod)}>
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-10" aria-label="Registration methods">
            <TabsTrigger 
              value="credentials" 
              className="text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              Credentials
            </TabsTrigger>
            <TabsTrigger 
              value="mobile" 
              className="text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              Mobile
            </TabsTrigger>
          </TabsList>
          
          {/* Credential Registration Tab */}
          <TabsContent value="credentials">
            <form onSubmit={handleCredentialRegister} className="space-y-4 pt-4">
              {credentialSuccess && (
                <FormSuccess role="alert" aria-live="polite">
                  Registration successful! You can now log in with your credentials.
                </FormSuccess>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="reg-username" className="text-sm sm:text-base">Username</Label>
                <Input
                  ref={usernameRef}
                  id="reg-username"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'credential')}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.username ? 'border-destructive' : ''}`}
                  aria-invalid={!!credentialErrors.username}
                  aria-describedby={credentialErrors.username ? 'username-error' : 'username-hint'}
                />
                <p id="username-hint" className="text-xs text-muted-foreground">
                  3-30 characters, letters, numbers, and underscores only
                </p>
                {credentialErrors.username && (
                  <FormError id="username-error">{credentialErrors.username}</FormError>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm sm:text-base">Email (optional)</Label>
                <Input
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'credential')}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.email ? 'border-destructive' : ''}`}
                  aria-invalid={!!credentialErrors.email}
                  aria-describedby={credentialErrors.email ? 'email-error' : 'email-hint'}
                  placeholder="your.email@example.com"
                />
                <p id="email-hint" className="text-xs text-muted-foreground">
                  Optional: Add an email for account recovery
                </p>
                {credentialErrors.email && (
                  <FormError id="email-error">{credentialErrors.email}</FormError>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm sm:text-base">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'credential')}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.password ? 'border-destructive' : ''}`}
                  aria-invalid={!!credentialErrors.password}
                  aria-describedby={credentialErrors.password ? 'password-error' : 'password-hint'}
                />
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
                {credentialErrors.password && (
                  <FormError id="password-error">{credentialErrors.password}</FormError>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password" className="text-sm sm:text-base">Confirm Password</Label>
                <Input
                  id="reg-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'credential')}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.confirmPassword ? 'border-destructive' : ''}`}
                  aria-invalid={!!credentialErrors.confirmPassword}
                  aria-describedby={credentialErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {credentialErrors.confirmPassword && (
                  <FormError id="confirm-password-error">{credentialErrors.confirmPassword}</FormError>
                )}
              </div>
              
              {credentialErrors.general && (
                <FormError role="alert" aria-live="polite">{credentialErrors.general}</FormError>
              )}
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px] text-base"
                  disabled={credentialLoading || credentialSuccess}
                >
                  {credentialLoading && <ButtonLoader />}
                  {credentialLoading ? 'Registering...' : credentialSuccess ? 'Success!' : 'Register'}
                </Button>
                
                {/* Retry button for network errors */}
                {lastFailedAction && activeTab === 'credentials' && (
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full min-h-[44px] text-base"
                    onClick={handleRetry}
                    disabled={credentialLoading}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
          
          {/* Mobile Registration Tab */}
          <TabsContent value="mobile">
            <form onSubmit={handleMobileRegister} className="space-y-4 pt-4">
              {mobileSuccess && (
                <FormSuccess role="alert" aria-live="polite">
                  Registration successful! You can now log in with your mobile number.
                </FormSuccess>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="reg-mobile" className="text-sm sm:text-base">Mobile Number</Label>
                <Input
                  ref={mobileRef}
                  id="reg-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+1234567890"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'mobile')}
                  disabled={mobileLoading || mobileSuccess}
                  className={`min-h-[44px] text-base ${mobileErrors.mobileNumber ? 'border-destructive' : ''}`}
                  aria-invalid={!!mobileErrors.mobileNumber}
                  aria-describedby={mobileErrors.mobileNumber ? 'mobile-error' : 'mobile-hint'}
                />
                <p id="mobile-hint" className="text-xs text-muted-foreground">
                  Enter your mobile number in E.164 format (e.g., +1234567890)
                </p>
                {mobileErrors.mobileNumber && (
                  <FormError id="mobile-error">{mobileErrors.mobileNumber}</FormError>
                )}
              </div>
              
              {mobileErrors.general && (
                <FormError role="alert" aria-live="polite">{mobileErrors.general}</FormError>
              )}
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px] text-base"
                  disabled={mobileLoading || mobileSuccess}
                >
                  {mobileLoading && <ButtonLoader />}
                  {mobileLoading ? 'Registering...' : mobileSuccess ? 'Success!' : 'Register'}
                </Button>
                
                {/* Retry button for network errors */}
                {lastFailedAction && activeTab === 'mobile' && (
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full min-h-[44px] text-base"
                    onClick={handleRetry}
                    disabled={mobileLoading}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
