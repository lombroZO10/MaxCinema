export function getMuxHlsUrl(playbackId?: string | null) {
  if (!playbackId) return null;
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getCloudflareStreamUrl(videoId?: string | null) {
  if (!videoId) return null;
  return `https://customer-domain.example/${videoId}/manifest/video.m3u8`;
}
