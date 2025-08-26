
import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BackButton, TopAppBar, useTheme } from '@/components/shared';

interface ScreenHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, children }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const styles = createStyles(theme);

    const leadingAction = (
        <BackButton 
            size="medium"
            style={styles.button}
        />
    );

    return (
        <TopAppBar title={title} leading={leadingAction} actions={children} />
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    button: {
        marginLeft: -theme.spacing.sm, // To align with edge
    },
});

export default ScreenHeader;