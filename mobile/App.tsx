import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFonts } from 'expo-font';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';

import './global.css';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { AuthProvider } from './src/context/AuthContext';
import { CasesProvider } from './src/context/CasesContext';
import { GlassBackground } from './src/components/Glass';
import { BottomTabBar, Tab } from './src/components/ui';
import { NewCaseSheet } from './src/components/NewCaseSheet';
import DashboardScreen from './src/screens/DashboardScreen';
import AuditScreen from './src/screens/AuditScreen';
import CaseMapScreen from './src/screens/CaseMapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function Shell() {
  const { theme } = useSettings();
  const [tab, setTab] = useState<Tab>('cases');
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  // Top of DashboardScreen has a dark charcoal hero header, so status bar icons are light on 'cases'
  const statusBarStyle = tab === 'cases' ? 'light' : theme === 'dark' ? 'light' : 'dark';

  return (
    <GlassBackground>
      <StatusBar style={statusBarStyle} />
      <CasesProvider>
        <Animated.View key={tab} style={{ flex: 1 }} entering={FadeIn.duration(100)}>
          {tab === 'cases' && (
            <DashboardScreen onNavigate={setTab} onNewCase={() => setNewCaseOpen(true)} />
          )}
          {tab === 'audit' && <AuditScreen onNavigate={setTab} />}
          {tab === 'caseMap' && <CaseMapScreen onNavigate={setTab} />}
          {tab === 'settings' && <SettingsScreen />}
        </Animated.View>
        <BottomTabBar
          active={tab}
          onChange={setTab}
          onFabPress={() => setNewCaseOpen(true)}
        />
        <NewCaseSheet
          visible={newCaseOpen}
          onClose={() => setNewCaseOpen(false)}
          onCreated={() => setTab('cases')}
        />
      </CasesProvider>
    </GlassBackground>
  );
}

function Root() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const { hydrated } = useSettings();

  if (!fontsLoaded || !hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FB',
        }}
      >
        <ActivityIndicator size="large" color="#1E1E20" />
      </View>
    );
  }
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
