import { VideoItem } from '../types';

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
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
  apiKey: string
): Promise<VideoItem[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Filter for videoDuration=short (< 4 minutes) as requested
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(
    query
  )}&type=video&videoDuration=short&key=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to fetch from YouTube");
  }

  const data: YouTubeSearchResponse = await response.json();

  return data.items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
  }));
};
