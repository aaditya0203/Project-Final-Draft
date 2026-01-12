import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/80">
      <div className="container flex flex-col gap-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} ConstructAI. Precision progress monitoring
          for modern construction teams.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/login" className="hover:text-primary">
            Login
          </Link>
          <Link to="/signup" className="hover:text-primary">
            Signup
          </Link>
          <a href="https://docs.constructai.io" className="hover:text-primary">
            API Docs
          </a>
          <a href="mailto:hello@constructai.io" className="hover:text-primary">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

