import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { theme } from '@/lib/theme';
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
  return (
    <View style={{ flex: 1 }}>
      {showHeader && <ScreenHeader title={title} />}
      <ScrollView contentContainerStyle={theme.settingsStyles.container}>
        {description && (
          <Text style={theme.settingsStyles.description}>
            {description}
          </Text>
        )}
        {children}
      </ScrollView>
    </View>
  );
};

export const SettingsSection: React.FC<SettingsSection> = ({ title, children }) => {
  return (
    <View>
      {title && (
        <Text style={theme.settingsStyles.sectionHeader}>
          {title}
        </Text>
      )}
      <View style={theme.settingsStyles.section}>
        {children}
      </View>
    </View>
  );
};

export default SettingsScreenLayout;
