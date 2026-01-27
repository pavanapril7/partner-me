"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Spinner,
  DotsLoader,
  ProgressBar,
  PulseLoader,
  LoadingOverlay,
} from "@/components/ui/loading";
import {
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTable,
  SkeletonForm,
  SkeletonText,
  SkeletonAvatar,
  SkeletonBusinessIdeaCard,
} from "@/components/ui/skeleton";
import { ScrollReveal, StaggeredChildren } from "@/components/ui/scroll-reveal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * AnimationShowcase Component
 * Demonstrates all available animations, transitions, and loading states
 */
export function AnimationShowcase() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleProgressDemo = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
  };

  return (
    <div className="container mx-auto space-y-12 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Animation & Loading Showcase</h1>
        <p className="text-muted-foreground">
          Explore all available animations, transitions, and loading states
        </p>
      </div>

      {/* Scroll Reveal Animations */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Scroll Reveal Animations</h2>
        
        <ScrollReveal direction="up">
          <Card>
            <CardHeader>
              <CardTitle>Fade In Up</CardTitle>
              <CardDescription>This card fades in from below</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Scroll down and back up to see the animation again (if triggerOnce is false)</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={100}>
          <Card>
            <CardHeader>
              <CardTitle>Slide In Left</CardTitle>
              <CardDescription>This card slides in from the left with a delay</CardDescription>
            </CardHeader>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={200}>
          <Card>
            <CardHeader>
              <CardTitle>Slide In Right</CardTitle>
              <CardDescription>This card slides in from the right with more delay</CardDescription>
            </CardHeader>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="scale" delay={300}>
          <Card>
            <CardHeader>
              <CardTitle>Scale In</CardTitle>
              <CardDescription>This card scales up with even more delay</CardDescription>
            </CardHeader>
          </Card>
        </ScrollReveal>
      </section>

      {/* Staggered Children */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Staggered Animations</h2>
        <StaggeredChildren
          staggerDelay={150}
          className="grid gap-4 md:grid-cols-3"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Card {i}</CardTitle>
                <CardDescription>Staggered reveal animation</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </StaggeredChildren>
      </section>

      {/* Loading Spinners */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Loading Spinners</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Spinner - Small</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Spinner size="sm" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spinner - Medium</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Spinner size="md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spinner - Large</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Spinner size="lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spinner - XL</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Spinner size="xl" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Other Loaders */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Other Loaders</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dots Loader</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DotsLoader />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pulse Loader</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <PulseLoader />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Progress Indicators</h2>
        <Card>
          <CardHeader>
            <CardTitle>Progress Bar</CardTitle>
            <CardDescription>Click the button to see progress animation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={progress} />
            <Button onClick={handleProgressDemo}>Start Progress</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indeterminate Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar indeterminate />
          </CardContent>
        </Card>
      </section>

      {/* Button Loading States */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Button Loading States</h2>
        <Card>
          <CardHeader>
            <CardTitle>Buttons with Loading</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button loading={loading} onClick={handleLoadingDemo}>
              {loading ? "Loading..." : "Click to Load"}
            </Button>
            <Button variant="secondary" loading={loading}>
              Secondary Loading
            </Button>
            <Button variant="outline" loading={loading}>
              Outline Loading
            </Button>
            <Button variant="destructive" loading={loading}>
              Destructive Loading
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Loading Overlay */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Loading Overlay</h2>
        <Card className="relative min-h-[200px]">
          <CardHeader>
            <CardTitle>Overlay Demo</CardTitle>
            <CardDescription>Click to show loading overlay</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOverlayDemo}>Show Overlay</Button>
          </CardContent>
          <LoadingOverlay visible={showOverlay} message="Loading content..." />
        </Card>
      </section>

      {/* Skeleton Loaders */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Skeleton Loaders</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Basic Skeleton</h3>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton Card</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton List Items</h3>
          <div className="space-y-2">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton Table</h3>
          <SkeletonTable rows={5} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton Form</h3>
          <SkeletonForm />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton Text</h3>
          <SkeletonText lines={5} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Skeleton Avatars</h3>
          <div className="flex gap-4">
            <SkeletonAvatar size="sm" />
            <SkeletonAvatar size="md" />
            <SkeletonAvatar size="lg" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Business Idea Card Skeleton</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonBusinessIdeaCard />
            <SkeletonBusinessIdeaCard />
            <SkeletonBusinessIdeaCard />
          </div>
        </div>
      </section>

      {/* CSS Animation Classes */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">CSS Animation Classes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Fade In</CardTitle>
              <CardDescription>.animate-fade-in</CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle>Fade In Up</CardTitle>
              <CardDescription>.animate-fade-in-up</CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Slide Up</CardTitle>
              <CardDescription>.animate-slide-up</CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Scale In</CardTitle>
              <CardDescription>.animate-scale-in</CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-bounce-in">
            <CardHeader>
              <CardTitle>Bounce In</CardTitle>
              <CardDescription>.animate-bounce-in</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift cursor-pointer">
            <CardHeader>
              <CardTitle>Hover Lift</CardTitle>
              <CardDescription>.hover-lift (hover me!)</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
