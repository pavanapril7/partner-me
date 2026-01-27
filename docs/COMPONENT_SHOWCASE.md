# Component Showcase

This document provides visual examples of all styled components in the template system. For interactive examples, visit `/component-showcase` in your browser.

## Table of Contents

1. [Buttons](#buttons)
2. [Cards](#cards)
3. [Forms](#forms)
4. [Typography](#typography)
5. [Badges & Tags](#badges--tags)
6. [Navigation](#navigation)
7. [Modals & Dialogs](#modals--dialogs)
8. [Loading States](#loading-states)
9. [Empty & Error States](#empty--error-states)
10. [Tables](#tables)
11. [Animations](#animations)

---

## Buttons

### Primary Button
**Use Case**: Main call-to-action, primary actions

```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90 
                   px-6 py-3 rounded-lg font-medium transition-all
                   hover:shadow-lg active:scale-95">
  Primary Button
</button>
```

**Visual**: Solid background with primary color, white text, shadow on hover

---

### Secondary Button
**Use Case**: Secondary actions, less emphasis than primary

```tsx
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/90
                   px-6 py-3 rounded-lg font-medium transition-all">
  Secondary Button
</button>
```

**Visual**: Solid background with secondary color, smooth hover transition

---

### Outline Button
**Use Case**: Alternative actions, less visual weight

```tsx
<button className="border-2 border-primary text-primary hover:bg-primary 
                   hover:text-primary-foreground px-6 py-3 rounded-lg 
                   font-medium transition-all">
  Outline Button
</button>
```

**Visual**: Transparent background with colored border, fills on hover

---

### Ghost Button
**Use Case**: Tertiary actions, minimal visual presence

```tsx
<button className="text-primary hover:bg-primary/10 px-6 py-3 rounded-lg 
                   font-medium transition-all">
  Ghost Button
</button>
```

**Visual**: No background or border, subtle background on hover

---

### Destructive Button
**Use Case**: Delete, remove, or dangerous actions

```tsx
<button className="bg-error text-error-foreground hover:bg-error/90
                   px-6 py-3 rounded-lg font-medium transition-all">
  Delete
</button>
```

**Visual**: Red/error colored background, clear warning signal

---

### Icon Button
**Use Case**: Actions with icon only, compact spaces

```tsx
<button className="p-3 rounded-lg hover:bg-muted transition-all">
  <svg className="w-5 h-5" /* icon */ />
</button>
```

**Visual**: Square button with icon, minimal padding

---

### Button with Icon
**Use Case**: Actions that benefit from visual reinforcement

```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90
                   px-6 py-3 rounded-lg font-medium transition-all
                   flex items-center gap-2">
  <svg className="w-5 h-5" /* icon */ />
  <span>Button with Icon</span>
</button>
```

**Visual**: Icon and text aligned horizontally

---

### Loading Button
**Use Case**: During async operations

```tsx
<button className="bg-primary text-primary-foreground px-6 py-3 
                   rounded-lg font-medium opacity-50 cursor-not-allowed
                   flex items-center gap-2" disabled>
  <div className="w-4 h-4 border-2 border-white border-t-transparent 
                  rounded-full animate-spin" />
  <span>Loading...</span>
</button>
```

**Visual**: Disabled state with spinner animation

---

### Button Sizes

```tsx
{/* Small */}
<button className="bg-primary text-primary-foreground px-4 py-2 
                   rounded-lg text-sm">Small</button>

{/* Medium (default) */}
<button className="bg-primary text-primary-foreground px-6 py-3 
                   rounded-lg">Medium</button>

{/* Large */}
<button className="bg-primary text-primary-foreground px-8 py-4 
                   rounded-lg text-lg">Large</button>
```

---

## Cards

### Basic Card
**Use Case**: Content containers, information display

```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-sm">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">
    Card content goes here. This is a basic card with minimal styling.
  </p>
</div>
```

**Visual**: White/dark background, subtle border and shadow

---

### Interactive Card
**Use Case**: Clickable cards, navigation items

```tsx
<div className="bg-card border border-border rounded-lg p-6 
                shadow-sm hover:shadow-lg hover:border-primary/20
                transition-all cursor-pointer hover:-translate-y-1">
  <h3 className="text-xl font-semibold mb-2">Interactive Card</h3>
  <p className="text-muted-foreground">
    Hover over this card to see the interactive effect.
  </p>
</div>
```

**Visual**: Lifts up and increases shadow on hover

---

### Gradient Card (Modern Gradient)
**Use Case**: Featured content, special highlights

```tsx
<div className="bg-gradient-to-br from-primary/10 to-accent/10 
                border border-primary/20 rounded-lg p-6 
                backdrop-blur-sm shadow-lg">
  <h3 className="text-xl font-semibold mb-2">Gradient Card</h3>
  <p className="text-muted-foreground">
    This card features a gradient background with glassmorphism effect.
  </p>
</div>
```

**Visual**: Gradient background with blur effect, modern look

---

### Card with Image
**Use Case**: Blog posts, products, media content

```tsx
<div className="bg-card border border-border rounded-lg overflow-hidden 
                shadow-sm hover:shadow-md transition-all">
  <img src="/image.jpg" alt="Card" className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Card with Image</h3>
    <p className="text-muted-foreground">
      Card content with an image header.
    </p>
  </div>
</div>
```

**Visual**: Image at top, content below with padding

---

### Card with Footer
**Use Case**: Cards with actions or metadata

```tsx
<div className="bg-card border border-border rounded-lg shadow-sm">
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Card Title</h3>
    <p className="text-muted-foreground">Card content here.</p>
  </div>
  <div className="border-t border-border p-4 bg-muted/30 
                  flex justify-between items-center">
    <span className="text-sm text-muted-foreground">Footer info</span>
    <button className="text-primary hover:underline text-sm">Action</button>
  </div>
</div>
```

**Visual**: Separated footer with different background

---

### Stat Card
**Use Case**: Dashboard metrics, statistics

```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-sm">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-muted-foreground">Total Users</span>
    <svg className="w-5 h-5 text-primary" /* icon */ />
  </div>
  <div className="text-3xl font-bold">1,234</div>
  <div className="text-sm text-success mt-2">
    ↑ 12% from last month
  </div>
</div>
```

**Visual**: Large number with label and trend indicator

---

## Forms

### Text Input
**Use Case**: Single-line text entry

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Email Address</label>
  <input 
    type="email"
    className="w-full px-4 py-2 border border-input rounded-lg
               focus:outline-none focus:ring-2 focus:ring-ring
               focus:border-transparent transition-all"
    placeholder="you@example.com"
  />
</div>
```

**Visual**: Clean input with focus ring

---

### Textarea
**Use Case**: Multi-line text entry

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Description</label>
  <textarea 
    className="w-full px-4 py-2 border border-input rounded-lg
               focus:outline-none focus:ring-2 focus:ring-ring
               min-h-[120px] resize-y"
    placeholder="Enter description..."
  />
</div>
```

**Visual**: Resizable textarea with same styling as input

---

### Input with Error
**Use Case**: Form validation feedback

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Password</label>
  <input 
    type="password"
    className="w-full px-4 py-2 border-2 border-error rounded-lg
               focus:outline-none focus:ring-2 focus:ring-error
               bg-error/5"
    placeholder="Enter password"
  />
  <p className="text-sm text-error flex items-center gap-1">
    <svg className="w-4 h-4" /* error icon */ />
    Password is required
  </p>
</div>
```

**Visual**: Red border and background tint, error message below

---

### Input with Success
**Use Case**: Successful validation feedback

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Username</label>
  <input 
    type="text"
    className="w-full px-4 py-2 border-2 border-success rounded-lg
               focus:outline-none focus:ring-2 focus:ring-success
               bg-success/5"
    value="johndoe"
  />
  <p className="text-sm text-success flex items-center gap-1">
    <svg className="w-4 h-4" /* checkmark icon */ />
    Username is available
  </p>
</div>
```

**Visual**: Green border and background tint, success message below

---

### Select Dropdown
**Use Case**: Single selection from options

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Country</label>
  <select 
    className="w-full px-4 py-2 border border-input rounded-lg
               focus:outline-none focus:ring-2 focus:ring-ring
               bg-background"
  >
    <option>Select a country</option>
    <option>United States</option>
    <option>Canada</option>
    <option>United Kingdom</option>
  </select>
</div>
```

**Visual**: Native select with consistent styling

---

### Checkbox
**Use Case**: Boolean options, multiple selections

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input 
    type="checkbox"
    className="w-4 h-4 rounded border-input text-primary 
               focus:ring-2 focus:ring-ring"
  />
  <span className="text-sm">I agree to the terms and conditions</span>
</label>
```

**Visual**: Styled checkbox with label

---

### Radio Buttons
**Use Case**: Single selection from multiple options

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Plan</label>
  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input 
        type="radio"
        name="plan"
        className="w-4 h-4 border-input text-primary 
                   focus:ring-2 focus:ring-ring"
      />
      <span className="text-sm">Free Plan</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input 
        type="radio"
        name="plan"
        className="w-4 h-4 border-input text-primary 
                   focus:ring-2 focus:ring-ring"
      />
      <span className="text-sm">Pro Plan</span>
    </label>
  </div>
</div>
```

**Visual**: Radio buttons with consistent styling

---

### Form Layout
**Use Case**: Complete form structure

```tsx
<form className="max-w-md mx-auto space-y-6">
  <div className="space-y-2">
    <label className="text-sm font-medium">Name</label>
    <input 
      type="text"
      className="w-full px-4 py-2 border border-input rounded-lg
                 focus:ring-2 focus:ring-ring"
    />
  </div>
  
  <div className="space-y-2">
    <label className="text-sm font-medium">Email</label>
    <input 
      type="email"
      className="w-full px-4 py-2 border border-input rounded-lg
                 focus:ring-2 focus:ring-ring"
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

**Visual**: Vertically stacked form with consistent spacing

---

## Typography

### Headings

```tsx
<h1 className="text-4xl md:text-6xl font-bold mb-4">
  Heading 1
</h1>

<h2 className="text-3xl md:text-4xl font-bold mb-3">
  Heading 2
</h2>

<h3 className="text-2xl md:text-3xl font-semibold mb-3">
  Heading 3
</h3>

<h4 className="text-xl md:text-2xl font-semibold mb-2">
  Heading 4
</h4>

<h5 className="text-lg md:text-xl font-medium mb-2">
  Heading 5
</h5>

<h6 className="text-base md:text-lg font-medium mb-2">
  Heading 6
</h6>
```

---

### Body Text

```tsx
<p className="text-base text-foreground mb-4">
  This is regular body text. It uses the base font size and default 
  foreground color for optimal readability.
</p>

<p className="text-lg text-foreground mb-4">
  This is large body text, useful for introductory paragraphs or 
  important content.
</p>

<p className="text-sm text-muted-foreground">
  This is small text with muted color, often used for helper text 
  or secondary information.
</p>
```

---

### Text Styles

```tsx
<p className="font-bold">Bold text</p>
<p className="font-semibold">Semibold text</p>
<p className="font-medium">Medium text</p>
<p className="font-normal">Normal text</p>
<p className="font-light">Light text</p>

<p className="italic">Italic text</p>
<p className="underline">Underlined text</p>
<p className="line-through">Strikethrough text</p>
```

---

### Text Colors

```tsx
<p className="text-foreground">Default text color</p>
<p className="text-muted-foreground">Muted text color</p>
<p className="text-primary">Primary color text</p>
<p className="text-secondary">Secondary color text</p>
<p className="text-accent">Accent color text</p>
<p className="text-success">Success color text</p>
<p className="text-warning">Warning color text</p>
<p className="text-error">Error color text</p>
```

---

### Gradient Text (Modern Gradient)

```tsx
<h1 className="text-4xl font-bold bg-gradient-to-r from-primary 
               to-secondary bg-clip-text text-transparent">
  Gradient Heading
</h1>
```

**Visual**: Text with gradient color effect

---

## Badges & Tags

### Status Badges

```tsx
{/* Success */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-success/10 text-success 
                 border border-success/20">
  Approved
</span>

{/* Warning */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-warning/10 text-warning 
                 border border-warning/20">
  Pending
</span>

{/* Error */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-error/10 text-error 
                 border border-error/20">
  Rejected
</span>

{/* Info */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-xs font-medium bg-info/10 text-info 
                 border border-info/20">
  Info
</span>
```

---

### Badge with Icon

```tsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full 
                 text-xs font-medium bg-primary/10 text-primary 
                 border border-primary/20">
  <svg className="w-3 h-3" /* icon */ />
  <span>New</span>
</span>
```

---

### Removable Tag

```tsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full 
                 text-xs font-medium bg-muted text-foreground">
  <span>Tag Name</span>
  <button className="hover:text-error transition-colors">
    <svg className="w-3 h-3" /* close icon */ />
  </button>
</span>
```

---

## Navigation

### Header Navigation

```tsx
<header className="border-b border-border bg-background/95 backdrop-blur 
                   sticky top-0 z-50">
  <nav className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold text-primary">
        Logo
      </div>
      <div className="hidden md:flex gap-6">
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
      <button className="md:hidden p-2">
        <svg className="w-6 h-6" /* menu icon */ />
      </button>
    </div>
  </nav>
</header>
```

---

### Breadcrumbs

```tsx
<nav className="flex items-center gap-2 text-sm">
  <a href="#" className="text-muted-foreground hover:text-primary 
                         transition-colors">
    Home
  </a>
  <span className="text-muted-foreground">/</span>
  <a href="#" className="text-muted-foreground hover:text-primary 
                         transition-colors">
    Category
  </a>
  <span className="text-muted-foreground">/</span>
  <span className="text-foreground font-medium">Current Page</span>
</nav>
```

---

### Tabs

```tsx
<div className="border-b border-border">
  <nav className="flex gap-6">
    <button className="pb-3 border-b-2 border-primary text-primary 
                       font-medium">
      Tab 1
    </button>
    <button className="pb-3 border-b-2 border-transparent 
                       text-muted-foreground hover:text-foreground 
                       transition-colors">
      Tab 2
    </button>
    <button className="pb-3 border-b-2 border-transparent 
                       text-muted-foreground hover:text-foreground 
                       transition-colors">
      Tab 3
    </button>
  </nav>
</div>
```

---

## Modals & Dialogs

### Basic Modal

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm 
                flex items-center justify-center p-4 z-50">
  <div className="bg-card border border-border rounded-lg shadow-2xl 
                  max-w-md w-full p-6 animate-scale-in">
    <h2 className="text-2xl font-bold mb-4">Modal Title</h2>
    <p className="text-muted-foreground mb-6">
      Modal content goes here. This is a basic modal dialog.
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

---

### Alert Dialog

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm 
                flex items-center justify-center p-4 z-50">
  <div className="bg-card border-2 border-error rounded-lg shadow-2xl 
                  max-w-md w-full p-6">
    <div className="flex items-start gap-4">
      <div className="p-2 bg-error/10 rounded-full">
        <svg className="w-6 h-6 text-error" /* warning icon */ />
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-2">Delete Item?</h2>
        <p className="text-muted-foreground mb-6">
          This action cannot be undone. Are you sure you want to proceed?
        </p>
        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 hover:bg-muted rounded-lg">
            Cancel
          </button>
          <button className="px-4 py-2 bg-error text-error-foreground 
                             rounded-lg hover:bg-error/90">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Loading States

### Spinner

```tsx
<div className="flex items-center justify-center p-8">
  <div className="w-12 h-12 border-4 border-muted border-t-primary 
                  rounded-full animate-spin" />
</div>
```

---

### Skeleton Loader

```tsx
<div className="space-y-4">
  <div className="h-4 bg-muted rounded animate-pulse" />
  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
</div>
```

---

### Loading Card

```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-muted rounded w-1/2" />
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-5/6" />
    </div>
  </div>
</div>
```

---

## Empty & Error States

### Empty State

```tsx
<div className="empty-state">
  <div className="empty-state-icon">
    <svg className="w-full h-full" /* icon */ />
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

---

### Error State

```tsx
<div className="error-state">
  <div className="error-state-icon">
    <svg className="w-full h-full" /* error icon */ />
  </div>
  <h3 className="error-state-title">Something went wrong</h3>
  <p className="error-state-description">
    We encountered an error while loading this content. Please try again.
  </p>
  <button className="mt-4 bg-primary text-primary-foreground px-6 py-2 
                     rounded-lg hover:bg-primary/90 transition-all">
    Try Again
  </button>
</div>
```

---

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

## Tables

### Basic Table

```tsx
<div className="border border-border rounded-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted/50 border-b border-border">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
        <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
        <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-6 py-4">John Doe</td>
        <td className="px-6 py-4 text-muted-foreground">john@example.com</td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 rounded-full text-xs bg-success/10 
                           text-success">Active</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Animations

### Fade In

```tsx
<div className="animate-fade-in">
  Content fades in
</div>
```

---

### Slide Up

```tsx
<div className="animate-slide-up">
  Content slides up
</div>
```

---

### Scale In

```tsx
<div className="animate-scale-in">
  Content scales in
</div>
```

---

### Staggered Animation

```tsx
<div className="space-y-4">
  <div className="animate-fade-in-up">First item</div>
  <div className="animate-fade-in-up delay-100">Second item</div>
  <div className="animate-fade-in-up delay-200">Third item</div>
</div>
```

---

*For interactive examples, visit `/component-showcase` in your browser.*
