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
 * Standard responsive 9:16 vector overlay that maintains exact proportions at any canvas size
 */
export const TikTokGuide: React.FC<GuideProps> = ({ aspectRatio }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
      <div className="relative h-full aspect-[9/16] max-w-full flex items-center justify-center">
        {aspectRatio !== '9:16' && (
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
        )}
        <svg
          viewBox="0 0 1080 1920"
          className="h-full w-full object-contain pointer-events-none select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Header */}
          <g>
            <text
              x="390"
              y="120"
              textAnchor="middle"
              fill="white"
              fillOpacity="0.65"
              fontSize="38"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Following
            </text>
            <text
              x="560"
              y="120"
              textAnchor="middle"
              fill="white"
              fontSize="38"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              For You
            </text>
            <line x1="510" y1="140" x2="610" y2="140" stroke="white" strokeWidth="6" strokeLinecap="round" />
            {/* Search Glass */}
            <circle cx="1000" cy="105" r="22" stroke="white" strokeWidth="5" fill="none" />
            <line x1="1016" y1="121" x2="1038" y2="143" stroke="white" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* Right Action Stack */}
          <g transform="translate(990, 780)">
            {/* Avatar with follow */}
            <g transform="translate(0, 0)">
              <circle cx="0" cy="0" r="48" fill="#374151" stroke="white" strokeWidth="4" />
              <path d="M0 -16 A16 16 0 1 1 0 16 A16 16 0 1 1 0 -16 M-24 38 C-20 20, 20 20, 24 38" fill="white" />
              <circle cx="0" cy="48" r="16" fill="#F43F5E" />
              <path d="M-7 48 H7 M0 41 V55" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Heart / Likes */}
            <g transform="translate(0, 140)">
              <path
                d="M0 -15 C-25 -40, -50 -10, -50 15 C-50 45, 0 65, 0 80 C0 65, 50 45, 50 15 C50 -10, 25 -40, 0 -15 Z"
                fill="white"
                transform="scale(0.65) translate(0, -25)"
              />
              <text
                x="0"
                y="70"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                124K
              </text>
            </g>

            {/* Comments */}
            <g transform="translate(0, 270)">
              <path
                d="M-28 -28 H28 C34 -28, 38 -24, 38 -18 V18 C38 24, 34 28, 28 28 H-6 L-24 44 V28 H-28 C-34 28, -38 24, -38 18 V-18 C-38 -24, -34 -28, -28 -28 Z"
                fill="white"
              />
              <circle cx="-14" cy="0" r="4" fill="#1F2937" />
              <circle cx="0" cy="0" r="4" fill="#1F2937" />
              <circle cx="14" cy="0" r="4" fill="#1F2937" />
              <text
                x="0"
                y="75"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                3.8K
              </text>
            </g>

            {/* Bookmark */}
            <g transform="translate(0, 400)">
              <path d="M-22 -30 H22 V34 L0 18 L-22 34 Z" fill="white" />
              <text
                x="0"
                y="70"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                12.1K
              </text>
            </g>

            {/* Share */}
            <g transform="translate(0, 530)">
              <path
                d="M-15 -10 L15 -32 L15 -18 C35 -18, 48 -5, 45 22 C38 2, 28 -5, 15 -5 L15 10 Z"
                fill="white"
              />
              <text
                x="0"
                y="65"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                Share
              </text>
            </g>

            {/* Rotating Disc */}
            <g transform="translate(0, 680)">
              <circle cx="0" cy="0" r="44" fill="#111827" stroke="#374151" strokeWidth="6" />
              <circle cx="0" cy="0" r="14" fill="#F43F5E" />
              <path d="M-4 6 A5 5 0 1 1 -9 1 L-9 -10 L4 -14 L4 3 A5 5 0 1 1 -1 -2 L-1 -10" fill="white" />
            </g>
          </g>

          {/* Bottom Creator Caption */}
          <g transform="translate(50, 1620)">
            <text x="0" y="40" fill="white" fontSize="36" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
              @creator
            </text>
            <text x="0" y="90" fill="#F3F4F6" fontSize="28" fontFamily="system-ui, -apple-system, sans-serif">
              Your caption &amp; text safely fit here without being hidden
            </text>
            <text x="0" y="130" fill="#93C5FD" fontSize="26" fontFamily="system-ui, -apple-system, sans-serif">
              #video #edit #creative #freecut
            </text>
            <g transform="translate(0, 155)">
              <path d="M4 12 A6 6 0 1 1 -2 6 L-2 -8 L12 -12 L12 4 A6 6 0 1 1 6 -2 L6 -8" fill="#E5E7EB" />
              <text x="32" y="8" fill="#E5E7EB" fontSize="24" fontFamily="system-ui, -apple-system, sans-serif">
                Original Sound - Creator Audio • 60 BPM
              </text>
            </g>
          </g>

          {/* Safe Area Box */}
          <rect
            x="50"
            y="170"
            width="880"
            height="1400"
            rx="24"
            fill="none"
            stroke="#22D3EE"
            strokeWidth="3.5"
            strokeDasharray="14 14"
            strokeOpacity="0.75"
          />
          <rect x="75" y="195" width="220" height="42" rx="8" fill="rgba(0,0,0,0.65)" />
          <text x="185" y="224" textAnchor="middle" fill="#67E8F9" fontSize="20" fontWeight="700" fontFamily="monospace">
            TIKTOK SAFE ZONE
          </text>
        </svg>
      </div>
    </div>
  );
};

/**
 * Instagram Reels Safe Area Overlay
 * Standard responsive 9:16 vector overlay
 */
export const InstagramReelsGuide: React.FC<GuideProps> = ({ aspectRatio }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
      <div className="relative h-full aspect-[9/16] max-w-full flex items-center justify-center">
        {aspectRatio !== '9:16' && (
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
        )}
        <svg
          viewBox="0 0 1080 1920"
          className="h-full w-full object-contain pointer-events-none select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Header */}
          <g>
            <text x="50" y="120" fill="white" fontSize="48" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
              Reels
            </text>
            {/* Camera Icon */}
            <rect x="970" y="80" width="56" height="42" rx="10" stroke="white" strokeWidth="5" fill="none" />
            <circle cx="998" cy="101" r="11" stroke="white" strokeWidth="4" fill="none" />
          </g>

          {/* Right Action Stack */}
          <g transform="translate(990, 850)">
            {/* Heart */}
            <g transform="translate(0, 0)">
              <path
                d="M0 -15 C-25 -40, -50 -10, -50 15 C-50 45, 0 65, 0 80 C0 65, 50 45, 50 15 C50 -10, 25 -40, 0 -15 Z"
                fill="white"
                transform="scale(0.65) translate(0, -25)"
              />
              <text
                x="0"
                y="70"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                85.4K
              </text>
            </g>

            {/* Comments */}
            <g transform="translate(0, 140)">
              <path
                d="M-28 -28 H28 C34 -28, 38 -24, 38 -18 V18 C38 24, 34 28, 28 28 H-6 L-24 44 V28 H-28 C-34 28, -38 24, -38 18 V-18 C-38 -24, -34 -28, -28 -28 Z"
                fill="white"
              />
              <text
                x="0"
                y="75"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                1,420
              </text>
            </g>

            {/* Paper Airplane (Share) */}
            <g transform="translate(0, 280)">
              <path d="M-26 -20 L30 0 L-26 20 L-14 0 Z" fill="white" />
              <text
                x="0"
                y="65"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                18.9K
              </text>
            </g>

            {/* More dots */}
            <g transform="translate(0, 400)">
              <circle cx="-16" cy="0" r="5" fill="white" />
              <circle cx="0" cy="0" r="5" fill="white" />
              <circle cx="16" cy="0" r="5" fill="white" />
            </g>

            {/* Audio thumbnail */}
            <g transform="translate(0, 520)">
              <rect x="-30" y="-30" width="60" height="60" rx="12" fill="#262626" stroke="white" strokeWidth="3" />
              <circle cx="0" cy="0" r="10" stroke="white" strokeWidth="3" fill="none" />
            </g>
          </g>

          {/* Bottom Channel Info */}
          <g transform="translate(50, 1630)">
            <circle cx="36" cy="36" r="36" fill="#6B7280" />
            <text x="90" y="46" fill="white" fontSize="34" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">
              reels_account
            </text>
            <rect x="360" y="16" width="130" height="44" rx="8" fill="none" stroke="white" strokeWidth="2.5" />
            <text
              x="425"
              y="46"
              textAnchor="middle"
              fill="white"
              fontSize="22"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Follow
            </text>
            <text x="10" y="105" fill="#F3F4F6" fontSize="28" fontFamily="system-ui, -apple-system, sans-serif">
              Instagram safe area bounds for text and focal elements...
            </text>
          </g>

          {/* Safe Area Box */}
          <rect
            x="50"
            y="170"
            width="880"
            height="1400"
            rx="24"
            fill="none"
            stroke="#F472B6"
            strokeWidth="3.5"
            strokeDasharray="14 14"
            strokeOpacity="0.75"
          />
          <rect x="75" y="195" width="220" height="42" rx="8" fill="rgba(0,0,0,0.65)" />
          <text x="185" y="224" textAnchor="middle" fill="#F9A8D4" fontSize="20" fontWeight="700" fontFamily="monospace">
            REELS SAFE ZONE
          </text>
        </svg>
      </div>
    </div>
  );
};

/**
 * YouTube Shorts Safe Area Overlay
 * Standard responsive 9:16 vector overlay
 */
export const YouTubeShortsGuide: React.FC<GuideProps> = ({ aspectRatio }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
      <div className="relative h-full aspect-[9/16] max-w-full flex items-center justify-center">
        {aspectRatio !== '9:16' && (
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
        )}
        <svg
          viewBox="0 0 1080 1920"
          className="h-full w-full object-contain pointer-events-none select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Header */}
          <g>
            <text x="50" y="120" fill="#EF4444" fontSize="48" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
              Shorts
            </text>
            {/* Search Glass */}
            <circle cx="940" cy="100" r="22" stroke="white" strokeWidth="5" fill="none" />
            <line x1="956" y1="116" x2="978" y2="138" stroke="white" strokeWidth="5" strokeLinecap="round" />
            {/* 3 Dots Menu */}
            <circle cx="1025" cy="85" r="5" fill="white" />
            <circle cx="1025" cy="105" r="5" fill="white" />
            <circle cx="1025" cy="125" r="5" fill="white" />
          </g>

          {/* Right Action Stack */}
          <g transform="translate(980, 820)">
            {/* Like (Thumbs Up) */}
            <g transform="translate(0, 0)">
              <path
                d="M-20 -15 C-20 -30, -5 -40, 10 -40 C15 -40, 18 -36, 18 -30 L18 -10 L30 -10 C38 -10, 42 -5, 40 5 L30 45 C28 52, 20 55, 12 55 L-20 55 Z"
                fill="white"
                stroke="black"
                strokeWidth="2"
              />
              <rect x="-35" y="-10" width="12" height="65" rx="3" fill="white" />
              <text
                x="0"
                y="85"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                92K
              </text>
            </g>

            {/* Dislike (Thumbs Down) */}
            <g transform="translate(0, 150)">
              <path
                d="M-20 15 C-20 30, -5 40, 10 40 C15 40, 18 36, 18 30 L18 10 L30 10 C38 10, 42 5, 40 -5 L30 -45 C28 -52, 20 -55, 12 -55 L-20 -55 Z"
                fill="white"
                stroke="black"
                strokeWidth="2"
              />
              <rect x="-35" y="-55" width="12" height="65" rx="3" fill="white" />
              <text
                x="0"
                y="85"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                Dislike
              </text>
            </g>

            {/* Comments */}
            <g transform="translate(0, 300)">
              <path
                d="M-28 -28 H28 C34 -28, 38 -24, 38 -18 V18 C38 24, 34 28, 28 28 H-6 L-24 44 V28 H-28 C-34 28, -38 24, -38 18 V-18 C-38 -24, -34 -28, -28 -28 Z"
                fill="white"
              />
              <text
                x="0"
                y="75"
                textAnchor="middle"
                fill="white"
                fontSize="26"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                854
              </text>
            </g>

            {/* Share */}
            <g transform="translate(0, 440)">
              <path
                d="M-15 -10 L15 -32 L15 -18 C35 -18, 48 -5, 45 22 C38 2, 28 -5, 15 -5 L15 10 Z"
                fill="white"
              />
              <text
                x="0"
                y="70"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                Share
              </text>
            </g>

            {/* Remix */}
            <g transform="translate(0, 570)">
              <circle cx="-10" cy="10" r="12" stroke="white" strokeWidth="5" fill="none" />
              <circle cx="10" cy="10" r="12" stroke="white" strokeWidth="5" fill="none" />
              <line x1="-3" y1="2" x2="18" y2="-28" stroke="white" strokeWidth="5" strokeLinecap="round" />
              <line x1="3" y1="2" x2="-18" y2="-28" stroke="white" strokeWidth="5" strokeLinecap="round" />
              <text
                x="0"
                y="70"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                Remix
              </text>
            </g>

            {/* Sound Icon */}
            <g transform="translate(0, 690)">
              <rect x="-32" y="-32" width="64" height="64" rx="14" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="3" />
              <path d="M-6 12 A8 8 0 1 1 -14 4 L-14 -16 L8 -22 L8 6 A8 8 0 1 1 0 -2 L0 -15" fill="white" />
            </g>
          </g>

          {/* Bottom Channel Info */}
          <g transform="translate(50, 1620)">
            <circle cx="45" cy="45" r="42" fill="#4B5563" />
            <path d="M45 25 A14 14 0 1 1 45 53 A14 14 0 1 1 45 25 M22 75 C24 58, 66 58, 68 75" fill="white" />
            <text x="110" y="55" fill="white" fontSize="36" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">
              @ChannelName
            </text>
            <rect x="420" y="16" width="190" height="56" rx="28" fill="#DC2626" />
            <text
              x="515"
              y="53"
              textAnchor="middle"
              fill="white"
              fontSize="26"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Subscribe
            </text>
            <text x="10" y="125" fill="#F3F4F6" fontSize="28" fontFamily="system-ui, -apple-system, sans-serif">
              YouTube Shorts safe viewing margins for vertical content
            </text>
          </g>

          {/* Safe Area Box */}
          <rect
            x="50"
            y="170"
            width="880"
            height="1400"
            rx="24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="3.5"
            strokeDasharray="14 14"
            strokeOpacity="0.75"
          />
          <rect x="75" y="195" width="230" height="42" rx="8" fill="rgba(0,0,0,0.65)" />
          <text
            x="190"
            y="224"
            textAnchor="middle"
            fill="#FCA5A5"
            fontSize="20"
            fontWeight="700"
            fontFamily="monospace"
          >
            SHORTS SAFE ZONE
          </text>
        </svg>
      </div>
    </div>
  );
};
