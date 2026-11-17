import React, { useRef, useState } from 'react';
import { FilePlus, Film, Music, Plus, Sparkles, Type, Upload } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { MediaAsset } from '@/types/editor';
import { generateCountdownVideo, generateSampleAudio } from '@/utils/sampleMedia';

export const AssetsPanel: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);

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
            width: v.videoWidth || 1280,
            height: v.videoHeight || 720,
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
        // Image
        const img = new Image();
        img.src = url;
        img.onload = () => {
          addAsset({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'image',
            url,
            duration: 4, // Default 4s for images
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

      // Automatically place on timeline for instant gratification
      const videoTrack = tracks.find((t) => t.type === 'video');
      const audioTrack = tracks.find((t) => t.type === 'audio');

      if (videoTrack) {
        addClip({
          trackId: videoTrack.id,
          assetId: videoAsset.id,
          name: videoAsset.name,
          type: 'video',
          start: 0,
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
          start: 0,
          duration: audioAsset.duration,
          trimStart: 0,
          trimEnd: audioAsset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0.8,
          color: '#10b981',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTextClip = () => {
    const textTrack = tracks.find((t) => t.type === 'text');
    if (!textTrack) return;

    addClip({
      trackId: textTrack.id,
      name: 'Title Text',
      type: 'text',
      text: 'FreeCut Video Editor',
      fontSize: 54,
      fontColor: '#ffffff',
      backgroundColor: 'transparent',
      fontFamily: 'Inter, system-ui',
      start: playhead,
      duration: 3,
      trimStart: 0,
      trimEnd: 3,
      transform: { x: 0, y: -150, scale: 1, rotation: 0, opacity: 1 },
      volume: 0,
      color: '#f59e0b',
    });
  };

  const handleAddAssetToTimeline = (asset: MediaAsset) => {
    const targetTrackType = asset.type === 'audio' ? 'audio' : 'video';
    const track = tracks.find((t) => t.type === targetTrackType);
    if (!track) return;

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
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-surface">
      {/* Panel Tabs / Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Media Assets
        </span>
        <button
          onClick={handleAddTextClip}
          title="Add Text Title"
          className="flex items-center gap-1 rounded bg-surface-elevated px-2 py-1 text-xs text-slate-300 hover:bg-border hover:text-white"
        >
          <Type className="h-3.5 w-3.5 text-amber-400" />
          <span>Add Text</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="p-3">
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
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#0d0f12] p-4 text-center transition hover:border-primary/50 hover:bg-surface-elevated"
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <p className="mt-1.5 text-xs font-medium text-slate-300">Upload Media</p>
          <p className="text-[10px] text-slate-500">Video, Audio, Images</p>
        </div>

        {/* Generate Sample Footage button */}
        <button
          onClick={handleAddSampleFootage}
          disabled={isGenerating}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs font-medium text-blue-400 hover:bg-primary/20 active:scale-98 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isGenerating ? 'Synthesizing...' : 'Load Sample Footage'}</span>
        </button>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500">
            <Film className="h-8 w-8 stroke-1 text-slate-600" />
            <p className="mt-2">No media loaded yet</p>
            <p className="text-[11px] text-slate-600">Click Load Sample Footage to start editing instantly</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group flex items-center justify-between rounded-lg border border-border bg-[#0d0f12] p-2 hover:border-border/80 hover:bg-surface-elevated"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface border border-border text-slate-400">
                    {asset.type === 'video' ? (
                      <Film className="h-4 w-4 text-blue-400" />
                    ) : asset.type === 'audio' ? (
                      <Music className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <FilePlus className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-medium text-slate-200">{asset.name}</p>
                    <p className="text-[10px] text-slate-500">{asset.duration.toFixed(1)}s</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddAssetToTimeline(asset)}
                  title="Add to Timeline at Playhead"
                  className="rounded p-1 text-slate-400 hover:bg-primary hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
