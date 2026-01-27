'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DarkModeTestPage() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dark Mode Test Page</h1>
        <ThemeToggle />
      </div>

      <p className="text-muted-foreground">
        This page helps verify that all components work correctly in both light and dark modes.
        Use the toggle button above to switch between themes.
      </p>

      {/* Color Swatches */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Verify all colors have proper contrast</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              Primary
            </div>
            <p className="text-xs text-center text-muted-foreground">Primary Color</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
              Secondary
            </div>
            <p className="text-xs text-center text-muted-foreground">Secondary Color</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-semibold">
              Accent
            </div>
            <p className="text-xs text-center text-muted-foreground">Accent Color</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-semibold">
              Muted
            </div>
            <p className="text-xs text-center text-muted-foreground">Muted Color</p>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
          <CardDescription>Status and feedback colors</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-success flex items-center justify-center text-success-foreground font-semibold">
              Success
            </div>
            <p className="text-xs text-center text-muted-foreground">Success State</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-warning flex items-center justify-center text-warning-foreground font-semibold">
              Warning
            </div>
            <p className="text-xs text-center text-muted-foreground">Warning State</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-error flex items-center justify-center text-error-foreground font-semibold">
              Error
            </div>
            <p className="text-xs text-center text-muted-foreground">Error State</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-info flex items-center justify-center text-info-foreground font-semibold">
              Info
            </div>
            <p className="text-xs text-center text-muted-foreground">Info State</p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>All button styles should be visible and accessible</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and form controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Text Input</label>
            <Input type="text" placeholder="Enter some text..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Input</label>
            <Input type="email" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Disabled Input</label>
            <Input type="text" placeholder="Disabled" disabled />
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card variant="default">
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
            <CardDescription>Standard card style</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This is the default card variant with standard shadow and border.</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
            <CardDescription>Glassmorphism effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This card has a glass effect with backdrop blur.</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Elevated Card</CardTitle>
            <CardDescription>Elevated with hover effect</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This card has a stronger shadow and hover animation.</p>
          </CardContent>
        </Card>
      </div>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Text styles and hierarchy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
            <h2 className="text-3xl font-bold mb-2">Heading 2</h2>
            <h3 className="text-2xl font-bold mb-2">Heading 3</h3>
            <h4 className="text-xl font-bold mb-2">Heading 4</h4>
          </div>
          <div>
            <p className="text-base mb-2">
              This is regular body text. It should be easily readable in both light and dark modes
              with sufficient contrast against the background.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              This is muted text, typically used for secondary information or descriptions.
            </p>
            <p className="text-xs text-muted-foreground">
              This is small text, often used for captions or footnotes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contrast Check */}
      <Card>
        <CardHeader>
          <CardTitle>Contrast Verification</CardTitle>
          <CardDescription>Ensure all text is readable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background border rounded-lg">
            <p className="text-foreground">Foreground text on background</p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <p className="text-card-foreground">Card foreground on card background</p>
          </div>
          <div className="p-4 bg-muted border rounded-lg">
            <p className="text-muted-foreground">Muted foreground on muted background</p>
          </div>
          <div className="p-4 bg-primary rounded-lg">
            <p className="text-primary-foreground font-semibold">Primary foreground on primary background</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground py-8">
        <p>Toggle between light and dark modes using the button at the top of the page.</p>
        <p className="mt-2">All elements should maintain proper contrast and readability.</p>
      </div>
    </div>
  );
}
