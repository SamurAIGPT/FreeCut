import React from 'react';
import { GridConfig } from '@/store/useEditorStore';

interface GuideProps {
  aspectRatio: string;
}

/**
 * Configurable Grid Lines (Rule of Thirds / Custom Rows & Columns)
 */
export const GridGuide: React.FC<{ config: GridConfig }> = ({ config }) => {
  const rows = Math.max(2, Math.min(config.rows || 3, 10));
  const cols = Math.max(2, Math.min(config.cols || 3, 10));

  const vLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const hLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* Vertical Lines */}
      {vLines.map((pct) => (
        <div
          key={`v-${pct}`}
          className="absolute top-0 bottom-0 w-px bg-white/40 shadow-[0_0_1px_rgba(0,0,0,0.8)]"
          style={{ left: `${pct}%` }}
        />
      ))}

      {/* Horizontal Lines */}
      {hLines.map((pct) => (
        <div
          key={`h-${pct}`}
          className="absolute left-0 right-0 h-px bg-white/40 shadow-[0_0_1px_rgba(0,0,0,0.8)]"
          style={{ top: `${pct}%` }}
        />
      ))}

      {/* Intersection power point crosshairs (for 3x3) */}
      {rows === 3 && cols === 3 && (
        <>
          {[33.333, 66.666].map((top) =>
            [33.333, 66.666].map((left) => (
              <div
                key={`point-${top}-${left}`}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-blue-500/50 shadow-sm"
                style={{ top: `${top}%`, left: `${left}%` }}
              />
            ))
          )}
        </>
      )}
    </div>
  );
};

/**
 * TikTok Safe Area UI Overlay
 * Standard 9:16 layout showing where TikTok's UI covers video content
 */
export const TikTokGuide: React.FC<GuideProps> = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans text-white">
      {/* Top Header Safe Margin */}
      <div className="absolute top-0 left-0 right-0 h-[14%] bg-gradient-to-b from-black/50 to-transparent flex items-start justify-between px-4 pt-4">
        <div className="flex items-center gap-4 text-xs font-semibold opacity-90 drop-shadow">
          <span className="opacity-60">Following</span>
          <span className="border-b-2 border-white pb-0.5">For You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full border border-white/40 flex items-center justify-center text-[10px]">
            🔍
          </div>
        </div>
      </div>

      {/* Right Action Column Safe Zone */}
      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3.5 w-12 text-center drop-shadow-md">
        {/* Avatar with follow */}
        <div className="relative mb-1">
          <div className="h-9 w-9 rounded-full border-2 border-white bg-neutral-600 flex items-center justify-center text-xs">
            👤
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
            +
          </div>
        </div>

        {/* Likes */}
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 flex items-center justify-center text-base">❤️</div>
          <span className="text-[9px] font-semibold tracking-tight">124K</span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 flex items-center justify-center text-base">💬</div>
          <span className="text-[9px] font-semibold tracking-tight">3.8K</span>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 flex items-center justify-center text-base">🔖</div>
          <span className="text-[9px] font-semibold tracking-tight">12.1K</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 flex items-center justify-center text-base">↪️</div>
          <span className="text-[9px] font-semibold tracking-tight">Share</span>
        </div>

        {/* Music Disc */}
        <div className="h-7 w-7 rounded-full border-2 border-neutral-700 bg-neutral-900 animate-spin flex items-center justify-center text-[9px]">
          🎵
        </div>
      </div>

      {/* Bottom Caption & Audio Safe Area */}
      <div className="absolute bottom-0 left-0 right-14 h-[22%] bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-3 pb-4">
        <div className="text-xs font-bold drop-shadow">@creator</div>
        <div className="mt-1 text-[11px] leading-tight text-white/90 line-clamp-2 drop-shadow">
          Your caption & text safely fit here without being hidden by platform buttons #video #edit
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/80">
          <span>🎵</span>
          <span className="truncate">Original Sound - Creator Audio • 60 BPM</span>
        </div>
      </div>

      {/* Safe Area Boundary Outlines */}
      <div className="absolute inset-x-2 top-14 bottom-14 border border-dashed border-cyan-400/50 rounded-lg pointer-events-none">
        <span className="absolute top-1 left-2 text-[8px] font-mono uppercase tracking-wider text-cyan-300/80 bg-black/60 px-1 py-0.5 rounded">
          TikTok Safe Zone
        </span>
      </div>
    </div>
  );
};

/**
 * Instagram Reels Safe Area Overlay
 */
export const InstagramReelsGuide: React.FC<GuideProps> = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans text-white">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-[10%] flex items-center justify-between px-3 pt-2 bg-gradient-to-b from-black/40 to-transparent">
        <span className="text-xs font-bold tracking-tight">Reels</span>
        <div className="text-xs">📷</div>
      </div>

      {/* Right Engagement Column */}
      <div className="absolute right-2 bottom-12 flex flex-col items-center gap-3 w-10 text-center drop-shadow-md">
        <div className="flex flex-col items-center">
          <div className="text-sm">❤️</div>
          <span className="text-[9px] font-medium">85.4K</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">💬</div>
          <span className="text-[9px] font-medium">1,420</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">✈️</div>
          <span className="text-[9px] font-medium">18.9K</span>
        </div>
        <div className="text-sm">⋯</div>
        <div className="h-6 w-6 rounded-md border border-white/60 bg-neutral-800 flex items-center justify-center text-[8px]">
          🎵
        </div>
      </div>

      {/* Bottom Profile & Caption */}
      <div className="absolute bottom-0 left-0 right-14 h-[18%] bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-neutral-500" />
          <span className="text-xs font-semibold">reels_account</span>
          <span className="rounded border border-white/40 px-1 text-[8px] font-bold">Follow</span>
        </div>
        <div className="mt-1 text-[10px] text-white/90 line-clamp-1">
          Instagram safe area bounds for text and focal elements...
        </div>
      </div>

      {/* Safe Area Box */}
      <div className="absolute inset-x-3 top-12 bottom-12 border border-dashed border-pink-400/50 rounded-lg pointer-events-none">
        <span className="absolute top-1 left-2 text-[8px] font-mono uppercase tracking-wider text-pink-300/80 bg-black/60 px-1 py-0.5 rounded">
          Reels Safe Zone
        </span>
      </div>
    </div>
  );
};

/**
 * YouTube Shorts Safe Area Overlay
 */
export const YouTubeShortsGuide: React.FC<GuideProps> = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans text-white">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-[10%] flex items-center justify-between px-3 pt-2 bg-gradient-to-b from-black/40 to-transparent">
        <span className="text-xs font-bold text-red-500">Shorts</span>
        <div className="flex items-center gap-2 text-xs">
          <span>🔍</span>
          <span>⋮</span>
        </div>
      </div>

      {/* Right Engagement Column */}
      <div className="absolute right-2 bottom-14 flex flex-col items-center gap-3.5 w-10 text-center drop-shadow-md">
        <div className="flex flex-col items-center">
          <div className="text-sm">👍</div>
          <span className="text-[9px] font-medium">92K</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">👎</div>
          <span className="text-[9px] font-medium">Dislike</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">💬</div>
          <span className="text-[9px] font-medium">854</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">↪️</div>
          <span className="text-[9px] font-medium">Share</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm">✂️</div>
          <span className="text-[9px] font-medium">Remix</span>
        </div>
        <div className="h-6 w-6 rounded bg-neutral-800 border border-white/40 flex items-center justify-center text-[8px]">
          🎵
        </div>
      </div>

      {/* Bottom Channel Info */}
      <div className="absolute bottom-0 left-0 right-14 h-[18%] bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-neutral-600" />
          <span className="text-xs font-semibold">@ChannelName</span>
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold">Subscribe</span>
        </div>
        <div className="mt-1 text-[10px] text-white/90 line-clamp-1">
          YouTube Shorts safe viewing margins for vertical content
        </div>
      </div>

      {/* Safe Area Box */}
      <div className="absolute inset-x-3 top-12 bottom-12 border border-dashed border-red-400/50 rounded-lg pointer-events-none">
        <span className="absolute top-1 left-2 text-[8px] font-mono uppercase tracking-wider text-red-300/80 bg-black/60 px-1 py-0.5 rounded">
          Shorts Safe Zone
        </span>
      </div>
    </div>
  );
};
