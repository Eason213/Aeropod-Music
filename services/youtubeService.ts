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

export const searchYouTube = async (
  query: string, 
  apiKey: string,
  type: 'video' | 'playlist' = 'video'
): Promise<VideoItem[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Base URL
  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=${type}&key=${apiKey}`;

  // Apply filters
  if (type === 'video') {
    // videoDuration=short (< 4 mins)
    // videoCategoryId=10 (Music) - This ensures we mostly get music results
    url += `&videoDuration=short&videoCategoryId=10`;
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
  })).filter(item => item.id !== ''); // Filter out items with no ID
};