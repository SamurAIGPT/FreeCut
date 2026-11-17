import React from 'react';
import { Eye, EyeOff, Film, Lock, Music, Type, Unlock, Volume2, VolumeX } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Track } from '@/types/editor';

interface TrackHeaderProps {
  track: Track;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackLock = useEditorStore((s) => s.toggleTrackLock);
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility);
  const toggleTrackSolo = useEditorStore((s) => s.toggleTrackSolo);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  return (
    <div className="flex h-16 w-60 shrink-0 items-center justify-between border-b border-app-border bg-app-surface px-3 select-none transition-colors duration-200">
      {/* Track Label */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-elevated ${
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
        <div className="overflow-hidden">
          <span className="truncate text-xs font-semibold text-app-text block">{track.name}</span>
          {/* Animated Mini VU meter when playing */}
          {track.type !== 'text' && !track.isMuted && (
            <div className="flex items-center gap-0.5 mt-0.5 h-1.5 w-16">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isPlaying ? `${h * 100}%` : '25%',
                  }}
                  className={`w-1 rounded-sm transition-all duration-150 ${
                    i > 3 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track Actions */}
      <div className="flex items-center gap-1">
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
            title={track.isMuted ? 'Unmute' : 'Mute'}
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
          title={track.isVisible ? 'Hide' : 'Show'}
          className={`rounded p-1 transition ${
            track.isVisible === false ? 'bg-red-500/20 text-red-500' : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          {track.isVisible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>

        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          title={track.isLocked ? 'Unlock' : 'Lock'}
          className={`rounded p-1 transition ${
            track.isLocked ? 'bg-amber-500/20 text-amber-500' : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          {track.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
};
