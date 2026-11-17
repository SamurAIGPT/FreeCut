import React, { useState } from 'react';
import { Download, Film, Loader2, X } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { exportTimelineVideo, ExportProgress } from '@/engine/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

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

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_export.webm`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Export Video</h2>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Project Name</label>
            <div className="mt-1 rounded-lg border border-border bg-[#0d0f12] px-3 py-2 text-sm text-slate-200">
              {projectTitle}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-[#0d0f12] p-3">
              <span className="text-slate-400">Aspect Ratio</span>
              <p className="mt-1 text-sm font-semibold text-white">{aspect}</p>
            </div>
            <div className="rounded-lg border border-border bg-[#0d0f12] p-3">
              <span className="text-slate-400">Duration</span>
              <p className="mt-1 text-sm font-semibold text-white">{duration.toFixed(1)}s</p>
            </div>
          </div>

          {isExporting && progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Rendering frames...</span>
                <span>{Math.round(progress.progress * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                Processed {progress.currentSecond.toFixed(1)}s of {progress.totalSeconds.toFixed(1)}s
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 pt-3">
            {!isExporting ? (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExport}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-primary-hover"
                >
                  <Download className="h-4 w-4" />
                  Render & Download
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-lg bg-primary/70 px-4 py-2 text-sm font-medium text-white"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering Video...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
