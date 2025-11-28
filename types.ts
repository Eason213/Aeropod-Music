export interface VideoItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export enum RepeatMode {
  OFF = 0,
  ALL = 1,
  ONE = 2,
}
