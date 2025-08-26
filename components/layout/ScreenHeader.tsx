
import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import TopAppBar from '../ui/TopAppBar';
import { BackButton } from '@/components/shared';
import { theme } from '@/lib/theme';

interface ScreenHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, children }) => {
    const { t } = useTranslation();

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

const styles = StyleSheet.create({
    button: {
        marginLeft: -theme.spacing.s, // To align with edge
    },
});

export default ScreenHeader;