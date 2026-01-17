import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // STACKING RULE: Overlay must be z-40 (L2 - Backdrops/Dimming) per ARCHITECTURE_RULES.md §5.1-5.2
      // twMerge ensures consumer className cannot override this z-index
      "fixed inset-0 z-40 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Dev-only z-index regression guard (does not run in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const checkZIndexStacking = () => {
      if (!contentRef.current || !overlayRef.current) return;

      // Only check when dialog is open
      const isOpen = contentRef.current.getAttribute('data-state') === 'open';
      if (!isOpen) return;

      const contentStyle = window.getComputedStyle(contentRef.current);
      const overlayStyle = window.getComputedStyle(overlayRef.current);

      const contentZIndex = parseInt(contentStyle.zIndex || '0', 10);
      const overlayZIndex = parseInt(overlayStyle.zIndex || '0', 10);

      // Warn if overlay z-index is >= content z-index (content should always be above overlay)
      if (overlayZIndex >= contentZIndex) {
        console.warn(
          '[Dialog z-index regression detected]',
          `Overlay z-index (${overlayZIndex}) >= Content z-index (${contentZIndex}). ` +
          `Expected: Overlay z-40 (${40}), Content z-70 (${70}). ` +
          `Check Dialog component z-index classes and ensure Tailwind config includes z-70.`
        );
      }
    };

    // Check after DOM and styles are applied
    const timeoutId = setTimeout(checkZIndexStacking, 100);

    // Watch for dialog state changes
    let observer: MutationObserver | null = null;
    const setupObserver = () => {
      if (contentRef.current && !observer) {
        observer = new MutationObserver(() => {
          setTimeout(checkZIndexStacking, 50);
        });
        observer.observe(contentRef.current, {
          attributes: true,
          attributeFilter: ['data-state'],
        });
      }
    };

    // Setup observer with retry if ref not ready (refs are set after render)
    const retryTimeoutId = setTimeout(setupObserver, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(retryTimeoutId);
      observer?.disconnect();
    };
  }, []);

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  return (
    <DialogPortal>
      {/* STACKING RULE: Overlay renders FIRST in DOM (lower in stacking order) with z-40 */}
      <DialogOverlay ref={overlayRef} />
      {/* STACKING RULE: Content renders SECOND in DOM (higher in stacking order) with z-70 */}
      <DialogPrimitive.Content
        ref={composedRef}
        className={cn(
          // STACKING RULE: Content must be z-70 (L5 - Modals/Dialogs) per ARCHITECTURE_RULES.md §5.1-5.2
          // twMerge ensures consumer className cannot override this z-index
          "fixed left-[50%] top-[50%] z-70 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}

