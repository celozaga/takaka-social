import React from 'react';
import { Link } from 'expo-router';
import { RichText } from '@atproto/api';
import { Pressable, Text, Linking, StyleSheet } from 'react-native';
// Remove this import as we're using useTheme hook instead
import { AccessibleText } from './AccessibleText';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useTheme } from './Theme/ThemeProvider';

interface RichTextRendererProps {
  record: {
    text: string;
    facets?: RichText['facets'];
  };
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ record }) => {
  const { getTextScale, getFontWeight } = useAccessibility();
  const { theme } = useTheme();
  
  if (!record.facets || record.facets.length === 0) {
    return <AccessibleText>{record.text}</AccessibleText>;
  }

  const rt = new RichText({ text: record.text, facets: record.facets });
  const segments: React.ReactNode[] = [];

  // Create accessible link styles
  const createAccessibleLinkStyle = (baseStyle: any) => {
    const textScale = getTextScale();
    const fontWeight = getFontWeight();
    
    return {
      ...baseStyle,
      fontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
      fontWeight: fontWeight === 'bold' ? 'bold' : (baseStyle.fontWeight || 'normal'),
    };
  };

  const linkStyle = createAccessibleLinkStyle({
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  });

  for (const segment of rt.segments()) {
    if (segment.isLink()) {
      segments.push(
        <Text
          key={segments.length}
          style={linkStyle}
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
          <Text style={linkStyle}>{segment.text}</Text>
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
          <Text style={linkStyle}>{segment.text}</Text>
        </Link>
      );
    } else {
      segments.push(<AccessibleText key={segments.length}>{segment.text}</AccessibleText>);
    }
  }

  return <>{segments}</>;
};

export default RichTextRenderer;
