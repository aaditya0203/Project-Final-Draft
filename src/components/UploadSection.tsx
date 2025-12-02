import { useState } from "react"
import { CloudUpload, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const stages = [
  "Site Prep",
  "Foundation",
  "Structural",
  "Envelope",
  "Interior",
  "Commissioning",
]

export function UploadSection() {
  const { toast } = useToast()
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [project, setProject] = useState("")
  const [stage, setStage] = useState(stages[2])

  const simulateUpload = () => {
    if (!project) {
      toast({
        title: "Add a project name",
        description: "We need a project label before uploading imagery.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          toast({
            title: "Upload complete",
            description: `Images ingested for ${project} — ${stage} analysis ready.`,
          })
          return 100
        }
        return prev + 10
      })
    }, 250)
  }

  return (
    <section
      id="upload"
      className="rounded-3xl border border-border/60 bg-card p-6 shadow-lg"
    >
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Data Ingestion
          </p>
          <h2 className="text-3xl font-bold text-foreground">
            Upload Site Imagery
          </h2>
          <p className="text-muted-foreground">
            Drag and drop drone, mast, or 360 shots. We&apos;ll normalize,
            align, and push them through the AI pipeline instantly.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <CloudUpload className="h-4 w-4" />
          View SFTP Instructions
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="project">Project name</Label>
            <Input
              id="project"
              placeholder="Aurora Tower"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="stage">Construction stage</Label>
            <select
              id="stage"
              className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              {stages.map((item) => (
                <option
                  className="bg-background text-foreground"
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any context for this batch of images?"
            />
          </div>

          <Button
            className="w-full gap-2"
            disabled={uploading}
            onClick={simulateUpload}
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Uploading" : "Start Upload"}
          </Button>

          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Pipeline progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="mt-2" />
          </div>
        </div>

        <label
          htmlFor="drop"
          className="flex h-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 p-10 text-center"
        >
          <input id="drop" type="file" className="hidden" multiple />
          <CloudUpload className="h-10 w-10 text-primary" />
          <p className="mt-4 text-lg font-semibold">Drop images here</p>
          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, TIFF • Max 4GB per batch
          </p>
        </label>
      </div>
    </section>
  )
}

