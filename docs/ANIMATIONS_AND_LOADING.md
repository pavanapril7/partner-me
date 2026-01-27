# Animations and Loading States Documentation

This document describes all available animations, transitions, and loading states in the application.

## Table of Contents

1. [CSS Animation Classes](#css-animation-classes)
2. [Transition Utilities](#transition-utilities)
3. [Loading Components](#loading-components)
4. [Skeleton Loaders](#skeleton-loaders)
5. [Scroll Reveal](#scroll-reveal)
6. [Usage Examples](#usage-examples)

## CSS Animation Classes

All animation classes are defined in `src/app/globals.css` and can be applied directly to elements.

### Fade Animations

- `.animate-fade-in` - Simple fade in
- `.animate-fade-in-up` - Fade in while moving up
- `.animate-fade-in-down` - Fade in while moving down

### Slide Animations

- `.animate-slide-up` - Slide up from bottom
- `.animate-slide-in-left` - Slide in from left
- `.animate-slide-in-right` - Slide in from right

### Scale Animations

- `.animate-scale-in` - Scale up from 90% to 100%
- `.animate-bounce-in` - Bounce in with overshoot

### Special Animations

- `.animate-gradient` - Animated gradient background
- `.animate-pulse-slow` - Slow pulsing opacity
- `.animate-shimmer` - Shimmer effect for loading states
- `.animate-spin-slow` - Slow rotation

### Animation Delays

Apply delays to stagger animations:

- `.delay-75` - 75ms delay
- `.delay-100` - 100ms delay
- `.delay-150` - 150ms delay
- `.delay-200` - 200ms delay
- `.delay-300` - 300ms delay
- `.delay-500` - 500ms delay
- `.delay-700` - 700ms delay
- `.delay-1000` - 1000ms delay

## Transition Utilities

### Base Transitions

- `.transition-base` - Transitions for colors and basic properties
- `.transition-transform` - Smooth transform transitions
- `.transition-all-smooth` - Transitions all properties smoothly
- `.transition-opacity` - Opacity transitions

### Easing Functions

- `.ease-smooth` - Standard cubic-bezier easing
- `.ease-bounce` - Bounce effect easing
- `.ease-spring` - Spring-like easing

### Hover Effects

- `.hover-lift` - Lifts element up on hover with shadow
- `.hover-scale` - Scales element to 105% on hover
- `.hover-glow` - Adds glow effect on hover

### Micro-interactions

- `.active-press` - Scales down to 95% when pressed
- `.focus-ring-animated` - Animated focus ring

## Loading Components

Import from `@/components/ui/loading`:

### Spinner

```tsx
import { Spinner } from "@/components/ui/loading";

<Spinner size="sm" />  // Small spinner
<Spinner size="md" />  // Medium spinner (default)
<Spinner size="lg" />  // Large spinner
<Spinner size="xl" />  // Extra large spinner
```

### DotsLoader

Three animated bouncing dots:

```tsx
import { DotsLoader } from "@/components/ui/loading";

<DotsLoader />
```

### PulseLoader

Three pulsing circles:

```tsx
import { PulseLoader } from "@/components/ui/loading";

<PulseLoader />
```

### ProgressBar

Linear progress indicator:

```tsx
import { ProgressBar } from "@/components/ui/loading";

// Determinate progress
<ProgressBar value={50} />

// Indeterminate progress
<ProgressBar indeterminate />
```

### LoadingOverlay

Full-screen or container overlay:

```tsx
import { LoadingOverlay } from "@/components/ui/loading";

<LoadingOverlay 
  visible={isLoading}
  message="Loading content..."
  fullScreen={false}
/>
```

### ButtonLoader

Spinner for buttons:

```tsx
import { ButtonLoader } from "@/components/ui/loading";

<Button>
  {loading && <ButtonLoader />}
  Submit
</Button>
```

Or use the built-in loading prop:

```tsx
<Button loading={isLoading}>
  Submit
</Button>
```

## Skeleton Loaders

Import from `@/components/ui/skeleton`:

### Basic Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
```

### Pre-built Skeleton Components

```tsx
import {
  SkeletonCard,
  SkeletonListItem,
  SkeletonTable,
  SkeletonForm,
  SkeletonText,
  SkeletonAvatar,
  SkeletonBusinessIdeaCard,
} from "@/components/ui/skeleton";

// Card skeleton
<SkeletonCard />

// List item skeleton
<SkeletonListItem />

// Table skeleton with 5 rows
<SkeletonTable rows={5} />

// Form skeleton
<SkeletonForm />

// Text block skeleton with 3 lines
<SkeletonText lines={3} />

// Avatar skeleton
<SkeletonAvatar size="md" />

// Business idea card skeleton
<SkeletonBusinessIdeaCard />
```

## Scroll Reveal

Animate elements when they enter the viewport.

### ScrollReveal Component

```tsx
import { ScrollReveal } from "@/components/ui/scroll-reveal";

<ScrollReveal 
  direction="up"      // "up" | "down" | "left" | "right" | "scale"
  delay={0}           // Delay in milliseconds
  threshold={0.1}     // Intersection threshold (0-1)
  triggerOnce={true}  // Only animate once
>
  <YourContent />
</ScrollReveal>
```

### StaggeredChildren Component

Animate multiple children with staggered delays:

```tsx
import { StaggeredChildren } from "@/components/ui/scroll-reveal";

<StaggeredChildren
  staggerDelay={100}  // Delay between each child
  direction="up"
>
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</StaggeredChildren>
```

### useScrollReveal Hook

For custom implementations:

```tsx
import { useScrollReveal } from "@/hooks/useScrollReveal";

function MyComponent() {
  const { ref, isVisible } = useScrollReveal({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <div ref={ref} className={isVisible ? "revealed" : ""}>
      Content
    </div>
  );
}
```

### useStaggeredScrollReveal Hook

For multiple elements:

```tsx
import { useStaggeredScrollReveal } from "@/hooks/useScrollReveal";

function MyList({ items }) {
  const { setRef, isVisible } = useStaggeredScrollReveal(items.length);

  return (
    <div>
      {items.map((item, index) => (
        <div 
          key={item.id}
          ref={setRef(index)}
          className={isVisible(index) ? "revealed" : ""}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

## Usage Examples

### Loading State in a Component

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading";

export function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <Button loading={loading}>Submit</Button>
      </form>
      <LoadingOverlay visible={loading} message="Submitting..." />
    </div>
  );
}
```

### Skeleton Loading State

```tsx
"use client";

import { useEffect, useState } from "react";
import { SkeletonCard } from "@/components/ui/skeleton";

export function DataList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map(item => (
        <Card key={item.id}>{item.content}</Card>
      ))}
    </div>
  );
}
```

### Scroll Reveal on Homepage

```tsx
import { ScrollReveal, StaggeredChildren } from "@/components/ui/scroll-reveal";

export function Homepage() {
  return (
    <div>
      <ScrollReveal direction="up">
        <h1>Welcome to Our Platform</h1>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={200}>
        <p>Discover amazing business ideas</p>
      </ScrollReveal>

      <StaggeredChildren staggerDelay={150}>
        {features.map(feature => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </StaggeredChildren>
    </div>
  );
}
```

### Animated Card with Hover Effect

```tsx
<Card className="hover-lift transition-all-smooth">
  <CardHeader>
    <CardTitle>Interactive Card</CardTitle>
  </CardHeader>
  <CardContent>
    Hover over me to see the lift effect!
  </CardContent>
</Card>
```

### Button with Loading State

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SubmitButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await performAction();
    setLoading(false);
  };

  return (
    <Button 
      loading={loading}
      onClick={handleClick}
      className="active-press"
    >
      {loading ? "Processing..." : "Submit"}
    </Button>
  );
}
```

## Demo Page

Visit `/animations-showcase` to see all animations and loading states in action.

## Performance Considerations

1. **Reduce Motion**: All animations respect the `prefers-reduced-motion` media query
2. **Intersection Observer**: Scroll reveal uses Intersection Observer for efficient viewport detection
3. **CSS Animations**: Most animations use CSS for better performance
4. **Trigger Once**: Use `triggerOnce={true}` on scroll reveals to prevent re-animations

## Accessibility

- All loading spinners include `role="status"` and screen reader text
- Focus states are clearly visible with animated rings
- Animations can be disabled via system preferences
- Loading overlays prevent interaction during loading states

## Browser Support

All animations and transitions work in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Fallbacks are provided for older browsers through the `motion-reduce` media query.
