# Takaka Social - Developer Guide

## 🚀 Quick Start

Takaka is a visual-first social app built on Bluesky/ATProto with a Xiaohongshu-style interface. This guide covers configuration, feature flags, and development workflows.

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI and Expo SDK 53
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation
```bash
npm install
```

### Development Commands
```bash
# Start development server
npm start

# Platform-specific development
npm run ios
npm run android  
npm run web

# Build commands
npm run build                 # Web build
npm run eas-build-dev        # Development builds
npm run eas-build-preview    # Preview builds
npm run eas-build-prod       # Production builds
```

## ⚙️ Configuration

### Feature Flags (`lib/config.ts`)

The app uses a comprehensive feature flag system to control functionality:

#### Core Content Policies
```typescript
TEXT_POSTING: false,                    // Disable text-only posts
QUOTE_POSTING: false,                   // Disable quote compose UI
SHOW_REPLIES_IN_MAIN_FEEDS: false,     // Hide replies from main feeds
VISUAL_ONLY_FEEDS: true,                // Filter feeds to show only visual content
```

#### Media Features
```typescript
IMAGE_POSTING: true,                    // Allow image uploads
VIDEO_POSTING: true,                    // Allow video uploads
HLS_VIDEO: true,                        // Enable HLS video streaming
VIDEO_THUMBNAILS: true,                 // Generate video thumbnails
```

#### User Experience
```typescript
BOOKMARKS: true,                        // Private bookmarks system
FOLLOW_SYSTEM: true,                    // Follow/unfollow users
SHARE_POSTS: true,                      // Cross-platform sharing
MASONRY_LAYOUT: true,                   // Grid/masonry feed layout
```

#### Watch Section
```typescript
WATCH_SECTION: true,                    // Dedicated /watch video feed
VIDEO_AUTOPLAY: true,                   // Autoplay videos in watch
VIDEO_PRELOADING: true,                 // Preload next videos
```

#### Safety & Moderation
```typescript
CONTENT_FILTERING: true,                // Respect ATProto labels
USER_BLOCKING: true,                    // Block/mute functionality
NSFW_FILTERING: true,                   // NSFW content filtering
```

### Media Configuration

#### File Limits
```typescript
MAX_IMAGES_PER_POST: 4,
MAX_VIDEOS_PER_POST: 1,
MAX_IMAGE_SIZE_MB: 10,
MAX_VIDEO_SIZE_MB: 100,
MAX_VIDEO_DURATION_SECONDS: 300,       // 5 minutes
```

#### Supported Formats
```typescript
SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
SUPPORTED_VIDEO_FORMATS: ['video/mp4', 'video/mov', 'video/avi'],
```

#### Feed Filtering
```typescript
ALLOWED_EMBED_TYPES: [
  'app.bsky.embed.images',
  'app.bsky.embed.video', 
  'app.bsky.embed.external',             // External links with previews
],
```

## 🔧 ATProto Configuration

### App Passwords Setup

1. **Create App Password**:
   - Go to [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords)
   - Create a new app password for Takaka
   - Save the password securely

2. **Configure PDS**:
   ```typescript
   // Default configuration
   DEFAULT_PDS: 'https://bsky.social',
   
   // For custom PDS, users can change during login
   ```

3. **Session Management**:
   ```typescript
   SESSION_REFRESH_THRESHOLD_MS: 5 * 60 * 1000,    // 5 minutes
   MAX_RETRY_ATTEMPTS: 3,
   RETRY_DELAY_MS: 1000,
   ```

### Custom Feeds Integration

The watch section uses a specific video feed:
```typescript
// Default video feed (can be changed)
const VIDEOS_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
```

To use a different feed:
1. Find the feed's AT URI
2. Update `VIDEOS_FEED_URI` in `components/watch/hooks/useVideoManager.ts`
3. Ensure the feed contains video content for optimal experience

## 🎥 Video Implementation

### Expo Video Integration
The app uses `expo-video` (SDK 53) for optimal performance:

```typescript
// Video player configuration
import { VideoView, useVideoPlayer } from 'expo-video';

// HLS support for web
import Hls from 'hls.js';
```

### Video Upload Flow
1. **Selection**: User selects video via `expo-image-picker`
2. **Validation**: Check file size, duration, and format
3. **Upload**: Convert to blob and upload via ATProto agent
4. **Embed**: Create `app.bsky.embed.video` record
5. **Post**: Submit to Bluesky with video embed

### HLS Streaming
- **Native**: Handled automatically by `expo-video`
- **Web**: Uses `hls.js` for compatibility
- **Fallback**: MP4 direct streaming for unsupported formats

## 🎨 UI Architecture

### Theme System
```typescript
// Using existing theme from @/lib/theme
import { theme } from '@/lib/theme';

// Theme values used throughout components
theme.colors.primary
theme.spacing.m
theme.typography.bodyMedium
```

### Layout Patterns
- **Masonry Grid**: Main feed layout for visual content
- **Vertical Feed**: Watch section with TikTok-style scrolling
- **Modal System**: Composer, actions, and settings overlays

### Component Structure
```
components/
├── shared/           # Reusable components (Feed, VideoPlayer)
├── composer/         # Post creation components
├── watch/           # Video feed components
├── post/            # Post display components
├── profile/         # User profile components
└── ui/              # UI primitives and utilities
```

## 🔄 State Management

### Context Providers
- **AtpContext**: Bluesky session and agent management
- **BookmarksContext**: Private bookmarks handling
- **ModerationContext**: Content filtering and safety
- **UIContext**: Modal states and navigation
- **ProfileCacheContext**: User profile caching

### Hooks
- **useVideoManager**: Video feed management with preloading
- **usePostActions**: Like, repost, and share functionality
- **useVideoPlayback**: Video URL resolution and streaming
- **useSavedFeeds**: Custom feed management

## 🚧 Development Workflow

### Feature Development
1. **Check Feature Flags**: Ensure the feature is enabled in `lib/config.ts`
2. **Create Components**: Follow existing patterns in component structure
3. **Add Translations**: Update language files in `locales/`
4. **Test Platforms**: Verify on iOS, Android, and Web
5. **Update Documentation**: Add any new configuration options

### Testing Strategy
```bash
# Test on all platforms
npm run ios -- --device-simulator="iPhone 15"
npm run android -- --device-id="emulator-5554"
npm run web

# Check for type errors
npx tsc --noEmit

# Run linting
npx eslint . --ext .ts,.tsx
```

### Performance Monitoring
Enable verbose logging for development:
```typescript
// In lib/config.ts
export const RUNTIME_FLAGS = {
  DEBUG_VIDEO_LOGS: true,
  VERBOSE_API_LOGS: true, 
  SHOW_PERFORMANCE_METRICS: true,
};
```

## 🐛 Debugging

### Video Issues
1. **Check HLS Support**: Verify browser/device HLS compatibility
2. **Network Logs**: Monitor video URL resolution
3. **Preloading**: Check preloading configuration and memory usage
4. **Performance**: Use React DevTools for render optimization

### Feed Issues
1. **Content Filtering**: Verify feature flags for visual-only feeds
2. **API Calls**: Check ATProto feed responses
3. **Moderation**: Ensure moderation context is properly loaded
4. **Cache**: Clear feed cache if seeing stale content

### Upload Issues
1. **File Validation**: Check size and format constraints
2. **Network**: Monitor blob upload progress
3. **Permissions**: Verify media library access
4. **ATProto**: Check session validity and agent configuration

### Common Debug Commands
```typescript
// Enable debug mode in components
const DEBUG = __DEV__ && RUNTIME_FLAGS.DEBUG_VIDEO_LOGS;

// Log ATProto operations
if (RUNTIME_FLAGS.VERBOSE_API_LOGS) {
  console.log('ATProto operation:', operation);
}

// Performance monitoring
if (RUNTIME_FLAGS.SHOW_PERFORMANCE_METRICS) {
  console.time('video-load');
  // ... operation
  console.timeEnd('video-load');
}
```

## 🌐 Platform-Specific Notes

### iOS
- **Video**: Uses native AVPlayer via expo-video
- **Sharing**: Native share sheet with proper fallbacks
- **Performance**: Hardware acceleration enabled by default

### Android
- **Video**: Uses ExoPlayer via expo-video
- **Sharing**: Android share intent system
- **Performance**: Hardware acceleration when available

### Web
- **Video**: HLS.js for streaming, fallback to HTML5 video
- **Sharing**: Web Share API with clipboard fallback
- **Performance**: Service worker for caching (future enhancement)

## 📱 Build Configuration

### EAS Build Profiles
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

### Environment Variables
```bash
# .env file (not committed)
EXPO_PUBLIC_API_URL=https://bsky.social
EXPO_PUBLIC_WEB_CLIENT_URL=https://bsky.app
```

## 🔒 Security Considerations

### App Passwords
- **Storage**: Secure storage on device
- **Transmission**: HTTPS only
- **Rotation**: Encourage regular password rotation

### User Data
- **Bookmarks**: Private, stored as ATProto records
- **Cache**: Cleared on logout
- **Uploads**: Validated before submission

### Content Safety
- **Moderation**: Respects ATProto labels
- **Reporting**: Uses Bluesky's reporting system
- **Blocking**: Comprehensive user blocking

## 📊 Performance Guidelines

### Video Optimization
- **Preloading**: Configurable based on network conditions
- **Memory**: Automatic cleanup of unused video elements
- **Caching**: Smart thumbnail and metadata caching

### Feed Performance
- **Pagination**: Cursor-based with intelligent batching
- **Rendering**: Optimized FlatList with view recycling
- **Network**: Minimize redundant API calls

### Bundle Size
- **Tree Shaking**: Ensure unused code is eliminated
- **Lazy Loading**: Dynamic imports for large components
- **Assets**: Optimized images and video thumbnails

## 🚀 Deployment

### Preparation
1. **Test All Platforms**: iOS, Android, Web
2. **Verify Feature Flags**: Ensure production-ready configuration
3. **Update Version**: Bump version in `package.json` and `app.json`
4. **Generate Builds**: Use EAS for native platforms

### Release Checklist
- [ ] All feature flags properly configured
- [ ] Video upload/playback tested on all platforms
- [ ] Feed filtering working correctly
- [ ] ATProto integration stable
- [ ] Translation files updated
- [ ] Performance benchmarks met
- [ ] Documentation updated

---

## 🤝 Contributing

When contributing to Takaka:

1. **Respect Feature Flags**: Always check flags before implementing features
2. **Maintain Visual Focus**: Keep the Xiaohongshu-style visual-first experience
3. **Test Thoroughly**: Verify changes on all supported platforms
4. **Document Changes**: Update both code and documentation
5. **Performance First**: Consider impact on video and feed performance

For questions or issues, refer to the main README.md or open an issue in the repository.

