import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import PostScreen, { Post, Comment, Adapters, ProfileLink } from '@/components/post/PostScreen';

// --- MOCK DATA ---
const mockAuthor: ProfileLink = {
  did: 'did:plc:123',
  handle: 'creator.bsky.social',
  displayName: 'Momo',
  avatar: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=400',
  verified: true,
};

const mockPost: Post = {
  uri: 'at://did:plc:123/app.bsky.feed.post/abc',
  cid: 'cid123',
  author: mockAuthor,
  title: 'Super beautiful golden skin, no loss to start with!',
  text: 'This is a test caption with a #hashtag and a @mention. The text can be quite long, so we need to make sure it wraps correctly and the "See more" functionality works as expected. Let\'s add some more text to be sure. This should be enough to trigger truncation.',
  media: [
    { type: "image", url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800', width: 800, height: 1000 },
    { type: "image", url: 'https://images.unsplash.com/photo-1620712943543-2858200f745a?q=80&w=800', width: 800, height: 800 },
  ],
  tags: ['art', 'design'],
  location: 'Hunan',
  lang: 'en',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  likeCount: 303,
  repostCount: 71,
  replyCount: 98,
  liked: false,
  reposted: false,
  saved: false,
  followedAuthor: false,
};

const mockComments: Comment[] = [
  {
    uri: 'at://did:plc:456/app.bsky.feed.post/c1', cid: 'c1',
    author: { did: 'did:plc:456', handle: 'user1.bsky.social', displayName: 'User One', avatar: 'https://images.unsplash.com/photo-1549396334-41335a5858df?q=80&w=400' },
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
    ]
  },
  {
    uri: 'at://did:plc:789/app.bsky.feed.post/c2', cid: 'c2',
    author: { did: 'did:plc:789', handle: 'user2.bsky.social', displayName: 'User Two', avatar: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=400' },
    text: 'A very long comment to test the "See more" functionality. This text should definitely be long enough to wrap to multiple lines and eventually get truncated by the component logic, which will then display a button to expand it.',
    likeCount: 1, liked: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isAuthor: false,
  },
];


// --- MOCK ADAPTERS ---
const mockAdapters: Adapters = {
  onOpenProfile: (p) => alert(`Opening profile: @${p.handle}`),
  onFollow: (did, next) => new Promise(res => setTimeout(() => { console.log(`Following ${did}: ${next}`); res(); }, 500)),
  onLike: (uri, next) => new Promise(res => setTimeout(() => { console.log(`Liking ${uri}: ${next}`); res(); }, 300)),
  onRepost: (uri, next) => new Promise(res => setTimeout(() => { console.log(`Reposting ${uri}: ${next}`); res(); }, 500)),
  onReply: (parentUri, text) => new Promise(res => setTimeout(() => { console.log(`Replying to ${parentUri}: "${text}"`); res(); }, 800)),
  onShare: (post) => alert(`Sharing post: ${post.title}`),
  onReport: (uri) => alert(`Reporting URI: ${uri}`),
  onTranslate: (text, lang) => new Promise(res => setTimeout(() => res(`[Translated] ${text}`), 600)),
  loadMoreComments: (cursor) => new Promise(res => setTimeout(() => res({ items: [], cursor: undefined }), 1000)),
  loadMoreReplies: (parentUri, cursor) => new Promise(res => setTimeout(() => res({ items: [], cursor: undefined }), 1000)),
};


export default function PostPage() {
  const { did, rkey } = useLocalSearchParams<{ did: string; rkey: string }>();
  
  // In a real app, you would use did and rkey to fetch real data
  // For this demo, we ignore them and use the mock data.
  if (!did || !rkey) {
      return <View><Text>Error: Invalid post identifier.</Text></View>;
  }

  return (
    <PostScreen 
      post={mockPost}
      initialComments={mockComments}
      adapters={mockAdapters}
    />
  );
}
