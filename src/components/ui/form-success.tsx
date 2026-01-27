import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormSuccessProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

const FormSuccess = React.forwardRef<HTMLParagraphElement, FormSuccessProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm font-medium text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1",
          className
        )}
        {...props}
      >
        <svg
          className="h-4 w-4 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {children}
      </p>
    )
  }
)
FormSuccess.displayName = "FormSuccess"

export { FormSuccess }
