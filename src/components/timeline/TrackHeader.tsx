import React, { useState } from 'react';
import { 
  Eye, EyeOff, Film, Lock, Music, Type, Unlock, 
  Volume2, VolumeX, ChevronUp, ChevronDown, Trash2 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Track } from '@/types/editor';

interface TrackHeaderProps {
  track: Track;
  index: number;
  totalTracks: number;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track, index, totalTracks }) => {
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackLock = useEditorStore((s) => s.toggleTrackLock);
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility);
  const toggleTrackSolo = useEditorStore((s) => s.toggleTrackSolo);
  const moveTrack = useEditorStore((s) => s.moveTrack);
  const deleteTrack = useEditorStore((s) => s.deleteTrack);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex h-16 w-60 shrink-0 items-center justify-between border-b border-app-border bg-app-surface px-2.5 select-none transition-colors duration-200"
    >
      {/* Track Info (Reorder + Type Icon + Title + VU Meter) */}
      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
        {/* Reorder Buttons (visible on hover) */}
        <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => moveTrack(track.id, 'up')}
            disabled={index === 0}
            title="Move Track Up"
            className="rounded p-0.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text disabled:opacity-20 transition"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => moveTrack(track.id, 'down')}
            disabled={index === totalTracks - 1}
            title="Move Track Down"
            className="rounded p-0.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text disabled:opacity-20 transition"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Track Type Icon */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-elevated shadow-xs ${
            track.type === 'video'
              ? 'text-blue-500'
              : track.type === 'audio'
              ? 'text-emerald-500'
              : 'text-amber-500'
          }`}
        >
          {track.type === 'video' ? (
            <Film className="h-3.5 w-3.5" />
          ) : track.type === 'audio' ? (
            <Music className="h-3.5 w-3.5" />
          ) : (
            <Type className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="overflow-hidden min-w-0 flex-1">
          <span className="truncate text-xs font-semibold text-app-text block leading-snug">
            {track.name}
          </span>

          {/* Animated Stereo VU meter when playing */}
          {track.type !== 'text' && !track.isMuted && (
            <div className="flex items-center gap-0.5 mt-1 h-1.5 w-16">
              {[0.35, 0.7, 0.45, 0.9, 0.65, 0.3].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isPlaying ? `${Math.max(20, Math.min(100, (h + (Math.sin(Date.now() / 150 + i) * 0.2)) * 100))}%` : '25%',
                  }}
                  className={`w-1 rounded-sm transition-all duration-100 ${
                    i >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Solo */}
        <button
          onClick={() => toggleTrackSolo(track.id)}
          title="Solo Track (S)"
          className={`h-5 w-5 rounded text-[10px] font-bold transition ${
            track.isSolo
              ? 'bg-amber-500 text-black'
              : 'text-app-text-muted hover:bg-app-elevated hover:text-app-text'
          }`}
        >
          S
        </button>

        {/* Mute */}
        {track.type !== 'text' && (
          <button
            onClick={() => toggleTrackMute(track.id)}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
            className={`rounded p-1 transition ${
              track.isMuted ? 'bg-red-500/20 text-red-500' : 'text-app-text-muted hover:text-app-text'
            }`}
          >
            {track.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
        )}

        {/* Visibility */}
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          title={track.isVisible === false ? 'Show Track' : 'Hide Track'}
          className={`rounded p-1 transition ${
            track.isVisible === false ? 'bg-red-500/20 text-red-500' : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          {track.isVisible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>

        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
          className={`rounded p-1 transition ${
            track.isLocked ? 'bg-amber-500/20 text-amber-500' : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          {track.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>

        {/* Delete Track (visible on hover) */}
        {totalTracks > 1 && (
          <button
            onClick={() => deleteTrack(track.id)}
            title="Delete Track"
            className="rounded p-1 text-app-text-muted hover:bg-red-500/15 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackHeader;
