import React from 'react';
import { Sliders, Trash2, Volume2, Type, Move, RotateCw, Layers } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

export const InspectorPanel: React.FC = () => {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const clips = useEditorStore((s) => s.clips);
  const updateClip = useEditorStore((s) => s.updateClip);
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform);
  const deleteClip = useEditorStore((s) => s.deleteClip);

  const clip = clips.find((c) => c.id === selectedClipId);

  if (!clip) {
    return (
      <aside className="flex h-full w-72 flex-col border-l border-border bg-surface p-6 text-center">
        <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-[#0d0f12] text-slate-600">
            <Sliders className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-slate-300">No Clip Selected</h3>
          <p className="mt-1 text-xs text-slate-500">
            Click any clip on the timeline to inspect its transforms, audio levels, or text styling.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 flex-col border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-xs font-semibold text-white">{clip.name}</span>
        </div>
        <button
          onClick={() => deleteClip(clip.id)}
          title="Delete Clip (Delete)"
          className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
        {/* Timing Information */}
        <div className="space-y-2">
          <span className="font-semibold uppercase tracking-wider text-slate-400">Timing</span>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="rounded border border-border bg-[#0d0f12] p-2">
              <span className="text-[10px] text-slate-500">Start Time</span>
              <p className="font-mono text-xs font-semibold">{clip.start.toFixed(2)}s</p>
            </div>
            <div className="rounded border border-border bg-[#0d0f12] p-2">
              <span className="text-[10px] text-slate-500">Duration</span>
              <p className="font-mono text-xs font-semibold">{clip.duration.toFixed(2)}s</p>
            </div>
          </div>
        </div>

        {/* Text Styling (if text clip) */}
        {clip.type === 'text' && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-amber-400">
              <Type className="h-3.5 w-3.5" />
              <span>Text Properties</span>
            </div>

            <div>
              <label className="text-slate-400">Text Content</label>
              <textarea
                rows={2}
                value={clip.text || ''}
                onChange={(e) => updateClip(clip.id, { text: e.target.value })}
                className="mt-1 w-full rounded border border-border bg-[#0d0f12] p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400">Font Size</label>
                <input
                  type="number"
                  min={12}
                  max={160}
                  value={clip.fontSize || 48}
                  onChange={(e) => updateClip(clip.id, { fontSize: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-border bg-[#0d0f12] p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-slate-400">Text Color</label>
                <div className="mt-1 flex items-center gap-1.5 rounded border border-border bg-[#0d0f12] p-1">
                  <input
                    type="color"
                    value={clip.fontColor || '#ffffff'}
                    onChange={(e) => updateClip(clip.id, { fontColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded bg-transparent border-none"
                  />
                  <span className="font-mono text-[11px] text-slate-300">{clip.fontColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transform Properties */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-blue-400">
            <Move className="h-3.5 w-3.5" />
            <span>Transform</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400">Pos X (px)</label>
              <input
                type="number"
                value={clip.transform.x}
                onChange={(e) => updateClipTransform(clip.id, { x: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-border bg-[#0d0f12] p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400">Pos Y (px)</label>
              <input
                type="number"
                value={clip.transform.y}
                onChange={(e) => updateClipTransform(clip.id, { y: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-border bg-[#0d0f12] p-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>Scale</span>
              <span>{(clip.transform.scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={3.0}
              step={0.05}
              value={clip.transform.scale}
              onChange={(e) => updateClipTransform(clip.id, { scale: Number(e.target.value) })}
              className="mt-1 w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>Rotation</span>
              <span>{clip.transform.rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={clip.transform.rotation}
              onChange={(e) => updateClipTransform(clip.id, { rotation: Number(e.target.value) })}
              className="mt-1 w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>Opacity</span>
              <span>{Math.round(clip.transform.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={clip.transform.opacity}
              onChange={(e) => updateClipTransform(clip.id, { opacity: Number(e.target.value) })}
              className="mt-1 w-full accent-primary"
            />
          </div>
        </div>

        {/* Audio Volume (if video or audio) */}
        {(clip.type === 'video' || clip.type === 'audio') && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-emerald-400">
              <Volume2 className="h-3.5 w-3.5" />
              <span>Audio</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Volume</span>
                <span>{Math.round(clip.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={clip.volume}
                onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
                className="mt-1 w-full accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
