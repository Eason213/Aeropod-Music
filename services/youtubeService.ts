import { VideoItem } from '../types';

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId?: string;
      playlistId?: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        high: {
          url: string;
        };
        medium: {
          url: string;
        };
      };
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      videoOwnerChannelTitle: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
}

export const searchYouTube = async (
  query: string, 
  apiKey: string,
  type: 'video' | 'playlist' = 'video'
): Promise<VideoItem[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Base URL
  // videoCategoryId=10 ensures we strictly get Music results
  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=${type}&key=${apiKey}&videoCategoryId=10`;

  // Apply specific filters
  if (type === 'video') {
    // videoDuration=short (< 4 mins)
    url += `&videoDuration=short`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to fetch from YouTube");
  }

  const data: YouTubeSearchResponse = await response.json();

  return data.items.map((item) => ({
    // Use either videoId or playlistId based on what we get back
    id: item.id.videoId || item.id.playlistId || '',
    title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
    kind: (item.id.playlistId ? 'playlist' : 'video') as 'video' | 'playlist'
  })).filter(item => item.id !== ''); // Filter out items with no ID
};

export const getPlaylistItems = async (playlistId: string, apiKey: string): Promise<VideoItem[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to fetch playlist items");
  }

  const data: YouTubePlaylistItemsResponse = await response.json();

  return data.items.map((item) => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
    channelTitle: item.snippet.videoOwnerChannelTitle || "Unknown Artist",
    thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    kind: 'video' as const
  })).filter(item => item.title !== 'Private video' && item.title !== 'Deleted video');
};