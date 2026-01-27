# Template System Guide

## Overview

The application includes a comprehensive styling system with three professionally designed templates. Each template provides a complete visual identity with carefully chosen colors, typography, spacing, and component styling. This guide covers everything you need to know about using and customizing the template system.

## Table of Contents

1. [Available Templates](#available-templates)
2. [How to Switch Templates](#how-to-switch-templates)
3. [Color Palette Reference](#color-palette-reference)
4. [Typography System](#typography-system)
5. [Component Style Guide](#component-style-guide)
6. [Common Patterns](#common-patterns)
7. [Customization Guide](#customization-guide)
8. [Dark Mode Support](#dark-mode-support)
9. [Accessibility Guidelines](#accessibility-guidelines)

---

## Available Templates

### 1. Modern Gradient (Default)
**Design Philosophy**: Bold, modern, and energetic. Uses vibrant gradients and strong colors to create an exciting, innovative feel.

**Best For**: 
- Tech startups
- Innovation platforms
- Creative agencies
- SaaS products

**Key Features**:
- Vibrant blue primary color (#3B82F6)
- Purple secondary accents (#8B5CF6)
- Gradient backgrounds and effects
- Glassmorphism card styles
- Bold, rounded buttons with shadows
- Animated hover states

**Visual Characteristics**:
- High energy and modern feel
- Strong color contrasts
- Dynamic gradients
- Smooth animations
- Contemporary design language

---

### 2. Minimal Professional
**Design Philosophy**: Clean, professional, and trustworthy. Uses subtle colors and ample whitespace to create a sophisticated, business-focused aesthetic.

**Best For**:
- B2B platforms
- Professional services
- Corporate applications
- Financial services
- Enterprise software

**Key Features**:
- Deep navy primary color (#1E293B)
- Indigo accent color (#4F46E5)
- Generous whitespace
- Subtle borders and dividers
- Minimal shadows (mostly flat design)
- Clean, rectangular cards
- Professional color scheme

**Visual Characteristics**:
- Clean and uncluttered
- Professional appearance
- Emphasis on content hierarchy
- Subtle interactions
- Business-appropriate styling

---

### 3. Warm & Friendly
**Design Philosophy**: Warm, friendly, and approachable. Uses warm colors and soft shapes to create an inviting, community-focused feel.

**Best For**:
- Consumer apps
- Community platforms
- Social features
- Creative marketplaces
- Educational platforms
- Lifestyle applications

**Key Features**:
- Warm orange primary color (#F97316)
- Teal accent color (#14B8A6)
- Rounded corners throughout
- Soft shadows
- Friendly, approachable button styles
- Organic shapes
- Community-focused design elements

**Visual Characteristics**:
- Warm and inviting
- Friendly and approachable
- Soft, rounded edges
- Comfortable color palette
- Human-centered design

---

## How to Switch Templates

### Method 1: Update CSS Variables (Recommended)

The easiest way to switch templates is to update the CSS custom properties in `src/app/globals.css`:

**Step 1**: Choose your template from the available options:
- `modern-gradient` (default)
- `minimal-professional`
- `warm-friendly`

**Step 2**: Import the corresponding CSS file in `src/app/globals.css`:

```css
/* For Modern Gradient (default) */
@import "tailwindcss";
/* CSS variables are already defined in globals.css */

/* For Minimal Professional */
@import "tailwindcss";
@import "../styles/templates/minimal-professional.css";

/* For Warm & Friendly */
@import "tailwindcss";
@import "../styles/templates/warm-friendly.css";
```

**Step 3**: Restart your development server to see the changes.

### Method 2: Programmatic Template Selection

For dynamic template switching, you can use the template configuration system:

```typescript
import { getTemplate, templates } from '@/styles/templates';

// Get a specific template
const theme = getTemplate('modern-gradient');

// Access template properties
console.log(theme.name); // "Modern Gradient"
console.log(theme.colors.primary.DEFAULT); // "#3b82f6"
```

### Method 3: Environment-Based Selection

Set a template based on environment variables:

```typescript
// In your configuration file
const TEMPLATE = process.env.NEXT_PUBLIC_TEMPLATE || 'modern-gradient';
```

---

## Color Palette Reference

### Modern Gradient Template

#### Primary Colors (Blue)
```
50:  #eff6ff  - Lightest blue
100: #dbeafe
200: #bfdbfe
300: #93c5fd
400: #60a5fa
500: #3b82f6  - Base primary
600: #2563eb
700: #1d4ed8
800: #1e40af
900: #1e3a8a
950: #172554  - Darkest blue
```

#### Secondary Colors (Purple)
```
50:  #faf5ff
500: #a855f7
600: #8b5cf6  - Base secondary
950: #4c1d95
```

#### Accent Colors (Cyan)
```
50:  #ecfeff
500: #06b6d4  - Base accent
950: #083344
```

#### Semantic Colors
```
Success: #10b981 (Emerald)
Warning: #f59e0b (Amber)
Error:   #ef4444 (Rose)
Info:    #06b6d4 (Cyan)
```

### Minimal Professional Template

#### Primary Colors (Navy)
```
50:  #f8fafc
800: #1e293b  - Base primary
950: #020617
```

#### Accent Colors (Indigo)
```
50:  #eef2ff
600: #4f46e5  - Base accent
950: #1e1b4b
```

#### Semantic Colors
```
Success: #22c55e (Green)
Warning: #f97316 (Orange)
Error:   #dc2626 (Red)
Info:    #4f46e5 (Indigo)
```

### Warm & Friendly Template

#### Primary Colors (Orange)
```
50:  #fff7ed
500: #f97316  - Base primary
950: #431407
```

#### Accent Colors (Teal)
```
50:  #f0fdfa
500: #14b8a6  - Base accent
950: #042f2e
```

#### Semantic Colors
```
Success: #84cc16 (Lime)
Warning: #eab308 (Yellow)
Error:   #ef4444 (Red)
Info:    #14b8a6 (Teal)
```

### Using Colors in Your Code

#### With Tailwind Classes
```tsx
<div className="bg-primary text-primary-foreground">
  Primary colored background
</div>

<button className="bg-accent hover:bg-accent/90">
  Accent button
</button>

<p className="text-success">Success message</p>
```

#### With CSS Variables
```css
.custom-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--border));
}
```

---

## Typography System

### Font Families

#### Modern Gradient
```typescript
heading: 'Inter'        // Bold, tight tracking
body:    'Inter'        // Regular, comfortable line height
accent:  'Space Grotesk' // For special headings
mono:    'ui-monospace' // For code
```

#### Minimal Professional
```typescript
heading: 'Outfit'       // Medium-bold, generous spacing
body:    'Inter'        // Regular, optimal readability
mono:    'JetBrains Mono' // For code/data
```

#### Warm & Friendly
```typescript
heading: 'Poppins'      // Semi-bold, friendly curves
body:    'Inter'        // Regular, comfortable spacing
accent:  'Quicksand'    // For playful elements
```

### Typography Scale

All templates use the same typography scale:

```
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px)
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
5xl:  3rem     (48px)
6xl:  3.75rem  (60px)
```

### Usage Examples

```tsx
<h1 className="text-4xl md:text-5xl font-bold">
  Large Heading
</h1>

<h2 className="text-3xl font-semibold">
  Section Heading
</h2>

<p className="text-base text-muted-foreground">
  Body text with muted color
</p>

<span className="text-sm text-muted-foreground">
  Small helper text
</span>
```

---

## Component Style Guide

### Buttons

#### Primary Button
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90 
                   px-6 py-3 rounded-lg font-medium transition-all
                   hover:shadow-lg active:scale-95">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/90
                   px-6 py-3 rounded-lg font-medium transition-all">
  Secondary Action
</button>
```

#### Outline Button
```tsx
<button className="border-2 border-primary text-primary hover:bg-primary 
                   hover:text-primary-foreground px-6 py-3 rounded-lg 
                   font-medium transition-all">
  Outline Button
</button>
```

#### Ghost Button
```tsx
<button className="text-primary hover:bg-primary/10 px-6 py-3 rounded-lg 
                   font-medium transition-all">
  Ghost Button
</button>
```

### Cards

#### Basic Card
```tsx
<div className="bg-card border border-border rounded-lg p-6 
                shadow-sm hover:shadow-md transition-all">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content goes here</p>
</div>
```

#### Interactive Card
```tsx
<div className="bg-card border border-border rounded-lg p-6 
                shadow-sm hover:shadow-lg hover:border-primary/20
                transition-all cursor-pointer hover:-translate-y-1">
  <h3 className="text-xl font-semibold mb-2">Interactive Card</h3>
  <p className="text-muted-foreground">Hover for effect</p>
</div>
```

#### Gradient Card (Modern Gradient template)
```tsx
<div className="bg-gradient-to-br from-primary/10 to-accent/10 
                border border-primary/20 rounded-lg p-6 
                backdrop-blur-sm shadow-lg">
  <h3 className="text-xl font-semibold mb-2">Gradient Card</h3>
  <p className="text-muted-foreground">With glassmorphism effect</p>
</div>
```

### Form Inputs

#### Text Input
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">
    Email Address
  </label>
  <input 
    type="email"
    className="w-full px-4 py-2 border border-input rounded-lg
               focus:outline-none focus:ring-2 focus:ring-ring
               focus:border-transparent transition-all"
    placeholder="you@example.com"
  />
</div>
```

#### Input with Error
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">
    Password
  </label>
  <input 
    type="password"
    className="w-full px-4 py-2 border-2 border-error rounded-lg
               focus:outline-none focus:ring-2 focus:ring-error
               bg-error/5"
    placeholder="Enter password"
  />
  <p className="text-sm text-error">Password is required</p>
</div>
```

#### Input with Success
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">
    Username
  </label>
  <input 
    type="text"
    className="w-full px-4 py-2 border-2 border-success rounded-lg
               focus:outline-none focus:ring-2 focus:ring-success
               bg-success/5"
    value="johndoe"
  />
  <p className="text-sm text-success">Username is available</p>
</div>
```

### Navigation

#### Header Navigation
```tsx
<header className="border-b border-border bg-background/95 backdrop-blur">
  <nav className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold text-primary">
        Logo
      </div>
      <div className="flex gap-6">
        <a href="#" className="text-foreground hover:text-primary 
                               transition-colors font-medium">
          Home
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary 
                               transition-colors font-medium">
          About
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary 
                               transition-colors font-medium">
          Contact
        </a>
      </div>
    </div>
  </nav>
</header>
```

### Badges

#### Status Badges
```tsx
{/* Success Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-success/10 text-success 
                 border border-success/20">
  Approved
</span>

{/* Warning Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-warning/10 text-warning 
                 border border-warning/20">
  Pending
</span>

{/* Error Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-error/10 text-error 
                 border border-error/20">
  Rejected
</span>
```

### Loading States

#### Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="w-12 h-12 border-4 border-muted border-t-primary 
                  rounded-full animate-spin" />
</div>
```

#### Skeleton Loader
```tsx
<div className="space-y-4">
  <div className="h-4 bg-muted rounded animate-pulse" />
  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
</div>
```

---

## Common Patterns

### Hero Section

```tsx
<section className="relative overflow-hidden py-20 md:py-32">
  {/* Background gradient (Modern Gradient template) */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 
                  via-accent/5 to-secondary/10" />
  
  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 
                     bg-gradient-to-r from-primary to-secondary 
                     bg-clip-text text-transparent animate-fade-in">
        Welcome to Our Platform
      </h1>
      <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up">
        Build amazing things with our powerful tools
      </p>
      <div className="flex gap-4 justify-center animate-fade-in-up delay-200">
        <button className="bg-primary text-primary-foreground px-8 py-3 
                           rounded-lg font-medium hover:bg-primary/90 
                           transition-all hover:shadow-lg">
          Get Started
        </button>
        <button className="border-2 border-primary text-primary px-8 py-3 
                           rounded-lg font-medium hover:bg-primary 
                           hover:text-primary-foreground transition-all">
          Learn More
        </button>
      </div>
    </div>
  </div>
</section>
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} 
         className="bg-card border border-border rounded-lg p-6 
                    hover:shadow-lg transition-all hover:-translate-y-1">
      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
      <p className="text-muted-foreground">{item.description}</p>
    </div>
  ))}
</div>
```

### Form Layout

```tsx
<form className="max-w-md mx-auto space-y-6">
  <div className="space-y-2">
    <label className="text-sm font-medium">Name</label>
    <input 
      type="text"
      className="w-full px-4 py-2 border border-input rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
  
  <div className="space-y-2">
    <label className="text-sm font-medium">Email</label>
    <input 
      type="email"
      className="w-full px-4 py-2 border border-input rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
  
  <button type="submit" 
          className="w-full bg-primary text-primary-foreground py-3 
                     rounded-lg font-medium hover:bg-primary/90 
                     transition-all">
    Submit
  </button>
</form>
```

### Modal/Dialog

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm 
                flex items-center justify-center p-4 z-50">
  <div className="bg-card border border-border rounded-lg shadow-2xl 
                  max-w-md w-full p-6 animate-scale-in">
    <h2 className="text-2xl font-bold mb-4">Dialog Title</h2>
    <p className="text-muted-foreground mb-6">
      Dialog content goes here
    </p>
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 text-muted-foreground hover:bg-muted 
                         rounded-lg transition-all">
        Cancel
      </button>
      <button className="px-4 py-2 bg-primary text-primary-foreground 
                         rounded-lg hover:bg-primary/90 transition-all">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Empty State

```tsx
<div className="empty-state">
  <div className="empty-state-icon">
    <svg className="w-full h-full" /* icon SVG */ />
  </div>
  <h3 className="empty-state-title">No items found</h3>
  <p className="empty-state-description">
    Get started by creating your first item
  </p>
  <button className="mt-4 bg-primary text-primary-foreground px-6 py-2 
                     rounded-lg hover:bg-primary/90 transition-all">
    Create Item
  </button>
</div>
```

### Success State

```tsx
<div className="success-state">
  <div className="success-state-icon">
    <svg className="w-full h-full" /* checkmark icon */ />
  </div>
  <h3 className="success-state-title">Success!</h3>
  <p className="success-state-description">
    Your changes have been saved successfully
  </p>
</div>
```

---

## Customization Guide

### Customizing Colors

To customize colors for your brand, update the CSS variables in `src/app/globals.css`:

```css
:root {
  /* Update primary color */
  --primary: 220 90 56%;  /* HSL format */
  --primary-foreground: 0 0% 100%;
  
  /* Update accent color */
  --accent: 180 80 45%;
  --accent-foreground: 0 0% 100%;
}
```

### Creating a Custom Template

1. Create a new template file: `src/styles/templates/my-template.ts`

```typescript
import { ThemeConfig } from './types';

export const myCustomTheme: ThemeConfig = {
  name: 'My Custom Template',
  description: 'A custom template for my brand',
  colors: {
    primary: {
      DEFAULT: '#your-color',
      // ... other shades
    },
    // ... other color definitions
  },
  // ... typography, spacing, etc.
};
```

2. Create corresponding CSS file: `src/styles/templates/my-template.css`

3. Export from `src/styles/templates/index.ts`:

```typescript
export * from './my-template';
import { myCustomTheme } from './my-template';

export const templates = {
  // ... existing templates
  'my-custom': myCustomTheme,
};
```

### Customizing Typography

Update font families in your template configuration:

```typescript
typography: {
  fontFamily: {
    heading: 'Your Heading Font, sans-serif',
    body: 'Your Body Font, sans-serif',
  },
  // ... scale remains the same
}
```

Don't forget to import the fonts in your `layout.tsx`:

```typescript
import { Inter, Your_Font } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const yourFont = Your_Font({ subsets: ['latin'] });
```

---

## Dark Mode Support

All templates include full dark mode support. The system automatically adjusts colors for optimal readability in dark mode.

### Using Dark Mode

The application uses `next-themes` for dark mode management:

```tsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

### Dark Mode Color Adjustments

Dark mode automatically adjusts:
- Background colors become darker
- Text colors become lighter
- Shadows become more subtle
- Borders become less prominent
- Gradients are adjusted for better visibility

### Testing Dark Mode

Test your components in both light and dark modes:

```tsx
// Force dark mode for testing
<div className="dark">
  <YourComponent />
</div>
```

---

## Accessibility Guidelines

### Color Contrast

All templates meet WCAG AA standards for color contrast:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Focus States

Always include visible focus states:

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-ring 
                   focus:ring-offset-2">
  Accessible Button
</button>
```

### Touch Targets

Ensure minimum touch target sizes (44x44px):

```tsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Touch-Friendly Button
</button>
```

### Semantic HTML

Use proper semantic HTML elements:

```tsx
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>
```

### Screen Reader Support

Include screen reader text when needed:

```tsx
<button>
  <span className="sr-only">Close dialog</span>
  <XIcon />
</button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:
- Use proper tab order
- Include skip links
- Support arrow key navigation where appropriate

---

## Best Practices

### Performance

1. **Use CSS Variables**: They're faster than inline styles
2. **Minimize Animations**: Use `prefers-reduced-motion` media query
3. **Optimize Images**: Use Next.js Image component
4. **Lazy Load**: Use dynamic imports for heavy components

### Consistency

1. **Use Design Tokens**: Always use CSS variables, never hardcode colors
2. **Follow Spacing Scale**: Use the defined spacing values
3. **Maintain Typography Hierarchy**: Use consistent heading levels
4. **Reuse Components**: Don't recreate common patterns

### Maintainability

1. **Document Custom Styles**: Add comments for complex CSS
2. **Use Tailwind Classes**: Prefer Tailwind over custom CSS
3. **Keep Templates Separate**: Don't mix template-specific code
4. **Test Across Templates**: Ensure components work with all templates

---

## Troubleshooting

### Colors Not Updating

1. Check that CSS variables are properly defined
2. Restart development server
3. Clear browser cache
4. Verify Tailwind config references CSS variables

### Fonts Not Loading

1. Check font import in `layout.tsx`
2. Verify font family names match imports
3. Check network tab for font loading errors
4. Ensure fonts are included in Next.js config

### Dark Mode Issues

1. Verify `next-themes` is properly configured
2. Check that dark mode CSS variables are defined
3. Test with `className="dark"` for debugging
4. Ensure ThemeProvider wraps your app

### Responsive Issues

1. Test at all breakpoints (mobile, tablet, desktop)
2. Use browser dev tools responsive mode
3. Check for hardcoded widths
4. Verify container padding at different sizes

---

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Support

For questions or issues with the template system:
1. Check this documentation first
2. Review the component examples
3. Test with the default template
4. Check browser console for errors
5. Verify all dependencies are installed

---

*Last Updated: January 2026*
