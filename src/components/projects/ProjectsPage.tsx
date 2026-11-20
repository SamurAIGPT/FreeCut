import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Scissors, Plus, Search, Grid, List, Moon, Sun, 
  MoreVertical, Copy, Trash2, Edit3, Play, Clock, 
  Film, AlertCircle, Info
} from 'lucide-react';
import { ProjectRecord, projectService, ProjectSortOption } from '@/services/storage/projectService';
import { useEditorStore } from '@/store/useEditorStore';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { formatTimecode } from '@/utils/time';

interface ProjectsPageProps {
  onOpenProject: (projectId: string) => void;
}

const SORT_OPTIONS: SelectOption<ProjectSortOption>[] = [
  { value: 'updatedAt-desc', label: 'Last Modified (Newest)' },
  { value: 'updatedAt-asc', label: 'Last Modified (Oldest)' },
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'name-desc', label: 'Name (Z to A)' },
  { value: 'duration-desc', label: 'Duration (Longest)' },
  { value: 'duration-asc', label: 'Duration (Shortest)' },
];

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<ProjectSortOption>('updatedAt-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dialog and menu states
  const [renamingProject, setRenamingProject] = useState<ProjectRecord | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingProject, setDeletingProject] = useState<ProjectRecord | null>(null);
  const [infoProject, setInfoProject] = useState<ProjectRecord | null>(null);
  const [menuState, setMenuState] = useState<{
    project: ProjectRecord;
    anchorRect: DOMRect;
  } | null>(null);

  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);

  // Close floating portal menu on window resize or scroll
  useEffect(() => {
    const handleDismiss = () => setMenuState(null);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, []);

  // Load and seed projects
  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await projectService.ensureInitialProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return projectService.sortProjects(result, sortOption);
  }, [projects, searchQuery, sortOption]);

  // Actions
  const handleCreateNewProject = async () => {
    try {
      const newProj = await projectService.createProject({
        name: `Untitled Project ${projects.length + 1}`,
        aspectRatio: '16:9',
        fps: 30,
      });
      onOpenProject(newProj.id);
    } catch (err) {
      console.error('Failed to create new project:', err);
    }
  };

  const handleDuplicate = async (project: ProjectRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuState(null);
    try {
      const dup = await projectService.duplicateProject(project.id);
      setProjects((prev) => [dup, ...prev]);
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      await projectService.deleteProject(deletingProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleRenameConfirm = async () => {
    if (!renamingProject || !renameInput.trim()) return;
    try {
      await projectService.renameProject(renamingProject.id, renameInput.trim());
      setProjects((prev) =>
        prev.map((p) =>
          p.id === renamingProject.id ? { ...p, name: renameInput.trim(), updatedAt: new Date().toISOString() } : p
        )
      );
      setRenamingProject(null);
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-y-auto bg-app-bg text-app-text select-none transition-colors duration-200">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-app-border bg-app-surface/90 px-4 sm:px-6 backdrop-blur-md gap-2">
        {/* Left: Brand Logo & Breadcrumb */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-bold shadow-sm">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-app-text">
              FreeCut
              <span className="ml-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-200/60 dark:bg-neutral-800/80 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-app-text-muted">
                PRO
              </span>
            </span>
          </div>

          <span className="text-app-text-muted/60 hidden sm:inline">/</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted hidden sm:inline">
            Projects
          </span>
        </div>

        {/* Center: Search Bar */}
        <div className="flex flex-1 max-w-xs md:max-w-sm mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-app-border bg-app-elevated pl-9 pr-3 py-1.5 text-xs text-app-text placeholder:text-app-text-muted focus:border-neutral-400 dark:focus:border-neutral-600 focus:bg-app-surface focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort Selector */}
          <div className="w-40 sm:w-48">
            <CustomSelect<ProjectSortOption>
              value={sortOption}
              options={SORT_OPTIONS}
              onChange={setSortOption}
              size="sm"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-app-border bg-app-elevated p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`rounded p-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`rounded p-1 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center rounded-lg border border-app-border bg-app-elevated p-0.5">
            <button
              onClick={() => setTheme('dark')}
              className={`rounded p-1 transition cursor-pointer ${theme === 'dark' ? 'bg-neutral-800 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'}`}
              title="Dark Mode"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`rounded p-1 transition cursor-pointer ${theme === 'light' ? 'bg-white text-neutral-900 shadow-xs' : 'text-app-text-muted hover:text-app-text'}`}
              title="Light Mode"
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>

          {/* Primary Create Button */}
          <button
            onClick={handleCreateNewProject}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-text">All Projects</h1>
            <p className="text-xs text-app-text-muted mt-0.5">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} saved locally in your browser
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="aspect-video w-full rounded-2xl bg-app-elevated" />
                <div className="h-4 w-3/4 rounded bg-app-elevated" />
                <div className="h-3 w-1/2 rounded bg-app-elevated" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-elevated text-app-text-muted mb-3">
              <Film className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-app-text">No projects found</h3>
            <p className="text-xs text-app-text-muted max-w-sm mt-1 mb-5">
              {searchQuery ? `No project matched "${searchQuery}". Try a different search term.` : 'Create your first video project to get started with professional timeline editing.'}
            </p>
            <button
              onClick={handleCreateNewProject}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= GRID VIEW ================= */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProjects.map((project) => {
              const isMenuOpen = menuState?.project.id === project.id;

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col cursor-pointer"
                  onClick={() => onOpenProject(project.id)}
                >
                  {/* Thumbnail Card with Clean Rounded Borders */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-app-border shadow-xs group-hover:border-neutral-400 dark:group-hover:border-neutral-600 transition">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-slate-900">
                        <Film className="h-10 w-10 text-neutral-600 group-hover:text-neutral-400 transition" />
                      </div>
                    )}

                    {/* Top Aspect Ratio Pill */}
                    <div className="absolute left-2.5 top-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                      {project.aspectRatio || '16:9'}
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-xs">
                      <Clock className="h-2.5 w-2.5 text-neutral-400" />
                      {formatTimecode(project.duration || 10)}
                    </div>

                    {/* Center Play Button Overlay on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transform group-hover:scale-110 transition">
                        <Play className="h-5 w-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    {/* Three-dots menu button on top-right of thumbnail */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMenuOpen) {
                          setMenuState(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuState({ project, anchorRect: rect });
                        }
                      }}
                      className={`absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition cursor-pointer ${
                        isMenuOpen ? 'opacity-100 ring-1 ring-white/40' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Project Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Project Info Below Thumbnail */}
                  <div className="pt-2.5 px-0.5 flex flex-col gap-0.5">
                    <h3
                      className="truncate text-sm font-semibold text-app-text group-hover:text-blue-500 transition"
                      title={project.name}
                    >
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-app-text-muted">
                      <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                      <span>•</span>
                      <span>{project.clips?.length || 0} clips</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= LIST VIEW ================= */
          <div className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 gap-4 border-b border-app-border bg-app-elevated px-4 py-2.5 text-xs font-semibold text-app-text-muted uppercase tracking-wider">
              <div className="col-span-6">Project</div>
              <div className="col-span-2">Ratio</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-app-border">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-app-elevated transition cursor-pointer"
                >
                  {/* Title & Thumbnail */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <div className="relative aspect-video h-11 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-900 border border-app-border">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-4 w-4 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-app-text">{project.name}</p>
                      <p className="text-[11px] text-app-text-muted">
                        Updated {formatRelativeTime(project.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Ratio */}
                  <div className="col-span-2 text-xs font-medium text-app-text-muted">
                    <span className="rounded bg-app-elevated px-2 py-0.5 border border-app-border">
                      {project.aspectRatio || '16:9'}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 text-xs font-mono font-medium text-app-text">
                    {formatTimecode(project.duration || 10)}
                  </div>

                  {/* Actions */}
                  <div
                    className="col-span-2 flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenamingProject(project);
                        setRenameInput(project.name);
                      }}
                      className="rounded p-1 text-app-text-muted hover:text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="Rename"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(project, e)}
                      className="rounded p-1 text-app-text-muted hover:text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProject(project)}
                      className="rounded p-1 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ================= FLOATING PORTAL DROPDOWN MENU ================= */}
      {menuState && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setMenuState(null)}
        >
          <div
            style={{
              position: 'fixed',
              left: Math.max(12, Math.min(window.innerWidth - 190, menuState.anchorRect.right - 180)),
              top:
                menuState.anchorRect.bottom + 180 > window.innerHeight
                  ? Math.max(10, menuState.anchorRect.top - 170)
                  : menuState.anchorRect.bottom + 6,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-44 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 shadow-2xl text-neutral-900 dark:text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => {
                const pid = menuState.project.id;
                setMenuState(null);
                onOpenProject(pid);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Open in Editor</span>
            </button>

            <button
              onClick={(e) => {
                const proj = menuState.project;
                setMenuState(null);
                handleDuplicate(proj, e);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                const proj = menuState.project;
                setMenuState(null);
                setRenamingProject(proj);
                setRenameInput(proj.name);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Rename</span>
            </button>

            <button
              onClick={() => {
                const proj = menuState.project;
                setMenuState(null);
                setInfoProject(proj);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Project Info</span>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            <button
              onClick={() => {
                const proj = menuState.project;
                setMenuState(null);
                setDeletingProject(proj);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ================= RENAME MODAL ================= */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-app-text">Rename Project</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') setRenamingProject(null);
              }}
              autoFocus
              className="w-full rounded-xl border border-app-border bg-app-elevated px-3.5 py-2 text-sm text-app-text focus:border-neutral-400 dark:focus:border-neutral-600 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenamingProject(null)}
                className="rounded-lg border border-app-border px-4 py-2 text-xs font-semibold text-app-text hover:bg-app-elevated transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameConfirm}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-app-text">Delete Project</h3>
            </div>
            <p className="text-xs text-app-text-muted">
              Are you sure you want to delete <strong className="text-app-text">{deletingProject.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setDeletingProject(null)}
                className="rounded-lg border border-app-border px-4 py-2 text-xs font-semibold text-app-text hover:bg-app-elevated transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= PROJECT INFO MODAL ================= */}
      {infoProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setInfoProject(null)}>
          <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-app-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-app-text">{infoProject.name}</h3>
                <p className="text-[11px] text-app-text-muted">Project Metadata & Specifications</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Duration:</span>
                <span className="font-mono font-semibold text-app-text">{formatTimecode(infoProject.duration || 10)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Aspect Ratio:</span>
                <span className="rounded bg-app-elevated px-2 py-0.5 font-medium text-app-text">{infoProject.aspectRatio || '16:9'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Frame Rate:</span>
                <span className="font-mono text-app-text">{infoProject.fps || 30} FPS</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Clips Count:</span>
                <span className="font-mono text-app-text">{infoProject.clips?.length || 0} clips</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Tracks Count:</span>
                <span className="font-mono text-app-text">{infoProject.tracks?.length || 0} tracks</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/40">
                <span className="text-app-text-muted">Created:</span>
                <span className="text-app-text">{new Date(infoProject.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-app-text-muted">Last Modified:</span>
                <span className="text-app-text">{new Date(infoProject.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInfoProject(null)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
