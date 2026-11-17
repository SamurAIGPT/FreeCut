import React, { useRef, useState } from 'react';
import { 
  Upload, Film, Music, Plus, Sparkles, Search, Palette, Wand2, Type, Smile, 
  Image as ImageIcon, Play, Square, Check, ArrowRight, Zap, Flame, Star, 
  Heart, PartyPopper, Rocket, Lightbulb, ThumbsUp, Target, Clapperboard, 
  Bell, Volume2
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { MediaAsset, ColorFilter } from '@/types/editor';
import { 
  generateCountdownVideo, 
  generateSampleAudio, 
  generateSoundEffect, 
  playLiveSoundPreview, 
  SoundEffectType 
} from '@/utils/sampleMedia';

export const SidebarContent: React.FC = () => {
  const activeTab = useEditorStore((s) => s.activeSidebarTab);
  const assets = useEditorStore((s) => s.assets);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClipId = useEditorStore((s) => s.setSelectedClipId);
  const updateClipFilter = useEditorStore((s) => s.updateClipFilter);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSoundCat, setActiveSoundCat] = useState('all');
  const [activeStickerCat, setActiveStickerCat] = useState('all');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const stopLiveAudioRef = useRef<(() => void) | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

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
          showToast(`Imported ${file.name}`);
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
          });
          showToast(`Imported ${file.name}`);
        };
      }
    }
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
    addClip({
      trackId: audioTrack.id,
      assetId: asset.id,
      name: sfx.name,
      type: 'audio',
      start: playhead,
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
    const newId = addClip({
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
    const newId = addClip({
      trackId: overlayTrack.id,
      assetId: existingAsset.id,
      name: sticker.name,
      type: 'image',
      start: playhead,
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
      const allClips = useEditorStore.getState().clips;
      const clipUnderPlayhead = allClips.find(
        (c) => c.type !== 'audio' && c.start <= playhead && playhead <= c.start + c.duration
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

  return (
    <div className="flex h-full min-h-0 w-80 flex-col border-r border-app-border bg-app-surface select-none overflow-hidden transition-colors duration-200">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="absolute top-12 left-16 z-50 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold shadow-xl border border-neutral-700 animate-in fade-in duration-150">
          {feedbackMessage}
        </div>
      )}

      {/* Search Header */}
      <div className="border-b border-app-border p-3 shrink-0">
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
                        className="group relative flex flex-col overflow-hidden rounded-lg border border-app-border bg-app-elevated hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                      >
                        <div className="relative flex h-20 w-full items-center justify-center bg-app-surface text-app-text-muted">
                          {asset.type === 'video' ? (
                            <Film className="h-5 w-5 text-blue-500" />
                          ) : asset.type === 'audio' ? (
                            <Music className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-purple-500" />
                          )}
                          <span className="absolute bottom-1 right-1.5 rounded bg-black/75 px-1 font-mono text-[9px] text-white">
                            {asset.duration.toFixed(1)}s
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2">
                          <span className="truncate text-[11px] font-medium text-app-text" title={asset.name}>
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
                                showToast(`Inserted ${asset.name} at playhead`);
                              }
                            }}
                            className="rounded p-1 text-app-text-muted hover:bg-app-surface hover:text-app-text transition cursor-pointer"
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
                            {sfx.cat} • {sfx.duration.toFixed(1)}s
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
        {(activeTab === 'effects' || activeTab === 'filters') && (
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
      </div>
    </div>
  );
};

export default SidebarContent;
