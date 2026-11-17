import React, { useState } from 'react';
import { Download, Film, Loader2, X, Monitor, Video, Gauge } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { exportTimelineVideo, ExportProgress } from '@/engine/exporter';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

const RESOLUTION_OPTIONS: SelectOption<string>[] = [
  { value: '1080p', label: '1080p Full HD', description: 'Standard high-definition web export' },
  { value: '720p', label: '720p HD', description: 'Fast render & smaller file size' },
  { value: '4k', label: '4K Ultra HD', description: 'Maximum crisp detail (3840×2160)' },
];

const FORMAT_OPTIONS: SelectOption<string>[] = [
  { value: 'webm', label: 'WebM Video', description: 'VP9 codec with high web compression' },
  { value: 'mp4', label: 'MP4 Video', description: 'Universal compatibility format' },
];

const FPS_OPTIONS: SelectOption<number>[] = [
  { value: 30, label: '30 FPS', description: 'Standard web & social video' },
  { value: 60, label: '60 FPS', description: 'Silky smooth high motion' },
  { value: 24, label: '24 FPS', description: 'Cinematic film cadence' },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [resolution, setResolution] = useState('1080p');
  const [format, setFormat] = useState('webm');
  const [fps, setFps] = useState(30);

  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const duration = useEditorStore((s) => s.duration);
  const projectTitle = useEditorStore((s) => s.projectTitle);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setProgress({ progress: 0, currentSecond: 0, totalSeconds: duration });

      const blob = await exportTimelineVideo(
        tracks,
        clips,
        assets,
        aspect,
        duration,
        (p) => setProgress(p)
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_${resolution}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-app-border pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-app-text" />
            <h2 className="text-base font-bold text-app-text">Export Video</h2>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div>
            <label className="text-app-text-muted font-medium">Project Name</label>
            <div className="mt-1 rounded-lg border border-app-border bg-app-elevated px-3 py-2 text-sm text-app-text font-medium">
              {projectTitle}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-app-border bg-app-elevated p-3">
              <span className="text-app-text-muted">Aspect Ratio</span>
              <p className="mt-1 text-sm font-bold text-app-text">{aspect}</p>
            </div>
            <div className="rounded-lg border border-app-border bg-app-elevated p-3">
              <span className="text-app-text-muted">Duration</span>
              <p className="mt-1 text-sm font-bold text-app-text">{duration.toFixed(1)}s</p>
            </div>
          </div>

          {/* Export Settings Dropdowns */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-app-text-muted font-medium">Export Resolution</label>
              <CustomSelect<string>
                value={resolution}
                onChange={(val) => setResolution(val)}
                options={RESOLUTION_OPTIONS}
                icon={<Monitor className="h-3.5 w-3.5" />}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-app-text-muted font-medium">Container Format</label>
                <CustomSelect<string>
                  value={format}
                  onChange={(val) => setFormat(val)}
                  options={FORMAT_OPTIONS}
                  icon={<Video className="h-3.5 w-3.5" />}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-app-text-muted font-medium">Frame Rate</label>
                <CustomSelect<number>
                  value={fps}
                  onChange={(val) => setFps(val)}
                  options={FPS_OPTIONS}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {isExporting && progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-app-text font-medium">
                <span>Rendering frames...</span>
                <span>{Math.round(progress.progress * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-app-elevated">
                <div
                  className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-100"
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
              <p className="text-center text-[11px] text-app-text-muted">
                Processed {progress.currentSecond.toFixed(1)}s of {progress.totalSeconds.toFixed(1)}s
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2.5 pt-3">
            {!isExporting ? (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-app-border px-4 py-2 font-medium text-app-text hover:bg-app-elevated transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExport}
                  className="flex items-center gap-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 px-4 py-2 font-semibold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 active:scale-95 transition"
                >
                  <Download className="h-4 w-4" />
                  Render & Download
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-lg bg-neutral-900/70 dark:bg-neutral-100/70 px-4 py-2 font-medium text-white dark:text-neutral-900"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
