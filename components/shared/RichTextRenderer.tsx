import React from 'react';
import { Link } from 'expo-router';
import { RichText } from '@atproto/api';

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
        <a
          key={segments.length}
          href={segment.link!.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {segment.text}
        </a>
      );
    } else if (segment.isMention()) {
      segments.push(
        <Link
          key={segments.length}
          href={`/profile/${segment.mention!.did}` as any}
          className="text-primary hover:underline"
          onPress={(e) => e.stopPropagation()}
        >
          {segment.text}
        </Link>
      );
    } else if (segment.isTag()) {
      segments.push(
        <Link
          key={segments.length}
          href={`/(tabs)/search?q=${encodeURIComponent(segment.tag!.tag)}&filter=top` as any}
          className="text-primary hover:underline"
          onPress={(e) => e.stopPropagation()}
        >
          {segment.text}
        </Link>
      );
    } else {
      segments.push(<span key={segments.length}>{segment.text}</span>);
    }
  }

  return <>{segments}</>;
};

export default RichTextRenderer;
