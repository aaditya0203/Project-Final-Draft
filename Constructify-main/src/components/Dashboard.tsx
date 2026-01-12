import { Activity, AlertTriangle, Layers, RefreshCw } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import constructionHero from "@/assets/construction-hero.jpg"
import progressComparison from "@/assets/progress-comparison.jpg"

const kpis = [
  {
    label: "Active Projects",
    value: "42",
    change: "+4 this week",
    icon: Layers,
  },
  {
    label: "Images Processed",
    value: "18,240",
    change: "↑ 12% WoW",
    icon: RefreshCw,
  },
  {
    label: "Accuracy",
    value: "98.4%",
    change: "Target 99%",
    icon: Activity,
  },
  {
    label: "Alerts",
    value: "12",
    change: "4 high priority",
    icon: AlertTriangle,
  },
]

const projects = [
  {
    name: "Aurora Tower",
    stage: "Structural",
    progress: 72,
    ssim: 0.93,
    updated: "2h ago",
  },
  {
    name: "Harbor Logistics Hub",
    stage: "Envelope",
    progress: 54,
    ssim: 0.88,
    updated: "5h ago",
  },
  {
    name: "Northbridge Stadium",
    stage: "Interior",
    progress: 63,
    ssim: 0.91,
    updated: "Today",
  },
]

export function Dashboard() {
  return (
    <section
      id="dashboard"
      className="space-y-8 rounded-3xl border border-border/60 bg-background p-6 shadow-inner"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline">Operations Control</Badge>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            Unified AI Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track SSIM deltas, flagged issues, and completion velocities in a
            single pane of glass.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border border-border/70 px-3 py-1">
            Data refresh: 5 min
          </span>
          <span className="rounded-full border border-border/70 px-3 py-1">
            SLA: 99.9%
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Project Tracker</CardTitle>
            <CardDescription>SSIM monitors versus target schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.name}
                className="rounded-2xl border border-border/60 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{project.name}</p>
                  <Badge variant="secondary">{project.stage}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Last updated {project.updated}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Completion</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="mt-2 h-2" />
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 text-sm">
                    <p className="text-muted-foreground">SSIM Score</p>
                    <p className="text-2xl font-semibold text-primary">
                      {project.ssim.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.ssim > 0.9
                        ? "High fidelity match"
                        : "Review recommended"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Progress Analysis</CardTitle>
            <CardDescription>
              Computer vision alignment with manual verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="before">
              <TabsList className="w-full">
                <TabsTrigger value="before" className="flex-1">
                  Before
                </TabsTrigger>
                <TabsTrigger value="after" className="flex-1">
                  After
                </TabsTrigger>
              </TabsList>
              <TabsContent value="before">
                <img
                  src={constructionHero}
                  alt="Before progress"
                  className="rounded-2xl border border-border object-cover"
                />
              </TabsContent>
              <TabsContent value="after">
                <img
                  src={progressComparison}
                  alt="After progress"
                  className="rounded-2xl border border-border object-cover"
                />
              </TabsContent>
            </Tabs>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
              <p className="font-semibold">AI Notes</p>
              <p className="text-muted-foreground">
                Envelope install accelerated 14% after crew expansion. SSIM 0.92
                confirms structural alignment across 340 checkpoints.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

