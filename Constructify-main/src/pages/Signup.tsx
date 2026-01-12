import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SignupPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({ password: "", confirm: "" })

  const handleSignup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (passwords.password !== passwords.confirm) {
      toast({
        title: "Passwords don’t match",
        description: "Make sure both password fields are identical.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Account created",
        description: "We just provisioned a ConstructAI workspace for you.",
      })
    }, 2200)
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Create your workspace</CardTitle>
          <CardDescription>
            Invite your field teams, automate reporting, and keep every project on schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Alex Carpenter" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Skyline Builders" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={passwords.password}
                onChange={(event) =>
                  setPasswords((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={passwords.confirm}
                onChange={(event) =>
                  setPasswords((prev) => ({ ...prev, confirm: event.target.value }))
                }
              />
            </div>
            <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground">
              <input type="checkbox" required className="mt-1" />
              <span>
                I agree to the ConstructAI{" "}
                <a href="#" className="text-primary underline-offset-4 hover:underline">
                  Terms &amp; Privacy
                </a>
              </span>
            </label>
            <Button className="md:col-span-2 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? "Provisioning workspace..." : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

