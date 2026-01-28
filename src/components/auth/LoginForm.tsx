'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { OTPInput } from './OTPInput';
import { FormError } from '@/components/ui/form-error';
import { FormSuccess } from '@/components/ui/form-success';
import { ButtonLoader } from '@/components/ui/loading';
import { 
  usernamePasswordLoginSchema, 
  otpRequestSchema, 
  otpVerifySchema 
} from '@/schemas/auth.schema';
import { z } from 'zod';

interface LoginFormProps {
  onCredentialLogin?: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  onOTPRequest?: (mobileNumber: string) => Promise<void>;
  onOTPVerify?: (mobileNumber: string, code: string, rememberMe: boolean) => Promise<void>;
  onSuccess?: () => void;
  showRememberMe?: boolean;
}

type LoginMethod = 'credentials' | 'otp';

/**
 * Login Form Component
 * Requirements: 2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3
 * 
 * Features:
 * - Tab switching between credential and OTP login
 * - Form validation using Zod schemas
 * - Error display for validation and API errors
 * - Two-step OTP flow (request -> verify)
 * - Remember me functionality for persistent sessions
 * - Keyboard navigation support (Enter key handling)
 * - Success callback for post-login actions
 * - Improved error messages with retry suggestions
 */
export function LoginForm({ 
  onCredentialLogin, 
  onOTPRequest, 
  onOTPVerify,
  onSuccess,
  showRememberMe = true
}: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<LoginMethod>('credentials');
  
  // Credential login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialSuccess, setCredentialSuccess] = useState(false);
  
  // OTP login state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRememberMe, setOtpRememberMe] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpSuccess, setOtpSuccess] = useState(false);
  
  // Network error retry state
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);

  // Handle credential login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialErrors({});
    setCredentialSuccess(false);
    setLastFailedAction(null);
    
    try {
      // Validate input
      usernamePasswordLoginSchema.parse({ username, password });
      
      setCredentialLoading(true);
      await onCredentialLogin?.(username, password, rememberMe);
      
      // Show success feedback before redirect
      setCredentialSuccess(true);
      
      // Clear form on success
      setUsername('');
      setPassword('');
      setRememberMe(false);
      
      // Call success callback if provided (after a brief delay to show success message)
      setTimeout(() => {
        onSuccess?.();
      }, 800);
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
        // Improved error messages with retry suggestions
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
          setCredentialErrors({ 
            general: 'Invalid username or password. Please check your credentials and try again.' 
          });
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
          setCredentialErrors({ 
            general: 'Connection error. Please check your internet connection and try again.' 
          });
          // Store the action for retry
          setLastFailedAction(() => () => handleCredentialLogin(e));
        } else {
          setCredentialErrors({ general: error.message });
        }
      }
    } finally {
      setCredentialLoading(false);
    }
  };

  // Handle OTP request
  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrors({});
    setLastFailedAction(null);
    
    try {
      // Validate mobile number
      otpRequestSchema.parse({ mobileNumber });
      
      setOtpLoading(true);
      
      if (onOTPRequest) {
        await onOTPRequest(mobileNumber);
      }
      
      // Set otpSent to true after successful request
      setOtpSent(true);
      setOtpAttempts(0);
    } catch (error) {
      console.error('OTP request error:', error);
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setOtpErrors(errors);
      } else if (error instanceof Error) {
        // Improved error messages
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
          setOtpErrors({ 
            general: 'Connection error. Please check your internet connection and try again.' 
          });
          // Store the action for retry
          setLastFailedAction(() => () => handleOTPRequest(e));
        } else {
          setOtpErrors({ general: error.message });
        }
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrors({});
    setOtpSuccess(false);
    setLastFailedAction(null);
    
    try {
      // Validate OTP code
      otpVerifySchema.parse({ mobileNumber, code: otpCode });
      
      setOtpLoading(true);
      await onOTPVerify?.(mobileNumber, otpCode, otpRememberMe);
      
      // Show success feedback before redirect
      setOtpSuccess(true);
      
      // Clear form on success
      setMobileNumber('');
      setOtpCode('');
      setOtpRememberMe(false);
      setOtpSent(false);
      setOtpAttempts(0);
      
      // Call success callback if provided (after a brief delay to show success message)
      setTimeout(() => {
        onSuccess?.();
      }, 800);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setOtpErrors(errors);
      } else if (error instanceof Error) {
        // Track OTP attempts and provide helpful error messages
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('invalid') || errorMessage.includes('incorrect') || errorMessage.includes('expired')) {
          if (newAttempts >= 3) {
            setOtpErrors({ 
              general: 'Invalid or expired code. Please request a new code.' 
            });
          } else {
            setOtpErrors({ 
              general: `Invalid or expired code. Please try again or request a new code. (Attempt ${newAttempts}/3)` 
            });
          }
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
          setOtpErrors({ 
            general: 'Connection error. Please check your internet connection and try again.' 
          });
          // Store the action for retry
          setLastFailedAction(() => () => handleOTPVerify(e));
        } else {
          setOtpErrors({ general: error.message });
        }
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Reset OTP flow
  const handleResetOTP = () => {
    setOtpSent(false);
    setOtpCode('');
    setOtpErrors({});
    setOtpAttempts(0);
    setOtpSuccess(false);
    setLastFailedAction(null);
  };

  // Retry last failed action
  const handleRetry = async () => {
    if (lastFailedAction) {
      await lastFailedAction();
    }
  };

  // Reset OTP state when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginMethod);
    if (value === 'credentials') {
      // Reset OTP state when switching away from OTP tab
      setOtpSent(false);
      setOtpCode('');
      setOtpErrors({});
      setOtpAttempts(0);
      setOtpSuccess(false);
    } else {
      // Reset credential state when switching away from credentials tab
      setCredentialSuccess(false);
    }
    // Clear retry action when switching tabs
    setLastFailedAction(null);
  };

  // Handle keyboard navigation - Enter key
  const handleKeyDown = (e: React.KeyboardEvent, submitHandler: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitHandler();
    } else if (e.key === 'Escape') {
      // Clear errors on Escape
      if (activeTab === 'credentials') {
        setCredentialErrors({});
      } else {
        setOtpErrors({});
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl">Login</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Choose your preferred login method
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-10" aria-label="Login methods">
            <TabsTrigger 
              value="credentials" 
              className="text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              Credentials
            </TabsTrigger>
            <TabsTrigger 
              value="otp" 
              className="text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              OTP
            </TabsTrigger>
          </TabsList>
          
          {/* Credential Login Tab */}
          <TabsContent value="credentials">
            <form onSubmit={handleCredentialLogin} className="space-y-4 pt-4">
              {/* Success Message */}
              {credentialSuccess && (
                <FormSuccess role="alert" aria-live="polite">
                  Login successful! Redirecting...
                </FormSuccess>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
                <Input
                  id="username"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleCredentialLogin(e as React.FormEvent))}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.username ? 'border-destructive' : ''}`}
                  autoFocus
                  aria-label="Username"
                  aria-invalid={!!credentialErrors.username}
                  aria-describedby={credentialErrors.username ? 'username-error' : undefined}
                  aria-required="true"
                />
                {credentialErrors.username && (
                  <FormError id="username-error" role="alert">{credentialErrors.username}</FormError>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleCredentialLogin(e as React.FormEvent))}
                  disabled={credentialLoading || credentialSuccess}
                  className={`min-h-[44px] text-base ${credentialErrors.password ? 'border-destructive' : ''}`}
                  aria-label="Password"
                  aria-invalid={!!credentialErrors.password}
                  aria-describedby={credentialErrors.password ? 'password-error' : undefined}
                  aria-required="true"
                />
                {credentialErrors.password && (
                  <FormError id="password-error" role="alert">{credentialErrors.password}</FormError>
                )}
              </div>
              
              {showRememberMe && (
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={credentialLoading || credentialSuccess}
                    className="min-h-[24px] min-w-[24px]"
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm sm:text-base font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </Label>
                </div>
              )}
              
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
                  {credentialLoading ? 'Logging in...' : credentialSuccess ? 'Success!' : 'Login'}
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
          
          {/* OTP Login Tab */}
          <TabsContent value="otp">
            {!otpSent ? (
              <form onSubmit={handleOTPRequest} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-sm sm:text-base">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+1234567890"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleOTPRequest(e as React.FormEvent))}
                    disabled={otpLoading}
                    className={`min-h-[44px] text-base ${otpErrors.mobileNumber ? 'border-destructive' : ''}`}
                    autoFocus
                    aria-label="Mobile Number"
                    aria-invalid={!!otpErrors.mobileNumber}
                    aria-describedby={otpErrors.mobileNumber ? 'mobile-error' : 'mobile-hint'}
                    aria-required="true"
                  />
                  <p id="mobile-hint" className="text-xs text-muted-foreground">
                    Enter your mobile number in E.164 format (e.g., +1234567890)
                  </p>
                  {otpErrors.mobileNumber && (
                    <FormError id="mobile-error" role="alert">{otpErrors.mobileNumber}</FormError>
                  )}
                </div>
                
                {otpErrors.general && (
                  <FormError role="alert" aria-live="polite">{otpErrors.general}</FormError>
                )}
                
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full min-h-[44px] text-base"
                    disabled={otpLoading}
                  >
                    {otpLoading && <ButtonLoader />}
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                  
                  {/* Retry button for network errors */}
                  {lastFailedAction && activeTab === 'otp' && !otpSent && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full min-h-[44px] text-base"
                      onClick={handleRetry}
                      disabled={otpLoading}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} className="space-y-4 pt-4">
                {/* Success Message */}
                {otpSuccess && (
                  <FormSuccess role="alert" aria-live="polite">
                    Login successful! Redirecting...
                  </FormSuccess>
                )}
                
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Enter OTP Code</Label>
                  <p id="otp-hint" className="text-xs sm:text-sm text-muted-foreground">
                    Enter the 6-digit code sent to {mobileNumber}
                  </p>
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={otpLoading || otpSuccess}
                    error={!!otpErrors.code}
                    ariaDescribedBy={otpErrors.code ? 'otp-error' : 'otp-hint'}
                  />
                  {otpErrors.code && (
                    <FormError id="otp-error" className="text-center" role="alert">{otpErrors.code}</FormError>
                  )}
                </div>
                
                {showRememberMe && (
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="otpRememberMe"
                      checked={otpRememberMe}
                      onCheckedChange={(checked) => setOtpRememberMe(checked === true)}
                      disabled={otpLoading || otpSuccess}
                      className="min-h-[24px] min-w-[24px]"
                    />
                    <Label 
                      htmlFor="otpRememberMe" 
                      className="text-sm sm:text-base font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </Label>
                  </div>
                )}
                
                {otpErrors.general && (
                  <FormError role="alert" aria-live="polite">{otpErrors.general}</FormError>
                )}
                
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full min-h-[44px] text-base"
                    disabled={otpLoading || otpCode.length !== 6 || otpSuccess}
                  >
                    {otpLoading && <ButtonLoader />}
                    {otpLoading ? 'Verifying...' : otpSuccess ? 'Success!' : 'Verify OTP'}
                  </Button>
                  
                  {/* Retry button for network errors */}
                  {lastFailedAction && activeTab === 'otp' && otpSent && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full min-h-[44px] text-base"
                      onClick={handleRetry}
                      disabled={otpLoading}
                    >
                      Retry
                    </Button>
                  )}
                  
                  <Button 
                    type="button"
                    variant="ghost"
                    className="w-full min-h-[44px] text-base"
                    onClick={handleResetOTP}
                    disabled={otpLoading || otpSuccess}
                  >
                    Use different number
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
