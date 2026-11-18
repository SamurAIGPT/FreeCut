import React, { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { projectService } from '@/services/storage/projectService';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { EditorWorkspace } from '@/components/editor/EditorWorkspace';
import { Loader2 } from 'lucide-react';

function parseRouteFromLocation(): { route: 'projects' | 'editor'; projectId: string | null } {
  if (typeof window === 'undefined') {
    return { route: 'projects', projectId: null };
  }

  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Query parameter ?project=... or ?id=...
  const queryProjectId = searchParams.get('project') || searchParams.get('id');
  if (queryProjectId) {
    return { route: 'editor', projectId: queryProjectId };
  }

  // 2. Path /editor/:id
  const editorMatch = pathname.match(/\/editor\/([^/?#]+)/);
  if (editorMatch && editorMatch[1]) {
    return { route: 'editor', projectId: editorMatch[1] };
  }

  // 3. Hash #/editor/:id
  const hashMatch = hash.match(/#\/editor\/([^/?#]+)/);
  if (hashMatch && hashMatch[1]) {
    return { route: 'editor', projectId: hashMatch[1] };
  }

  return { route: 'projects', projectId: null };
}

export const App: React.FC = () => {
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);

  const [currentRoute, setCurrentRoute] = useState<'projects' | 'editor'>(() => {
    return parseRouteFromLocation().route;
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return parseRouteFromLocation().projectId;
  });
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Sync theme with query param or store on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTheme = urlParams.get('theme');
      if (queryTheme === 'light' || queryTheme === 'dark') {
        setTheme(queryTheme);
        return;
      }
    }
    setTheme(theme);
  }, []);

  // Listen for browser popstate navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromLocation();
      setCurrentRoute(parsed.route);
      setActiveProjectId(parsed.projectId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Back to projects handler
  const handleBackToProjects = useCallback(async () => {
    try {
      await useEditorStore.getState().saveCurrentProject();
    } catch {
      // ignore
    }
    useEditorStore.getState().setCurrentProjectId(null);
    setActiveProjectId(null);
    setCurrentRoute('projects');
    window.history.pushState(null, '', '/projects');
  }, []);

  // Open project handler
  const handleOpenProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentRoute('editor');
    window.history.pushState(null, '', `/editor/${projectId}`);
  }, []);

  // Load project record whenever in editor route
  useEffect(() => {
    if (currentRoute === 'editor' && activeProjectId) {
      let isCancelled = false;
      const load = async () => {
        setIsLoadingProject(true);
        try {
          let project = await projectService.getProject(activeProjectId);
          if (!project) {
            // Ensure starter project exists if loading default
            const initialList = await projectService.ensureInitialProjects();
            project = initialList.find((p) => p.id === activeProjectId) || null;
          }

          if (isCancelled) return;

          if (project) {
            useEditorStore.getState().loadProjectRecord(project);
          } else {
            console.warn(`Project ${activeProjectId} not found in storage, returning to projects.`);
            handleBackToProjects();
          }
        } catch (err) {
          console.error('Failed to load project from storage:', err);
          handleBackToProjects();
        } finally {
          if (!isCancelled) {
            setIsLoadingProject(false);
          }
        }
      };

      load();
      return () => {
        isCancelled = true;
      };
    }
  }, [currentRoute, activeProjectId, handleBackToProjects]);

  // Loading Screen for Editor Project
  if (currentRoute === 'editor' && isLoadingProject) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-app-bg text-app-text select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400 dark:text-neutral-500" />
          <p className="text-xs font-semibold text-app-text-muted tracking-wider uppercase">
            Loading Project...
          </p>
        </div>
      </div>
    );
  }

  // Active Editor Workspace
  if (currentRoute === 'editor') {
    return <EditorWorkspace onBackToProjects={handleBackToProjects} />;
  }

  // Projects Dashboard View
  return <ProjectsPage onOpenProject={handleOpenProject} />;
};

export default App;
