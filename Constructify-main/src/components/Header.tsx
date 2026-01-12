import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const links = [
  { label: "Home", id: "home" },
  { label: "Dashboard", id: "dashboard" },
  { label: "Upload", id: "upload" },
  { label: "Features", id: "features" },
]

type HeaderProps = {
  sticky?: boolean
}

export function Header({ sticky = true }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useMobile()
  const location = useLocation()

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      setOpen(false)
    }
  }

  const isLanding = location.pathname === "/"

  return (
    <header
      className={cn(
        "top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        sticky ? "sticky" : "",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            CAI
          </div>
          <div>
            <p className="text-base font-semibold leading-tight">
              ConstructAI
            </p>
            <p className="text-xs text-muted-foreground -mt-1">
              Progress Monitoring
            </p>
          </div>
        </Link>

        {isLanding && !isMobile && (
          <nav className="flex items-center gap-8">
            {links.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="hidden sm:flex">
            <Link to="/signup">Get Started</Link>
          </Button>
          {isLanding && isMobile && (
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {isLanding && isMobile && open && (
        <div className="border-t border-border/40 bg-background/95 px-4 py-4 shadow-lg">
          <nav className="flex flex-col space-y-2">
            {links.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="rounded-md px-3 py-3 text-left text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </button>
            ))}
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="w-full justify-start">
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

