import { cn } from "@/lib/utils";

/**
 * Spinner Component
 * A circular loading spinner with customizable size
 */
interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Dots Loader Component
 * Three animated dots for loading indication
 */
interface DotsLoaderProps {
  className?: string;
}

export function DotsLoader({ className }: DotsLoaderProps) {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
    </div>
  );
}

/**
 * Progress Bar Component
 * A linear progress indicator
 */
interface ProgressBarProps {
  value?: number; // 0-100
  indeterminate?: boolean;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  className,
  barClassName,
}: ProgressBarProps) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all duration-300 ease-out",
          indeterminate && "animate-shimmer",
          barClassName
        )}
        style={
          indeterminate
            ? undefined
            : { width: `${Math.min(100, Math.max(0, value))}%` }
        }
      />
    </div>
  );
}

/**
 * Pulse Loader Component
 * Pulsing circles for loading indication
 */
interface PulseLoaderProps {
  className?: string;
}

export function PulseLoader({ className }: PulseLoaderProps) {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <div className="h-3 w-3 animate-pulse rounded-full bg-current"></div>
      <div className="h-3 w-3 animate-pulse rounded-full bg-current delay-75"></div>
      <div className="h-3 w-3 animate-pulse rounded-full bg-current delay-150"></div>
    </div>
  );
}

/**
 * Loading Overlay Component
 * Full-screen or container overlay with loading indicator
 */
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  visible,
  message,
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-10",
        "animate-fade-in",
        className
      )}
    >
      <Spinner size="lg" className="text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-fade-in delay-100">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Button Loading State Component
 * Spinner specifically sized for buttons
 */
interface ButtonLoaderProps {
  className?: string;
}

export function ButtonLoader({ className }: ButtonLoaderProps) {
  return (
    <Spinner size="sm" className={cn("mr-2", className)} />
  );
}
