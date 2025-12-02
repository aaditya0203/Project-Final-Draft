import { ArrowRight, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import constructionHero from "@/assets/construction-hero.jpg"

const stats = [
  { label: "AI Accuracy", value: "98.4%" },
  { label: "Projects Tracked", value: "320+" },
  { label: "System Uptime", value: "99.9%" },
]

export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl"
    >
      <div className="absolute inset-0">
        <img
          src={constructionHero}
          alt="AI assisted construction site"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
      </div>

      <div className="relative z-10 grid gap-8 px-6 py-16 md:grid-cols-[1.2fr,0.8fr] md:px-12 md:py-20">
        <div className="space-y-6">
          <Badge className="bg-primary/15 text-primary">
            AI Construction Intelligence
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Real-time Construction Progress Powered by Vision AI
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            ConstructAI ingests daily site imagery, runs OpenCV + ML analysis,
            and surfaces SSIM-powered progress insights so you can keep every
            build on schedule.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2">
              Start Monitoring <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              View Demo
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/50 bg-background/80 p-5 backdrop-blur"
              >
                <p className="text-2xl font-semibold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold text-muted-foreground">
            Live AI Insights
          </p>
          <div className="mt-4 grid gap-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-muted-foreground">Vision Model</p>
                <p className="font-semibold">OpenCV + Custom CNN</p>
              </div>
              <span className="text-xs font-semibold text-primary">
                Optimized
              </span>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-muted-foreground">Progress Momentum</p>
              <p className="text-3xl font-bold text-primary">+14% ↑</p>
              <p className="text-xs text-muted-foreground">
                Week over week site completion delta
              </p>
            </div>
            <div className="space-y-3">
              {["Foundation", "Structure", "Envelope"].map((stage, index) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stage}</span>
                    <span>{70 + index * 8}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      style={{ width: `${70 + index * 8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

