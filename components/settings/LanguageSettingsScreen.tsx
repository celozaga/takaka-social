import React from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../../lib/i18n';
import { Check } from 'lucide-react';
import Head from 'expo-router/head';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@/components/shared';
import { SettingsDivider } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const LanguageSettingsScreen: React.FC = () => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <>
            <Head><title>{t('languageSettings.title')}</title></Head>
            <SettingsScreenLayout
                title={t('languageSettings.title')}
                description={t('languageSettings.description')}
            >
                <SettingsSection>
                    {supportedLanguages.map((lang, index) => (
                        <React.Fragment key={lang.code}>
                            <Pressable
                                onPress={() => changeLanguage(lang.code)}
                                style={({ pressed }) => [theme.settingsStyles.item, pressed && theme.settingsStyles.pressed]}
                            >
                                <Text style={theme.settingsStyles.label}>{lang.name}</Text>
                                {i18n.language.startsWith(lang.code) && <Check color={theme.colors.onSurface} size={20} />}
                            </Pressable>
                            {index < supportedLanguages.length - 1 && <SettingsDivider />}
                        </React.Fragment>
                    ))}
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default LanguageSettingsScreen;