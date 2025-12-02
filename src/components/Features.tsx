import {
  Brain,
  ChartArea,
  CloudUpload,
  FileBarChart,
  Lock,
  Microscope,
  Radar,
  Sparkles,
  Users,
} from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Image Processing",
    description: "High fidelity OpenCV pipelines clean and align daily captures.",
    icon: Microscope,
  },
  {
    title: "ML Analysis",
    description: "Custom vision models segment stages and detect anomalies.",
    icon: Brain,
  },
  {
    title: "SSIM Progress Tracking",
    description: "Structural similarity scores quantify delta vs. baseline.",
    icon: ChartArea,
  },
  {
    title: "Secure Data",
    description: "SOC2 compliant encryption in-flight and at rest.",
    icon: Lock,
  },
  {
    title: "Real-time Monitoring",
    description: "Stream updates directly from drones & 360 cameras.",
    icon: Radar,
  },
  {
    title: "Collaboration",
    description: "Share annotated progress with owners and GCs instantly.",
    icon: Users,
  },
  {
    title: "Automated Reports",
    description: "Weekly PDF summaries with AI callouts delivered inbox-ready.",
    icon: FileBarChart,
  },
  {
    title: "Accuracy",
    description: "Model ensemble + QA reviewers keep accuracy above 98%.",
    icon: Sparkles,
  },
  {
    title: "Predictive Analytics",
    description: "Machine learning predicts schedule risk before it hits.",
    icon: CloudUpload,
  },
]

const stack = [
  "OpenCV",
  "PyTorch",
  "TensorRT",
  "Supabase",
  "AWS",
  "React + Vite",
  "TailwindCSS",
  "Shadcn UI",
  "TanStack Query",
]

export function Features() {
  return (
    <section id="features" className="space-y-10 rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="secondary">Product Features</Badge>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            AI copilots for every construction milestone
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every module is purpose-built for field teams, schedulers, and owners to stay aligned on what&apos;s
            happening across each project in near real-time.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-border/70">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Technology Stack
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-sm font-medium"
            >
              {item}
              <span className="text-xs text-primary">Ready</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

