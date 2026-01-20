'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  usernamePasswordRegistrationSchema, 
  mobileRegistrationSchema 
} from '@/schemas/auth.schema';
import { z } from 'zod';

interface RegistrationFormProps {
  onCredentialRegister?: (username: string, password: string) => Promise<void>;
  onMobileRegister?: (mobileNumber: string) => Promise<void>;
}

type RegistrationMethod = 'credentials' | 'mobile';

/**
 * Registration Form Component
 * Requirements: 1.1, 2.1, 2.2
 * 
 * Features:
 * - Tab switching between credential and mobile registration
 * - Form validation using Zod schemas
 * - Error display for validation and API errors
 * - Password confirmation field
 */
export function RegistrationForm({ 
  onCredentialRegister, 
  onMobileRegister 
}: RegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<RegistrationMethod>('credentials');
  
  // Credential registration state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [credentialLoading, setCredentialLoading] = useState(false);
  
  // Mobile registration state
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileErrors, setMobileErrors] = useState<Record<string, string>>({});
  const [mobileLoading, setMobileLoading] = useState(false);

  // Handle credential registration
  const handleCredentialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialErrors({});
    
    // Check password confirmation
    if (password !== confirmPassword) {
      setCredentialErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    try {
      // Validate input
      usernamePasswordRegistrationSchema.parse({ username, password });
      
      setCredentialLoading(true);
      await onCredentialRegister?.(username, password);
      
      // Clear form on success
      setUsername('');
      setPassword('');
      setConfirmPassword('');
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

  // Handle mobile registration
  const handleMobileRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileErrors({});
    
    try {
      // Validate mobile number
      mobileRegistrationSchema.parse({ mobileNumber });
      
      setMobileLoading(true);
      await onMobileRegister?.(mobileNumber);
      
      // Clear form on success
      setMobileNumber('');
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
        setMobileErrors({ general: error.message });
      }
    } finally {
      setMobileLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create an account using your preferred method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RegistrationMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
          
          {/* Credential Registration Tab */}
          <TabsContent value="credentials">
            <form onSubmit={handleCredentialRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={credentialLoading}
                  className={credentialErrors.username ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  3-30 characters, letters, numbers, and underscores only
                </p>
                {credentialErrors.username && (
                  <p className="text-sm text-destructive">{credentialErrors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={credentialLoading}
                  className={credentialErrors.password ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
                {credentialErrors.password && (
                  <p className="text-sm text-destructive">{credentialErrors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                <Input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={credentialLoading}
                  className={credentialErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {credentialErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{credentialErrors.confirmPassword}</p>
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
                {credentialLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </TabsContent>
          
          {/* Mobile Registration Tab */}
          <TabsContent value="mobile">
            <form onSubmit={handleMobileRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-mobile">Mobile Number</Label>
                <Input
                  id="reg-mobile"
                  type="tel"
                  placeholder="+1234567890"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={mobileLoading}
                  className={mobileErrors.mobileNumber ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your mobile number in E.164 format (e.g., +1234567890)
                </p>
                {mobileErrors.mobileNumber && (
                  <p className="text-sm text-destructive">{mobileErrors.mobileNumber}</p>
                )}
              </div>
              
              {mobileErrors.general && (
                <p className="text-sm text-destructive">{mobileErrors.general}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={mobileLoading}
              >
                {mobileLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
