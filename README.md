<table width="100%">
  <tr>
    <td align="left" width="120">
      <img src="public/logo.svg" alt="FreeCut Logo" width="100" />
    </td>
    <td align="right">
      <h1>FreeCut</h1>
      <h3 style="margin-top: -10px;">A free, lightweight, and open-source video editor for the modern web.</h3>
    </td>
  </tr>
</table>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000&style=flat)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=fff&style=flat)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=fff&style=flat)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=fff&style=flat)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-WebAudio_Engine-orange?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Client_Side-success?style=flat)](#why-freecut)

---

https://github.com/user-attachments/assets/f2c207cb-20a9-4bd2-9a07-6a18af70dbbb

FreeCut is an open-source, client-side non-linear video editor designed to be fast, privacy-focused, and effortless to run. It runs 100% in your browser without requiring external databases, Docker containers, or server-side rendering pipelines.

---

## Why FreeCut?

- **100% Client-Side Privacy**: Your video clips, audio tracks, and exported files stay entirely on your device. No cloud uploads, no server rendering, and zero tracking.
- **Free & Unrestricted**: All creative tools are completely free — multi-track layering, color filters, transitions, blend modes, speed controls, and high-resolution exports without watermarks.
- **Effortless Setup**: Runs in any modern desktop browser. Zero backend infrastructure, no Docker requirement, no database setup — just `npm install` and `npm run dev`.
- **Persistent Local Projects**: Full multi-project manager backed by browser IndexedDB with real-time autosave, project switching, duplication, renaming, and instant thumbnail generation.

---

## ✨ Features

- **Multi-Track Non-Linear Timeline**:
  - Layer video, audio, text titles, and adjustment clips with frame-accurate synchronization.
  - Razor / Split (`S`), Trim handles, Duplicate (`Ctrl+D`), Ripple editing, and Magnet snapping (`N`).
  - Track-level mute, solo, lock, and visibility controls.
- **Canvas 2D / WebGL Compositor**:
  - Real-time preview rendering with support for multiple aspect ratios: `16:9` (YouTube / Landscape), `9:16` (TikTok / Shorts / Reels), `1:1` (Instagram Square), `4:3` (Standard), and `21:9` (Ultrawide).
  - Flexible viewport zoom (`Fit`, `25%`, `50%`, `75%`, `100%`, `200%`).
- **Live Transform & Inspector Controls**:
  - Translate ($X, Y$), Scale ($0.1\times - 3.0\times$), Rotation ($-180^\circ$ to $+180^\circ$), and Opacity ($0-100\%$).
  - Blend modes: Normal, Screen, Multiply, Overlay, Lighten, Darken, Color Dodge.
  - Crop & pan controls, per-clip audio volume curves, and rich typography formatting (font size, color, background badge, line height).
- **Visual Effects & Filters Library**:
  - Left sidebar catalog: Dramatic Noir, Warm 70s, Cyberpunk Neon, Vignette Dark, Sepia Nostalgia, Punchy Contrast, Dreamy Bloom, Invert Matrix, CRT Scanlines, and Chromatic Aberration.
  - Live preview in inspector and deterministic timeline application.
- **Transitions & Motion**:
  - Cross Dissolve, Slide Left/Right, Wipe, Zoom In/Out, and Fade to Black.
- **Web Audio Engine**:
  - Multi-channel audio mixer with Web Audio API.
  - Built-in audio library with synth pads, beat drops, risers, and sound effects.
- **High-Performance In-Browser Exporter**:
  - Deterministic frame-by-frame renderer exporting directly to `.mp4` / `.webm` without quality loss.

---

## 📁 Project Structure

```
FreeCut/
├── public/                 # Static branding assets and icons
├── src/
│   ├── components/
│   │   ├── assets/         # Media asset managers & synthesizers
│   │   ├── editor/         # Editor workspace container & layout
│   │   ├── header/         # Top bar, theme toggle, timecode & export modal
│   │   ├── inspector/      # Clip property inspector (transform, effects, text, audio)
│   │   ├── preview/        # Canvas compositor viewport & playback transport
│   │   ├── projects/       # Multi-project dashboard & IndexedDB storage manager
│   │   ├── sidebar/        # Left navigation & panels (media, audio, text, effects, transitions)
│   │   ├── timeline/       # Multi-track timeline, playhead, tracks & ruler
│   │   └── ui/             # Reusable UI controls (selects, tooltips, number fields)
│   ├── engine/             # Canvas compositor, Web Audio engine & video exporter
│   ├── hooks/              # Custom React hooks (keyboard shortcuts, animation loop)
│   ├── services/storage/   # IndexedDB database adapter & project service
│   ├── store/              # Zustand editor state & undo/redo history
│   └── types/              # TypeScript interfaces and editor types
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [bun](https://bun.sh/)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SamurAIGPT/FreeCut.git
   cd FreeCut
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   The application will be live at [http://localhost:3001](http://localhost:3001) (or [http://localhost:5173](http://localhost:5173)).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `S` | Split / Cut clip at playhead position |
| `Delete` / `Backspace` | Delete selected clip |
| `Ctrl + D` / `Cmd + D` | Duplicate selected clip |
| `Ctrl + Z` / `Cmd + Z` | Undo last action |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo last undone action |
| `Left Arrow` | Step backward 1 frame |
| `Right Arrow` | Step forward 1 frame |
| `Home` | Move playhead to beginning |
| `End` | Move playhead to end of timeline |
| `N` | Toggle Magnet Snapping |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Database**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb`)
- **Rendering & Media**: HTML5 Canvas 2D, Web Audio API, MediaStream Recording API
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🤝 Contributing

Contributions are always welcome! Feel free to:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
