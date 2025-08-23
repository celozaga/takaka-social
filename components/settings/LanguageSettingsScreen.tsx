import React from 'react';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '../layout/ScreenHeader';
import { supportedLanguages } from '../../lib/i18n';
import { Check } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme, settingsStyles } from '@/lib/theme';

const LanguageSettingsScreen: React.FC = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <>
            <Head><title>{t('languageSettings.title')}</title></Head>
            <View style={{flex: 1}}>
                <ScreenHeader title={t('languageSettings.title')} />
                <ScrollView contentContainerStyle={settingsStyles.scrollContainer}>
                    <Text style={settingsStyles.description}>{t('languageSettings.description')}</Text>
                    <View style={settingsStyles.section}>
                        {supportedLanguages.map((lang, index) => (
                            <React.Fragment key={lang.code}>
                                <Pressable
                                    onPress={() => changeLanguage(lang.code)}
                                    style={({ pressed }) => [settingsStyles.item, pressed && settingsStyles.pressed]}
                                >
                                    <Text style={settingsStyles.label}>{lang.name}</Text>
                                    {i18n.language.startsWith(lang.code) && <Check color={theme.colors.onSurface} size={20} />}
                                </Pressable>
                                {index < supportedLanguages.length - 1 && <View style={settingsStyles.divider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

export default LanguageSettingsScreen;