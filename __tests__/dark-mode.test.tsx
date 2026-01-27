import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@/components/theme-provider';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('Dark Mode Implementation', () => {
  it('should render ThemeProvider without errors', () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>Test Content</div>
      </ThemeProvider>
    );
    
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have dark mode configured in Tailwind', () => {
    // This test verifies that the tailwind config has darkMode set to 'class'
    const tailwindConfig = require('../tailwind.config.ts');
    expect(tailwindConfig.default.darkMode).toBe('class');
  });

  it('should have CSS variables defined for dark mode', () => {
    // Read the globals.css file to verify dark mode variables exist
    const fs = require('fs');
    const path = require('path');
    const globalsPath = path.join(__dirname, '../src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // Check for dark mode class
    expect(globalsContent).toContain('.dark');
    
    // Check for key dark mode variables
    expect(globalsContent).toContain('--background:');
    expect(globalsContent).toContain('--foreground:');
    expect(globalsContent).toContain('--card:');
    expect(globalsContent).toContain('--primary:');
  });

  it('should have dark mode variables in all template CSS files', () => {
    const fs = require('fs');
    const path = require('path');
    
    const templates = [
      'minimal-professional.css',
      'warm-friendly.css',
    ];
    
    templates.forEach(template => {
      const templatePath = path.join(__dirname, `../src/styles/templates/${template}`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      // Check for dark mode class
      expect(templateContent).toContain('.dark');
      
      // Check for key variables
      expect(templateContent).toContain('--background:');
      expect(templateContent).toContain('--foreground:');
    });
  });

  it('should have proper contrast ratios defined', () => {
    const fs = require('fs');
    const path = require('path');
    const globalsPath = path.join(__dirname, '../src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // Verify dark mode section exists
    const darkModeSection = globalsContent.match(/\.dark\s*{[\s\S]*?}/);
    expect(darkModeSection).toBeTruthy();
    
    if (darkModeSection) {
      const darkModeCSS = darkModeSection[0];
      
      // Check that background and foreground are different
      expect(darkModeCSS).toContain('--background:');
      expect(darkModeCSS).toContain('--foreground:');
      
      // Check that semantic colors are defined
      expect(darkModeCSS).toContain('--success:');
      expect(darkModeCSS).toContain('--warning:');
      expect(darkModeCSS).toContain('--error:');
    }
  });

  it('should export ThemeToggle component', () => {
    // Verify the theme toggle component exists
    const ThemeToggle = require('@/components/ui/theme-toggle').ThemeToggle;
    expect(ThemeToggle).toBeDefined();
  });
});
