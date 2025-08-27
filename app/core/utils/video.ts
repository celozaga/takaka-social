export interface VideoConfig {
  // Player preferences
  preferredPlayer: 'bluesky';
  
  // Quality settings
  preferredQuality: 'auto' | 'high' | 'medium' | 'low';
  
  // Playback settings
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  
  // Performance settings
  enableHLS: boolean;
  enableStreaming: boolean;
  
  // UI settings
  showControls: boolean;
  showProgressBar: boolean;
  showFullscreenButton: boolean;
  
  // Advanced settings
  bufferSize: number;
  maxBitrate: number;
  enableHardwareAcceleration: boolean;
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  preferredPlayer: 'bluesky',
  preferredQuality: 'auto',
  autoplay: true,
  loop: true,
  muted: true,
  enableHLS: true,
  enableStreaming: true,
  showControls: true,
  showProgressBar: true,
  showFullscreenButton: true,
  bufferSize: 10, // seconds
  maxBitrate: 0, // 0 = auto
  enableHardwareAcceleration: true,
};

export class VideoManager {
  private static instance: VideoManager;
  private config: VideoConfig;

  private constructor() {
    this.config = { ...DEFAULT_VIDEO_CONFIG };
  }

  static getInstance(): VideoManager {
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  getConfig(): VideoConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<VideoConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  resetToDefaults(): void {
    this.config = { ...DEFAULT_VIDEO_CONFIG };
  }

  // Helper methods for common configurations
  shouldUseBlueskyPlayer(): boolean {
    return true; // Always use Bluesky player
  }

  shouldEnableHLS(): boolean {
    return this.config.enableHLS && this.config.preferredQuality !== 'low';
  }

  shouldEnableStreaming(): boolean {
    return this.config.enableStreaming && this.config.preferredQuality !== 'low';
  }

  getBufferSize(): number {
    return Math.max(1, Math.min(30, this.config.bufferSize));
  }

  getMaxBitrate(): number {
    if (this.config.maxBitrate === 0) return 0; // auto
    return Math.max(100000, Math.min(10000000, this.config.maxBitrate));
  }
}

// Export singleton instance
export const videoManager = VideoManager.getInstance();
