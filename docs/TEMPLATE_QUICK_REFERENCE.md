# Template System Quick Reference

A quick reference guide for developers working with the template system.

## Quick Start

### Switch Templates

Edit `src/app/globals.css`:

```css
/* Modern Gradient (default) - already configured */

/* Minimal Professional */
@import "tailwindcss";
@import "../styles/templates/minimal-professional.css";

/* Warm & Friendly */
@import "tailwindcss";
@import "../styles/templates/warm-friendly.css";
```

## Color Classes

### Background Colors
```tsx
bg-primary          // Primary brand color
bg-secondary        // Secondary color
bg-accent           // Accent color
bg-success          // Success state
bg-warning          // Warning state
bg-error            // Error state
bg-muted            // Muted background
bg-card             // Card background
```

### Text Colors
```tsx
text-primary        // Primary text
text-foreground     // Default text
text-muted-foreground // Muted text
text-success        // Success text
text-warning        // Warning text
text-error          // Error text
```

### Border Colors
```tsx
border-primary      // Primary border
border-border       // Default border
border-input        // Input border
```

## Component Patterns

### Button
```tsx
<button className="bg-primary text-primary-foreground px-6 py-3 
                   rounded-lg hover:bg-primary/90 transition-all">
  Click Me
</button>
```

### Card
```tsx
<div className="bg-card border border-border rounded-lg p-6 
                shadow-sm hover:shadow-md transition-all">
  Content
</div>
```

### Input
```tsx
<input className="w-full px-4 py-2 border border-input rounded-lg
                  focus:ring-2 focus:ring-ring" />
```

### Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium 
                 bg-success/10 text-success border border-success/20">
  Status
</span>
```

## Spacing Scale

```
xs:  0.5rem  (8px)
sm:  0.75rem (12px)
md:  1rem    (16px)
lg:  1.5rem  (24px)
xl:  2rem    (32px)
2xl: 3rem    (48px)
3xl: 4rem    (64px)
4xl: 6rem    (96px)
```

## Typography Scale

```
text-xs:   12px
text-sm:   14px
text-base: 16px
text-lg:   18px
text-xl:   20px
text-2xl:  24px
text-3xl:  30px
text-4xl:  36px
text-5xl:  48px
text-6xl:  60px
```

## Animations

```tsx
animate-fade-in         // Fade in
animate-fade-in-up      // Fade in from bottom
animate-slide-up        // Slide up
animate-scale-in        // Scale in
animate-bounce-in       // Bounce in
animate-pulse-slow      // Slow pulse
animate-spin-slow       // Slow spin
```

### Animation Delays
```tsx
delay-100
delay-200
delay-300
delay-500
```

## Responsive Breakpoints

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Usage
```tsx
<div className="text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```

## Dark Mode

```tsx
// Light and dark variants
<div className="bg-white dark:bg-gray-900">
  Content
</div>

// Toggle theme
import { useTheme } from 'next-themes';
const { theme, setTheme } = useTheme();
setTheme(theme === 'dark' ? 'light' : 'dark');
```

## Common Utilities

### Hover Effects
```tsx
hover:shadow-lg         // Lift shadow
hover:-translate-y-1    // Lift up
hover:scale-105         // Scale up
hover:bg-primary/90     // Darken background
```

### Transitions
```tsx
transition-all          // Transition all properties
transition-colors       // Transition colors only
transition-transform    // Transition transform only
duration-200            // 200ms duration
ease-in-out            // Easing function
```

### Shadows
```tsx
shadow-sm              // Small shadow
shadow-md              // Medium shadow
shadow-lg              // Large shadow
shadow-xl              // Extra large shadow
shadow-2xl             // 2X large shadow
```

### Border Radius
```tsx
rounded-sm             // Small radius
rounded-md             // Medium radius (default)
rounded-lg             // Large radius
rounded-xl             // Extra large radius
rounded-full           // Fully rounded
```

## Accessibility

### Focus States
```tsx
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

### Screen Reader Only
```tsx
<span className="sr-only">Hidden text</span>
```

### Minimum Touch Targets
```tsx
min-h-[44px] min-w-[44px]
```

## Template-Specific Features

### Modern Gradient
```tsx
// Gradient backgrounds
bg-gradient-to-r from-primary to-secondary

// Glassmorphism
bg-primary/10 backdrop-blur-sm

// Gradient text
bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent
```

### Minimal Professional
```tsx
// Subtle borders
border border-border/50

// Minimal shadows
shadow-sm

// Professional spacing
space-y-8
```

### Warm & Friendly
```tsx
// Rounded corners
rounded-xl

// Soft shadows
shadow-md

// Warm backgrounds
bg-primary/5
```

## CSS Variables

### Using in Custom CSS
```css
.custom-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}
```

### Available Variables
```
--primary
--secondary
--accent
--success
--warning
--error
--background
--foreground
--card
--border
--input
--ring
--radius
--shadow-sm
--shadow-md
--shadow-lg
```

## Performance Tips

1. Use CSS variables instead of inline styles
2. Prefer Tailwind classes over custom CSS
3. Use `will-change` sparingly
4. Optimize animations with `transform` and `opacity`
5. Use `prefers-reduced-motion` for accessibility

## Common Patterns

### Hero Section
```tsx
<section className="py-20 md:py-32">
  <div className="container mx-auto px-4">
    <h1 className="text-4xl md:text-6xl font-bold mb-6">Title</h1>
    <p className="text-xl text-muted-foreground mb-8">Description</p>
    <button className="bg-primary text-primary-foreground px-8 py-3 
                       rounded-lg">CTA</button>
  </div>
</section>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-card border rounded-lg p-6">
      {item.content}
    </div>
  ))}
</div>
```

### Form
```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <label className="text-sm font-medium">Label</label>
    <input className="w-full px-4 py-2 border rounded-lg 
                      focus:ring-2 focus:ring-ring" />
  </div>
  <button type="submit" className="w-full bg-primary 
                                    text-primary-foreground py-3 
                                    rounded-lg">Submit</button>
</form>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Colors not updating | Restart dev server, clear cache |
| Fonts not loading | Check font imports in layout.tsx |
| Dark mode not working | Verify ThemeProvider setup |
| Responsive issues | Test at all breakpoints |
| Animations not smooth | Use transform/opacity only |

## Resources

- Full Guide: `docs/TEMPLATE_SYSTEM_GUIDE.md`
- Component Examples: `src/app/component-showcase/page.tsx`
- Template Configs: `src/styles/templates/`
- Tailwind Config: `tailwind.config.ts`
- Global Styles: `src/app/globals.css`
