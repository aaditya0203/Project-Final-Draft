import { Toaster as SonnerToaster } from "sonner"

export function Sonner() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "bg-background/90 text-foreground border border-border shadow-xl",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
        },
      }}
    />
  )
}

