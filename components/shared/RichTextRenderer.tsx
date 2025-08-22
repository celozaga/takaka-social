import React from 'react';
import { Link } from 'expo-router';
import { RichText } from '@atproto/api';
import { Pressable, Text, Linking, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface RichTextRendererProps {
  record: {
    text: string;
    facets?: RichText['facets'];
  };
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ record }) => {
  if (!record.facets || record.facets.length === 0) {
    return <>{record.text}</>;
  }

  const rt = new RichText({ text: record.text, facets: record.facets });
  const segments: React.ReactNode[] = [];

  for (const segment of rt.segments()) {
    if (segment.isLink()) {
      segments.push(
        <Text
          key={segments.length}
          style={styles.link}
          onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(segment.link!.uri);
          }}
        >
          {segment.text}
        </Text>
      );
    } else if (segment.isMention()) {
      segments.push(
        <Link
          key={segments.length}
          href={`/profile/${segment.mention!.did}` as any}
          onPress={(e) => e.stopPropagation()}
          asChild
        >
          <Text style={styles.link}>{segment.text}</Text>
        </Link>
      );
    } else if (segment.isTag()) {
      segments.push(
        <Link
          key={segments.length}
          href={`/search?q=${encodeURIComponent(segment.tag!.tag)}&filter=top` as any}
          onPress={(e) => e.stopPropagation()}
          asChild
        >
          <Text style={styles.link}>{segment.text}</Text>
        </Link>
      );
    } else {
      segments.push(<Text key={segments.length}>{segment.text}</Text>);
    }
  }

  return <>{segments}</>;
};

const styles = StyleSheet.create({
    link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
    }
});

export default RichTextRenderer;
