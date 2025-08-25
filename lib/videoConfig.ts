export interface VideoConfig {
  // Player preferences
  preferredPlayer: 'bluesky' | 'expo' | 'auto';
  
  // Quality settings
  preferredQuality: 'auto' | 'high' | 'medium' | 'low';
  
  // Playback settings
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  
  // Performance settings
  enableHLS: boolean;
  enableStreaming: boolean;
  enableFallback: boolean;
  
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
  preferredPlayer: 'auto',
  preferredQuality: 'auto',
  autoplay: true,
  loop: true,
  muted: true,
  enableHLS: true,
  enableStreaming: true,
  enableFallback: true,
  showControls: true,
  showProgressBar: true,
  showFullscreenButton: true,
  bufferSize: 10, // seconds
  maxBitrate: 0, // 0 = auto
  enableHardwareAcceleration: true,
};

export class VideoConfigManager {
  private static instance: VideoConfigManager;
  private config: VideoConfig;

  private constructor() {
    this.config = { ...DEFAULT_VIDEO_CONFIG };
  }

  static getInstance(): VideoConfigManager {
    if (!VideoConfigManager.instance) {
      VideoConfigManager.instance = new VideoConfigManager();
    }
    return VideoConfigManager.instance;
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
    if (this.config.preferredPlayer === 'bluesky') return true;
    if (this.config.preferredPlayer === 'expo') return false;
    return this.config.preferredPlayer === 'auto';
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
export const videoConfig = VideoConfigManager.getInstance();
