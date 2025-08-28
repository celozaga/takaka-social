import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';
import ScreenHeader from '../layout/ScreenHeader';

interface SettingsSection {
  title?: string;
  children: React.ReactNode;
}

interface SettingsScreenLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showHeader?: boolean;
}

const SettingsScreenLayout: React.FC<SettingsScreenLayoutProps> = ({
  title,
  description,
  children,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={{ flex: 1 }}>
      {showHeader && <ScreenHeader title={title} />}
      <ScrollView contentContainerStyle={styles.container}>
        {description && (
          <Text style={styles.description}>
            {description}
          </Text>
        )}
        {children}
      </ScrollView>
    </View>
  );
};

export const SettingsSection: React.FC<SettingsSection> = ({ title, children }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      {title && (
        <Text style={styles.sectionHeader}>
          {title}
        </Text>
      )}
      <View style={styles.section}>
        {children}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    ...theme.typography.bodyMedium,
    marginBottom: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
});

export default SettingsScreenLayout;
