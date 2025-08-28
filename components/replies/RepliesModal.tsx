import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { X } from 'lucide-react';
// Remove import do tema legado
import RepliesList from './RepliesList';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTheme } from '@/components/shared/Theme/ThemeProvider';

interface RepliesModalProps {
  data: {
    post: AppBskyFeedDefs.PostView;
    thread: AppBskyFeedDefs.ThreadViewPost;
  };
  onClose: () => void;
}

 const RepliesModal: React.FC<RepliesModalProps> = ({ data, onClose }) => {
   const { post, thread } = data;
   const { t } = useTranslation();
   const { requireAuth } = useAuthGuard();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  // Verificar autenticação ao montar o componente
  React.useEffect(() => {
    if (!requireAuth('replies')) {
      onClose();
    }
  }, [requireAuth, onClose]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>{t('common.replies', { count: post.replyCount || 0 })}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X color={theme.colors.onSurface} />
        </Pressable>
      </View>
      
      <RepliesList 
        post={post} 
        thread={thread} 
        showActionBar={true}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
     container: {
         flex: 1,
         backgroundColor: theme.colors.surfaceContainer,
     },
     header: {
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'center',
         padding: theme.spacing.l,
         borderBottomWidth: 1,
         borderBottomColor: theme.colors.outline,
         position: 'relative',
     },
     dragHandle: {
         position: 'absolute',
         top: theme.spacing.s,
         alignSelf: 'center',
         width: 40,
         height: 4,
         borderRadius: 2,
         backgroundColor: theme.colors.outline,
     },
     headerTitle: {
         flex: 1,
         alignItems: 'center',
         justifyContent: 'center',
     },
     headerTitleText: {
         ...theme.typography.titleMedium,
         color: theme.colors.onSurface,
         textAlign: 'center',
         paddingTop: theme.spacing.s,
     },
     closeButton: {
         position: 'absolute',
         right: theme.spacing.l,
         top: '50%',
         marginTop: 4,
     },
     listContentContainer: {
         padding: theme.spacing.l,
     },
     separator: {
         height: 1,
         backgroundColor: theme.colors.outline,
         marginVertical: theme.spacing.s,
     },
     messageContainer: {
         padding: theme.spacing.xxl,
         alignItems: 'center',
     },
     infoText: {
         ...theme.typography.bodyLarge,
         color: theme.colors.onSurfaceVariant,
     },
 });

 export default RepliesModal;
