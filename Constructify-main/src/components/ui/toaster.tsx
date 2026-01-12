import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <RadixToastProvider>
      {toasts.map(function ({ id, title, description, action, variant }) {
        return (
          <Toast key={id} variant={variant}>
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action ? <ToastAction altText="Toast action">{action}</ToastAction> : null}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        )
      })}
      <ToastViewport />
    </RadixToastProvider>
  )
}

