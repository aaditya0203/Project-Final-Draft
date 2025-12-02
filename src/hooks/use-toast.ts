// Forked from shadcn/ui - https://github.com/shadcn/ui
import * as React from "react"

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
}

type ToastOptions = Omit<ToasterToast, "id">

type ToastContextType = {
  toasts: ToasterToast[]
  toast: (toast: ToastOptions) => { id: string; dismiss: () => void }
  dismiss: (toastId: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const dismiss = React.useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const toast = React.useCallback(
    (toastData: ToastOptions) => {
      const id = crypto.randomUUID()
      const duration = toastData.duration ?? 4000
      setToasts((current) => [...current, { id, ...toastData }])
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
      return {
        id,
        dismiss: () => dismiss(id),
      }
    },
    [dismiss],
  )

  return React.createElement(
    ToastContext.Provider,
    { value: { toasts, toast, dismiss } },
    children,
  )
}

export type { ToasterToast }

