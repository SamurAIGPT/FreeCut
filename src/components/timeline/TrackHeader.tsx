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

  return (
    <div className="flex h-14 w-52 shrink-0 items-center justify-between border-b border-border bg-[#0d0f12] px-3">
      <div className="flex items-center gap-2 overflow-hidden">
        {track.type === 'video' ? (
          <Film className="h-4 w-4 text-blue-400 shrink-0" />
        ) : track.type === 'audio' ? (
          <Music className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <Type className="h-4 w-4 text-amber-400 shrink-0" />
        )}
        <span className="truncate text-xs font-medium text-slate-300">{track.name}</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Visibility / Hide */}
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          title={track.isVisible ? 'Hide Track' : 'Show Track'}
          className="rounded p-1 text-slate-500 hover:text-white"
        >
          {track.isVisible !== false ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-red-400" />
          )}
        </button>

        {/* Audio Mute (for audio/video tracks) */}
        {track.type !== 'text' && (
          <button
            onClick={() => toggleTrackMute(track.id)}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
            className="rounded p-1 text-slate-500 hover:text-white"
          >
            {track.isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Lock Track */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
          className="rounded p-1 text-slate-500 hover:text-white"
        >
          {track.isLocked ? (
            <Lock className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
