import { Dashboard } from "@/components/Dashboard"
import { Features } from "@/components/Features"
import { Footer } from "@/components/Footer"
import { Hero } from "@/components/Hero"
import { UploadSection } from "@/components/UploadSection"

export function IndexPage() {
  return (
    <>
      <main className="container space-y-16 py-12">
        <Hero />
        <Dashboard />
        <UploadSection />
        <Features />
      </main>
      <Footer />
    </>
  )
}

