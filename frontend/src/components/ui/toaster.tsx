import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

type ToasterProps = {
  position?: "top-center" | "top-right"
  toastOptions?: {
    duration?: number
    style?: React.CSSProperties
  }
}

export function Toaster({ position = "top-right", toastOptions }: ToasterProps) {
  const { toasts } = useToast()
  const viewportClassName =
    position === "top-center"
      ? "fixed top-4 left-1/2 -translate-x-1/2 right-auto sm:bottom-auto sm:right-auto sm:top-4 sm:flex-col md:max-w-[420px]"
      : undefined

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const duration = props.duration ?? toastOptions?.duration
        return (
          <Toast key={id} {...props} duration={duration} style={{ ...toastOptions?.style, ...props.style }}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className={viewportClassName} />
    </ToastProvider>
  )
}
