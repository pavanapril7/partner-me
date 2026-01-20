'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OTPInput } from './OTPInput';
import { 
  usernamePasswordLoginSchema, 
  otpRequestSchema, 
  otpVerifySchema 
} from '@/schemas/auth.schema';
import { z } from 'zod';

interface LoginFormProps {
  onCredentialLogin?: (username: string, password: string) => Promise<void>;
  onOTPRequest?: (mobileNumber: string) => Promise<void>;
  onOTPVerify?: (mobileNumber: string, code: string) => Promise<void>;
}

type LoginMethod = 'credentials' | 'otp';

/**
 * Login Form Component
 * Requirements: 2.1, 2.2, 3.1, 4.1, 5.2
 * 
 * Features:
 * - Tab switching between credential and OTP login
 * - Form validation using Zod schemas
 * - Error display for validation and API errors
 * - Two-step OTP flow (request -> verify)
 */
export function LoginForm({ 
  onCredentialLogin, 
  onOTPRequest, 
  onOTPVerify 
}: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<LoginMethod>('credentials');
  
  // Credential login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [credentialLoading, setCredentialLoading] = useState(false);
  
  // OTP login state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [otpLoading, setOtpLoading] = useState(false);

  // Handle credential login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialErrors({});
    
    try {
      // Validate input
      usernamePasswordLoginSchema.parse({ username, password });
      
      setCredentialLoading(true);
      await onCredentialLogin?.(username, password);
      
      // Clear form on success
      setUsername('');
      setPassword('');
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
        setCredentialErrors({ general: error.message });
      }
    } finally {
      setCredentialLoading(false);
    }
  };

  // Handle OTP request
  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrors({});
    
    try {
      // Validate mobile number
      otpRequestSchema.parse({ mobileNumber });
      
      setOtpLoading(true);
      
      if (onOTPRequest) {
        await onOTPRequest(mobileNumber);
      }
      
      // Set otpSent to true after successful request
      setOtpSent(true);
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
        setOtpErrors({ general: error.message });
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrors({});
    
    try {
      // Validate OTP code
      otpVerifySchema.parse({ mobileNumber, code: otpCode });
      
      setOtpLoading(true);
      await onOTPVerify?.(mobileNumber, otpCode);
      
      // Clear form on success
      setMobileNumber('');
      setOtpCode('');
      setOtpSent(false);
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
        setOtpErrors({ general: error.message });
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
  };

  // Reset OTP state when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginMethod);
    if (value === 'credentials') {
      // Reset OTP state when switching away from OTP tab
      setOtpSent(false);
      setOtpCode('');
      setOtpErrors({});
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Choose your preferred login method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="otp">OTP</TabsTrigger>
          </TabsList>
          
          {/* Credential Login Tab */}
          <TabsContent value="credentials">
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={credentialLoading}
                  className={credentialErrors.username ? 'border-destructive' : ''}
                />
                {credentialErrors.username && (
                  <p className="text-sm text-destructive">{credentialErrors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={credentialLoading}
                  className={credentialErrors.password ? 'border-destructive' : ''}
                />
                {credentialErrors.password && (
                  <p className="text-sm text-destructive">{credentialErrors.password}</p>
                )}
              </div>
              
              {credentialErrors.general && (
                <p className="text-sm text-destructive">{credentialErrors.general}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={credentialLoading}
              >
                {credentialLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>
          
          {/* OTP Login Tab */}
          <TabsContent value="otp">
            {!otpSent ? (
              <form onSubmit={handleOTPRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="+1234567890"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    disabled={otpLoading}
                    className={otpErrors.mobileNumber ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your mobile number in E.164 format (e.g., +1234567890)
                  </p>
                  {otpErrors.mobileNumber && (
                    <p className="text-sm text-destructive">{otpErrors.mobileNumber}</p>
                  )}
                </div>
                
                {otpErrors.general && (
                  <p className="text-sm text-destructive">{otpErrors.general}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={otpLoading}
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter OTP Code</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to {mobileNumber}
                  </p>
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={otpLoading}
                    error={!!otpErrors.code}
                  />
                  {otpErrors.code && (
                    <p className="text-sm text-destructive text-center">{otpErrors.code}</p>
                  )}
                </div>
                
                {otpErrors.general && (
                  <p className="text-sm text-destructive">{otpErrors.general}</p>
                )}
                
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleResetOTP}
                    disabled={otpLoading}
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
