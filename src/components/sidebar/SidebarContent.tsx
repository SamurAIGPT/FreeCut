import React, { useRef, useState } from 'react';
import { 
  Upload, Film, Music, Plus, Sparkles, Search, Play, Volume2, 
  Layers, Palette, Wand2, Type, Smile, Image as ImageIcon 
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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

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
      const assetType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video';

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
          color: '#3b82f6',
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
          color: '#10b981',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Preset Text Templates
  const TEXT_PRESETS = [
    { title: 'Neon Cyberpunk', text: 'NEON MATRIX', fontSize: 64, fontColor: '#38bdf8', bg: 'rgba(15,23,42,0.85)', color: '#ec4899' },
    { title: 'Minimal Modern', text: 'CREATIVE STUDIO', fontSize: 48, fontColor: '#f8fafc', bg: 'transparent', color: '#3b82f6' },
    { title: 'Cinematic Gold', text: 'THE PREMIERE', fontSize: 56, fontColor: '#facc15', bg: 'rgba(0,0,0,0.7)', color: '#eab308' },
    { title: 'Retro VHS Title', text: 'REC // 1994', fontSize: 42, fontColor: '#22c55e', bg: 'rgba(0,0,0,0.9)', color: '#10b981' },
    { title: 'Lower Thirds', text: 'Alex Vance | Producer', fontSize: 32, fontColor: '#ffffff', bg: '#1e293b', color: '#6366f1' },
    { title: 'Big Impact Header', text: 'DISRUPT NOW', fontSize: 80, fontColor: '#ef4444', bg: 'transparent', color: '#f43f5e' },
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
    { name: 'Cyber Whoosh Transition', duration: '1.4s', cat: 'Whoosh' },
    { name: 'Electronic Glitch Stutter', duration: '2.1s', cat: 'Glitch' },
    { name: 'Ambient Lo-Fi Vinyl Beat', duration: '5.0s', cat: 'Music' },
    { name: 'Digital UI Click & Chime', duration: '0.8s', cat: 'Foley' },
  ];

  // Filter Presets
  const FILTER_PRESETS = [
    { name: 'Teal & Orange', desc: 'Blockbuster Cinematic', filter: { brightness: 1.05, contrast: 1.25, saturation: 1.3, blur: 0 } },
    { name: 'Cyberpunk Neon', desc: 'Saturated Violet & Cyan', filter: { brightness: 1.1, contrast: 1.3, saturation: 1.8, blur: 0 } },
    { name: 'Vintage 90s Camcorder', desc: 'Desaturated Warm Film', filter: { brightness: 1.0, contrast: 0.9, saturation: 0.7, blur: 0.5 } },
    { name: 'Noir Black & White', desc: 'High Contrast Dramatic', filter: { brightness: 1.0, contrast: 1.4, saturation: 0, blur: 0 } },
    { name: 'Dreamy Soft Glow', desc: 'Ethereal Bloom Blur', filter: { brightness: 1.15, contrast: 1.05, saturation: 1.1, blur: 1.5 } },
  ];

  return (
    <div className="flex h-full w-80 flex-col border-r border-[#1f242e] bg-[#12141a]">
      {/* Top Search & Filter */}
      <div className="border-b border-[#1f242e] p-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#252b38] bg-[#0c0e12] px-2.5 py-1.5 text-xs text-slate-300 focus-within:border-blue-500">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent placeholder:text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content Body */}
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
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#2d3545] bg-[#0c0e12] p-5 text-center transition hover:border-blue-500/60 hover:bg-blue-600/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#181c24] text-blue-400 group-hover:scale-110 transition">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-200">Import Media Files</p>
              <p className="text-[11px] text-slate-500">MP4, WebM, WAV, MP3, PNG, JPG</p>
            </div>

            <button
              onClick={handleAddSampleFootage}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'Synthesizing...' : 'Load Demo Footage & Audio'}</span>
            </button>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>PROJECT BIN</span>
                <span>{assets.length} items</span>
              </div>

              {assets.length === 0 ? (
                <div className="rounded-lg border border-[#1f242e] bg-[#0c0e12] p-6 text-center text-xs text-slate-500">
                  <Film className="mx-auto h-7 w-7 text-slate-600" />
                  <p className="mt-2">No files imported yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative flex flex-col overflow-hidden rounded-lg border border-[#232938] bg-[#0d0f14] hover:border-blue-500/50 transition"
                    >
                      <div className="relative flex h-20 w-full items-center justify-center bg-[#151922] text-slate-400">
                        {asset.type === 'video' ? (
                          <Film className="h-6 w-6 text-blue-400" />
                        ) : asset.type === 'audio' ? (
                          <Music className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-amber-400" />
                        )}
                        <span className="absolute bottom-1 right-1.5 rounded bg-black/75 px-1 font-mono text-[9px] text-slate-300">
                          {asset.duration.toFixed(1)}s
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2">
                        <span className="truncate text-[11px] font-medium text-slate-200">
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
                                color: asset.type === 'audio' ? '#10b981' : '#3b82f6',
                              });
                            }
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-blue-600 hover:text-white"
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Title & Typography Presets
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {TEXT_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddPresetText(preset)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-[#232938] bg-[#0c0e12] p-3 hover:border-blue-500/50 hover:bg-[#151922] transition"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{preset.title}</h4>
                    <p
                      style={{ color: preset.fontColor }}
                      className="mt-0.5 font-bold tracking-wide text-xs"
                    >
                      {preset.text}
                    </p>
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AUDIO TAB --- */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sound FX & Tracks
            </span>
            <div className="space-y-2">
              {AUDIO_PRESETS.map((sfx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#232938] bg-[#0c0e12] p-2.5 hover:border-emerald-500/40 hover:bg-[#151922] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Music className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-slate-200">{sfx.name}</h4>
                      <span className="text-[10px] text-slate-500">{sfx.cat} • {sfx.duration}</span>
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
                        color: '#10b981',
                      });
                    }}
                    title="Add sound effect"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- FILTERS & EFFECTS TABS --- */}
        {(activeTab === 'filters' || activeTab === 'effects') && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-[#232938] bg-[#0c0e12] p-3 hover:border-purple-500/50 hover:bg-[#151922] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{filter.name}</h4>
                      <p className="text-[10px] text-slate-500">{filter.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {activeTab === 'transitions' ? 'Motion Transitions' : 'Stickers & Graphics'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {['Cross Dissolve', 'Fade to Black', 'Whip Pan', 'Zoom In', 'Glitch Wipe', 'Flash Blur'].map((name, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-xl border border-[#232938] bg-[#0c0e12] p-4 text-center hover:border-blue-500/50 transition cursor-pointer"
                >
                  <Wand2 className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="text-xs font-medium text-slate-300">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
