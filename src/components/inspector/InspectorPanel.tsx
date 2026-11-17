import React, { useState } from 'react';
import { 
  Move, RotateCw, Volume2, Type, Sliders, Trash2, Gauge, 
  Palette, Eye, Sparkles, Layers, RefreshCw 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

type InspectorTab = 'basic' | 'audio' | 'color' | 'speed' | 'text';

export const InspectorPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('basic');

  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const clips = useEditorStore((s) => s.clips);
  const updateClip = useEditorStore((s) => s.updateClip);
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform);
  const updateClipFilter = useEditorStore((s) => s.updateClipFilter);
  const deleteClip = useEditorStore((s) => s.deleteClip);

  const clip = clips.find((c) => c.id === selectedClipId);

  if (!clip) {
    return (
      <aside className="flex h-full w-80 flex-col border-l border-[#1f242e] bg-[#12141a] p-6 text-center">
        <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#232938] bg-[#0c0e12] text-slate-500 shadow-inner">
            <Sliders className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xs font-semibold text-slate-200">No Clip Selected</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
            Click any clip on the timeline to customize motion transforms, audio mix, color grading, and text.
          </p>
        </div>
      </aside>
    );
  }

  const isAudioAvailable = clip.type === 'audio' || clip.type === 'video';
  const isTextAvailable = clip.type === 'text';

  const filter = clip.filter || { brightness: 1, contrast: 1, saturation: 1, blur: 0 };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-[#1f242e] bg-[#12141a]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1f242e] p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-400 shrink-0">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-xs font-semibold text-white">{clip.name}</span>
        </div>
        <button
          onClick={() => deleteClip(clip.id)}
          title="Delete Clip"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1f242e] bg-[#0c0e12] px-2 text-xs">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 font-medium transition ${
            activeTab === 'basic' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Move className="h-3.5 w-3.5" />
          <span>Basic</span>
        </button>

        {isTextAvailable && (
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 font-medium transition ${
              activeTab === 'text' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Text</span>
          </button>
        )}

        {isAudioAvailable && (
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 font-medium transition ${
              activeTab === 'audio' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('color')}
          className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 font-medium transition ${
            activeTab === 'color' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab('speed')}
          className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 font-medium transition ${
            activeTab === 'speed' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="h-3.5 w-3.5" />
          <span>Speed</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* --- BASIC TAB --- */}
        {activeTab === 'basic' && (
          <>
            {/* Position */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-semibold">
                <span>POSITION (X, Y)</span>
                <button
                  onClick={() => updateClipTransform(clip.id, { x: 0, y: 0 })}
                  title="Reset Position"
                  className="text-slate-500 hover:text-white"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-lg border border-[#232938] bg-[#0c0e12] px-2 py-1.5">
                  <span className="text-[10px] text-slate-500 mr-2">X</span>
                  <input
                    type="number"
                    value={clip.transform.x}
                    onChange={(e) => updateClipTransform(clip.id, { x: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center rounded-lg border border-[#232938] bg-[#0c0e12] px-2 py-1.5">
                  <span className="text-[10px] text-slate-500 mr-2">Y</span>
                  <input
                    type="number"
                    value={clip.transform.y}
                    onChange={(e) => updateClipTransform(clip.id, { y: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>SCALE</span>
                <span className="font-mono text-white">{(clip.transform.scale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3.0}
                step={0.05}
                value={clip.transform.scale}
                onChange={(e) => updateClipTransform(clip.id, { scale: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>ROTATION</span>
                <span className="font-mono text-white">{clip.transform.rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={clip.transform.rotation}
                onChange={(e) => updateClipTransform(clip.id, { rotation: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>OPACITY</span>
                <span className="font-mono text-white">{Math.round(clip.transform.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={clip.transform.opacity}
                onChange={(e) => updateClipTransform(clip.id, { opacity: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Blend Mode */}
            <div className="space-y-1.5 pt-2 border-t border-[#1f242e]">
              <span className="text-slate-400 font-semibold">COMPOSITING BLEND MODE</span>
              <select
                value={clip.blendMode || 'source-over'}
                onChange={(e) => updateClip(clip.id, { blendMode: e.target.value as GlobalCompositeOperation })}
                className="w-full rounded-lg border border-[#232938] bg-[#0c0e12] p-2 text-white focus:outline-none"
              >
                <option value="source-over">Normal</option>
                <option value="screen">Screen (Lighten)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="overlay">Overlay</option>
                <option value="lighter">Add / Glow</option>
                <option value="difference">Invert Difference</option>
              </select>
            </div>
          </>
        )}

        {/* --- TEXT TAB --- */}
        {activeTab === 'text' && isTextAvailable && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 font-semibold">TEXT STRING</label>
              <textarea
                rows={3}
                value={clip.text || ''}
                onChange={(e) => updateClip(clip.id, { text: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#232938] bg-[#0c0e12] p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400">Font Size (px)</label>
                <input
                  type="number"
                  min={12}
                  max={200}
                  value={clip.fontSize || 54}
                  onChange={(e) => updateClip(clip.id, { fontSize: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#232938] bg-[#0c0e12] p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400">Text Color</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#232938] bg-[#0c0e12] p-1.5">
                  <input
                    type="color"
                    value={clip.fontColor || '#ffffff'}
                    onChange={(e) => updateClip(clip.id, { fontColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-slate-300">{clip.fontColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400">Background Badge Color</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#232938] bg-[#0c0e12] p-2">
                <input
                  type="color"
                  value={clip.backgroundColor && clip.backgroundColor !== 'transparent' ? clip.backgroundColor : '#000000'}
                  onChange={(e) => updateClip(clip.id, { backgroundColor: e.target.value })}
                  className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
                />
                <button
                  onClick={() => updateClip(clip.id, { backgroundColor: 'transparent' })}
                  className="rounded bg-[#1a1f2b] px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                >
                  Clear Background
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- AUDIO TAB --- */}
        {activeTab === 'audio' && isAudioAvailable && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>MASTER VOLUME</span>
                <span className="font-mono text-emerald-400">{Math.round(clip.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={clip.volume}
                onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}

        {/* --- COLOR & FILTER TAB --- */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>BRIGHTNESS</span>
                <span className="font-mono text-white">{(filter.brightness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={filter.brightness}
                onChange={(e) => updateClipFilter(clip.id, { brightness: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>CONTRAST</span>
                <span className="font-mono text-white">{(filter.contrast * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={filter.contrast}
                onChange={(e) => updateClipFilter(clip.id, { contrast: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>SATURATION</span>
                <span className="font-mono text-white">{(filter.saturation * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.05}
                value={filter.saturation}
                onChange={(e) => updateClipFilter(clip.id, { saturation: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>SOFT BLUR</span>
                <span className="font-mono text-white">{filter.blur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={filter.blur}
                onChange={(e) => updateClipFilter(clip.id, { blur: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* --- SPEED TAB --- */}
        {activeTab === 'speed' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>PLAYBACK SPEED</span>
                <span className="font-mono text-cyan-400">{(clip.speed || 1).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={3.0}
                step={0.25}
                value={clip.speed || 1}
                onChange={(e) => updateClip(clip.id, { speed: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {[0.5, 1.0, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  onClick={() => updateClip(clip.id, { speed: val })}
                  className={`rounded-lg border py-1.5 font-mono text-xs ${
                    (clip.speed || 1) === val
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-[#232938] bg-[#0c0e12] text-slate-400 hover:text-white'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
