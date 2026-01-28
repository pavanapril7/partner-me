# Implementation Plan

- [x] 1. Create authentication utility functions
  - Create `src/lib/auth-utils.ts` with redirect URL handling, intended destination storage, and admin route checking
  - Implement functions for URL parameter parsing and localStorage management
  - _Requirements: 4.2, 4.3, 4.4, 8.2_

- [ ]* 1.1 Write property test for redirect URL preservation
  - **Property 1: Authentication redirect preservation**
  - **Validates: Requirements 4.2, 4.3**

- [x] 2. Enhance AuthContext with remember me functionality
  - Add remember me support to login method in `src/contexts/AuthContext.tsx`
  - Implement session persistence logic based on remember me flag
  - Update localStorage handling to support persistent vs session storage
  - _Requirements: 2.5, 8.4_

- [ ]* 2.1 Write property test for remember me persistence
  - **Property 3: Session persistence with remember me**
  - **Validates: Requirements 2.5**

- [ ]* 2.2 Write property test for token validation on load
  - **Property 4: Session token validation on load**
  - **Validates: Requirements 8.4**

- [x] 3. Enhance ProtectedRoute component
  - Update `src/components/auth/ProtectedRoute.tsx` with redirect URL preservation
  - Add support for admin-only routes with `requireAdmin` prop
  - Implement intended destination storage before redirect
  - Add custom unauthorized component support
  - _Requirements: 4.1, 4.2, 8.2_

- [ ]* 3.1 Write property test for protected route blocking
  - **Property 5: Protected route authentication requirement**
  - **Validates: Requirements 4.1**

- [ ]* 3.2 Write property test for admin route protection
  - **Property 10: Admin route protection**
  - **Validates: Requirements 8.2**

- [x] 4. Enhance LoginForm component
  - Add remember me checkbox to `src/components/auth/LoginForm.tsx`
  - Update credential and OTP login handlers to accept remember me parameter
  - Add success callback prop for post-login actions
  - Improve error messages with retry suggestions
  - Add keyboard navigation support (Enter key handling)
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3_

- [ ]* 4.1 Write property test for form validation
  - **Property 7: Form validation before submission**
  - **Validates: Requirements 5.2**

- [x] 5. Enhance RegistrationForm component
  - Add optional email field to credential registration in `src/components/auth/RegistrationForm.tsx`
  - Add success callback prop for post-registration actions
  - Improve validation feedback and error messages
  - Add keyboard navigation support
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2, 5.4_

- [x] 6. Create Login page
  - Create `src/app/login/page.tsx` with centered card layout
  - Implement redirect parameter handling from URL
  - Add automatic redirect for authenticated users
  - Integrate enhanced LoginForm with API handlers
  - Add link to registration page
  - Implement post-login redirect to intended destination
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.3_

- [ ]* 6.1 Write property test for authenticated user redirect
  - **Property 2: Authenticated user login page redirect**
  - **Validates: Requirements 1.3**

- [x] 7. Create Register page
  - Create `src/app/register/page.tsx` with centered card layout
  - Add automatic redirect for authenticated users
  - Integrate enhanced RegistrationForm with API handlers
  - Add link to login page
  - Implement success message and redirect to login after registration
  - _Requirements: 1.2, 1.3, 1.5, 3.1, 3.2, 3.3_

- [x] 8. Update Header component
  - Update `src/components/Header.tsx` to link to `/login` instead of `/auth-demo`
  - Add `/register` link for unauthenticated users
  - Implement user dropdown menu for authenticated users (desktop)
  - Add loading state during authentication check
  - Update mobile menu with new auth links
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 8.1 Write property test for header state synchronization
  - **Property 8: Header authentication state display**
  - **Validates: Requirements 6.1, 6.2**

- [x] 9. Implement responsive design for auth pages
  - Add mobile-optimized layouts to login and register pages
  - Ensure form elements stack vertically on mobile (< 768px)
  - Set appropriate input types for mobile keyboards (tel, email, text)
  - Verify touch targets are minimum 44x44 pixels
  - Test responsive behavior across different viewport sizes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.1 Write property test for mobile layout
  - **Property 9: Mobile responsive layout**
  - **Validates: Requirements 7.4**

- [x] 10. Add logout functionality with cleanup
  - Ensure logout clears session token from storage
  - Verify logout redirects to home page
  - Test logout from both header and user menu
  - _Requirements: 4.5, 6.3_

- [ ]* 10.1 Write property test for logout cleanup
  - **Property 6: Logout session cleanup**
  - **Validates: Requirements 4.5**

- [x] 11. Implement loading and error states
  - Add loading indicators to all authentication forms
  - Disable form inputs during submission
  - Display clear error messages for authentication failures
  - Show success feedback before redirects
  - Add retry functionality for network errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Add accessibility features
  - Add ARIA labels to all form inputs
  - Implement keyboard navigation (Tab, Enter, Escape)
  - Add focus management (auto-focus first input on page load)
  - Ensure screen reader announcements for errors and success messages
  - Verify color contrast meets WCAG standards
  - Test with keyboard-only navigation
  - _Requirements: 7.3, 7.5_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Update existing protected routes
  - Update admin pages to use enhanced ProtectedRoute with `requireAdmin` prop
  - Replace `/auth-demo` redirects with `/login` throughout the application
  - Test protected route behavior with new redirect logic
  - _Requirements: 4.1, 8.2_

- [x] 15. Final integration testing
  - Test complete login flow with redirect preservation
  - Test complete registration flow
  - Test remember me functionality across browser sessions
  - Test logout and session cleanup
  - Test protected route access for authenticated and unauthenticated users
  - Test admin route protection for non-admin users
  - Test mobile responsive behavior
  - Verify all error states display correctly
  - _Requirements: All_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
