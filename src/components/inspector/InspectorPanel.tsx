import React, { useState } from 'react';
import { 
  Move, RotateCw, Volume2, VolumeX, Type, Sliders, Trash2, Gauge, 
  Palette, Layers, RefreshCw, Blend, CaseSensitive, Droplet, 
  Sparkles, Wand2, Square, Circle, Star, Heart, Diamond, 
  AlignLeft, AlignCenter, AlignRight, FlipHorizontal 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { ClipMask, ColorFilter, MaskType, Transform } from '@/types/editor';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { Tooltip } from '@/components/ui/Tooltip';

const BLEND_MODE_OPTIONS: SelectOption<GlobalCompositeOperation>[] = [
  { value: 'source-over', label: 'Normal', description: 'Standard layer opacity' },
  { value: 'screen', label: 'Screen (Lighten)', description: 'Best for fire, lens flares, explosions' },
  { value: 'multiply', label: 'Multiply (Darken)', description: 'Best for textures and shadows' },
  { value: 'overlay', label: 'Overlay', description: 'Dynamic contrast blending' },
  { value: 'lighter', label: 'Add / Glow', description: 'Vibrant luminescent glow effect' },
  { value: 'darken', label: 'Darken', description: 'Keeps only darkest pixels' },
  { value: 'lighten', label: 'Lighten', description: 'Keeps only lightest pixels' },
  { value: 'color-dodge', label: 'Color Dodge', description: 'Brightens underlying color' },
  { value: 'difference', label: 'Invert Difference', description: 'High-contrast inverted stylization' },
  { value: 'exclusion', label: 'Exclusion', description: 'Softer difference mode' },
];

const FONT_OPTIONS: SelectOption<string>[] = [
  { value: 'Inter, system-ui', label: 'Inter Sans', description: 'Clean modern sans-serif' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono', description: 'Technical monospace code' },
  { value: 'Impact, sans-serif', label: 'Impact Display', description: 'Punchy heavy titles' },
  { value: 'Georgia, serif', label: 'Georgia Serif', description: 'Classic editorial serif' },
  { value: 'system-ui, sans-serif', label: 'System Default', description: 'Native operating system' },
];

type InspectorTabId = 'transform' | 'audio' | 'speed' | 'blending' | 'masks' | 'effects' | 'text';

interface TabDef {
  id: InspectorTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const InspectorPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectorTabId>('transform');

  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const clips = useEditorStore((s) => s.clips);
  const tracks = useEditorStore((s) => s.tracks);
  const updateClip = useEditorStore((s) => s.updateClip);
  const updateClipTransform = useEditorStore((s) => s.updateClipTransform);
  const updateClipFilter = useEditorStore((s) => s.updateClipFilter);
  const updateClipMask = useEditorStore((s) => s.updateClipMask);
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
            <Sliders className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-app-text">No Clip Selected</h3>
          <p className="mt-1.5 text-xs text-app-text-muted max-w-[220px] leading-relaxed">
            Select any clip on the timeline to customize motion transform, blending, masks, effects, and audio.
          </p>
        </div>
      </aside>
    );
  }

  const transform: Transform = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
  const filter: ColorFilter = clip.filter || { brightness: 1, contrast: 1, saturation: 1, blur: 0 };
  const mask: ClipMask = clip.mask || {
    type: 'none',
    x: 0,
    y: 0,
    width: 360,
    height: 240,
    radius: 0,
    feather: 0,
    inverted: false,
  };
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
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
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
                <button
                  onClick={() => updateClipTransform(clip.id, { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0 })}
                  title="Reset Transform"
                  className="flex items-center gap-1 text-[10px] text-app-text-muted hover:text-app-text transition cursor-pointer"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Position X */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.positionX', 'Position X')}
                <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-3 py-1.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition">
                  <input
                    type="number"
                    value={Math.round(transform.x)}
                    onChange={(e) => updateClipTransform(clip.id, { x: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                  />
                  <span className="text-[10px] text-app-text-muted ml-1">px</span>
                </div>
              </div>

              {/* Position Y */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.positionY', 'Position Y')}
                <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-3 py-1.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition">
                  <input
                    type="number"
                    value={Math.round(transform.y)}
                    onChange={(e) => updateClipTransform(clip.id, { y: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                  />
                  <span className="text-[10px] text-app-text-muted ml-1">px</span>
                </div>
              </div>

              {/* Scale X */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.scaleX', 'Scale X')}
                <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-3 py-1.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={transform.scaleX !== undefined ? transform.scaleX : transform.scale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateClipTransform(clip.id, { scaleX: val });
                    }}
                    className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                  />
                  <span className="text-[10px] text-app-text-muted ml-1">
                    {Math.round(((transform.scaleX !== undefined ? transform.scaleX : transform.scale) * 100))}%
                  </span>
                </div>
              </div>

              {/* Scale Y */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.scaleY', 'Scale Y')}
                <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-3 py-1.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={transform.scaleY !== undefined ? transform.scaleY : transform.scale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateClipTransform(clip.id, { scaleY: val });
                    }}
                    className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                  />
                  <span className="text-[10px] text-app-text-muted ml-1">
                    {Math.round(((transform.scaleY !== undefined ? transform.scaleY : transform.scale) * 100))}%
                  </span>
                </div>
              </div>

              {/* Rotate */}
              <div className="space-y-1.5">
                {renderFieldHeader('transform.rotate', 'Rotate')}
                <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-3 py-1.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition">
                  <input
                    type="number"
                    min="-360"
                    max="360"
                    value={transform.rotation}
                    onChange={(e) => updateClipTransform(clip.id, { rotation: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                  />
                  <span className="text-[10px] text-app-text-muted ml-1">°</span>
                </div>
              </div>

              {/* Quick Scale Presets */}
              <div className="pt-2 border-t border-app-border space-y-1.5">
                <span className="text-[11px] font-semibold text-app-text-muted uppercase tracking-wider">Quick Scale</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.5, 1.0, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateClipTransform(clip.id, { scale: s, scaleX: s, scaleY: s })}
                      className="rounded border border-app-border bg-app-elevated py-1 text-center font-mono text-[11px] text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== BLENDING TAB ===================== */}
          {activeTab === 'blending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Blending & Opacity</span>
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                {renderFieldHeader('blending.opacity', 'Opacity')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={transform.opacity}
                    onChange={(e) => updateClipTransform(clip.id, { opacity: Number(e.target.value) })}
                    className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <div className="flex w-16 items-center justify-center rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-mono font-medium text-app-text">
                    {Math.round(transform.opacity * 100)}%
                  </div>
                </div>
              </div>

              {/* Compositing Blend Mode */}
              <div className="space-y-1.5 pt-2 border-t border-app-border">
                {renderFieldHeader('blending.blendMode', 'Blend Mode')}
                <CustomSelect<GlobalCompositeOperation>
                  value={clip.blendMode || 'source-over'}
                  onChange={(val) => updateClip(clip.id, { blendMode: val })}
                  options={BLEND_MODE_OPTIONS}
                  icon={<Blend className="h-3.5 w-3.5" />}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* ===================== MASKS TAB ===================== */}
          {activeTab === 'masks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Masks</span>
                {mask.type !== 'none' && (
                  <button
                    onClick={() => updateClipMask(clip.id, { type: 'none' })}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Clear Mask
                  </button>
                )}
              </div>

              {/* Mask Type Selector Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-app-text-muted">MASK SHAPE</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { type: 'none', label: 'None', icon: Sliders },
                    { type: 'rectangle', label: 'Rectangle', icon: Square },
                    { type: 'circle', label: 'Circle', icon: Circle },
                    { type: 'split', label: 'Linear', icon: AlignCenter },
                    { type: 'star', label: 'Star', icon: Star },
                    { type: 'heart', label: 'Heart', icon: Heart },
                  ].map((m) => {
                    const MIcon = m.icon;
                    const isSelected = mask.type === m.type;

                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => updateClipMask(clip.id, { type: m.type as MaskType })}
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-1 text-[11px] transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:border-blue-400 dark:bg-blue-400/15 dark:text-blue-400 font-semibold shadow-xs'
                            : 'border-app-border bg-app-elevated text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <MIcon className="h-4 w-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Mask Parameters */}
              {mask.type !== 'none' && (
                <div className="space-y-3 pt-2 border-t border-app-border">
                  {/* Invert Mask Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-elevated p-2">
                    <div className="flex items-center gap-2">
                      <FlipHorizontal className="h-3.5 w-3.5 text-app-text-muted" />
                      <span className="text-xs font-medium text-app-text">Invert Mask Area</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateClipMask(clip.id, { inverted: !mask.inverted })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mask.inverted ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          mask.inverted ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mask Position X / Y */}
                  <div className="space-y-1.5">
                    {renderFieldHeader('mask.position', 'Mask Center (X, Y)')}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                        <span className="text-[10px] text-app-text-muted mr-1.5">X</span>
                        <input
                          type="number"
                          value={Math.round(mask.x)}
                          onChange={(e) => updateClipMask(clip.id, { x: Number(e.target.value) })}
                          className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                        <span className="text-[10px] text-app-text-muted mr-1.5">Y</span>
                        <input
                          type="number"
                          value={Math.round(mask.y)}
                          onChange={(e) => updateClipMask(clip.id, { y: Number(e.target.value) })}
                          className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mask Width / Height */}
                  <div className="space-y-1.5">
                    {renderFieldHeader('mask.size', 'Mask Size (W, H)')}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                        <span className="text-[10px] text-app-text-muted mr-1.5">W</span>
                        <input
                          type="number"
                          min="20"
                          max="2000"
                          value={Math.round(mask.width)}
                          onChange={(e) => updateClipMask(clip.id, { width: Number(e.target.value) })}
                          className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                        <span className="text-[10px] text-app-text-muted mr-1.5">H</span>
                        <input
                          type="number"
                          min="20"
                          max="2000"
                          value={Math.round(mask.height)}
                          onChange={(e) => updateClipMask(clip.id, { height: Number(e.target.value) })}
                          className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rectangle Corner Radius */}
                  {mask.type === 'rectangle' && (
                    <div className="space-y-1.5">
                      {renderFieldHeader('mask.radius', 'Corner Radius')}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={120}
                          value={mask.radius || 0}
                          onChange={(e) => updateClipMask(clip.id, { radius: Number(e.target.value) })}
                          className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                        />
                        <span className="w-10 text-right font-mono text-xs text-app-text">{mask.radius || 0}px</span>
                      </div>
                    </div>
                  )}

                  {/* Feather Softness */}
                  <div className="space-y-1.5">
                    {renderFieldHeader('mask.feather', 'Edge Feather')}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={mask.feather}
                        onChange={(e) => updateClipMask(clip.id, { feather: Number(e.target.value) })}
                        className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                      />
                      <span className="w-10 text-right font-mono text-xs text-app-text">{mask.feather}px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== EFFECTS TAB ===================== */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Effects & Color</span>
                <button
                  onClick={() => updateClipFilter(clip.id, { brightness: 1, contrast: 1, saturation: 1, blur: 0 })}
                  className="flex items-center gap-1 text-[10px] text-app-text-muted hover:text-app-text transition cursor-pointer"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                {renderFieldHeader('effects.brightness', 'Brightness')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.05}
                    value={filter.brightness}
                    onChange={(e) => updateClipFilter(clip.id, { brightness: Number(e.target.value) })}
                    className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span className="w-12 text-right font-mono text-xs text-app-text">
                    {Math.round(filter.brightness * 100)}%
                  </span>
                </div>
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                {renderFieldHeader('effects.contrast', 'Contrast')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.05}
                    value={filter.contrast}
                    onChange={(e) => updateClipFilter(clip.id, { contrast: Number(e.target.value) })}
                    className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span className="w-12 text-right font-mono text-xs text-app-text">
                    {Math.round(filter.contrast * 100)}%
                  </span>
                </div>
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                {renderFieldHeader('effects.saturation', 'Saturation')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={2.0}
                    step={0.05}
                    value={filter.saturation}
                    onChange={(e) => updateClipFilter(clip.id, { saturation: Number(e.target.value) })}
                    className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span className="w-12 text-right font-mono text-xs text-app-text">
                    {Math.round(filter.saturation * 100)}%
                  </span>
                </div>
              </div>

              {/* Soft Blur */}
              <div className="space-y-1.5">
                {renderFieldHeader('effects.blur', 'Defocus Blur')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={filter.blur}
                    onChange={(e) => updateClipFilter(clip.id, { blur: Number(e.target.value) })}
                    className="flex-1 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span className="w-12 text-right font-mono text-xs text-app-text">{filter.blur}px</span>
                </div>
              </div>

              {/* One-Click Filter Presets */}
              <div className="pt-2 border-t border-app-border space-y-1.5">
                <span className="text-[11px] font-semibold text-app-text-muted uppercase tracking-wider">Quick Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Warm Glow', filter: { brightness: 1.15, contrast: 1.25, saturation: 1.2, blur: 0 } },
                    { name: 'Noir B&W', filter: { brightness: 1.0, contrast: 1.5, saturation: 0, blur: 0 } },
                    { name: 'Vintage 90s', filter: { brightness: 0.95, contrast: 0.95, saturation: 0.75, blur: 0.3 } },
                    { name: 'Cyber Neon', filter: { brightness: 1.05, contrast: 1.4, saturation: 1.6, blur: 0 } },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => updateClipFilter(clip.id, p.filter)}
                      className="rounded border border-app-border bg-app-elevated py-1.5 px-2 text-left font-medium text-[11px] text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== AUDIO TAB ===================== */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Audio Mix</span>
              </div>

              {/* Volume Slider & Percentage */}
              <div className="space-y-1.5">
                {renderFieldHeader('audio.volume', 'Master Volume')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={clip.volume}
                    onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <div className="flex w-14 items-center justify-center rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-mono font-bold text-emerald-500">
                    {Math.round(clip.volume * 100)}%
                  </div>
                </div>
              </div>

              {/* Mute Audio Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-app-border bg-app-elevated p-2.5">
                <div className="flex items-center gap-2">
                  {clip.isMuted ? (
                    <VolumeX className="h-4 w-4 text-red-500" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className="text-xs font-medium text-app-text">Mute Audio Track</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateClip(clip.id, { isMuted: !clip.isMuted })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    clip.isMuted ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      clip.isMuted ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ===================== SPEED TAB ===================== */}
          {activeTab === 'speed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Speed & Retiming</span>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                {renderFieldHeader('speed.rate', 'Playback Rate')}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.25}
                    max={4.0}
                    step={0.25}
                    value={clip.speed || 1}
                    onChange={(e) => updateClip(clip.id, { speed: Number(e.target.value) })}
                    className="flex-1 accent-cyan-500"
                  />
                  <div className="flex w-14 items-center justify-center rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-mono font-bold text-cyan-500">
                    {(clip.speed || 1).toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Quick Speed Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                {[0.5, 1.0, 1.5, 2.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateClip(clip.id, { speed: val })}
                    className={`rounded-lg border py-1.5 font-mono text-xs transition cursor-pointer ${
                      (clip.speed || 1) === val
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold shadow-xs'
                        : 'border-app-border bg-app-elevated text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===================== TEXT TAB ===================== */}
          {activeTab === 'text' && clip.type === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-1">
                <span className="text-xs font-bold text-app-text tracking-wider uppercase">Text Properties</span>
              </div>

              {/* Text String */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-app-text-muted">CONTENT</label>
                <textarea
                  rows={3}
                  value={clip.text || ''}
                  onChange={(e) => updateClip(clip.id, { text: e.target.value })}
                  placeholder="Enter text..."
                  className="w-full rounded-lg border border-app-border bg-app-elevated p-2.5 text-xs text-app-text focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-app-text-muted">FONT FAMILY</label>
                <CustomSelect<string>
                  value={clip.fontFamily || 'Inter, system-ui'}
                  onChange={(val) => updateClip(clip.id, { fontFamily: val })}
                  options={FONT_OPTIONS}
                  icon={<CaseSensitive className="h-3.5 w-3.5" />}
                  className="w-full"
                />
              </div>

              {/* Font Size & Alignment */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-app-text-muted">FONT SIZE</label>
                  <div className="flex items-center rounded-lg border border-app-border bg-app-elevated px-2.5 py-1.5">
                    <input
                      type="number"
                      min={12}
                      max={200}
                      value={clip.fontSize || 54}
                      onChange={(e) => updateClip(clip.id, { fontSize: Number(e.target.value) })}
                      className="w-full bg-transparent font-mono text-xs text-app-text focus:outline-none"
                    />
                    <span className="text-[10px] text-app-text-muted ml-1">px</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-app-text-muted">ALIGNMENT</label>
                  <div className="flex h-[34px] items-center rounded-lg border border-app-border bg-app-elevated p-0.5">
                    <button
                      type="button"
                      onClick={() => updateClip(clip.id, { textAlign: 'left' })}
                      className={`flex-1 flex items-center justify-center h-full rounded transition ${
                        clip.textAlign === 'left' ? 'bg-app-surface text-app-text shadow-xs' : 'text-app-text-muted hover:text-app-text'
                      }`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClip(clip.id, { textAlign: 'center' })}
                      className={`flex-1 flex items-center justify-center h-full rounded transition ${
                        !clip.textAlign || clip.textAlign === 'center' ? 'bg-app-surface text-app-text shadow-xs' : 'text-app-text-muted hover:text-app-text'
                      }`}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClip(clip.id, { textAlign: 'right' })}
                      className={`flex-1 flex items-center justify-center h-full rounded transition ${
                        clip.textAlign === 'right' ? 'bg-app-surface text-app-text shadow-xs' : 'text-app-text-muted hover:text-app-text'
                      }`}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-app-text-muted">TEXT COLOR</label>
                <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-elevated p-1.5">
                  <input
                    type="color"
                    value={clip.fontColor || '#ffffff'}
                    onChange={(e) => updateClip(clip.id, { fontColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-xs text-app-text">{clip.fontColor || '#ffffff'}</span>
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-app-text-muted">BACKGROUND BADGE</label>
                <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-elevated p-1.5">
                  <input
                    type="color"
                    value={clip.backgroundColor && clip.backgroundColor !== 'transparent' ? clip.backgroundColor : '#000000'}
                    onChange={(e) => updateClip(clip.id, { backgroundColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => updateClip(clip.id, { backgroundColor: 'transparent' })}
                    className="ml-auto rounded bg-app-surface border border-app-border px-2 py-1 text-[10px] text-app-text-muted hover:text-app-text transition"
                  >
                    Clear Background
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default InspectorPanel;
