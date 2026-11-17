import { Clip, MediaAsset, Track } from '@/types/editor';

class AudioEngine {
  private audioElements = new Map<string, HTMLAudioElement>();

  public getOrCreateAudio(asset: MediaAsset): HTMLAudioElement {
    let audio = this.audioElements.get(asset.id);
    if (!audio) {
      audio = new Audio(asset.url);
      audio.preload = 'auto';
      this.audioElements.set(asset.id, audio);
    }
    return audio;
  }

  public sync(
    playhead: number,
    isPlaying: boolean,
    tracks: Track[],
    clips: Clip[],
    assets: MediaAsset[]
  ) {
    const mutedTrackIds = new Set(tracks.filter((t) => t.isMuted).map((t) => t.id));

    // Get all audio-producing clips
    const audioClips = clips.filter((c) => c.type === 'audio' || c.type === 'video');

    for (const clip of audioClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      if (!asset) continue;

      const audio = this.getOrCreateAudio(asset);
      const isMuted = mutedTrackIds.has(clip.trackId);
      const isActive = playhead >= clip.start && playhead < clip.start + clip.duration;

      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, clip.volume));

      if (isActive && isPlaying) {
        const relativeTime = clip.trimStart + (playhead - clip.start);
        if (Math.abs(audio.currentTime - relativeTime) > 0.15) {
          audio.currentTime = relativeTime;
        }
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    }
  }

  public stopAll() {
    this.audioElements.forEach((audio) => {
      audio.pause();
    });
  }
}

export const audioEngine = new AudioEngine();
