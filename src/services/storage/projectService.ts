import { AspectRatio, Clip, MediaAsset, Track } from '@/types/editor';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { generateCountdownVideo, generateSampleAudio } from '@/utils/sampleMedia';
import { generateProjectPoster } from '@/utils/thumbnail';

export interface ProjectRecord {
  id: string; // Unique Project ID
  name: string; // Project Title
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  duration: number; // Duration in seconds
  aspectRatio: AspectRatio; // 16:9, 9:16, 1:1, etc.
  fps: number; // 24, 25, 30, 60
  canvasBg: string; // Hex color or #000000
  tracks: Track[];
  clips: Clip[];
  assets: MediaAsset[];
  thumbnail?: string; // Data URL of thumbnail image
}

export type ProjectSortOption =
  | 'updatedAt-desc'
  | 'updatedAt-asc'
  | 'name-asc'
  | 'name-desc'
  | 'duration-desc'
  | 'duration-asc';

class ProjectService {
  private adapter: IndexedDBAdapter<ProjectRecord>;
  private isInitialized = false;

  constructor() {
    this.adapter = new IndexedDBAdapter<ProjectRecord>({
      dbName: 'freecut-video-projects',
      storeName: 'projects',
      version: 1,
    });
  }

  public async getAllProjects(): Promise<ProjectRecord[]> {
    try {
      const projects = await this.adapter.getAll();
      // Ensure all projects have valid visual thumbnails
      for (const p of projects) {
        if (!p.thumbnail || p.id === 'proj-default-cyberpunk' || p.thumbnail.length < 1500) {
          p.thumbnail = generateProjectPoster(p.name, p.id === 'proj-default-cyberpunk' ? 'CYBERPUNK MASTER CUT' : 'FREECUT PRO');
          await this.adapter.set(p.id, p);
        }
      }
      return projects.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (err) {
      console.warn('Failed to get projects from IndexedDB:', err);
      return [];
    }
  }

  public async getProject(id: string): Promise<ProjectRecord | null> {
    try {
      return await this.adapter.get(id);
    } catch (err) {
      console.warn(`Failed to get project ${id}:`, err);
      return null;
    }
  }

  public async saveProject(
    project: Partial<ProjectRecord> & { id: string; name: string }
  ): Promise<void> {
    try {
      const existing = await this.adapter.get(project.id);
      const now = new Date().toISOString();
      const updatedRecord: ProjectRecord = {
        id: project.id,
        name: project.name,
        createdAt: existing?.createdAt || project.createdAt || now,
        updatedAt: now,
        duration: project.duration !== undefined ? project.duration : (existing?.duration || 10),
        aspectRatio: project.aspectRatio || existing?.aspectRatio || '16:9',
        fps: project.fps || existing?.fps || 30,
        canvasBg: project.canvasBg || existing?.canvasBg || '#000000',
        tracks: project.tracks || existing?.tracks || [],
        clips: project.clips || existing?.clips || [],
        assets: project.assets || existing?.assets || [],
        thumbnail: project.thumbnail || existing?.thumbnail,
      };
      await this.adapter.set(project.id, updatedRecord);
    } catch (err) {
      console.error(`Failed to save project ${project.id}:`, err);
    }
  }

  public async createProject(params?: {
    name?: string;
    aspectRatio?: AspectRatio;
    fps?: number;
  }): Promise<ProjectRecord> {
    const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const defaultTracks: Track[] = [
      { id: 'track-text-1', name: 'Text & Titles', type: 'text', isVisible: true },
      { id: 'track-video-2', name: 'Overlay B-Roll', type: 'video', isVisible: true },
      { id: 'track-video-1', name: 'Main Track', type: 'video', isVisible: true },
      { id: 'track-audio-1', name: 'Soundtrack', type: 'audio', isMuted: false },
      { id: 'track-audio-2', name: 'Sound FX', type: 'audio', isMuted: false },
    ];

    const newRecord: ProjectRecord = {
      id,
      name: params?.name || 'Untitled Video Project',
      createdAt: now,
      updatedAt: now,
      duration: 10,
      aspectRatio: params?.aspectRatio || '16:9',
      fps: params?.fps || 30,
      canvasBg: '#000000',
      tracks: defaultTracks,
      clips: [],
      assets: [],
      thumbnail: generateProjectPoster(params?.name || 'Untitled Video Project'),
    };

    await this.adapter.set(id, newRecord);
    return newRecord;
  }

  public async duplicateProject(id: string): Promise<ProjectRecord> {
    const source = await this.getProject(id);
    if (!source) {
      throw new Error(`Project ${id} not found`);
    }

    const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const duplicate: ProjectRecord = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    await this.adapter.set(newId, duplicate);
    return duplicate;
  }

  public async renameProject(id: string, newName: string): Promise<void> {
    const project = await this.getProject(id);
    if (project) {
      project.name = newName;
      project.updatedAt = new Date().toISOString();
      await this.adapter.set(id, project);
    }
  }

  public async deleteProject(id: string): Promise<void> {
    await this.adapter.remove(id);
  }

  public async updateProjectThumbnail(id: string, thumbnail: string): Promise<void> {
    try {
      const project = await this.getProject(id);
      if (project) {
        project.thumbnail = thumbnail;
        await this.adapter.set(id, project);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Initializes storage with the default Cyberpunk Trailer Project if the user has no projects yet.
   */
  public async ensureInitialProjects(): Promise<ProjectRecord[]> {
    const existing = await this.getAllProjects();
    if (existing.length > 0) {
      return existing;
    }

    // Seed default starter project with unique ID
    const defaultId = 'proj-default-cyberpunk';
    const now = new Date().toISOString();

    const defaultTracks: Track[] = [
      { id: 'track-text-1', name: 'Text & Titles', type: 'text', isVisible: true },
      { id: 'track-video-2', name: 'Overlay B-Roll', type: 'video', isVisible: true },
      { id: 'track-video-1', name: 'Main Track', type: 'video', isVisible: true },
      { id: 'track-audio-1', name: 'Soundtrack', type: 'audio', isMuted: false },
      { id: 'track-audio-2', name: 'Sound FX', type: 'audio', isMuted: false },
    ];

    const defaultClips: Clip[] = [
      {
        id: 'clip-countdown-main',
        trackId: 'track-video-1',
        name: 'Cinematic Countdown.webm',
        type: 'video',
        start: 0,
        duration: 5,
        trimStart: 0,
        trimEnd: 5,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        volume: 1,
        color: '#2563eb',
      },
      {
        id: 'clip-countdown-overlay',
        trackId: 'track-video-2',
        name: 'Picture-in-Picture.webm',
        type: 'video',
        start: 2,
        duration: 3,
        trimStart: 2,
        trimEnd: 5,
        transform: { x: 380, y: -190, scale: 0.35, rotation: 0, opacity: 0.95 },
        volume: 0,
        color: '#4f46e5',
      },
      {
        id: 'clip-audio-beat',
        trackId: 'track-audio-1',
        name: 'Lo-Fi Ambient Beat.wav',
        type: 'audio',
        start: 0,
        duration: 5,
        trimStart: 0,
        trimEnd: 5,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        volume: 0.85,
        color: '#059669',
      },
      {
        id: 'clip-title-obsidian',
        trackId: 'track-text-1',
        name: 'Cyberpunk Master Cut',
        type: 'text',
        text: 'CYBERPUNK MASTER CUT',
        fontSize: 52,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        fontFamily: 'Inter, system-ui',
        start: 0.5,
        duration: 4.5,
        trimStart: 0,
        trimEnd: 4.5,
        transform: { x: 0, y: 160, scale: 1, rotation: 0, opacity: 1 },
        volume: 0,
        color: '#d97706',
      },
    ];

    const starterProject: ProjectRecord = {
      id: defaultId,
      name: 'Cyberpunk Trailer Project',
      createdAt: now,
      updatedAt: now,
      duration: 10,
      aspectRatio: '16:9',
      fps: 30,
      canvasBg: '#000000',
      tracks: defaultTracks,
      clips: defaultClips,
      assets: [],
      thumbnail: generateProjectPoster('Cyberpunk Trailer Project', 'CYBERPUNK MASTER CUT'),
    };

    await this.adapter.set(defaultId, starterProject);
    return [starterProject];
  }

  public sortProjects(projects: ProjectRecord[], sortOption: ProjectSortOption): ProjectRecord[] {
    const list = [...projects];
    switch (sortOption) {
      case 'updatedAt-asc':
        return list.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'duration-desc':
        return list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
      case 'duration-asc':
        return list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case 'updatedAt-desc':
      default:
        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }
}

export const projectService = new ProjectService();
