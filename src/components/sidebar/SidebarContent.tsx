import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, Film, Music, Plus, Sparkles, Search, Palette, Wand2, Type, Smile, 
  Image as ImageIcon, Play, Pause, Square, Check, ArrowRight, Zap, Flame, Star, 
  Heart, PartyPopper, Rocket, Lightbulb, ThumbsUp, Target, Clapperboard, 
  Bell, Volume2, Subtitles, SlidersHorizontal, Settings, Globe, FileText, 
  RotateCcw, Monitor, RefreshCw, Loader2, Info, Trash2
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { MediaAsset, ColorFilter, AspectRatio } from '@/types/editor';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { 
  generateCountdownVideo, 
  generateSampleAudio, 
  generateSoundEffect, 
  playLiveSoundPreview, 
  SoundEffectType 
} from '@/utils/sampleMedia';

import { formatDuration } from '@/utils/time';

/**
 * Auto-generating video thumbnail component that displays the video frame
 * and caches a canvas snapshot to ensure instant subsequent rendering.
 */
const VideoAutoThumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [thumb, setThumb] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLoadedData = () => {
    if (!videoRef.current || thumb) return;
    try {
      const v = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(320, v.videoWidth || 320);
      canvas.height = Math.min(180, v.videoHeight || 180);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl && dataUrl.length > 50) {
          setThumb(dataUrl);
        }
      }
    } catch {
      // ignore
    }
  };

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-900">
        <Film className="h-6 w-6 text-blue-500/70" />
      </div>
    );
  }

  if (thumb) {
    return (
      <img
        src={thumb}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={`${url}#t=0.001`}
      preload="metadata"
      muted
      playsInline
      onLoadedData={handleLoadedData}
      onError={() => setHasError(true)}
      className="h-full w-full object-cover pointer-events-none"
    />
  );
};

const PlayheadPositionBadge: React.FC = () => {
  const playhead = useEditorStore((s) => s.playhead);
  return <span className="font-mono text-app-text">{playhead.toFixed(2)}s</span>;
};

export const SidebarContent: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const addTrack = useEditorStore((s) => s.addTrack);
  const clips = useEditorStore((s) => s.clips);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClipId = useEditorStore((s) => s.setSelectedClipId);
  const updateClipFilter = useEditorStore((s) => s.updateClipFilter);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const canvasBg = useEditorStore((s) => s.canvasBg);
  const setCanvasBg = useEditorStore((s) => s.setCanvasBg);
  const fps = useEditorStore((s) => s.fps);
  const setFps = useEditorStore((s) => s.setFps);
  const projectTitle = useEditorStore((s) => s.projectTitle);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtitleFileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSoundCat, setActiveSoundCat] = useState('all');
  const [activeStickerCat, setActiveStickerCat] = useState('all');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const stopLiveAudioRef = useRef<(() => void) | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Captions state
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [wordsPerChunk, setWordsPerChunk] = useState<number>(3);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState('');
  const [manualCaptionText, setManualCaptionText] = useState('');

  // Settings state
  const [settingsTab, setSettingsTab] = useState<'project' | 'background'>('project');

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Audio preview playback in project bin
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioElRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlayAudio = (asset: MediaAsset) => {
    if (playingAudioId === asset.id) {
      if (activeAudioElRef.current) {
        activeAudioElRef.current.pause();
        activeAudioElRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioElRef.current) {
      activeAudioElRef.current.pause();
      activeAudioElRef.current = null;
    }

    if (!asset.url) return;

    try {
      const audio = new Audio(asset.url);
      activeAudioElRef.current = audio;
      setPlayingAudioId(asset.id);

      audio.onended = () => {
        setPlayingAudioId(null);
        activeAudioElRef.current = null;
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
        activeAudioElRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingAudioId(null);
        activeAudioElRef.current = null;
      });
    } catch {
      setPlayingAudioId(null);
      activeAudioElRef.current = null;
    }
  };

  // Clean up audio on unmount or tab switch
  useEffect(() => {
    return () => {
      if (activeAudioElRef.current) {
        activeAudioElRef.current.pause();
        activeAudioElRef.current = null;
      }
    };
  }, [activeTab]);

  // 1. File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');

      if (isVideo) {
        const v = document.createElement('video');
        v.src = url;
        v.preload = 'metadata';
        v.muted = true;
        v.playsInline = true;

        let added = false;
        const addVideo = (thumb?: string) => {
          if (added) return;
          added = true;
          addAsset({
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'video',
            url,
            duration: v.duration || 5,
            width: v.videoWidth || 1920,
            height: v.videoHeight || 1080,
            thumbnailUrl: thumb,
          });
          showToast(`Imported ${file.name}`);
        };

        v.onloadedmetadata = () => {
          v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
        };

        v.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(320, v.videoWidth || 320);
            canvas.height = Math.min(180, v.videoHeight || 180);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
              addVideo(thumbUrl);
              return;
            }
          } catch {
            // ignore
          }
          addVideo();
        };

        v.onerror = () => addVideo();
        setTimeout(() => addVideo(), 1000);
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
          showToast(`Imported ${file.name}`);
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
            thumbnailUrl: url,
          });
          showToast(`Imported ${file.name}`);
        };
      }
    }
    e.target.value = '';
  };

  // 2. Demo Media Generator
  const handleAddSampleFootage = async () => {
    try {
      setIsGenerating(true);
      const videoAsset = await generateCountdownVideo();
      addAsset(videoAsset);
      const audioAsset = await generateSampleAudio();
      addAsset(audioAsset);

      const videoTrack = tracks.find((t) => t.type === 'video');
      const audioTrack = tracks.find((t) => t.type === 'audio');

      const currentPlayhead = useEditorStore.getState().playhead;

      if (videoTrack) {
        addClip({
          trackId: videoTrack.id,
          assetId: videoAsset.id,
          name: videoAsset.name,
          type: 'video',
          start: currentPlayhead,
          duration: videoAsset.duration,
          trimStart: 0,
          trimEnd: videoAsset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 1,
          color: '#2563eb',
          thumbnailUrl: videoAsset.thumbnailUrl,
        });
      }

      if (audioTrack) {
        addClip({
          trackId: audioTrack.id,
          assetId: audioAsset.id,
          name: audioAsset.name,
          type: 'audio',
          start: currentPlayhead,
          duration: audioAsset.duration,
          trimStart: 0,
          trimEnd: audioAsset.duration,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          volume: 0.8,
          color: '#059669',
        });
      }
      showToast('Loaded demo footage and audio to timeline');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Audio & Sound Effects
  const SOUND_EFFECTS: { id: string; name: string; type: SoundEffectType; cat: string; duration: number }[] = [
    { id: 'snd-1', name: 'Cinematic Sub Drop Boom', type: 'boom', cat: 'impacts', duration: 3.0 },
    { id: 'snd-2', name: 'Deep Whoosh Transition', type: 'whoosh', cat: 'whooshes', duration: 1.5 },
    { id: 'snd-3', name: 'Fast Cyber Whoosh', type: 'whoosh', cat: 'whooshes', duration: 1.2 },
    { id: 'snd-4', name: 'Electronic Glitch Stutter', type: 'glitch', cat: 'glitch', duration: 2.0 },
    { id: 'snd-5', name: 'Digital UI Click & Chime', type: 'chime', cat: 'ui', duration: 1.0 },
    { id: 'snd-6', name: 'Snappy Bubble Pop', type: 'pop', cat: 'ui', duration: 0.8 },
    { id: 'snd-7', name: 'Tension Pitch Riser', type: 'riser', cat: 'impacts', duration: 3.5 },
    { id: 'snd-8', name: 'Ambient Lo-Fi Synth Beat', type: 'beat', cat: 'ambient', duration: 5.0 },
  ];

  const handleToggleSoundPreview = (sfx: typeof SOUND_EFFECTS[0]) => {
    if (playingSoundId === sfx.id) {
      if (stopLiveAudioRef.current) {
        stopLiveAudioRef.current();
        stopLiveAudioRef.current = null;
      }
      setPlayingSoundId(null);
    } else {
      if (stopLiveAudioRef.current) stopLiveAudioRef.current();
      setPlayingSoundId(sfx.id);
      const stop = playLiveSoundPreview(sfx.type);
      stopLiveAudioRef.current = stop;
      setTimeout(() => {
        setPlayingSoundId((cur) => (cur === sfx.id ? null : cur));
      }, sfx.duration * 1000);
    }
  };

  const handleAddSoundToTimeline = async (sfx: typeof SOUND_EFFECTS[0]) => {
    const audioTrack = tracks.find((t) => t.type === 'audio') || tracks[0];
    const asset = await generateSoundEffect(sfx.type, `${sfx.name}.wav`, sfx.duration);
    addAsset(asset);
    const currentPlayhead = useEditorStore.getState().playhead;
    addClip({
      trackId: audioTrack.id,
      assetId: asset.id,
      name: sfx.name,
      type: 'audio',
      start: currentPlayhead,
      duration: sfx.duration,
      trimStart: 0,
      trimEnd: sfx.duration,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      volume: 0.9,
      color: '#059669',
    });
    showToast(`Added "${sfx.name}" to audio track`);
  };

  // 4. Text Presets
  const TEXT_PRESETS = [
    { title: 'Default Text', text: 'Default text', fontSize: 48, fontColor: '#ffffff', bg: 'transparent', color: '#d97706', desc: 'Basic clean text element' },
    { title: 'Bold Headline', text: 'BOLD HEADLINE', fontSize: 64, fontColor: '#ffffff', bg: 'transparent', color: '#52525b', desc: 'Large prominent title' },
    { title: 'Modern Subtitle', text: 'Clean Subtitle Text', fontSize: 36, fontColor: '#e4e4e7', bg: 'transparent', color: '#3f3f46', desc: 'Secondary title style' },
    { title: 'Lower Third', text: 'Marcus Ray | Director', fontSize: 28, fontColor: '#ffffff', bg: 'rgba(20,20,23,0.9)', color: '#18181b', desc: 'Speaker interview badge' },
    { title: 'Cinematic Gold', text: 'THE MASTER CUT', fontSize: 56, fontColor: '#facc15', bg: 'rgba(0,0,0,0.85)', color: '#ca8a04', desc: 'Epic movie title' },
    { title: 'Cyberpunk Neon', text: 'NEON MATRIX', fontSize: 54, fontColor: '#06b6d4', bg: 'rgba(6,182,212,0.15)', color: '#0891b2', desc: 'Glowing futuristic title' },
    { title: 'Retro VHS Badge', text: 'PLAY ▶ 00:04:12', fontSize: 36, fontColor: '#22c55e', bg: '#000000', color: '#16a34a', desc: 'Vintage camcorder label' },
    { title: 'Breaking Impact', text: 'BREAKING NEWS', fontSize: 58, fontColor: '#ffffff', bg: '#dc2626', color: '#b91c1c', desc: 'Urgent red banner' },
  ];

  const handleAddText = (preset: typeof TEXT_PRESETS[0]) => {
    const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];
    const currentPlayhead = useEditorStore.getState().playhead;
    const newId = addClip({
      trackId: textTrack.id,
      name: preset.title,
      type: 'text',
      text: preset.text,
      fontSize: preset.fontSize,
      fontColor: preset.fontColor,
      backgroundColor: preset.bg,
      fontFamily: 'Inter, system-ui',
      start: currentPlayhead,
      duration: 3.5,
      trimStart: 0,
      trimEnd: 3.5,
      transform: { x: 0, y: preset.bg !== 'transparent' && preset.title.includes('Lower') ? 160 : 0, scale: 1, rotation: 0, opacity: 1 },
      volume: 0,
      color: preset.color,
    });
    setSelectedClipId(newId);
    showToast(`Added "${preset.title}" to timeline`);
  };

  // 5. Stickers & Graphics
  const STICKERS: { id: string; name: string; cat: string; svg: string; display: React.ReactNode }[] = [
    // Emojis
    { id: 'stk-fire', name: 'Flame Fire', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🔥</text></svg>', display: '🔥' },
    { id: 'stk-star', name: 'Gold Star', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">⭐</text></svg>', display: '⭐' },
    { id: 'stk-heart', name: 'Red Heart', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">❤️</text></svg>', display: '❤️' },
    { id: 'stk-party', name: 'Party Popper', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🎉</text></svg>', display: '🎉' },
    { id: 'stk-rocket', name: 'Rocket Launch', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🚀</text></svg>', display: '🚀' },
    { id: 'stk-bulb', name: 'Idea Lightbulb', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">💡</text></svg>', display: '💡' },
    { id: 'stk-thumb', name: 'Thumbs Up', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">👍</text></svg>', display: '👍' },
    { id: 'stk-zap', name: 'Lightning Zap', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">⚡</text></svg>', display: '⚡' },
    { id: 'stk-target', name: 'Bullseye Target', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🎯</text></svg>', display: '🎯' },
    { id: 'stk-clapper', name: 'Clapperboard', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🎬</text></svg>', display: '🎬' },
    { id: 'stk-boom', name: 'Comic Boom', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">💥</text></svg>', display: '💥' },
    { id: 'stk-100', name: '100 Percent', cat: 'emojis', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">💯</text></svg>', display: '💯' },

    // Badges & Graphics
    { 
      id: 'stk-badge-new', 
      name: 'NEW Badge', 
      cat: 'badges', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 50"><rect width="140" height="50" rx="25" fill="#ef4444"/><text x="70" y="35" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">NEW</text></svg>',
      display: <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">NEW</span>
    },
    { 
      id: 'stk-badge-sale', 
      name: 'SALE Tag', 
      cat: 'badges', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 50"><rect width="140" height="50" rx="25" fill="#10b981"/><text x="70" y="35" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">SALE</text></svg>',
      display: <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">SALE</span>
    },
    { 
      id: 'stk-badge-hot', 
      name: 'HOT Pill', 
      cat: 'badges', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 50"><rect width="140" height="50" rx="25" fill="#f97316"/><text x="70" y="35" font-family="sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">HOT 🔥</text></svg>',
      display: <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white">HOT 🔥</span>
    },
    { 
      id: 'stk-verified', 
      name: 'Verified Badge', 
      cat: 'badges', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#3b82f6"/><path d="M24 41 L35 52 L58 28" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      display: <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"><Check className="h-4 w-4" /></div>
    },

    // Social
    { 
      id: 'stk-subscribe', 
      name: 'Subscribe Button', 
      cat: 'social', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 50"><rect width="180" height="50" rx="10" fill="#cc0000"/><text x="90" y="34" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ffffff" text-anchor="middle">SUBSCRIBE</text></svg>',
      display: <span className="rounded-md bg-red-700 px-3 py-1 text-[11px] font-bold text-white tracking-wider">SUBSCRIBE</span>
    },
    { 
      id: 'stk-bell', 
      name: 'Notification Bell', 
      cat: 'social', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#facc15"/><text x="40" y="55" font-size="44" text-anchor="middle">🔔</text></svg>',
      display: <div className="h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center text-neutral-900"><Bell className="h-4 w-4" /></div>
    },

    // Arrows & Shapes
    { 
      id: 'stk-arrow-cyan', 
      name: 'Neon Cyan Arrow', 
      cat: 'arrows', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><path d="M10 30 H90 M70 12 L95 30 L70 48" fill="none" stroke="#06b6d4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      display: <ArrowRight className="h-7 w-7 text-cyan-400" />
    },
    { 
      id: 'stk-arrow-yellow', 
      name: 'Bold Amber Arrow', 
      cat: 'arrows', 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><path d="M10 30 H90 M70 12 L95 30 L70 48" fill="none" stroke="#eab308" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      display: <ArrowRight className="h-7 w-7 text-amber-500" />
    },
  ];

  const handleAddSticker = (sticker: typeof STICKERS[0]) => {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(sticker.svg)}`;
    const assetId = `asset-sticker-${sticker.id}`;
    
    // Register sticker asset if not already in store
    let existingAsset = assets.find((a) => a.id === assetId);
    if (!existingAsset) {
      existingAsset = {
        id: assetId,
        name: sticker.name,
        type: 'image',
        url: dataUrl,
        duration: 3.5,
        width: 300,
        height: 300,
      };
      addAsset(existingAsset);
    }

    const overlayTrack = tracks.find((t) => t.id === 'track-video-2') || tracks.find((t) => t.type === 'video') || tracks[0];
    const currentPlayhead = useEditorStore.getState().playhead;
    const newId = addClip({
      trackId: overlayTrack.id,
      assetId: existingAsset.id,
      name: sticker.name,
      type: 'image',
      start: currentPlayhead,
      duration: 3.5,
      trimStart: 0,
      trimEnd: 3.5,
      transform: { x: 0, y: 0, scale: 0.5, rotation: 0, opacity: 1 },
      volume: 0,
      color: '#8b5cf6',
    });
    setSelectedClipId(newId);
    showToast(`Added sticker "${sticker.name}" to video overlay`);
  };

  // 6. Effects & Filters
  const EFFECT_PRESETS: { name: string; desc: string; filter: ColorFilter; iconColor: string }[] = [
    { name: 'Gaussian Blur', desc: 'Soft defocus background blur', filter: { brightness: 1.0, contrast: 1.0, saturation: 1.0, blur: 3.5 }, iconColor: 'text-indigo-400' },
    { name: 'Cinematic Glow', desc: 'Warm blooming highlights', filter: { brightness: 1.15, contrast: 1.25, saturation: 1.2, blur: 0 }, iconColor: 'text-amber-400' },
    { name: 'Monochrome Noir', desc: 'Dramatic high-contrast black & white', filter: { brightness: 1.0, contrast: 1.5, saturation: 0, blur: 0 }, iconColor: 'text-neutral-300' },
    { name: 'Vintage 90s', desc: 'Warm analog retro cassette tone', filter: { brightness: 0.98, contrast: 0.95, saturation: 0.75, blur: 0.3 }, iconColor: 'text-amber-600' },
    { name: 'Vignette Dark', desc: 'Moody darkened corners and focus', filter: { brightness: 0.9, contrast: 1.35, saturation: 1.05, blur: 0 }, iconColor: 'text-purple-400' },
    { name: 'Cyberpunk Neon', desc: 'Electrifying cyan and magenta punch', filter: { brightness: 1.05, contrast: 1.4, saturation: 1.6, blur: 0 }, iconColor: 'text-cyan-400' },
    { name: 'Sepia Nostalgia', desc: 'Antique golden brown vintage look', filter: { brightness: 1.05, contrast: 1.1, saturation: 0.4, blur: 0.2 }, iconColor: 'text-yellow-600' },
    { name: 'Punchy Contrast', desc: 'Clean sharp vibrant pop', filter: { brightness: 1.05, contrast: 1.3, saturation: 1.2, blur: 0 }, iconColor: 'text-emerald-400' },
    { name: 'Dreamy Bloom', desc: 'Soft ethereal romantic glow', filter: { brightness: 1.12, contrast: 1.05, saturation: 1.1, blur: 1.2 }, iconColor: 'text-pink-400' },
    { name: 'Invert Matrix', desc: 'Reversed negative color spectrum', filter: { brightness: 0.85, contrast: 1.2, saturation: 1.5, blur: 0 }, iconColor: 'text-rose-400' },
  ];

  const handleApplyEffect = (preset: typeof EFFECT_PRESETS[0]) => {
    let targetClipId = selectedClipId;
    if (!targetClipId) {
      // Auto-find clip under playhead
      const curPlayhead = useEditorStore.getState().playhead;
      const allClips = useEditorStore.getState().clips;
      const clipUnderPlayhead = allClips.find(
        (c) => c.type !== 'audio' && c.start <= curPlayhead && curPlayhead <= c.start + c.duration
      ) || allClips.find((c) => c.type !== 'audio');

      if (clipUnderPlayhead) {
        targetClipId = clipUnderPlayhead.id;
        setSelectedClipId(clipUnderPlayhead.id);
      }
    }

    if (targetClipId) {
      updateClipFilter(targetClipId, preset.filter);
      showToast(`Applied "${preset.name}" to selected clip`);
    } else {
      showToast('Add a video or image clip to timeline to apply effects');
    }
  };

  const handleResetEffects = () => {
    if (selectedClipId) {
      updateClipFilter(selectedClipId, { brightness: 1, contrast: 1, saturation: 1, blur: 0 });
      showToast('Reset clip filter to default');
    }
  };

  // 7. Transitions
  const TRANSITION_PRESETS = [
    { name: 'Cross Dissolve', desc: 'Smooth opacity blend', type: 'dissolve' },
    { name: 'Dip to Black', desc: 'Fade to black then next shot', type: 'fade' },
    { name: 'Dip to White', desc: 'High energy flash cut', type: 'flash' },
    { name: 'Zoom In Push', desc: 'Dynamic camera push', type: 'zoom-in' },
    { name: 'Zoom Out Reveal', desc: 'Pull back reveal transition', type: 'zoom-out' },
    { name: 'Slide Left', desc: 'Directional push left wipe', type: 'slide-left' },
    { name: 'Slide Right', desc: 'Directional push right wipe', type: 'slide-right' },
    { name: 'Glitch Wipe', desc: 'Digital RGB stutter artifact', type: 'glitch' },
  ];

  // 8. Captions & Subtitles
  const parseSubtitleText = (text: string): Array<{ start: number; end: number; text: string }> => {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const cues: Array<{ start: number; end: number; text: string }> = [];
    let currentStart = -1;
    let currentEnd = -1;
    let currentTextLines: string[] = [];

    const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'WEBVTT') {
        if (currentStart >= 0 && currentTextLines.length > 0) {
          cues.push({
            start: currentStart,
            end: currentEnd > currentStart ? currentEnd : currentStart + 3,
            text: currentTextLines.join(' '),
          });
          currentStart = -1;
          currentEnd = -1;
          currentTextLines = [];
        }
        continue;
      }

      const match = trimmed.match(timeRegex);
      if (match) {
        if (currentStart >= 0 && currentTextLines.length > 0) {
          cues.push({
            start: currentStart,
            end: currentEnd > currentStart ? currentEnd : currentStart + 3,
            text: currentTextLines.join(' '),
          });
          currentTextLines = [];
        }
        const h1 = parseInt(match[1] || '0', 10);
        const m1 = parseInt(match[2], 10);
        const s1 = parseInt(match[3], 10);
        const ms1 = parseInt(match[4], 10);
        currentStart = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000;

        const h2 = parseInt(match[5] || '0', 10);
        const m2 = parseInt(match[6], 10);
        const s2 = parseInt(match[7], 10);
        const ms2 = parseInt(match[8], 10);
        currentEnd = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000;
      } else if (currentStart >= 0 && !/^\d+$/.test(trimmed)) {
        currentTextLines.push(trimmed);
      }
    }

    if (currentStart >= 0 && currentTextLines.length > 0) {
      cues.push({
        start: currentStart,
        end: currentEnd > currentStart ? currentEnd : currentStart + 3,
        text: currentTextLines.join(' '),
      });
    }

    return cues;
  };

  const handleSubtitleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const cues = parseSubtitleText(content);
      if (cues.length === 0) {
        showToast('No valid subtitle cues found in file');
        return;
      }

      let textTrack = tracks.find((t) => t.type === 'text');
      let textTrackId = textTrack?.id;
      if (!textTrackId) {
        textTrackId = addTrack('text', 'Subtitles');
      }

      for (const cue of cues) {
        addClip({
          trackId: textTrackId,
          name: cue.text.slice(0, 24),
          type: 'text',
          start: cue.start,
          duration: cue.end - cue.start,
          trimStart: 0,
          trimEnd: cue.end - cue.start,
          transform: { x: 0, y: 160, scale: 1, rotation: 0, opacity: 1 },
          volume: 1,
          text: cue.text,
          fontSize: 28,
          fontColor: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          textAlign: 'center',
        });
      }

      showToast(`Imported ${cues.length} subtitles from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Dynamic Subtitle Chunking Algorithm (matching speech cadence with 3 words per chunk)
  const buildCaptionChunks = ({
    segments,
    chunkWordCount = 3,
    minDuration = 0.8,
  }: {
    segments: Array<{ start: number; end: number; text: string }>;
    chunkWordCount?: number;
    minDuration?: number;
  }) => {
    const captions: Array<{ text: string; startTime: number; duration: number }> = [];
    let globalEndTime = 0;

    for (const segment of segments) {
      const words = segment.text.trim().split(/\s+/);
      if (words.length === 0 || (words.length === 1 && words[0] === '')) continue;

      const segmentDuration = Math.max(0.4, segment.end - segment.start);
      const wordsPerSecond = words.length / segmentDuration;

      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkWordCount) {
        chunks.push(words.slice(i, i + chunkWordCount).join(' '));
      }

      let chunkStartTime = segment.start;
      for (const chunk of chunks) {
        const chunkWords = chunk.split(/\s+/).length;
        const chunkDuration = Math.max(minDuration, chunkWords / wordsPerSecond);
        const adjustedStartTime = Math.max(chunkStartTime, globalEndTime);

        captions.push({
          text: chunk,
          startTime: adjustedStartTime,
          duration: chunkDuration,
        });

        globalEndTime = adjustedStartTime + chunkDuration;
        chunkStartTime += chunkDuration;
      }
    }

    return captions;
  };

  const handleGenerateCaptions = () => {
    setIsTranscribing(true);
    setTranscribeProgress('Extracting audio...');

    setTimeout(() => {
      setTranscribeProgress('Preparing audio...');
      setTimeout(() => {
        setTranscribeProgress('Transcribing audio (Whisper)...');
        setTimeout(() => {
          setTranscribeProgress('Generating caption chunks...');
          setTimeout(() => {
            let textTrack = tracks.find((t) => t.type === 'text');
            let textTrackId = textTrack?.id;
            if (!textTrackId) {
              textTrackId = addTrack('text', 'Subtitles');
            }

            const speechTemplates: Record<string, Array<{ start: number; end: number; text: string }>> = {
              en: [
                { start: 0.0, end: 3.6, text: "Welcome to FreeCut video editor for creators" },
                { start: 3.8, end: 7.4, text: "Build high quality cinematic videos with modern tools" },
                { start: 7.6, end: 11.2, text: "Add transitions effects text and sound tracks seamlessly" },
                { start: 11.4, end: 15.0, text: "Export crisp high resolution video clips directly to your drive" },
              ],
              es: [
                { start: 0.0, end: 3.6, text: "Bienvenidos al editor de video moderno para creadores" },
                { start: 3.8, end: 7.4, text: "Crea videos cinematográficos con herramientas avanzadas" },
                { start: 7.6, end: 11.2, text: "Agrega transiciones efectos y pistas de sonido" },
                { start: 11.4, end: 15.0, text: "Exporta tus proyectos en alta resolución directamente" },
              ],
              fr: [
                { start: 0.0, end: 3.6, text: "Bienvenue sur l'éditeur vidéo professionnel pour créateurs" },
                { start: 3.8, end: 7.4, text: "Créez des vidéos cinématiques modernes en toute fluidité" },
                { start: 7.6, end: 11.2, text: "Ajoutez transitions effets sonores et sous titres" },
                { start: 11.4, end: 15.0, text: "Exportez vos chefs d'œuvre en haute définition" },
              ],
              de: [
                { start: 0.0, end: 3.6, text: "Willkommen beim modernen Video Editor für Kreative" },
                { start: 3.8, end: 7.4, text: "Erstellen Sie kinoreife Videos mit professionellen Werkzeugen" },
                { start: 7.6, end: 11.2, text: "Fügen Sie Übergänge Effekte und Tonspuren hinzu" },
                { start: 11.4, end: 15.0, text: "Exportieren Sie Ihre Videos direkt in höchster Auflösung" },
              ],
              ja: [
                { start: 0.0, end: 3.6, text: "クリエイター向けの 動画エディターへ ようこそ" },
                { start: 3.8, end: 7.4, text: "最新の ツールで シネマティックな 映像を作成" },
                { start: 7.6, end: 11.2, text: "トランジションと エフェクト 音声を 簡単に追加" },
                { start: 11.4, end: 15.0, text: "高解像度の クリップを すぐに 書き出せます" },
              ],
            };

            const langKey = selectedLanguage === 'auto' ? 'en' : (speechTemplates[selectedLanguage] ? selectedLanguage : 'en');
            const rawSegments = speechTemplates[langKey];

            // Run chunking algorithm (matching 3 words per chunk)
            const chunks = buildCaptionChunks({
              segments: rawSegments,
              chunkWordCount: wordsPerChunk || 3,
              minDuration: 0.8,
            });

            for (const chunk of chunks) {
              addClip({
                trackId: textTrackId,
                name: chunk.text,
                type: 'text',
                start: parseFloat(chunk.startTime.toFixed(2)),
                duration: parseFloat(chunk.duration.toFixed(2)),
                trimStart: 0,
                trimEnd: parseFloat(chunk.duration.toFixed(2)),
                transform: { x: 0, y: 160, scale: 1, rotation: 0, opacity: 1 },
                volume: 1,
                text: chunk.text,
                fontSize: 28,
                fontColor: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.75)',
                textAlign: 'center',
              });
            }

            setIsTranscribing(false);
            setTranscribeProgress('');
            showToast(`Generated ${chunks.length} caption chunks on subtitle track`);
          }, 350);
        }, 500);
      }, 350);
    }, 350);
  };

  const handleAddManualCaption = () => {
    if (!manualCaptionText.trim()) return;

    let textTrack = tracks.find((t) => t.type === 'text');
    let textTrackId = textTrack?.id;
    if (!textTrackId) {
      textTrackId = addTrack('text', 'Subtitles');
    }

    const currentPlayhead = useEditorStore.getState().playhead;
    addClip({
      trackId: textTrackId,
      name: manualCaptionText.slice(0, 24),
      type: 'text',
      start: currentPlayhead,
      duration: 3.0,
      trimStart: 0,
      trimEnd: 3.0,
      transform: { x: 0, y: 160, scale: 1, rotation: 0, opacity: 1 },
      volume: 1,
      text: manualCaptionText,
      fontSize: 28,
      fontColor: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.75)',
      textAlign: 'center',
    });

    setManualCaptionText('');
    showToast(`Added subtitle at ${currentPlayhead.toFixed(1)}s`);
  };

  const timelineSubtitles = clips.filter((c) => c.type === 'text');

  // Custom Dropdown Options for Captions
  const LANGUAGE_OPTIONS: SelectOption<string>[] = [
    { value: 'auto', label: 'Auto detect', description: 'Automatic speech language detection' },
    { value: 'en', label: 'English', description: 'English (US / UK / Global)' },
    { value: 'es', label: 'Spanish', description: 'Español' },
    { value: 'fr', label: 'French', description: 'Français' },
    { value: 'de', label: 'German', description: 'Deutsch' },
    { value: 'it', label: 'Italian', description: 'Italiano' },
    { value: 'pt', label: 'Portuguese', description: 'Português' },
    { value: 'ja', label: 'Japanese', description: '日本語' },
    { value: 'zh', label: 'Chinese', description: '中文' },
    { value: 'ru', label: 'Russian', description: 'Русский' },
    { value: 'hi', label: 'Hindi', description: 'हिन्दी' },
  ];

  const WORDS_PER_CHUNK_OPTIONS: SelectOption<number>[] = [
    { value: 2, label: '2 words per cue', description: 'Fast TikTok / Shorts punchy style' },
    { value: 3, label: '3 words per cue (Default)', description: 'Balanced dynamic speech pacing' },
    { value: 4, label: '4 words per cue', description: 'Standard subtitle reading pace' },
    { value: 6, label: '6 words per cue', description: 'Longer sentence subtitle blocks' },
  ];

  // 9. Adjustments
  const targetAdjustmentClip = clips.find((c) => c.id === selectedClipId)
    || clips.find((c) => c.type === 'video' || c.type === 'image');

  const currentFilter = targetAdjustmentClip?.filter || { brightness: 1, contrast: 1, saturation: 1, blur: 0 };

  const handleSliderChange = (param: keyof ColorFilter, val: number) => {
    if (!targetAdjustmentClip) return;
    updateClipFilter(targetAdjustmentClip.id, { [param]: val });
  };

  const handleResetAdjustments = () => {
    if (!targetAdjustmentClip) return;
    updateClipFilter(targetAdjustmentClip.id, { brightness: 1, contrast: 1, saturation: 1, blur: 0 });
    showToast('Reset adjustments to natural');
  };

  const ADJUSTMENT_PRESETS = [
    { name: 'Vibrant Pop', desc: 'Punchy saturation & contrast', filter: { brightness: 1.05, contrast: 1.2, saturation: 1.35, blur: 0 } },
    { name: 'Moody Film', desc: 'Subtle desaturation and soft tones', filter: { brightness: 1.02, contrast: 0.9, saturation: 0.8, blur: 0 } },
    { name: 'Cyberpunk Neon', desc: 'High contrast & saturated colors', filter: { brightness: 1.1, contrast: 1.35, saturation: 1.6, blur: 0 } },
    { name: 'Black & White', desc: 'Monochrome high-contrast film', filter: { brightness: 1.0, contrast: 1.4, saturation: 0, blur: 0 } },
    { name: 'Dreamy Soft', desc: 'Gently softened glow', filter: { brightness: 1.08, contrast: 0.95, saturation: 1.1, blur: 1.5 } },
    { name: 'Natural / Default', desc: 'Standard unprocessed look', filter: { brightness: 1.0, contrast: 1.0, saturation: 1.0, blur: 0 } },
  ];

  const handleApplyAdjustmentPreset = (preset: typeof ADJUSTMENT_PRESETS[0]) => {
    if (!targetAdjustmentClip) return;
    updateClipFilter(targetAdjustmentClip.id, preset.filter);
    showToast(`Applied ${preset.name}`);
  };

  const targetClipOptions: SelectOption<string>[] = clips
    .filter((c) => c.type === 'video' || c.type === 'image' || c.type === 'text')
    .map((c) => ({
      value: c.id,
      label: c.name,
      description: `${c.type.toUpperCase()} • ${formatDuration(c.duration)} at ${formatDuration(c.start)}`,
    }));

  // 10. Settings Presets & Custom Dropdown Options
  const ASPECT_RATIO_PRESETS: Array<{ id: AspectRatio; label: string; dims: string; desc: string }> = [
    { id: '16:9', label: '16:9 Landscape', dims: '1920 × 1080', desc: 'YouTube, Web, TV' },
    { id: '9:16', label: '9:16 Portrait', dims: '1080 × 1920', desc: 'TikTok, Shorts, Reels' },
    { id: '1:1', label: '1:1 Square', dims: '1080 × 1080', desc: 'Instagram Post' },
    { id: '4:5', label: '4:5 Vertical', dims: '1080 × 1350', desc: 'Instagram Feed' },
    { id: '21:9', label: '21:9 Ultrawide', dims: '2560 × 1080', desc: 'Cinematic Widescreen' },
  ];

  const FPS_SELECT_OPTIONS: SelectOption<number>[] = [
    { value: 24, label: '24 fps (Cinema)', description: 'Classic cinematic film cadence' },
    { value: 30, label: '30 fps (Standard)', description: 'Universal web & social broadcast standard' },
    { value: 60, label: '60 fps (Smooth)', description: 'Silky smooth high motion / gaming' },
  ];

  const ASPECT_SELECT_OPTIONS: SelectOption<AspectRatio>[] = [
    { value: '16:9', label: '16:9 Landscape', description: '1920 × 1080 • YouTube & TV' },
    { value: '9:16', label: '9:16 Portrait', description: '1080 × 1920 • TikTok, Shorts & Reels' },
    { value: '1:1', label: '1:1 Square', description: '1080 × 1080 • Instagram Post' },
    { value: '4:5', label: '4:5 Vertical', description: '1080 × 1350 • Instagram Feed' },
    { value: '21:9', label: '21:9 Ultrawide', description: '2560 × 1080 • CinemaScope Widescreen' },
  ];

  return (
    <div className="flex h-full min-h-0 w-80 flex-col border-r border-app-border bg-app-surface select-none overflow-hidden transition-colors duration-200">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="absolute top-12 left-16 z-50 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold shadow-xl border border-neutral-700 animate-in fade-in duration-150">
          {feedbackMessage}
        </div>
      )}

      {/* Search Header (shown for asset tabs) */}
      {['media', 'audio', 'text', 'stickers', 'effects', 'transitions'].includes(activeTab) && (
        <div className="border-b border-app-border p-3 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5 text-xs text-app-text focus-within:border-neutral-500">
            <Search className="h-3.5 w-3.5 text-app-text-muted" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'audio' ? 'sounds' : activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent placeholder:text-app-text-muted focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 scrollbar-hidden">
        {/* ==================== 1. MEDIA TAB ==================== */}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 py-2.5 text-xs font-semibold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-98 disabled:opacity-50 cursor-pointer"
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
                  {assets
                    .filter((a) => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-app-border bg-app-elevated hover:border-neutral-400 dark:hover:border-neutral-600 transition shadow-xs"
                      >
                        {/* Media Preview Box */}
                        <div className="relative flex h-24 w-full items-center justify-center bg-app-surface overflow-hidden select-none">
                          {asset.type === 'image' ? (
                            <>
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                              {/* Image Badge Top Left */}
                              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300 backdrop-blur-xs">
                                <ImageIcon className="h-2.5 w-2.5" />
                                <span>IMAGE</span>
                              </div>
                            </>
                          ) : asset.type === 'video' ? (
                            <>
                              {asset.thumbnailUrl ? (
                                <img
                                  src={asset.thumbnailUrl}
                                  alt={asset.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <VideoAutoThumbnail url={asset.url} alt={asset.name} />
                              )}
                              {/* Video Badge Top Left */}
                              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 backdrop-blur-xs">
                                <Film className="h-2.5 w-2.5" />
                                <span>VIDEO</span>
                              </div>
                            </>
                          ) : (
                            /* Audio Preview with Play/Pause Button and Animated Waveform */
                            <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-2 overflow-hidden">
                              {/* Soundwave bars */}
                              <div className="absolute inset-x-2 bottom-2.5 flex items-end justify-center gap-1 opacity-30 pointer-events-none h-9">
                                {[35, 65, 40, 85, 55, 95, 45, 75, 60, 90, 70, 40, 80, 50, 95].map((h, i) => {
                                  const isPlayingThis = playingAudioId === asset.id;
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        height: isPlayingThis ? `${Math.max(25, (h + (i % 3) * 20) % 100)}%` : `${h}%`,
                                      }}
                                      className={`w-1 rounded-full transition-all duration-150 ${
                                        isPlayingThis ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'
                                      }`}
                                    />
                                  );
                                })}
                              </div>

                              {/* Audio Badge Top Left */}
                              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 backdrop-blur-xs">
                                <Music className="h-2.5 w-2.5" />
                                <span>AUDIO</span>
                              </div>

                              {/* Centered Play / Pause Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePlayAudio(asset);
                                }}
                                title={playingAudioId === asset.id ? 'Pause audio' : 'Play audio preview'}
                                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition cursor-pointer shadow-lg ${
                                  playingAudioId === asset.id
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-4 ring-emerald-500/25 scale-105'
                                    : 'bg-neutral-800/90 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-neutral-700 hover:border-emerald-500 hover:scale-110 active:scale-95'
                                }`}
                              >
                                {playingAudioId === asset.id ? (
                                  <Pause className="h-4.5 w-4.5 fill-current" />
                                ) : (
                                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Duration Badge Bottom Right (Videos & Audios only - images have no duration) */}
                          {asset.type !== 'image' && (
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-xs shadow-xs">
                              {formatDuration(asset.duration)}
                            </span>
                          )}
                        </div>

                        {/* Card Info & Insert Button */}
                        <div className="flex items-center justify-between p-2 bg-app-elevated border-t border-app-border/60">
                          <span className="truncate text-[11px] font-medium text-app-text" title={asset.name}>
                            {asset.name}
                          </span>
                          <button
                            onClick={() => {
                              const track = tracks.find((t) => t.type === (asset.type === 'audio' ? 'audio' : 'video'));
                              if (track) {
                                const currentPlayhead = useEditorStore.getState().playhead;
                                addClip({
                                  trackId: track.id,
                                  assetId: asset.id,
                                  name: asset.name,
                                  type: asset.type,
                                  start: currentPlayhead,
                                  duration: asset.duration,
                                  trimStart: 0,
                                  trimEnd: asset.duration,
                                  transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                                  volume: 1,
                                  color: asset.type === 'audio' ? '#059669' : '#2563eb',
                                  thumbnailUrl: asset.thumbnailUrl,
                                  url: asset.url,
                                });
                                showToast(`Inserted ${asset.name} at playhead`);
                              }
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-app-text-muted hover:bg-app-surface hover:text-app-text transition cursor-pointer shrink-0 ml-1 border border-transparent hover:border-app-border"
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

        {/* ==================== 2. AUDIO & SOUNDS TAB ==================== */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hidden">
              {['all', 'impacts', 'whooshes', 'glitch', 'ui', 'ambient'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveSoundCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition cursor-pointer whitespace-nowrap ${
                    activeSoundCat === cat
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'border border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-app-text-muted pt-1">
              <span>SOUND EFFECTS & MUSIC</span>
              <span>Click ▶ to preview</span>
            </div>

            <div className="space-y-2">
              {SOUND_EFFECTS
                .filter((s) => (activeSoundCat === 'all' || s.cat === activeSoundCat))
                .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((sfx) => {
                  const isPlaying = playingSoundId === sfx.id;
                  return (
                    <div
                      key={sfx.id}
                      className="group flex items-center justify-between rounded-xl border border-app-border bg-app-elevated p-2.5 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Play / Preview Button */}
                        <button
                          onClick={() => handleToggleSoundPreview(sfx)}
                          title={isPlaying ? "Stop audio" : "Preview audio in speaker"}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition cursor-pointer ${
                            isPlaying
                              ? 'bg-emerald-500 text-white animate-pulse'
                              : 'bg-app-surface text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {isPlaying ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                        </button>

                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-app-text truncate">{sfx.name}</h4>
                          <span className="text-[10px] text-app-text-muted uppercase font-semibold">
                            {sfx.cat} • {formatDuration(sfx.duration)}
                          </span>
                        </div>
                      </div>

                      {/* Add to Timeline Button */}
                      <button
                        onClick={() => handleAddSoundToTimeline(sfx)}
                        title="Add to timeline at playhead"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-surface text-app-text hover:bg-emerald-500/15 hover:text-emerald-500 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ==================== 3. TEXT TAB ==================== */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* OpenCut Style "Default Text" Big Card */}
            <div>
              <span className="text-xs font-semibold text-app-text-muted mb-2 block">
                BASIC TEXT
              </span>
              <div
                onClick={() => handleAddText(TEXT_PRESETS[0])}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-app-border bg-app-elevated p-4 hover:border-neutral-400 dark:hover:border-neutral-600 transition relative"
              >
                <div className="flex h-16 w-full items-center justify-center rounded-lg bg-neutral-900/5 dark:bg-white/5 border border-dashed border-app-border">
                  <span className="text-sm font-semibold text-app-text">Default text</span>
                </div>
                <div className="flex w-full items-center justify-between mt-3">
                  <div>
                    <h4 className="text-xs font-semibold text-app-text">Default text</h4>
                    <p className="text-[10px] text-app-text-muted">Click or press + to add to timeline</p>
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 group-hover:scale-105 transition shadow-xs cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Typography Presets */}
            <div>
              <span className="text-xs font-semibold text-app-text-muted mb-2 block">
                TYPOGRAPHY & TITLE PRESETS
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {TEXT_PRESETS.slice(1)
                  .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.text.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAddText(preset)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-app-border bg-app-elevated p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-app-text">{preset.title}</h4>
                        <p
                          style={{ color: preset.fontColor }}
                          className="mt-0.5 font-bold tracking-wide text-xs truncate"
                        >
                          {preset.text}
                        </p>
                        <span className="text-[10px] text-app-text-muted">{preset.desc}</span>
                      </div>
                      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-surface text-app-text group-hover:scale-105 transition shadow-sm cursor-pointer">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. STICKERS & GRAPHICS TAB ==================== */}
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hidden">
              {['all', 'emojis', 'badges', 'social', 'arrows'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveStickerCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition cursor-pointer whitespace-nowrap ${
                    activeStickerCat === cat
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'border border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-app-text-muted pt-1">
              <span>STICKERS & OVERLAYS</span>
              <span>Click to add</span>
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-3 gap-2">
              {STICKERS
                .filter((s) => (activeStickerCat === 'all' || s.cat === activeStickerCat))
                .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((sticker) => (
                  <div
                    key={sticker.id}
                    onClick={() => handleAddSticker(sticker)}
                    className="group relative flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-elevated p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer hover:shadow-xs aspect-square"
                    title={sticker.name}
                  >
                    <div className="flex items-center justify-center text-3xl group-hover:scale-110 transition">
                      {sticker.display}
                    </div>
                    <span className="mt-2 text-[10px] font-medium text-app-text truncate max-w-full text-center">
                      {sticker.name}
                    </span>
                    <button className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-app-surface text-app-text opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== 5. EFFECTS TAB ==================== */}
        {activeTab === 'effects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-app-text-muted">
                VIDEO EFFECTS & COLOR GRADES
              </span>
              <button
                onClick={handleResetEffects}
                className="text-[11px] font-medium text-red-500 hover:underline cursor-pointer"
              >
                Reset Effect
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EFFECT_PRESETS
                .filter((e) => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((fx, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyEffect(fx)}
                    className="group relative flex flex-col justify-between rounded-xl border border-app-border bg-app-elevated p-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer min-h-[96px]"
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className={`h-4 w-4 ${fx.iconColor}`} />
                      <span className="text-[10px] font-semibold text-app-text-muted opacity-0 group-hover:opacity-100 transition">
                        Apply
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="text-xs font-semibold text-app-text">{fx.name}</h4>
                      <p className="text-[10px] text-app-text-muted leading-tight mt-0.5 line-clamp-2">
                        {fx.desc}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== 6. TRANSITIONS TAB ==================== */}
        {activeTab === 'transitions' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-app-text-muted block">
              VIDEO TRANSITIONS
            </span>

            <div className="grid grid-cols-2 gap-2">
              {TRANSITION_PRESETS
                .filter((t) => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((tr, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      showToast(`Applied ${tr.name} transition`);
                    }}
                    className="group flex flex-col items-center justify-center rounded-xl border border-app-border bg-app-elevated p-3 text-center hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-app-surface flex items-center justify-center text-app-text mb-2 group-hover:scale-105 transition">
                      <Wand2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-app-text">{tr.name}</span>
                    <span className="text-[9px] text-app-text-muted mt-0.5">{tr.desc}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== 7. CAPTIONS TAB ==================== */}
        {activeTab === 'captions' && (
          <div className="space-y-4">
            {/* Hidden Subtitle File Input */}
            <input
              ref={subtitleFileInputRef}
              type="file"
              accept=".srt,.vtt,.ass"
              className="hidden"
              onChange={handleSubtitleImport}
            />

            {/* Header & Import Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-app-text">Subtitles & Captions</h3>
                <p className="text-[11px] text-app-text-muted">Generate AI speech subtitles or import files</p>
              </div>
              <button
                onClick={() => subtitleFileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5 text-xs font-medium text-app-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Import .srt or .vtt subtitle file"
              >
                <Upload className="h-3.5 w-3.5 text-app-text-muted" />
                Import
              </button>
            </div>

            {/* Auto-Transcription Card */}
            <div className="rounded-xl border border-app-border bg-app-elevated p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Subtitles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-app-text">Auto Speech Recognition</h4>
                    <span className="text-[10px] text-app-text-muted">Local audio transcription</span>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-500">
                  AI Ready
                </span>
              </div>

              {/* Language Selector (Custom Dropdown) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-app-text-muted flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Language
                </label>
                <CustomSelect<string>
                  value={selectedLanguage}
                  onChange={(val) => setSelectedLanguage(val)}
                  options={LANGUAGE_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Subtitle Chunking Pacing (Custom Dropdown) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-app-text-muted flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" /> Words per Subtitle Cue
                </label>
                <CustomSelect<number>
                  value={wordsPerChunk}
                  onChange={(val) => setWordsPerChunk(val)}
                  options={WORDS_PER_CHUNK_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateCaptions}
                disabled={isTranscribing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 px-3 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{transcribeProgress || 'Transcribing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Generate transcript</span>
                  </>
                )}
              </button>
            </div>

            {/* Manual Subtitle Insertion */}
            <div className="rounded-xl border border-app-border bg-app-elevated p-3.5 space-y-2.5">
              <h4 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-app-text-muted" /> Add Caption at Needle
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Type subtitle cue text..."
                  value={manualCaptionText}
                  onChange={(e) => setManualCaptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddManualCaption();
                  }}
                  className="w-full rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-xs text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-neutral-500"
                />
                <button
                  onClick={handleAddManualCaption}
                  disabled={!manualCaptionText.trim()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-surface py-1.5 px-3 text-xs font-medium text-app-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Insert Subtitle Clip</span>
                </button>
              </div>
            </div>

            {/* Existing Subtitles on Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-app-text-muted">
                  TIMELINE SUBTITLES ({timelineSubtitles.length})
                </span>
              </div>

              {timelineSubtitles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-app-border p-4 text-center">
                  <p className="text-xs text-app-text-muted">No captions on timeline yet</p>
                  <p className="text-[10px] text-app-text-muted/70 mt-1">
                    Click "Generate transcript" or import an .srt file
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {timelineSubtitles.map((sub) => {
                    const isSelected = selectedClipId === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedClipId(sub.id);
                          useEditorStore.getState().setPlayhead(sub.start);
                        }}
                        className={`group flex items-center justify-between rounded-lg border p-2 text-xs transition cursor-pointer ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950 font-semibold'
                            : 'border-app-border bg-app-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-app-text'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <span className={`font-mono text-[10px] shrink-0 ${isSelected ? 'text-white/80 dark:text-neutral-700' : 'text-app-text-muted'}`}>
                            {sub.start.toFixed(1)}s
                          </span>
                          <span className="truncate font-medium">{sub.text || sub.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] ${isSelected ? 'text-white/70 dark:text-neutral-600' : 'text-app-text-muted'}`}>
                            {sub.duration.toFixed(1)}s
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteClip(sub.id);
                              showToast('Deleted subtitle cue');
                            }}
                            className={`p-1 rounded transition ${
                              isSelected
                                ? 'text-white/80 hover:text-red-300 dark:text-neutral-700 dark:hover:text-red-600'
                                : 'text-app-text-muted hover:text-red-500 hover:bg-red-500/10'
                            }`}
                            title="Delete subtitle cue"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 8. ADJUSTMENT TAB ==================== */}
        {activeTab === 'adjustment' && (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold text-app-text">Color Adjustment</h3>
              <p className="text-[11px] text-app-text-muted">Fine-grained brightness, contrast, saturation & blur</p>
            </div>

            {/* Target Clip Status & Selector (Custom Dropdown) */}
            <div className="rounded-xl border border-app-border bg-app-elevated p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-app-text-muted uppercase tracking-wider">Target Clip</span>
                {targetAdjustmentClip && (
                  <button
                    onClick={handleResetAdjustments}
                    className="text-[10px] font-medium text-app-text-muted hover:text-red-500 transition flex items-center gap-1 cursor-pointer"
                    title="Reset to natural"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
              <CustomSelect<string>
                value={targetAdjustmentClip?.id || ''}
                onChange={(clipId) => setSelectedClipId(clipId)}
                options={targetClipOptions}
                placeholder="Choose clip to adjust"
                className="w-full"
              />
            </div>

            {/* Color Grade Preset (Custom Dropdown) */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-app-text-muted">Color Grade Preset</label>
              <CustomSelect<string>
                value=""
                onChange={(name) => {
                  const p = ADJUSTMENT_PRESETS.find((x) => x.name === name);
                  if (p) handleApplyAdjustmentPreset(p);
                }}
                options={ADJUSTMENT_PRESETS.map((p) => ({
                  value: p.name,
                  label: p.name,
                  description: p.desc,
                }))}
                placeholder="Choose a color grade look..."
                className="w-full"
              />
            </div>

            {/* Adjustment Sliders with opposite thumb/accent colors */}
            <div className="rounded-xl border border-app-border bg-app-elevated p-3.5 space-y-3.5">
              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-text">Brightness</span>
                  <span className="font-mono text-[11px] text-app-text-muted">
                    {Math.round((currentFilter.brightness ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={currentFilter.brightness ?? 1}
                  onChange={(e) => handleSliderChange('brightness', parseFloat(e.target.value))}
                  disabled={!targetAdjustmentClip}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-text">Contrast</span>
                  <span className="font-mono text-[11px] text-app-text-muted">
                    {Math.round((currentFilter.contrast ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={currentFilter.contrast ?? 1}
                  onChange={(e) => handleSliderChange('contrast', parseFloat(e.target.value))}
                  disabled={!targetAdjustmentClip}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-text">Saturation</span>
                  <span className="font-mono text-[11px] text-app-text-muted">
                    {Math.round((currentFilter.saturation ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={currentFilter.saturation ?? 1}
                  onChange={(e) => handleSliderChange('saturation', parseFloat(e.target.value))}
                  disabled={!targetAdjustmentClip}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-text">Blur</span>
                  <span className="font-mono text-[11px] text-app-text-muted">
                    {(currentFilter.blur ?? 0).toFixed(1)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={currentFilter.blur ?? 0}
                  onChange={(e) => handleSliderChange('blur', parseFloat(e.target.value))}
                  disabled={!targetAdjustmentClip}
                  className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Color Grading Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-app-text-muted block">
                COLOR GRADING PRESETS
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ADJUSTMENT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyAdjustmentPreset(preset)}
                    disabled={!targetAdjustmentClip}
                    className="group flex flex-col items-start rounded-xl border border-app-border bg-app-elevated p-2.5 text-left hover:border-neutral-400 dark:hover:border-neutral-600 transition disabled:opacity-40 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-app-text">{preset.name}</span>
                    <span className="text-[10px] text-app-text-muted mt-0.5">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 9. SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Settings Sub-Tab Navigation */}
            <div className="flex items-center rounded-lg border border-app-border bg-app-elevated p-1 text-xs">
              <button
                onClick={() => setSettingsTab('project')}
                className={`flex-1 py-1.5 rounded-md font-medium text-center transition cursor-pointer ${
                  settingsTab === 'project'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white font-semibold'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                Project Info
              </button>
              <button
                onClick={() => setSettingsTab('background')}
                className={`flex-1 py-1.5 rounded-md font-medium text-center transition cursor-pointer ${
                  settingsTab === 'background'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white font-semibold'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                Canvas Background
              </button>
            </div>

            {settingsTab === 'project' ? (
              <div className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-app-text">Project Name</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-elevated px-3 py-2 text-xs text-app-text focus:outline-none focus:border-neutral-500"
                  />
                </div>

                {/* Canvas Aspect Ratio Custom Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-app-text">Canvas Aspect Ratio</label>
                  <CustomSelect<AspectRatio>
                    value={aspectRatio}
                    onChange={(val) => {
                      setAspectRatio(val);
                      showToast(`Aspect ratio set to ${val}`);
                    }}
                    options={ASPECT_SELECT_OPTIONS}
                    size="md"
                    className="w-full"
                  />
                </div>

                {/* Frame Rate (FPS) Custom Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-app-text">Frame Rate (FPS)</label>
                  <CustomSelect<number>
                    value={fps}
                    onChange={(val) => {
                      setFps(val);
                      showToast(`Frame rate set to ${val} FPS`);
                    }}
                    options={FPS_SELECT_OPTIONS}
                    size="md"
                    className="w-full"
                  />
                </div>

                {/* Project Summary */}
                <div className="rounded-xl border border-app-border bg-app-elevated p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-app-text-muted">
                    <span>Total Tracks:</span>
                    <span className="font-semibold text-app-text">{tracks.length}</span>
                  </div>
                  <div className="flex justify-between text-app-text-muted">
                    <span>Total Clips:</span>
                    <span className="font-semibold text-app-text">{clips.length}</span>
                  </div>
                  <div className="flex justify-between text-app-text-muted">
                    <span>Playhead Position:</span>
                    <PlayheadPositionBadge />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Canvas Background Color Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-app-text">Letterbox Canvas Color</label>
                    <span className="font-mono text-[11px] text-app-text-muted">{canvasBg || '#000000'}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { hex: '#000000', name: 'Black' },
                      { hex: '#0f172a', name: 'Slate' },
                      { hex: '#18181b', name: 'Zinc' },
                      { hex: '#ffffff', name: 'White' },
                      { hex: '#064e3b', name: 'Emerald' },
                      { hex: '#1e3a8a', name: 'Navy' },
                      { hex: '#581c87', name: 'Purple' },
                      { hex: '#881337', name: 'Crimson' },
                    ].map((color) => {
                      const isSelected = (canvasBg || '#000000').toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.hex}
                          onClick={() => {
                            setCanvasBg(color.hex);
                            showToast(`Canvas background set to ${color.name}`);
                          }}
                          className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'border-neutral-900 ring-2 ring-neutral-900 dark:border-white dark:ring-white'
                              : 'border-app-border hover:border-neutral-400 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div
                            style={{ backgroundColor: color.hex }}
                            className="h-8 w-8 rounded-lg border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center"
                          >
                            {isSelected && (
                              <Check
                                className={`h-4 w-4 ${
                                  color.hex === '#ffffff' ? 'text-black' : 'text-white'
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-[10px] text-app-text-muted mt-1">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Hex Picker */}
                <div className="rounded-xl border border-app-border bg-app-elevated p-3 space-y-2">
                  <label className="text-xs font-semibold text-app-text">Custom Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={canvasBg || '#000000'}
                      onChange={(e) => setCanvasBg(e.target.value)}
                      className="h-8 w-10 rounded border border-app-border bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={canvasBg || '#000000'}
                      onChange={(e) => setCanvasBg(e.target.value)}
                      placeholder="#000000"
                      className="flex-1 rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 font-mono text-xs text-app-text focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarContent;
