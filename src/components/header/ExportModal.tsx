import React, { useState } from 'react';
import { Download, Film, Loader2, X, Monitor, Video, Gauge, Sliders, Volume2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { exportTimelineVideo, ExportProgress, computeExportBitrate, ExportQuality } from '@/engine/exporter';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { formatDuration } from '@/utils/time';

const RESOLUTION_OPTIONS: SelectOption<string>[] = [
  { value: '1080p', label: '1080p Full HD (1920×1080)', description: 'Standard high-definition web export' },
  { value: '720p', label: '720p HD (1280×720)', description: 'Fast render & compact file size' },
  { value: '4k', label: '4K Ultra HD (3840×2160)', description: 'Maximum crisp detail' },
];

const FORMAT_OPTIONS: SelectOption<string>[] = [
  { value: 'mp4', label: 'MP4 Video (H.264 / AVC)', description: 'Universal format compatible everywhere' },
  { value: 'webm', label: 'WebM Video (VP9)', description: 'High compression web standard' },
];

const FPS_OPTIONS: SelectOption<number>[] = [
  { value: 30, label: '30 FPS', description: 'Standard web & social video' },
  { value: 60, label: '60 FPS', description: 'Silky smooth high motion' },
  { value: 24, label: '24 FPS', description: 'Cinematic film cadence' },
];

const QUALITY_OPTIONS: SelectOption<string>[] = [
  { value: 'very_high', label: 'Very High (Master)', description: 'Maximum visual detail & bit allocation' },
  { value: 'high', label: 'High Quality', description: 'Crisp visual fidelity & rich colors' },
  { value: 'medium', label: 'Balanced Quality', description: 'Good trade-off between size and fidelity' },
  { value: 'low', label: 'Fast Draft', description: 'Quick rendering and smaller download' },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [resolution, setResolution] = useState('1080p');
  const [format, setFormat] = useState('mp4');
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState('high');
  const [includeAudio, setIncludeAudio] = useState(true);

  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const duration = useEditorStore((s) => s.duration);
  const projectTitle = useEditorStore((s) => s.projectTitle);

  // Calculate actual content duration (end of last clip)
  const contentDuration = clips.length > 0 
    ? Math.max(...clips.map((c) => c.start + c.duration))
    : duration;

  const [exportRange, setExportRange] = useState<'content' | 'timeline'>('content');

  if (!isOpen) return null;

  const activeDuration = exportRange === 'content' && contentDuration > 0 ? contentDuration : duration;

  const videoBitrate = computeExportBitrate(
    resolution as '1080p' | '720p' | '4k',
    fps,
    quality as ExportQuality
  );
  const audioBitrate = includeAudio
    ? quality === 'low'
      ? 96000
      : quality === 'medium'
      ? 128000
      : quality === 'very_high'
      ? 256000
      : 192000
    : 0;
  const totalBitrate = videoBitrate + audioBitrate;
  const estimatedBytes = (totalBitrate * activeDuration) / 8;
  const estimatedSizeMb = (estimatedBytes / (1024 * 1024)).toFixed(1);
  const estimatedSizeFormatted = Number(estimatedSizeMb) >= 1000
    ? `${(Number(estimatedSizeMb) / 1024).toFixed(2)} GB`
    : `${estimatedSizeMb} MB`;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setProgress({ progress: 0, currentSecond: 0, totalSeconds: activeDuration });

      const blob = await exportTimelineVideo(
        tracks,
        clips,
        assets,
        aspect,
        activeDuration,
        (p) => setProgress(p),
        {
          format: format as 'webm' | 'mp4',
          resolution: resolution as '1080p' | '720p' | '4k',
          fps,
          quality: quality as ExportQuality,
          includeAudio,
        }
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
      alert('Export failed. Check console for details: ' + (err instanceof Error ? err.message : String(err)));
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

          {/* Export Range Selection */}
          <div>
            <label className="text-app-text-muted font-medium mb-1.5 block">Export Range</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportRange('content')}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition ${
                  exportRange === 'content'
                    ? 'border-blue-500 bg-blue-500/10 text-app-text'
                    : 'border-app-border bg-app-elevated text-app-text-muted hover:border-neutral-400'
                }`}
              >
                <span className="font-semibold text-xs text-app-text">Timeline Content</span>
                <span className="text-[11px] font-mono mt-0.5 text-app-text-muted">
                  0:00 - {formatDuration(contentDuration)} ({contentDuration.toFixed(1)}s)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportRange('timeline')}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition ${
                  exportRange === 'timeline'
                    ? 'border-blue-500 bg-blue-500/10 text-app-text'
                    : 'border-app-border bg-app-elevated text-app-text-muted hover:border-neutral-400'
                }`}
              >
                <span className="font-semibold text-xs text-app-text">Full Timeline</span>
                <span className="text-[11px] font-mono mt-0.5 text-app-text-muted">
                  0:00 - {formatDuration(duration)} ({duration.toFixed(1)}s)
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-app-border bg-app-elevated p-2.5">
              <span className="text-app-text-muted text-[11px] block">Aspect Ratio</span>
              <p className="mt-0.5 text-xs font-bold text-app-text truncate">{aspect}</p>
            </div>
            <div className="rounded-lg border border-app-border bg-app-elevated p-2.5">
              <span className="text-app-text-muted text-[11px] block">Export Duration</span>
              <p className="mt-0.5 text-xs font-bold text-blue-500 truncate">
                {formatDuration(activeDuration)} ({activeDuration.toFixed(1)}s)
              </p>
            </div>
            <div className="rounded-lg border border-app-border bg-app-elevated p-2.5">
              <span className="text-app-text-muted text-[11px] block">Estimated Size</span>
              <p className="mt-0.5 text-xs font-bold text-emerald-400 truncate">
                ~{estimatedSizeFormatted}
              </p>
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

            <div className="space-y-1">
              <label className="text-app-text-muted font-medium">Encoding Quality</label>
              <CustomSelect<string>
                value={quality}
                onChange={(val) => setQuality(val)}
                options={QUALITY_OPTIONS}
                icon={<Sliders className="h-3.5 w-3.5" />}
                className="w-full"
              />
            </div>

            {/* Audio Inclusion Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-app-text">
              <input
                type="checkbox"
                checked={includeAudio}
                onChange={(e) => setIncludeAudio(e.target.checked)}
                className="rounded border-app-border accent-blue-500 h-4 w-4"
              />
              <Volume2 className="h-3.5 w-3.5 text-app-text-muted" />
              <span className="font-medium">Include audio tracks in export</span>
            </label>
          </div>

          {isExporting && progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-app-text font-medium">
                <span>
                  Rendering {progress.currentFrame ? `frame ${progress.currentFrame}/${progress.totalFrames}` : 'frames...'}
                </span>
                <span>{Math.round(progress.progress * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-app-elevated">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
                />
              </div>
              <p className="text-center text-[11px] text-app-text-muted">
                {progress.currentSecond.toFixed(1)}s of {progress.totalSeconds.toFixed(1)}s rendered
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
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 font-semibold text-white shadow-sm active:scale-95 transition"
                >
                  <Download className="h-4 w-4" />
                  Render & Download
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-lg bg-blue-600/70 px-4 py-2 font-medium text-white"
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
