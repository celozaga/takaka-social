import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import PostScreen, { Post, Comment, Adapters, ProfileLink } from '@/components/post/PostScreen';

// --- MOCK DATA ---
const mockAuthor: ProfileLink = {
  did: 'did:plc:123',
  handle: 'creator.bsky.social',
  displayName: 'Momo',
  avatar: 'https://i.pravatar.cc/150?u=momo',
  verified: true,
};

const mockPost: Post = {
  uri: 'at://did:plc:123/app.bsky.feed.post/abc',
  cid: 'cid123',
  author: mockAuthor,
  title: 'Super beautiful golden skin, no loss to start with!',
  text: 'This is a test caption with a #hashtag and a @mention. The text can be quite long, so we need to make sure it wraps correctly and the "See more" functionality works as expected. Let\'s add some more text to be sure. This should be enough to trigger truncation.',
  media: [
    { type: "image", url: 'https://picsum.photos/seed/post1/800/1000', width: 800, height: 1000 },
    { type: "image", url: 'https://picsum.photos/seed/post2/800/800', width: 800, height: 800 },
    { type: "image", url: 'https://picsum.photos/seed/post3/1000/800', width: 1000, height: 800 },
  ],
  tags: ['art', 'design'],
  location: 'Hunan',
  lang: 'en',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  likeCount: 303,
  repostCount: 71,
  replyCount: 98,
  liked: false,
  reposted: true,
  saved: false,
  followedAuthor: false,
};

const mockComments: Comment[] = [
  {
    uri: 'at://did:plc:456/app.bsky.feed.post/c1', cid: 'c1',
    author: { did: 'did:plc:456', handle: 'user1.bsky.social', displayName: 'User One', avatar: 'https://i.pravatar.cc/150?u=user1' },
    text: 'This is the first comment. It is amazing!',
    likeCount: 5, liked: true, createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    isAuthor: false,
    children: [
      {
        uri: 'at://did:plc:123/app.bsky.feed.post/c1r1', cid: 'c1r1',
        author: mockAuthor,
        text: 'Thank you!',
        likeCount: 7, liked: false, createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        isAuthor: true,
      },
       {
        uri: 'at://did:plc:999/app.bsky.feed.post/c1r2', cid: 'c1r2',
        author: { did: 'did:plc:999', handle: 'user3.bsky.social', displayName: 'User Three', avatar: 'https://i.pravatar.cc/150?u=user3' },
        text: 'This is another reply to test the expansion.',
        likeCount: 2, liked: false, createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        isAuthor: false,
      }
    ]
  },
  {
    uri: 'at://did:plc:789/app.bsky.feed.post/c2', cid: 'c2',
    author: { did: 'did:plc:789', handle: 'user2.bsky.social', displayName: 'User Two', avatar: 'https://i.pravatar.cc/150?u=user2' },
    text: 'A very long comment to test the "See more" functionality. This text should definitely be long enough to wrap to multiple lines and eventually get truncated by the component logic, which will then display a button to expand it.',
    likeCount: 1, liked: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isAuthor: false,
  },
];


// --- MOCK ADAPTERS ---
const mockAdapters: Adapters = {
  onOpenProfile: (p) => alert(`Opening profile: @${p.handle}`),
  onFollow: (did, next) => new Promise(res => setTimeout(() => { console.log(`Following ${did}: ${next}`); res(void 0); }, 500)),
  onLike: (uri, next) => new Promise(res => setTimeout(() => { console.log(`Liking ${uri}: ${next}`); res(void 0); }, 300)),
  onRepost: (uri, next) => new Promise(res => setTimeout(() => { console.log(`Reposting ${uri}: ${next}`); res(void 0); }, 500)),
  onReply: (parentUri, text) => new Promise(res => setTimeout(() => { console.log(`Replying to ${parentUri}: "${text}"`); res(void 0); }, 800)),
  onShare: (post) => alert(`Sharing post: ${post.title}`),
  onReport: (uri) => alert(`Reporting URI: ${uri}`),
  onTranslate: (text, lang) => new Promise(res => setTimeout(() => res(`[Translated] ${text}`), 600)),
  loadMoreComments: (cursor) => new Promise(res => setTimeout(() => res({ items: [], cursor: undefined }), 1000)),
  loadMoreReplies: (parentUri, cursor) => new Promise(res => setTimeout(() => res({ items: [], cursor: undefined }), 1000)),
};


export default function PostPage() {
  const { did, rkey } = useLocalSearchParams<{ did: string; rkey: string }>();
  
  if (!did || !rkey) {
      return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>Error: Invalid post identifier.</Text>
        </View>
      );
  }

  return (
    <PostScreen 
      post={mockPost}
      initialComments={mockComments}
      adapters={mockAdapters}
    />
  );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    }
});