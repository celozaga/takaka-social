import React from 'react';
import { Link } from 'expo-router';
import { AppBskyActorDefs } from '@atproto/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { View, Pressable, Text, Image, StyleSheet } from 'react-native';

interface ConvoHeaderProps {
  peer: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed | null;
  isLoading: boolean;
}

const ConvoHeader: React.FC<ConvoHeaderProps> = ({ peer, isLoading }) => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <Pressable onPress={() => window.history.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="white" />
        </Pressable>
        {isLoading && <Loader2 style={styles.loader} size={20} color="white" />}
        {!isLoading && peer && (
          <Link href={`/profile/${peer.handle}`} asChild>
            <Pressable style={styles.peerInfo}>
              <Image source={{ uri: peer.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
              <View style={styles.peerTextContainer}>
                <Text style={styles.peerName} numberOfLines={1}>{peer.displayName || `@${peer.handle}`}</Text>
                {peer.displayName && <Text style={styles.peerHandle} numberOfLines={1}>@{peer.handle}</Text>}
              </View>
            </Pressable>
          </Link>
        )}
        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        marginHorizontal: 'auto',
        paddingHorizontal: 16,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        color: 'white',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 999,
    },
    loader: {
        // animation...
    },
    peerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexShrink: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2b2d2e',
    },
    peerTextContainer: {
        flexShrink: 1,
    },
    peerName: {
        fontWeight: 'bold',
        color: 'white',
    },
    peerHandle: {
        fontSize: 12,
        opacity: 0.7,
        color: 'white',
    },
    placeholder: {
        width: 32,
    }
});

export default ConvoHeader;
