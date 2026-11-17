import React, { useRef, useState } from 'react';
import { 
  Upload, Film, Music, Plus, Sparkles, Search, Palette, Wand2, Type, Smile, Image as ImageIcon 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { MediaAsset } from '@/types/editor';
import { generateCountdownVideo, generateSampleAudio } from '@/utils/sampleMedia';

export const SidebarContent: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      if (isVideo) {
        const v = document.createElement('video');
        v.src = url;
        v.onloadedmetadata = () => {
          addAsset({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'video',
            url,
            duration: v.duration || 5,
            width: v.videoWidth || 1920,
            height: v.videoHeight || 1080,
          });
        };
      } else if (isAudio) {
        const a = new Audio(url);
        a.onloadedmetadata = () => {
          addAsset({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'audio',
            url,
            duration: a.duration || 5,
          });
        };
      } else {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          addAsset({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'image',
            url,
            duration: 4,
            width: img.width,
            height: img.height,
          });
        };
      }
    }
  };

  const handleAddSampleFootage = async () => {
    try {
      setIsGenerating(true);
      const videoAsset = await generateCountdownVideo();
      addAsset(videoAsset);
      const audioAsset = await generateSampleAudio();
      addAsset(audioAsset);

      const videoTrack = tracks.find((t) => t.type === 'video');
      const audioTrack = tracks.find((t) => t.type === 'audio');

      if (videoTrack) {
        addClip({
          trackId: videoTrack.id,
          assetId: videoAsset.id,
          name: videoAsset.name,
          type: 'video',
          start: playhead,
          duration: videoAsset.duration,
          trimStart: 0,
          trimEnd: videoAsset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 1,
          color: '#2563eb',
        });
      }

      if (audioTrack) {
        addClip({
          trackId: audioTrack.id,
          assetId: audioAsset.id,
          name: audioAsset.name,
          type: 'audio',
          start: playhead,
          duration: audioAsset.duration,
          trimStart: 0,
          trimEnd: audioAsset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0.8,
          color: '#059669',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Preset Text Templates
  const TEXT_PRESETS = [
    { title: 'Obsidian Minimal', text: 'CLEAN ARCHITECTURE', fontSize: 50, fontColor: '#ffffff', bg: '#000000', color: '#52525b' },
    { title: 'Cinematic Gold', text: 'THE MASTER CUT', fontSize: 56, fontColor: '#facc15', bg: 'rgba(0,0,0,0.85)', color: '#ca8a04' },
    { title: 'Lower Thirds', text: 'Director | Marcus Ray', fontSize: 32, fontColor: '#ffffff', bg: 'rgba(24,24,27,0.9)', color: '#3f3f46' },
    { title: 'Bold Impact', text: 'DISRUPT NOW', fontSize: 72, fontColor: '#ffffff', bg: 'transparent', color: '#71717a' },
    { title: 'Retro VHS Badge', text: 'PLAY // 00:04:12', fontSize: 40, fontColor: '#22c55e', bg: '#000000', color: '#16a34a' },
  ];

  const handleAddPresetText = (preset: typeof TEXT_PRESETS[0]) => {
    const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];
    addClip({
      trackId: textTrack.id,
      name: preset.title,
      type: 'text',
      text: preset.text,
      fontSize: preset.fontSize,
      fontColor: preset.fontColor,
      backgroundColor: preset.bg,
      fontFamily: 'Inter, system-ui',
      start: playhead,
      duration: 3.5,
      trimStart: 0,
      trimEnd: 3.5,
      transform: { x: 0, y: -100, scale: 1, rotation: 0, opacity: 1 },
      volume: 0,
      color: preset.color,
    });
  };

  // Sound Effects Library
  const AUDIO_PRESETS = [
    { name: 'Cinematic Sub Drop Boom', duration: '3.2s', cat: 'Impact' },
    { name: 'Deep Whoosh Transition', duration: '1.4s', cat: 'Whoosh' },
    { name: 'Electronic Glitch Stutter', duration: '2.1s', cat: 'Glitch' },
    { name: 'Ambient Lo-Fi Vinyl Beat', duration: '5.0s', cat: 'Music' },
    { name: 'Digital UI Click & Chime', duration: '0.8s', cat: 'Foley' },
  ];

  // Filter Presets
  const FILTER_PRESETS = [
    { name: 'Monochrome Noir', desc: 'High Contrast Black & White', filter: { brightness: 1.0, contrast: 1.45, saturation: 0, blur: 0 } },
    { name: 'Warm Cinema', desc: 'Subtle Golden Curve', filter: { brightness: 1.05, contrast: 1.2, saturation: 1.15, blur: 0 } },
    { name: 'Vintage 90s', desc: 'Desaturated Analog Grain', filter: { brightness: 0.98, contrast: 0.95, saturation: 0.75, blur: 0.5 } },
    { name: 'Clean Neutral Boost', desc: 'Punchy Highlights', filter: { brightness: 1.05, contrast: 1.15, saturation: 1.1, blur: 0 } },
    { name: 'Ethereal Bloom', desc: 'Soft Dreamy Haze', filter: { brightness: 1.12, contrast: 1.05, saturation: 1.05, blur: 1.5 } },
  ];

  return (
    <div className="flex h-full w-80 flex-col border-r border-app-border bg-app-surface select-none transition-colors duration-200">
      {/* Search Header */}
      <div className="border-b border-app-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5 text-xs text-app-text focus-within:border-neutral-500">
          <Search className="h-3.5 w-3.5 text-app-text-muted" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent placeholder:text-app-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* --- MEDIA TAB --- */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,audio/*,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-elevated p-5 text-center transition hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-surface text-app-text group-hover:scale-105 transition shadow-sm">
                <Upload className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs font-semibold text-app-text">Import Media Files</p>
              <p className="text-[11px] text-app-text-muted">MP4, WebM, WAV, MP3, PNG, JPG</p>
            </div>

            <button
              onClick={handleAddSampleFootage}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
              <span>{isGenerating ? 'Synthesizing...' : 'Load Demo Footage & Audio'}</span>
            </button>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-app-text-muted mb-2">
                <span>PROJECT BIN</span>
                <span>{assets.length} items</span>
              </div>

              {assets.length === 0 ? (
                <div className="rounded-lg border border-app-border bg-app-elevated p-6 text-center text-xs text-app-text-muted">
                  <Film className="mx-auto h-7 w-7 text-app-text-muted" />
                  <p className="mt-2">No files in media bin</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative flex flex-col overflow-hidden rounded-lg border border-app-border bg-app-elevated hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                    >
                      <div className="relative flex h-20 w-full items-center justify-center bg-app-surface text-app-text-muted">
                        {asset.type === 'video' ? (
                          <Film className="h-5 w-5 text-neutral-400" />
                        ) : asset.type === 'audio' ? (
                          <Music className="h-5 w-5 text-neutral-400" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-neutral-400" />
                        )}
                        <span className="absolute bottom-1 right-1.5 rounded bg-black/75 px-1 font-mono text-[9px] text-white">
                          {asset.duration.toFixed(1)}s
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2">
                        <span className="truncate text-[11px] font-medium text-app-text">
                          {asset.name}
                        </span>
                        <button
                          onClick={() => {
                            const track = tracks.find((t) => t.type === (asset.type === 'audio' ? 'audio' : 'video'));
                            if (track) {
                              addClip({
                                trackId: track.id,
                                assetId: asset.id,
                                name: asset.name,
                                type: asset.type,
                                start: playhead,
                                duration: asset.duration,
                                trimStart: 0,
                                trimEnd: asset.duration,
                                transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                                volume: 1,
                                color: asset.type === 'audio' ? '#059669' : '#2563eb',
                              });
                            }
                          }}
                          className="rounded p-1 text-app-text-muted hover:bg-neutral-800 hover:text-white"
                          title="Insert at Playhead"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TEXT TAB --- */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              Title & Typography Presets
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {TEXT_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddPresetText(preset)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-app-border bg-app-elevated p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-app-text">{preset.title}</h4>
                    <p
                      style={{ color: preset.fontColor }}
                      className="mt-0.5 font-bold tracking-wide text-xs"
                    >
                      {preset.text}
                    </p>
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-app-surface text-app-text group-hover:scale-105 transition shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AUDIO TAB --- */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              Sound FX & Tracks
            </span>
            <div className="space-y-2">
              {AUDIO_PRESETS.map((sfx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-app-border bg-app-elevated p-2.5 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-surface text-app-text">
                      <Music className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-app-text">{sfx.name}</h4>
                      <span className="text-[10px] text-app-text-muted">{sfx.cat} • {sfx.duration}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const audioAsset = await generateSampleAudio();
                      addAsset(audioAsset);
                      const audioTrack = tracks.find((t) => t.type === 'audio') || tracks[0];
                      addClip({
                        trackId: audioTrack.id,
                        assetId: audioAsset.id,
                        name: sfx.name,
                        type: 'audio',
                        start: playhead,
                        duration: 5,
                        trimStart: 0,
                        trimEnd: 5,
                        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                        volume: 0.9,
                        color: '#059669',
                      });
                    }}
                    title="Add sound effect"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-app-surface text-app-text hover:bg-neutral-800 hover:text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- FILTERS & EFFECTS TABS --- */}
        {(activeTab === 'filters' || activeTab === 'effects') && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              Color Grades & Video Styles
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {FILTER_PRESETS.map((filter, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const selectedClip = useEditorStore.getState().selectedClipId;
                    if (selectedClip) {
                      useEditorStore.getState().updateClipFilter(selectedClip, filter.filter);
                    } else {
                      alert('Select a clip on the timeline first to apply this filter.');
                    }
                  }}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-app-border bg-app-elevated p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-surface text-app-text">
                      <Palette className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-app-text">{filter.name}</h4>
                      <p className="text-[10px] text-app-text-muted">{filter.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-app-text opacity-0 group-hover:opacity-100 transition">
                    Apply
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TRANSITIONS & STICKERS --- */}
        {(activeTab === 'transitions' || activeTab === 'stickers') && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
              {activeTab === 'transitions' ? 'Transitions' : 'Stickers & Graphics'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {['Cross Dissolve', 'Fade to Black', 'Whip Pan', 'Zoom In', 'Glitch Wipe', 'Flash Blur'].map((name, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-elevated p-4 text-center hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer"
                >
                  <Wand2 className="h-4 w-4 text-app-text-muted mb-1" />
                  <span className="text-xs font-medium text-app-text">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
