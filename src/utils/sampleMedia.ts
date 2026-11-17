import { MediaAsset } from '@/types/editor';

/**
 * Generate a synthetic 5-second animated countdown video in memory
 */
export async function generateCountdownVideo(): Promise<MediaAsset> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const duration = 5; // 5 seconds
  const fps = 30;
  const totalFrames = duration * fps;

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve({
        id: 'sample-countdown-' + Date.now(),
        name: 'Sample 5s Countdown.webm',
        type: 'video',
        url,
        duration,
        width: 1280,
        height: 720,
      });
    };

    recorder.start();

    let frame = 0;
    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
        return;
      }

      const count = Math.max(1, 5 - Math.floor(frame / fps));

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating radar line
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const angle = (frame / fps) * Math.PI * 2;

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 180, cy + Math.sin(angle) * 180);
      ctx.stroke();
      ctx.restore();

      // Countdown number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(count), cx, cy);

      // Label
      ctx.font = '24px Inter, system-ui';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('FREECUT TEST FOOTAGE', cx, cy + 240);

      frame++;
    }, 1000 / fps);
  });
}

/**
 * Generate a 5-second ambient synth beat audio track in memory
 */
export async function generateSampleAudio(): Promise<MediaAsset> {
  return generateSoundEffect('beat', 'Lo-Fi Ambient Beat.wav', 5.0);
}

/**
 * Sound effect synthesis options
 */
export type SoundEffectType = 'boom' | 'whoosh' | 'glitch' | 'chime' | 'riser' | 'beat' | 'pop';

/**
 * Synthesize real sound effects into WAV audio asset
 */
export async function generateSoundEffect(
  type: SoundEffectType,
  name: string,
  duration = 3.0
): Promise<MediaAsset> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  if (type === 'boom') {
    // Deep Sub Drop Boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, 0);
    osc.frequency.exponentialRampToValueAtTime(32, duration * 0.8);
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(duration);
  } else if (type === 'whoosh') {
    // Noise whoosh sweep
    const bufferSize = sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, 0);
    filter.frequency.exponentialRampToValueAtTime(3000, duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, duration);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.4, duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    whiteNoise.start(0);
  } else if (type === 'glitch') {
    // FM synth glitch
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, 0);
    osc.frequency.setValueAtTime(880, 0.2);
    osc.frequency.setValueAtTime(220, 0.5);
    osc.frequency.setValueAtTime(1760, 0.8);

    mod.type = 'square';
    mod.frequency.setValueAtTime(60, 0);
    modGain.gain.setValueAtTime(400, 0);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.2, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    mod.start(0);
    osc.stop(duration);
    mod.stop(duration);
  } else if (type === 'chime' || type === 'pop') {
    // Bell chime
    const freqs = [880, 1320, 1760];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, 0);
      gain.gain.setValueAtTime(0.15, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(duration);
    });
  } else if (type === 'riser') {
    // Tension riser
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, 0);
    osc.frequency.exponentialRampToValueAtTime(1200, duration);
    gain.gain.setValueAtTime(0.05, 0);
    gain.gain.linearRampToValueAtTime(0.35, duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(duration);
  } else {
    // Beat / ambient
    const frequencies = [220, 277.18, 329.63, 440];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, 0);
      gain.gain.setValueAtTime(0.08, 0);
      gain.gain.linearRampToValueAtTime(0.18, duration * 0.5);
      gain.gain.linearRampToValueAtTime(0.01, duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(duration);
    });
  }

  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  return {
    id: `sound-${type}-${Date.now()}`,
    name,
    type: 'audio',
    url,
    duration,
  };
}

let activeLiveAudioCtx: AudioContext | null = null;

/**
 * Play live audio preview directly through speaker in browser
 */
export function playLiveSoundPreview(type: SoundEffectType): () => void {
  try {
    if (activeLiveAudioCtx) {
      activeLiveAudioCtx.close();
      activeLiveAudioCtx = null;
    }
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    activeLiveAudioCtx = ctx;

    const duration = type === 'pop' || type === 'chime' ? 1.0 : type === 'whoosh' ? 1.2 : 2.0;

    if (type === 'boom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + duration * 0.8);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } else if (type === 'whoosh') {
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();
    } else if (type === 'chime' || type === 'pop') {
      [880, 1320].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }

    return () => {
      try {
        ctx.close();
      } catch {
        // ignored
      }
    };
  } catch (err) {
    console.error('Audio preview error:', err);
    return () => {};
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const numSamples = buffer.length * numChannels;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * 2;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Write PCM audio
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
