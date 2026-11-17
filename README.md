# FreeCut 🎬

> A free, lightweight, and modern in-browser video editor built from scratch.

![FreeCut Editor](https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80)

FreeCut is an open-source, client-side video editor designed to be fast, privacy-focused, and effortless to run. It runs 100% in your browser without requiring external databases, Docker, or server-side video rendering.

---

## ✨ Features

- **Multi-Track Timeline**: Layer video, audio, and text/title tracks with frame-level precision.
- **Interactive Trimming & Splitting**:
  - Drag clip left/right edges to adjust in/out points.
  - Press `S` to cut/split clips at the playhead needle.
  - Press `Delete` or `Backspace` to remove clips.
  - Drag clips across time and tracks.
- **Canvas 2D Compositor**: Real-time rendering with support for multiple aspect ratios:
  - `16:9` (YouTube / Landscape)
  - `9:16` (TikTok / Shorts / Reels)
  - `1:1` (Instagram Square)
- **Live Transform Inspector**:
  - Translate ($X, Y$), Scale ($0.1\times - 3.0\times$), Rotation ($-180^\circ$ to $+180^\circ$), and Opacity ($0-100\%$).
  - Per-clip audio volume control.
  - Text typography editor (content, font size, text color, background badge).
- **Web Audio Engine**: Synchronized multi-track audio playback with master clock and track mute/lock controls.
- **Built-in Media Synthesizer**: Generates test countdown footage and synth chord tracks in memory for instant experimentation.
- **Browser-Side Exporter**: Renders the complete timeline to `.webm` / `.mp4` using `MediaRecorder` directly to your local downloads.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

The application will start on **http://localhost:3001**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `S` | Split selected clip at playhead |
| `Delete` / `Backspace` | Delete selected clip |
| `Left Arrow` | Step backward 1 frame |
| `Right Arrow` | Step forward 1 frame |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Media**: Canvas 2D, Web Audio API, MediaStream Recording
- **Icons**: Lucide React

---

## 📄 License

MIT License. Free for personal and commercial use.
