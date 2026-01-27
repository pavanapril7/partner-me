# Template Configuration System

This directory contains the complete template configuration system for the application, providing three distinct design options.

## Available Templates

### 1. Modern Gradient (Default)
**Design Philosophy**: Bold, modern, and energetic. Uses vibrant gradients and strong colors to create an exciting, innovative feel.

**Best For**: Tech startups, innovation platforms, creative agencies

**Key Features**:
- Vibrant blue primary color with gradient effects
- Purple secondary and cyan accent colors
- Glassmorphism effects on cards
- Bold, rounded buttons with shadows
- Animated hover states

**Usage**: This is the default template and is already applied in `src/app/globals.css`

---

### 2. Minimal Professional
**Design Philosophy**: Clean, professional, and trustworthy. Uses subtle colors and ample whitespace to create a sophisticated, business-focused aesthetic.

**Best For**: B2B platforms, professional services, corporate applications

**Key Features**:
- Deep navy primary color
- Generous whitespace
- Subtle borders and minimal shadows
- Clean, rectangular cards
- Professional color scheme

**Usage**: To switch to this template, edit `src/app/globals.css`:
```css
@import "tailwindcss";
@import "../styles/templates/minimal-professional.css";
```
Then restart your development server.

---

### 3. Warm & Friendly
**Design Philosophy**: Warm, friendly, and approachable. Uses warm colors and soft shapes to create an inviting, community-focused feel.

**Best For**: Consumer apps, community platforms, social features, creative marketplaces

**Key Features**:
- Warm orange primary color
- Rounded corners throughout
- Soft shadows
- Friendly, approachable button styles
- Organic shapes and warm color palette

**Usage**: To switch to this template, edit `src/app/globals.css`:
```css
@import "tailwindcss";
@import "../styles/templates/warm-friendly.css";
```
Then restart your development server.

---

## File Structure

```
src/styles/templates/
├── types.ts                      # TypeScript interfaces for theme configuration
├── modern-gradient.ts            # Modern Gradient theme configuration
├── minimal-professional.ts       # Minimal Professional theme configuration
├── warm-friendly.ts              # Warm & Friendly theme configuration
├── minimal-professional.css      # CSS custom properties for Minimal Professional
├── warm-friendly.css             # CSS custom properties for Warm & Friendly
├── index.ts                      # Exports all templates and utilities
└── README.md                     # This file
```

## TypeScript Configuration

All templates are fully typed using TypeScript interfaces defined in `types.ts`:

```typescript
import { getTemplate, templates, DEFAULT_TEMPLATE } from '@/styles/templates';

// Get a specific template
const theme = getTemplate('modern-gradient');

// Access all templates
const allTemplates = templates;

// Get default template name
const defaultName = DEFAULT_TEMPLATE;
```

## CSS Custom Properties

Each template defines CSS custom properties (CSS variables) that can be used throughout the application:

### Color Variables
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`
- `--success`, `--warning`, `--error`, `--info`
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--input`, `--ring`

### Utility Variables
- `--radius` - Border radius
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl` - Shadow scales
- `--gradient-primary`, `--gradient-secondary`, `--gradient-accent` - Gradient definitions (Modern Gradient only)

## Dark Mode Support

All templates include dark mode variants that are automatically applied when the `.dark` class is present on the root element.

## Switching Templates

### Method 1: Update CSS Import (Recommended)

Edit `src/app/globals.css` and change the import:

```css
/* For Modern Gradient (default) */
@import "tailwindcss";
/* CSS variables already defined in globals.css */

/* For Minimal Professional */
@import "tailwindcss";
@import "../styles/templates/minimal-professional.css";

/* For Warm & Friendly */
@import "tailwindcss";
@import "../styles/templates/warm-friendly.css";
```

After changing the import, restart your development server for changes to take effect.

### Method 2: Programmatic Access

Access template configurations programmatically:

```typescript
import { getTemplate, templates } from '@/styles/templates';

// Get a specific template
const theme = getTemplate('modern-gradient');
console.log(theme.colors.primary.DEFAULT); // "#3b82f6"

// List all available templates
const templateNames = Object.keys(templates);
```

## Extending Templates

To create a new template:

1. Create a new TypeScript file (e.g., `my-template.ts`) following the structure of existing templates
2. Create a corresponding CSS file (e.g., `my-template.css`) with CSS custom properties
3. Export the template in `index.ts`
4. Update the `templates` object and `TemplateName` type

## Integration with Tailwind CSS

The CSS custom properties are designed to work seamlessly with Tailwind CSS. Update your `tailwind.config.ts` to reference these variables for consistent theming across utility classes.

## Comprehensive Documentation

For detailed information about using the template system:

- **[Template System Guide](../../../docs/TEMPLATE_SYSTEM_GUIDE.md)** - Complete guide with examples, patterns, and best practices
- **[Quick Reference](../../../docs/TEMPLATE_QUICK_REFERENCE.md)** - Quick lookup for developers
- **[Component Showcase](../../../docs/COMPONENT_SHOWCASE.md)** - Visual examples of all styled components

These guides cover:
- Detailed color palettes and usage guidelines
- Typography system and font configurations
- Complete component style guide with code examples
- Common UI patterns and layouts
- Dark mode implementation
- Accessibility guidelines
- Customization and extension guide
- Troubleshooting tips

