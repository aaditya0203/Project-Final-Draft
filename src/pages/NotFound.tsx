import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-background to-background/60 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
        404
      </p>
      <h1 className="mt-4 text-4xl font-bold text-foreground">
        The blueprint you&apos;re looking for doesn&apos;t exist.
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        The page might have been moved or archived. Let&apos;s get you back to
        the control center.
      </p>
      <img
        src="/placeholder.svg"
        alt="Construction worker illustration"
        className="mt-8 w-full max-w-md"
      />
      <Button asChild size="lg" className="mt-8">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}

