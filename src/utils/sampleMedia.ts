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

      const progress = frame / totalFrames;
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
  const sampleRate = 44100;
  const duration = 5;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Play a simple chord progression
  const frequencies = [220, 277.18, 329.63, 440]; // A major

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, 0);

    // Pulse volume
    gain.gain.setValueAtTime(0.08, 0);
    gain.gain.linearRampToValueAtTime(0.15, 2.5);
    gain.gain.linearRampToValueAtTime(0.01, duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(0);
    osc.stop(duration);
  });

  const renderedBuffer = await ctx.startRendering();
  
  // Encode to WAV Blob
  const wavBlob = audioBufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  return {
    id: 'sample-audio-' + Date.now(),
    name: 'Sample Ambient Chords.wav',
    type: 'audio',
    url,
    duration,
  };
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
