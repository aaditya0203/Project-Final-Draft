import { useState } from 'react';
import { UploadSection } from '@/components/UploadSection';
import { Dashboard } from '@/components/Dashboard';
import { ProjectsList } from '@/components/ProjectsList';
import { Welcome } from '@/components/Welcome';
import { AuthScreen } from '@/components/AuthScreen';
import { About } from '@/components/About';
import { TrainingPage } from '@/components/TrainingPage';
import { Navbar } from '@/components/Navbar';
// Removed unused Signout import
import { AnimatePresence, motion } from 'framer-motion';
import { AuthTransition } from '@/components/AuthTransition';
import Chatbot from '@/components/Chatbot';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';

function App() {
  const [view, setView] = useState<string>('welcome');
  const [isAuth, setIsAuth] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

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
          ? new Date(fullProjectData.latestAnalysis.analyzed_at).toLocaleString()
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

  const ensureAuth = (target: 'upload' | 'projects') => {
    if (!isAuth) {
      setView('auth');
    } else {
      setView(target);
    }
  };

  const handleLogout = () => {
    setIsAuth(false);
    setProjectData(null);
    setView('welcome');
  };

  const AuthenticatedLayout = ({ children, viewKey }: { children: React.ReactNode, viewKey: string }) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated font-sans text-foreground antialiased">
      {/* Floating background circles */}
      <div className="absolute -left-[15%] -top-[15%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute -bottom-[15%] -right-[15%] h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[120px] animate-float pointer-events-none" />

      <Navbar
        currentView={view}
        isAuthenticated={isAuth}
        onNavigate={(v) => {
          if (['projects', 'upload'].includes(v)) {
            ensureAuth(v as any);
          } else {
            setView(v);
          }
        }}
        onLogout={handleLogout}
        className="relative z-50"
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 relative z-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
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
          <Welcome
            onGetStarted={() => setView('auth')}
            currentView={view}
            isAuthenticated={isAuth}
            onNavigate={(v) => {
              if (['projects', 'upload'].includes(v)) {
                ensureAuth(v as any);
              } else {
                setView(v);
              }
            }}
            onLogout={handleLogout}
          />
        </AuthTransition>
      )}
      {view === 'auth' && (
        <AuthTransition>
          <AuthScreen
            onLoginSuccess={() => {
              setIsAuth(true);
              setView('projects');
            }}
            onBack={() => setView('welcome')}
          />
        </AuthTransition>
      )}

      {view === 'projects' && (
        <AuthenticatedLayout viewKey="projects">
          <ProjectsList onSelectProject={handleSelectProject} onBack={() => setView('dashboard')} />
        </AuthenticatedLayout>
      )}

      {view === 'upload' && (
        <AuthenticatedLayout viewKey="upload">
          <div className="mx-auto max-w-4xl">
            <UploadSection onUploadComplete={handleUploadComplete} onBack={() => setView('dashboard')} />
          </div>
        </AuthenticatedLayout>
      )}

      {view === 'dashboard' && (
        <AuthenticatedLayout viewKey="dashboard">
          <Dashboard
            projectData={projectData}
            isAuthenticated={isAuth}
            onBack={() => setView(isAuth ? 'projects' : 'welcome')}
          />
        </AuthenticatedLayout>
      )}

      {view === 'about' && (
        <AuthenticatedLayout viewKey="about">
          <About onBack={() => setView('dashboard')} />
        </AuthenticatedLayout>
      )}

      {view === 'training' && (
        <AuthenticatedLayout viewKey="training">
          <TrainingPage onBack={() => setView('dashboard')} />
        </AuthenticatedLayout>
      )}
      <Chatbot
        isAuthenticated={isAuth}
        currentView={view}
        projectData={projectData}
      />
      {isAuth && view === 'projects' && <OnboardingTutorial />}
    </AnimatePresence>
  );
}

export default App;
