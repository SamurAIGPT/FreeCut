import React, { useState } from 'react';
import { 
  Move, Volume2, VolumeX, Gauge, Droplet, Layers, Sparkles, Type, 
  Trash2, Diamond, Link2, Unlink2, FlipHorizontal, FlipVertical, 
  Plus, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight, Bold, 
  Italic, Underline, Strikethrough, Split, Square, Circle, Heart, 
  Star, Film, Music, SlidersHorizontal
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ClipMask, ClipEffect, MaskType, Transform } from '@/types/editor';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { Tooltip } from '@/components/ui/Tooltip';
import { NumberField } from '@/components/ui/NumberField';
import { formatDuration } from '@/utils/time';

const BLEND_MODE_OPTIONS: SelectOption<GlobalCompositeOperation>[] = [
  { value: 'source-over', label: 'Normal', description: 'Standard layer opacity' },
  { value: 'darken', label: 'Darken', description: 'Keeps only darkest pixels' },
  { value: 'multiply', label: 'Multiply', description: 'Best for textures and shadows' },
  { value: 'color-burn', label: 'Color Burn', description: 'Darkens base color with high contrast' },
  { value: 'lighten', label: 'Lighten', description: 'Keeps only lightest pixels' },
  { value: 'screen', label: 'Screen', description: 'Best for fire, lens flares, explosions' },
  { value: 'lighter', label: 'Plus Lighter / Add', description: 'Vibrant luminescent glow effect' },
  { value: 'color-dodge', label: 'Color Dodge', description: 'Brightens underlying color' },
  { value: 'overlay', label: 'Overlay', description: 'Dynamic contrast blending' },
  { value: 'soft-light', label: 'Soft Light', description: 'Subtle contrast and diffused lighting' },
  { value: 'hard-light', label: 'Hard Light', description: 'Strong contrast and intense speculars' },
  { value: 'difference', label: 'Difference', description: 'High-contrast inverted stylization' },
  { value: 'exclusion', label: 'Exclusion', description: 'Softer difference mode' },
  { value: 'hue', label: 'Hue', description: 'Preserves luminance & saturation with new hue' },
  { value: 'saturation', label: 'Saturation', description: 'Preserves luminance & hue with new saturation' },
  { value: 'color', label: 'Color', description: 'Preserves luminance with new hue and saturation' },
  { value: 'luminosity', label: 'Luminosity', description: 'Preserves hue and saturation with new luminance' },
];

const FONT_OPTIONS: SelectOption<string>[] = [
  { value: 'Inter, system-ui', label: 'Inter Sans', description: 'Clean modern sans-serif' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono', description: 'Technical monospace code' },
  { value: 'Impact, sans-serif', label: 'Impact Display', description: 'Punchy heavy titles' },
  { value: 'Georgia, serif', label: 'Georgia Serif', description: 'Classic editorial serif' },
  { value: 'system-ui, sans-serif', label: 'System Default', description: 'Native operating system' },
];

const MASK_TYPE_OPTIONS: { type: MaskType; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'rectangle', name: 'Rectangle', icon: Square },
  { type: 'ellipse', name: 'Circle / Ellipse', icon: Circle },
  { type: 'split', name: 'Split Line', icon: Split },
  { type: 'cinematic-bars', name: 'Cinematic Bars', icon: Film },
  { type: 'diamond', name: 'Diamond', icon: Diamond },
  { type: 'star', name: 'Star', icon: Star },
  { type: 'heart', name: 'Heart', icon: Heart },
  { type: 'text', name: 'Text Mask', icon: Type },
];

const EFFECT_CATALOG: { type: ClipEffect['type']; name: string; defaultParam: Partial<ClipEffect> }[] = [
  { type: 'blur', name: 'Gaussian Blur', defaultParam: { intensity: 15 } },
  { type: 'brightness', name: 'Brightness', defaultParam: { value: 120 } },
  { type: 'contrast', name: 'Contrast', defaultParam: { value: 125 } },
  { type: 'saturation', name: 'Saturation', defaultParam: { value: 130 } },
  { type: 'grayscale', name: 'Grayscale', defaultParam: { value: 100 } },
  { type: 'sepia', name: 'Sepia Tone', defaultParam: { value: 80 } },
  { type: 'invert', name: 'Invert Color', defaultParam: { value: 100 } },
  { type: 'hue-rotate', name: 'Hue Rotation', defaultParam: { value: 90 } },
];

type InspectorTabId = 'transform' | 'audio' | 'speed' | 'blending' | 'masks' | 'effects' | 'text';

interface TabDef {
  id: InspectorTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const InspectorPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectorTabId>('transform');
  const [isScaleLocked, setIsScaleLocked] = useState(true);
  const [isAddMaskOpen, setIsAddMaskOpen] = useState(false);
  const [isAddEffectOpen, setIsAddEffectOpen] = useState(false);

  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const clips = useEditorStore((s) => s.clips);
  const tracks = useEditorStore((s) => s.tracks);
  const updateClip = useEditorStore((s) => s.updateClip);
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform);
  const updateClipMask = useEditorStore((s) => s.updateClipMask);
  const addClipEffect = useEditorStore((s) => s.addClipEffect);
  const updateClipEffect = useEditorStore((s) => s.updateClipEffect);
  const removeClipEffect = useEditorStore((s) => s.removeClipEffect);
  const toggleClipEffect = useEditorStore((s) => s.toggleClipEffect);
  const toggleClipKeyframe = useEditorStore((s) => s.toggleClipKeyframe);
  const deleteClip = useEditorStore((s) => s.deleteClip);

  const clip = clips.find((c) => c.id === selectedClipId);
  const track = clip ? tracks.find((t) => t.id === clip.trackId) : null;

  // Determine available tabs dynamically based on track/clip type selection
  const getVisibleTabs = (): TabDef[] => {
    if (!clip) return [];

    switch (clip.type) {
      case 'video':
        return [
          { id: 'transform', label: 'Transform', icon: Move },
          { id: 'audio', label: 'Audio', icon: Volume2 },
          { id: 'speed', label: 'Speed', icon: Gauge },
          { id: 'blending', label: 'Blending', icon: Droplet },
          { id: 'masks', label: 'Masks', icon: Layers },
          { id: 'effects', label: 'Effects', icon: Sparkles },
        ];
      case 'image':
        return [
          { id: 'transform', label: 'Transform', icon: Move },
          { id: 'blending', label: 'Blending', icon: Droplet },
          { id: 'masks', label: 'Masks', icon: Layers },
          { id: 'effects', label: 'Effects', icon: Sparkles },
        ];
      case 'audio':
        return [
          { id: 'audio', label: 'Audio', icon: Volume2 },
          { id: 'speed', label: 'Speed', icon: Gauge },
        ];
      case 'text':
        return [
          { id: 'text', label: 'Text', icon: Type },
          { id: 'transform', label: 'Transform', icon: Move },
          { id: 'blending', label: 'Blending', icon: Droplet },
        ];
      default:
        return [
          { id: 'transform', label: 'Transform', icon: Move },
          { id: 'blending', label: 'Blending', icon: Droplet },
        ];
    }
  };

  const visibleTabs = getVisibleTabs();

  // If current active tab is not valid for selected clip, switch to default
  React.useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [clip?.id, clip?.type]);

  if (!clip) {
    return (
      <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-app-border bg-app-surface select-none overflow-hidden transition-colors duration-200">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-app-text-muted">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-app-border bg-app-elevated text-app-text-muted shadow-sm">
            <SlidersHorizontal className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-app-text">No Clip Selected</h3>
          <p className="mt-1.5 text-xs text-app-text-muted max-w-[220px] leading-relaxed">
            Select any clip on the timeline to customize motion transform, blending, masks, effects, and audio.
          </p>
        </div>
      </aside>
    );
  }

  const transform: Transform = clip.transform || { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 };
  const mask: ClipMask = clip.mask || {
    type: 'none',
    x: 0,
    y: 0,
    width: 360,
    height: 240,
    scale: 1,
    radius: 0,
    feather: 0,
    inverted: false,
    rotation: 0,
  };
  const effects: ClipEffect[] = clip.effects || [];
  const keyframedProps = clip.keyframedProps || [];

  const isKeyframed = (prop: string) => keyframedProps.includes(prop);

  // Field Header with Diamond Keyframe Icon (exact styling matching reference project)
  const renderFieldHeader = (propName: string, label: string) => {
    const active = isKeyframed(propName);
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-app-text">
        <button
          type="button"
          onClick={() => toggleClipKeyframe(clip.id, propName)}
          title={`Toggle keyframe for ${label}`}
          className={`flex items-center justify-center h-4 w-4 rounded transition cursor-pointer ${
            active ? 'text-blue-500 hover:text-blue-600' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Diamond className={`h-3 w-3 ${active ? 'fill-blue-500' : ''}`} />
        </button>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-row border-l border-app-border bg-app-surface select-none overflow-hidden transition-colors duration-200">
      {/* --- Vertical Left Icon Tab Strip --- */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1.5 border-r border-app-border bg-app-surface/90 py-3 px-1 scrollbar-hidden overflow-y-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <Tooltip key={tab.id} content={tab.label} side="right">
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition cursor-pointer ${
                  isActive
                    ? 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/15 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:bg-app-elevated hover:text-app-text dark:text-neutral-400'
                }`}
                aria-label={tab.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* --- Right Content Area --- */}
      <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden bg-app-surface">
        {/* Top Header Bar */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-app-border px-3.5">
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
            <span className="truncate text-xs font-semibold text-app-text" title={clip.name}>
              {clip.name}
            </span>
            <span className="rounded bg-app-elevated px-1.5 py-0.5 text-[9px] font-mono text-app-text-muted capitalize">
              {clip.type}
            </span>
          </div>

          <button
            onClick={() => deleteClip(clip.id)}
            title="Delete Clip (Del)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-app-text-muted hover:bg-red-500/15 hover:text-red-500 transition cursor-pointer shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Properties Panel Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs scrollbar-thin">
          {/* ===================== TRANSFORM TAB ===================== */}
          {activeTab === 'transform' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Transform</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsScaleLocked(!isScaleLocked)}
                    title={isScaleLocked ? 'Aspect Ratio Locked (Scale X & Y synced)' : 'Aspect Ratio Unlocked'}
                    className={`flex items-center justify-center h-6 w-6 rounded transition cursor-pointer ${
                      isScaleLocked ? 'bg-blue-500/15 text-blue-500' : 'text-app-text-muted hover:bg-app-elevated'
                    }`}
                  >
                    {isScaleLocked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = transform.scaleX ?? transform.scale ?? 1;
                      updateClipTransform(clip.id, { scaleX: -cur });
                    }}
                    title="Flip Horizontal"
                    className="flex items-center justify-center h-6 w-6 rounded text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = transform.scaleY ?? transform.scale ?? 1;
                      updateClipTransform(clip.id, { scaleY: -cur });
                    }}
                    title="Flip Vertical"
                    className="flex items-center justify-center h-6 w-6 rounded text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
                  >
                    <FlipVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Position X */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.positionX', 'Position X')}
                <NumberField
                  value={transform.x}
                  defaultValue={0}
                  step={1}
                  suffix="px"
                  icon="X"
                  onChange={(val) => updateClipTransform(clip.id, { x: val })}
                  onReset={() => updateClipTransform(clip.id, { x: 0 })}
                />
              </div>

              {/* Position Y */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.positionY', 'Position Y')}
                <NumberField
                  value={transform.y}
                  defaultValue={0}
                  step={1}
                  suffix="px"
                  icon="Y"
                  onChange={(val) => updateClipTransform(clip.id, { y: val })}
                  onReset={() => updateClipTransform(clip.id, { y: 0 })}
                />
              </div>

              {/* Scale X */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.scaleX', 'Scale X')}
                <NumberField
                  value={transform.scaleX !== undefined ? transform.scaleX : transform.scale}
                  defaultValue={1}
                  step={0.01}
                  min={0.01}
                  max={20}
                  dragSensitivity="slow"
                  onChange={(val) => {
                    if (isScaleLocked) {
                      updateClipTransform(clip.id, { scale: val, scaleX: val, scaleY: val });
                    } else {
                      updateClipTransform(clip.id, { scaleX: val });
                    }
                  }}
                  onReset={() => {
                    if (isScaleLocked) {
                      updateClipTransform(clip.id, { scale: 1, scaleX: 1, scaleY: 1 });
                    } else {
                      updateClipTransform(clip.id, { scaleX: 1 });
                    }
                  }}
                />
              </div>

              {/* Scale Y */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.scaleY', 'Scale Y')}
                <NumberField
                  value={transform.scaleY !== undefined ? transform.scaleY : transform.scale}
                  defaultValue={1}
                  step={0.01}
                  min={0.01}
                  max={20}
                  dragSensitivity="slow"
                  onChange={(val) => {
                    if (isScaleLocked) {
                      updateClipTransform(clip.id, { scale: val, scaleX: val, scaleY: val });
                    } else {
                      updateClipTransform(clip.id, { scaleY: val });
                    }
                  }}
                  onReset={() => {
                    if (isScaleLocked) {
                      updateClipTransform(clip.id, { scale: 1, scaleX: 1, scaleY: 1 });
                    } else {
                      updateClipTransform(clip.id, { scaleY: 1 });
                    }
                  }}
                />
              </div>

              {/* Rotate */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.rotate', 'Rotate')}
                <NumberField
                  value={transform.rotation}
                  defaultValue={0}
                  min={-360}
                  max={360}
                  step={1}
                  suffix="°"
                  onChange={(val) => updateClipTransform(clip.id, { rotation: val })}
                  onReset={() => updateClipTransform(clip.id, { rotation: 0 })}
                />
              </div>
            </div>
          )}

          {/* ===================== BLENDING TAB ===================== */}
          {activeTab === 'blending' && (
            <div className="space-y-3.5">
              <div className="border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Blending</span>
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                {renderFieldHeader('opacity', 'Opacity')}
                <NumberField
                  value={transform.opacity}
                  defaultValue={1}
                  min={0}
                  max={1}
                  step={0.01}
                  dragSensitivity="slow"
                  onChange={(val) => updateClipTransform(clip.id, { opacity: val })}
                  onReset={() => updateClipTransform(clip.id, { opacity: 1 })}
                />
              </div>

              {/* Blend Mode */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-app-text">Blend Mode</span>
                <CustomSelect<GlobalCompositeOperation>
                  value={clip.blendMode || 'source-over'}
                  onChange={(val) => updateClip(clip.id, { blendMode: val })}
                  options={BLEND_MODE_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* ===================== AUDIO TAB ===================== */}
          {activeTab === 'audio' && (
            <div className="space-y-3.5">
              <div className="border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Audio Controls</span>
              </div>

              {/* Volume */}
              <div className="space-y-1.5">
                {renderFieldHeader('volume', 'Volume')}
                <NumberField
                  value={clip.volume !== undefined ? clip.volume : 1}
                  defaultValue={1}
                  min={0}
                  max={2}
                  step={0.01}
                  dragSensitivity="slow"
                  onChange={(val) => updateClip(clip.id, { volume: val })}
                  onReset={() => updateClip(clip.id, { volume: 1 })}
                />
              </div>

              {/* Stereo Pan */}
              <div className="space-y-1.5">
                {renderFieldHeader('pan', 'Stereo Pan')}
                <NumberField
                  value={clip.pan || 0}
                  defaultValue={0}
                  min={-1}
                  max={1}
                  step={0.05}
                  dragSensitivity="slow"
                  onChange={(val) => updateClip(clip.id, { pan: val })}
                  onReset={() => updateClip(clip.id, { pan: 0 })}
                />
              </div>

              {/* Mute Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-elevated p-2.5">
                <div className="flex items-center gap-2">
                  {clip.isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-app-text" />}
                  <span className="text-xs font-medium text-app-text">Mute Audio</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateClip(clip.id, { isMuted: !clip.isMuted })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    clip.isMuted ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      clip.isMuted ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ===================== SPEED TAB ===================== */}
          {activeTab === 'speed' && (
            <div className="space-y-3.5">
              <div className="border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Speed & Retiming</span>
              </div>

              {/* Speed Factor */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-app-text">Speed</span>
                <NumberField
                  value={clip.speed || 1}
                  defaultValue={1}
                  min={0.01}
                  max={100}
                  step={0.01}
                  suffix="x"
                  dragSensitivity="slow"
                  onChange={(val) => {
                    const newSpeed = Math.max(0.01, val);
                    updateClip(clip.id, { speed: newSpeed });
                  }}
                  onReset={() => updateClip(clip.id, { speed: 1 })}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateClip(clip.id, { speed: rate })}
                    className={`rounded border py-1 font-mono text-[11px] transition cursor-pointer ${
                      (clip.speed || 1) === rate
                        ? 'border-blue-500 bg-blue-500/15 text-blue-500 font-semibold'
                        : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Maintain Pitch Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-elevated p-2.5">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-app-text">Change Pitch</span>
                  <span className="text-[10px] text-app-text-muted">Pitch scales with speed playback</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateClip(clip.id, { maintainPitch: !clip.maintainPitch })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    !clip.maintainPitch ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      !clip.maintainPitch ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Resulting Duration Info */}
              <div className="rounded-lg border border-app-border bg-app-elevated p-2.5 flex items-center justify-between text-xs">
                <span className="text-app-text-muted">Effective Duration:</span>
                <span className="font-mono font-semibold text-app-text">
                  {formatDuration(clip.duration / (clip.speed || 1))}
                </span>
              </div>
            </div>
          )}

          {/* ===================== MASKS TAB ===================== */}
          {activeTab === 'masks' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Masks</span>
                
                {/* Add Mask dropdown trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddMaskOpen(!isAddMaskOpen)}
                    className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
                    title="Add Mask Shape"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  {isAddMaskOpen && (
                    <div className="absolute right-0 top-7 z-50 w-44 rounded-lg border border-app-border bg-app-surface py-1 shadow-xl">
                      {MASK_TYPE_OPTIONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              updateClipMask(clip.id, {
                                type: item.type,
                                x: 0,
                                y: 0,
                                width: item.type === 'split' ? 600 : 360,
                                height: item.type === 'cinematic-bars' ? 120 : 240,
                                scale: 1,
                                radius: 0,
                                feather: 0,
                                inverted: false,
                                rotation: 0,
                                strokeWidth: 0,
                                strokeColor: '#ffffff',
                              });
                              setIsAddMaskOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-app-text hover:bg-app-elevated transition cursor-pointer"
                          >
                            <Icon className="h-3.5 w-3.5 text-blue-500" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {mask.type === 'none' ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-app-text-muted">
                  <Layers className="h-8 w-8 stroke-[1.5] text-app-text-muted/60" />
                  <p className="mt-2 text-xs font-medium text-app-text">No Mask Applied</p>
                  <p className="mt-1 text-[11px] text-app-text-muted">
                    Click the + icon above or select a shape to isolate and crop regions.
                  </p>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 w-full">
                    {MASK_TYPE_OPTIONS.slice(0, 4).map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() =>
                          updateClipMask(clip.id, {
                            type: opt.type,
                            x: 0,
                            y: 0,
                            width: opt.type === 'split' ? 600 : 360,
                            height: opt.type === 'cinematic-bars' ? 120 : 240,
                            scale: 1,
                            radius: 0,
                            feather: 0,
                            inverted: false,
                            rotation: 0,
                            strokeWidth: 0,
                          })
                        }
                        className="rounded border border-app-border bg-app-elevated py-1.5 text-center text-[10px] font-medium text-app-text hover:border-blue-500 hover:text-blue-500 transition cursor-pointer"
                      >
                        {opt.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mask Header & Invert / Remove Actions */}
                  <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                    <span className="font-semibold text-xs text-app-text capitalize">
                      {mask.type.replace('-', ' ')} Mask
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateClipMask(clip.id, { inverted: !mask.inverted })}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          mask.inverted ? 'bg-blue-500 text-white' : 'bg-app-surface text-app-text-muted hover:text-app-text'
                        }`}
                        title="Invert Mask Area"
                      >
                        {mask.inverted ? 'Inverted' : 'Normal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateClipMask(clip.id, { type: 'none' })}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                        title="Remove Mask"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Position X & Y */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      {renderFieldHeader('mask.x', 'Position X')}
                      <NumberField
                        value={mask.x}
                        defaultValue={0}
                        step={1}
                        suffix="px"
                        icon="X"
                        onChange={(val) => updateClipMask(clip.id, { x: val })}
                        onReset={() => updateClipMask(clip.id, { x: 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderFieldHeader('mask.y', 'Position Y')}
                      <NumberField
                        value={mask.y}
                        defaultValue={0}
                        step={1}
                        suffix="px"
                        icon="Y"
                        onChange={(val) => updateClipMask(clip.id, { y: val })}
                        onReset={() => updateClipMask(clip.id, { y: 0 })}
                      />
                    </div>
                  </div>

                  {/* Size controls depending on shape */}
                  {mask.type === 'rectangle' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          {renderFieldHeader('mask.width', 'Width')}
                          <NumberField
                            value={mask.width}
                            defaultValue={360}
                            min={10}
                            step={1}
                            suffix="px"
                            onChange={(val) => updateClipMask(clip.id, { width: val })}
                            onReset={() => updateClipMask(clip.id, { width: 360 })}
                          />
                        </div>
                        <div className="space-y-1">
                          {renderFieldHeader('mask.height', 'Height')}
                          <NumberField
                            value={mask.height}
                            defaultValue={240}
                            min={10}
                            step={1}
                            suffix="px"
                            onChange={(val) => updateClipMask(clip.id, { height: val })}
                            onReset={() => updateClipMask(clip.id, { height: 240 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {renderFieldHeader('mask.radius', 'Corner Radius')}
                        <NumberField
                          value={mask.radius || 0}
                          defaultValue={0}
                          min={0}
                          max={200}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClipMask(clip.id, { radius: val })}
                          onReset={() => updateClipMask(clip.id, { radius: 0 })}
                        />
                      </div>
                    </>
                  )}

                  {(mask.type === 'ellipse' || mask.type === 'circle') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        {renderFieldHeader('mask.width', 'Radius X')}
                        <NumberField
                          value={mask.width}
                          defaultValue={360}
                          min={10}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClipMask(clip.id, { width: val })}
                          onReset={() => updateClipMask(clip.id, { width: 360 })}
                        />
                      </div>
                      <div className="space-y-1">
                        {renderFieldHeader('mask.height', 'Radius Y')}
                        <NumberField
                          value={mask.height}
                          defaultValue={240}
                          min={10}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClipMask(clip.id, { height: val })}
                          onReset={() => updateClipMask(clip.id, { height: 240 })}
                        />
                      </div>
                    </div>
                  )}

                  {(mask.type === 'star' || mask.type === 'heart' || mask.type === 'diamond') && (
                    <div className="space-y-1">
                      {renderFieldHeader('mask.scale', 'Scale')}
                      <NumberField
                        value={mask.scale || 1}
                        defaultValue={1}
                        min={0.1}
                        max={10}
                        step={0.05}
                        onChange={(val) => updateClipMask(clip.id, { scale: val })}
                        onReset={() => updateClipMask(clip.id, { scale: 1 })}
                      />
                    </div>
                  )}

                  {mask.type === 'cinematic-bars' && (
                    <div className="space-y-1">
                      {renderFieldHeader('mask.height', 'Bar Height')}
                      <NumberField
                        value={mask.height}
                        defaultValue={120}
                        min={10}
                        max={500}
                        step={1}
                        suffix="px"
                        onChange={(val) => updateClipMask(clip.id, { height: val })}
                        onReset={() => updateClipMask(clip.id, { height: 120 })}
                      />
                    </div>
                  )}

                  {/* Rotation */}
                  <div className="space-y-1">
                    {renderFieldHeader('mask.rotation', 'Rotation')}
                    <NumberField
                      value={mask.rotation || 0}
                      defaultValue={0}
                      min={-360}
                      max={360}
                      step={1}
                      suffix="°"
                      onChange={(val) => updateClipMask(clip.id, { rotation: val })}
                      onReset={() => updateClipMask(clip.id, { rotation: 0 })}
                    />
                  </div>

                  {/* Feather */}
                  <div className="space-y-1">
                    {renderFieldHeader('mask.feather', 'Feather')}
                    <NumberField
                      value={mask.feather}
                      defaultValue={0}
                      min={0}
                      max={100}
                      step={1}
                      suffix="px"
                      onChange={(val) => updateClipMask(clip.id, { feather: val })}
                      onReset={() => updateClipMask(clip.id, { feather: 0 })}
                    />
                  </div>

                  {/* Stroke Width & Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-app-text">Stroke Width</span>
                      <NumberField
                        value={mask.strokeWidth || 0}
                        defaultValue={0}
                        min={0}
                        max={50}
                        step={1}
                        suffix="px"
                        onChange={(val) => updateClipMask(clip.id, { strokeWidth: val })}
                        onReset={() => updateClipMask(clip.id, { strokeWidth: 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-app-text">Stroke Color</span>
                      <div className="flex h-8 items-center gap-1.5 rounded-md border border-app-border bg-app-elevated px-2">
                        <input
                          type="color"
                          value={mask.strokeColor || '#ffffff'}
                          onChange={(e) => updateClipMask(clip.id, { strokeColor: e.target.value })}
                          className="h-5 w-5 rounded border-none bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-xs uppercase text-app-text">
                          {mask.strokeColor || '#ffffff'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== EFFECTS TAB ===================== */}
          {activeTab === 'effects' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Effects</span>

                {/* Add Effect dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddEffectOpen(!isAddEffectOpen)}
                    className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
                    title="Add Visual Effect"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  {isAddEffectOpen && (
                    <div className="absolute right-0 top-7 z-50 w-44 rounded-lg border border-app-border bg-app-surface py-1 shadow-xl">
                      {EFFECT_CATALOG.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            addClipEffect(clip.id, {
                              type: item.type,
                              name: item.name,
                              enabled: true,
                              ...item.defaultParam,
                            });
                            setIsAddEffectOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-app-text hover:bg-app-elevated transition cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {effects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-app-text-muted">
                  <Sparkles className="h-8 w-8 stroke-[1.5] text-app-text-muted/60" />
                  <p className="mt-2 text-xs font-medium text-app-text">No Effects Added</p>
                  <p className="mt-1 text-[11px] text-app-text-muted">
                    Click the + icon above to stack blur, brightness, contrast, and color filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {effects.map((eff) => (
                    <div
                      key={eff.id}
                      className="rounded-lg border border-app-border bg-app-elevated p-2.5 space-y-2.5 transition"
                    >
                      <div className="flex items-center justify-between border-b border-app-border/60 pb-1.5">
                        <span className="font-semibold text-xs text-app-text">{eff.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleClipEffect(clip.id, eff.id)}
                            className="p-1 rounded text-app-text-muted hover:text-app-text transition cursor-pointer"
                            title={eff.enabled ? 'Disable Effect' : 'Enable Effect'}
                          >
                            {eff.enabled ? <Eye className="h-3.5 w-3.5 text-blue-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeClipEffect(clip.id, eff.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Remove Effect"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {eff.type === 'blur' && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-app-text">Intensity</span>
                          <NumberField
                            value={eff.intensity || 0}
                            defaultValue={15}
                            min={0}
                            max={100}
                            step={1}
                            suffix="px"
                            onChange={(val) => updateClipEffect(clip.id, eff.id, { intensity: val })}
                            onReset={() => updateClipEffect(clip.id, eff.id, { intensity: 15 })}
                          />
                        </div>
                      )}

                      {(eff.type === 'brightness' || eff.type === 'contrast' || eff.type === 'saturation') && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-app-text">Amount</span>
                          <NumberField
                            value={eff.value !== undefined ? eff.value : 100}
                            defaultValue={100}
                            min={0}
                            max={300}
                            step={1}
                            suffix="%"
                            onChange={(val) => updateClipEffect(clip.id, eff.id, { value: val })}
                            onReset={() => updateClipEffect(clip.id, eff.id, { value: 100 })}
                          />
                        </div>
                      )}

                      {(eff.type === 'grayscale' || eff.type === 'sepia' || eff.type === 'invert') && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-app-text">Intensity</span>
                          <NumberField
                            value={eff.value !== undefined ? eff.value : 100}
                            defaultValue={100}
                            min={0}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(val) => updateClipEffect(clip.id, eff.id, { value: val })}
                            onReset={() => updateClipEffect(clip.id, eff.id, { value: 100 })}
                          />
                        </div>
                      )}

                      {eff.type === 'hue-rotate' && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-app-text">Angle</span>
                          <NumberField
                            value={eff.value !== undefined ? eff.value : 0}
                            defaultValue={0}
                            min={0}
                            max={360}
                            step={1}
                            suffix="°"
                            onChange={(val) => updateClipEffect(clip.id, eff.id, { value: val })}
                            onReset={() => updateClipEffect(clip.id, eff.id, { value: 0 })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TEXT TAB ===================== */}
          {activeTab === 'text' && (
            <div className="space-y-3.5">
              <div className="border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Typography</span>
              </div>

              {/* Text Content */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-app-text">Content</span>
                <textarea
                  rows={2}
                  value={clip.text || ''}
                  onChange={(e) => updateClip(clip.id, { text: e.target.value })}
                  placeholder="Enter text..."
                  className="w-full rounded-md border border-neutral-200 dark:border-neutral-700/60 bg-neutral-100/80 dark:bg-neutral-800/60 p-2 text-xs text-app-text outline-none focus:border-blue-500 focus:bg-app-surface focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-app-text">Font Family</span>
                <CustomSelect<string>
                  value={clip.fontFamily || 'Inter, system-ui'}
                  onChange={(val) => updateClip(clip.id, { fontFamily: val })}
                  options={FONT_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {renderFieldHeader('fontSize', 'Font Size')}
                  <NumberField
                    value={clip.fontSize || 48}
                    defaultValue={48}
                    min={8}
                    max={300}
                    step={1}
                    suffix="px"
                    onChange={(val) => updateClip(clip.id, { fontSize: val })}
                    onReset={() => updateClip(clip.id, { fontSize: 48 })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-app-text">Text Color</span>
                  <div className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-700/60 bg-neutral-100/80 dark:bg-neutral-800/60 px-2">
                    <input
                      type="color"
                      value={clip.fontColor || '#ffffff'}
                      onChange={(e) => updateClip(clip.id, { fontColor: e.target.value })}
                      className="h-5 w-5 rounded border-none bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs uppercase text-app-text">
                      {clip.fontColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alignment & Styles */}
              <div className="flex items-center justify-between gap-2">
                {/* Alignment */}
                <div className="flex items-center rounded-md border border-app-border bg-app-elevated p-0.5">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                    const isSelected = (clip.textAlign || 'center') === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updateClip(clip.id, { textAlign: align })}
                        className={`flex h-7 w-7 items-center justify-center rounded transition cursor-pointer ${
                          isSelected ? 'bg-blue-500 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Font Weight, Italic, Underline */}
                <div className="flex items-center rounded-md border border-app-border bg-app-elevated p-0.5">
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { fontWeight: clip.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`flex h-7 w-7 items-center justify-center rounded transition cursor-pointer ${
                      clip.fontWeight === 'bold' ? 'bg-blue-500 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { fontStyle: clip.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`flex h-7 w-7 items-center justify-center rounded transition cursor-pointer ${
                      clip.fontStyle === 'italic' ? 'bg-blue-500 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'
                    }`}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { textDecoration: clip.textDecoration === 'underline' ? 'none' : 'underline' })}
                    className={`flex h-7 w-7 items-center justify-center rounded transition cursor-pointer ${
                      clip.textDecoration === 'underline' ? 'bg-blue-500 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'
                    }`}
                    title="Underline"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { textDecoration: clip.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                    className={`flex h-7 w-7 items-center justify-center rounded transition cursor-pointer ${
                      clip.textDecoration === 'line-through' ? 'bg-blue-500 text-white shadow-xs' : 'text-app-text-muted hover:text-app-text'
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Letter Spacing & Line Height */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {renderFieldHeader('letterSpacing', 'Letter Spacing')}
                  <NumberField
                    value={clip.letterSpacing || 0}
                    defaultValue={0}
                    min={-20}
                    max={100}
                    step={1}
                    suffix="px"
                    onChange={(val) => updateClip(clip.id, { letterSpacing: val })}
                    onReset={() => updateClip(clip.id, { letterSpacing: 0 })}
                  />
                </div>
                <div className="space-y-1">
                  {renderFieldHeader('lineHeight', 'Line Height')}
                  <NumberField
                    value={clip.lineHeight || 1.2}
                    defaultValue={1.2}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    dragSensitivity="slow"
                    onChange={(val) => updateClip(clip.id, { lineHeight: val })}
                    onReset={() => updateClip(clip.id, { lineHeight: 1.2 })}
                  />
                </div>
              </div>

              {/* Background Box Section */}
              <div className="rounded-lg border border-app-border bg-app-elevated p-2.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-app-text">Text Background Box</span>
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { backgroundEnabled: !clip.backgroundEnabled })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      clip.backgroundEnabled ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        clip.backgroundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {clip.backgroundEnabled && (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-app-text">Background Color</span>
                      <div className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-700/60 bg-app-surface px-2">
                        <input
                          type="color"
                          value={clip.backgroundColor || '#000000'}
                          onChange={(e) => updateClip(clip.id, { backgroundColor: e.target.value })}
                          className="h-5 w-5 rounded border-none bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-xs uppercase text-app-text">
                          {clip.backgroundColor || '#000000'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-app-text">Corner Radius</span>
                        <NumberField
                          value={clip.backgroundCornerRadius || 8}
                          defaultValue={8}
                          min={0}
                          max={50}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClip(clip.id, { backgroundCornerRadius: val })}
                          onReset={() => updateClip(clip.id, { backgroundCornerRadius: 8 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-app-text">Padding X</span>
                        <NumberField
                          value={clip.backgroundPaddingX ?? 20}
                          defaultValue={20}
                          min={0}
                          max={100}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClip(clip.id, { backgroundPaddingX: val })}
                          onReset={() => updateClip(clip.id, { backgroundPaddingX: 20 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-app-text">Padding Y</span>
                        <NumberField
                          value={clip.backgroundPaddingY ?? 12}
                          defaultValue={12}
                          min={0}
                          max={100}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClip(clip.id, { backgroundPaddingY: val })}
                          onReset={() => updateClip(clip.id, { backgroundPaddingY: 12 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-app-text">Offset Y</span>
                        <NumberField
                          value={clip.backgroundOffsetY ?? 0}
                          defaultValue={0}
                          min={-200}
                          max={200}
                          step={1}
                          suffix="px"
                          onChange={(val) => updateClip(clip.id, { backgroundOffsetY: val })}
                          onReset={() => updateClip(clip.id, { backgroundOffsetY: 0 })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
