import { useState } from 'react';
import { UploadSection } from '@/components/UploadSection';
import { Dashboard } from '@/components/Dashboard';
import { ProjectsList } from '@/components/ProjectsList';
import { Welcome } from '@/components/Welcome';
import { Login } from '@/components/Login';
import { Signup } from '@/components/Signup';
import { ResetPassword } from '@/components/ResetPassword';
// Removed unused Signout import
import { Button } from '@/components/ui/button';
import { HardHat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthTransition } from '@/components/AuthTransition';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function App() {
  const [view, setView] = useState<string>('welcome');
  const [isAuth, setIsAuth] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Check for reset password URL
  useState(() => {
    if (window.location.pathname === '/reset-password') {
      setView('reset-password');
    }
  });

  const handleUploadComplete = (data: any) => {
    setProjectData(data);
    setView('dashboard');
  };

  const handleSelectProject = async (project: any) => {
    try {
      // Fetch full project details including analysis data
      const api = (await import('@/services/api')).default;
      const fullProjectData = await api.getProject(project.id);

      // Transform the data to match Dashboard expectations
      const transformedData = {
        id: fullProjectData.project.id,
        project: fullProjectData.project.name,
        stage: fullProjectData.project.stage || 'Planning',
        location: fullProjectData.project.location,
        description: fullProjectData.project.description,
        updated: fullProjectData.latestAnalysis
          ? new Date(fullProjectData.latestAnalysis.created_at).toLocaleString()
          : 'No analysis yet',
        progress: fullProjectData.latestAnalysis?.progress_percentage || 0,
        ssim: fullProjectData.latestAnalysis?.confidence_score || 0,
        aiAnalysis: fullProjectData.latestAnalysis ? {
          structural: Object.entries(fullProjectData.latestAnalysis.structural_elements || {})
            .filter(([_, count]) => (count as number) > 0)
            .map(([type, count]) => `${count} ${type}`),
          safety: fullProjectData.latestAnalysis.safety_issues?.length > 0
            ? fullProjectData.latestAnalysis.safety_issues.map((issue: any) => issue.description)
            : ['No safety issues detected'],
          weather: fullProjectData.latestAnalysis.weather_conditions || 'Unknown',
          confidence: `${(fullProjectData.latestAnalysis.confidence_score * 100).toFixed(1)}%`,
        } : null,
        timeEstimate: fullProjectData.latestAnalysis?.time_estimate_days,
        progressHistory: fullProjectData.progressHistory || [],
      };

      setProjectData(transformedData);
      setView('dashboard');
    } catch (error: any) {
      console.error('Failed to load project details:', error);
      // Fall back to basic project data if fetch fails
      setProjectData(project);
      setView('dashboard');
    }
  };

  const ensureAuth = (target: 'upload' | 'dashboard' | 'projects') => {
    if (!isAuth) {
      setView('login');
    } else {
      setView(target);
    }
  };

  // Signout handling moved to the button click handler directly

  // Navbar component used for authenticated pages
  const Navbar = (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass supports-[backdrop-filter]:bg-background/20">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 font-bold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setView('welcome')} role="button">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary animate-pulse-glow">
            <HardHat className="h-5 w-5" />
          </div>
          <span className="text-gradient font-extrabold">Constructify</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {isAuth ? (
            <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
              <DialogTrigger asChild>
                <Button variant="ghost" className={`hover:bg-primary/10 hover:text-primary transition-colors ${view === 'signout' ? 'bg-primary/10 text-primary' : ''}`}>Sign Out</Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Sign Out</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to sign out? You will need to log in again to access your projects.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSignOutConfirm(false)} className="hover:bg-white/5">Cancel</Button>
                  <Button variant="destructive" onClick={() => {
                    setShowSignOutConfirm(false);
                    // Handle signout directly
                    setIsAuth(false);
                    setProjectData(null);
                    setView('welcome');
                  }}>Sign Out</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setView('login')} className="hover:bg-primary/10 hover:text-primary">Login</Button>
              <Button variant="ghost" onClick={() => setView('signup')} className="hover:bg-primary/10 hover:text-primary">Sign Up</Button>
            </>
          )}
          <Button variant="ghost" onClick={() => ensureAuth('projects')} className={`hover:bg-primary/10 hover:text-primary transition-colors ${view === 'projects' ? 'bg-primary/10 text-primary' : ''}`}>Projects</Button>
          <Button variant="ghost" onClick={() => ensureAuth('upload')} className={`hover:bg-primary/10 hover:text-primary transition-colors ${view === 'upload' ? 'bg-primary/10 text-primary' : ''}`}>New Analysis</Button>
          <Button variant="ghost" onClick={() => ensureAuth('dashboard')} className={`hover:bg-primary/10 hover:text-primary transition-colors ${view === 'dashboard' ? 'bg-primary/10 text-primary' : ''}`}>Dashboard</Button>
        </nav>
      </div>
    </header>
  );

  const AuthenticatedLayout = ({ children, viewKey }: { children: React.ReactNode, viewKey: string }) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated font-sans text-foreground antialiased">
      {/* Floating background circles */}
      <div className="absolute -left-[15%] -top-[15%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute -bottom-[15%] -right-[15%] h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[120px] animate-float pointer-events-none" />

      {Navbar}
      <main className="container relative z-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {view === 'welcome' && (
        <AuthTransition>
          <Welcome onGetStarted={() => setView('login')} />
        </AuthTransition>
      )}
      {view === 'login' && (
        <AuthTransition>
          <Login
            onLoginSuccess={() => {
              setIsAuth(true);
              setView('projects');
            }}
            onSwitchToSignup={() => setView('signup')}
          />
        </AuthTransition>
      )}
      {view === 'signup' && (
        <AuthTransition>
          <Signup
            onSignupSuccess={() => {
              setIsAuth(true);
              setView('projects');
            }}
            onSwitchToLogin={() => setView('login')}
          />
        </AuthTransition>
      )}

      {view === 'reset-password' && (
        <AuthTransition>
          <ResetPassword
            onSuccess={() => {
              setView('login');
              // Clear URL
              window.history.pushState({}, '', '/');
            }}
          />
        </AuthTransition>
      )}

      {view === 'projects' && (
        <AuthenticatedLayout viewKey="projects">
          <ProjectsList onSelectProject={handleSelectProject} />
        </AuthenticatedLayout>
      )}

      {view === 'upload' && (
        <AuthenticatedLayout viewKey="upload">
          <div className="mx-auto max-w-4xl">
            <UploadSection onUploadComplete={handleUploadComplete} />
          </div>
        </AuthenticatedLayout>
      )}

      {view === 'dashboard' && (
        <AuthenticatedLayout viewKey="dashboard">
          <Dashboard
            projectData={projectData}
            onBack={() => setView('projects')}
          />
        </AuthenticatedLayout>
      )}
    </AnimatePresence>
  );
}

export default App;
