import React from 'react';
import { Eye, EyeOff, Film, Music, Type, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Track } from '@/types/editor';

interface TrackHeaderProps {
  track: Track;
  index: number;
  totalTracks: number;
}

export const getTrackHeight = (type: Track['type']) => {
  switch (type) {
    case 'video': return 65;
    case 'audio': return 50;
    case 'text': return 28;
    default: return 50;
  }
};

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track, totalTracks }) => {
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackVisibility = useEditorStore((s) => s.toggleTrackVisibility);
  const deleteTrack = useEditorStore((s) => s.deleteTrack);

  const height = getTrackHeight(track.type);

  return (
    <div 
      style={{ height: `${height}px` }}
      className="group relative flex w-28 shrink-0 items-center justify-end gap-2 px-3 select-none transition-colors duration-150 border-r border-app-border"
    >
      {/* Delete Track (visible on hover) */}
      {totalTracks > 1 && (
        <button
          onClick={() => deleteTrack(track.id)}
          title="Delete Track"
          className="rounded p-0.5 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Mute Toggle */}
      {track.type !== 'text' && (
        <button
          onClick={() => toggleTrackMute(track.id)}
          title={track.isMuted ? 'Unmute track' : 'Mute track'}
          className={`cursor-pointer transition ${
            track.isMuted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {track.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

      {/* Visibility Toggle */}
      <button
        onClick={() => toggleTrackVisibility(track.id)}
        title={track.isVisible === false ? 'Show track' : 'Hide track'}
        className={`cursor-pointer transition ${
          track.isVisible === false ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        {track.isVisible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      {/* Track Type Icon */}
      <div className="text-neutral-400 shrink-0">
        {track.type === 'video' ? (
          <Film className="h-4 w-4" />
        ) : track.type === 'audio' ? (
          <Music className="h-4 w-4" />
        ) : (
          <Type className="h-4 w-4" />
        )}
      </div>
    </div>
  );
};

export default TrackHeader;
