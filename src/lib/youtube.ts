/**
 * YouTube Utility functions for URL parsing, thumbnail generation, and metadata detection
 */

export const VIDEO_CATEGORIES = [
  'Jobs',
  'Internships',
  'Scholarships',
  'Coding',
  'Career Guidance',
  'Competitive Exams',
  'Freelancing'
] as const;

/**
 * Extracts the 11-character YouTube video ID from various standard YouTube URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Regex pattern for 11-char YouTube ID across formats
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
}

/**
 * Returns standard YouTube CDN thumbnail URL.
 * hqdefault is guaranteed to exist for every video on YouTube.
 */
export function getYouTubeThumbnail(videoId: string, highRes = true): string {
  return highRes
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/default.jpg`;
}

/**
 * Formats a clean watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Formats an embed URL for preview modal
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

/**
 * Optional auto-metadata fetch via public oEmbed endpoint
 * Returns null if network fails or CORS prevents it, allowing full manual fallback
 */
export async function fetchYouTubeOEmbed(url: string): Promise<{ title?: string; author_name?: string } | null> {
  try {
    const encoded = encodeURIComponent(url);
    const res = await fetch(`https://noembed.com/embed?url=${encoded}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || undefined,
      author_name: data.author_name || undefined,
    };
  } catch (err) {
    return null;
  }
}
