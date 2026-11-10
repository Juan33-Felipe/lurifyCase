import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import {
  GlassSurface,
  Symbol,
  SymbolKey,
  Text,
  radii,
  usePalette,
  usePressFeedback,
} from '../apple';
import { useSettings } from '../../context/SettingsContext';
import { TranslationKey } from '../../i18n/translations';

export type Tab = 'cases' | 'caseMap' | 'audit' | 'settings';

interface BottomTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onFabPress: () => void;
}

const LEFT_TABS: { tab: Tab; icon: SymbolKey; labelKey: TranslationKey }[] = [
  { tab: 'cases', icon: 'home', labelKey: 'nav.cases' },
  { tab: 'caseMap', icon: 'doc', labelKey: 'nav.caseMap' },
];

const RIGHT_TABS: { tab: Tab; icon: SymbolKey; labelKey: TranslationKey }[] = [
  { tab: 'audit', icon: 'bell', labelKey: 'nav.audit' },
  { tab: 'settings', icon: 'settings', labelKey: 'nav.settings' },
];

/**
 * Barra de navegación inferior flotante con el kit de vidrio estilo Apple (`src/components/apple`):
 * - Superficie de vidrio translúcido (`GlassSurface`) en forma de píldora flotante sobre el contenido.
 * - 4 pestañas con pastilla activa (`palette.glass.thumb`), íconos `Symbol` y tipografía nativa (`Text`).
 * - Botón central flotante (FAB) elevado con anillo de vidrio y respuesta táctil con resorte (`usePressFeedback`).
 */
export function BottomTabBar({ active, onChange, onFabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { t } = useSettings();
  const fabPress = usePressFeedback(0.92);

  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 14);
  const isDark = palette.mode === 'dark';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <GlassSurface
        radius={radii.hero}
        style={styles.dockSurface}
        contentStyle={styles.dockContent}
      >
        {/* Izquierda: Inicio y Expedientes */}
        {LEFT_TABS.map((item) => (
          <TabSlot
            key={item.tab}
            icon={item.icon}
            label={t(item.labelKey)}
            active={active === item.tab}
            onPress={() => onChange(item.tab)}
          />
        ))}

        {/* Centro: Botón de acción flotante '+' con anillo de vidrio estilo Apple */}
        <View style={styles.fabSlot}>
          <Animated.View style={fabPress.container}>
            <Pressable
              onPress={onFabPress}
              {...fabPress.handlers}
              accessibilityRole="button"
              accessibilityLabel={t('nav.newCase')}
              style={[
                styles.fabOuterRing,
                {
                  backgroundColor: isDark ? 'rgba(28, 28, 30, 0.78)' : 'rgba(255, 255, 255, 0.82)',
                  borderColor: palette.glass.border,
                  shadowColor: isDark ? '#000000' : palette.glass.shadow,
                },
              ]}
            >
              <View
                style={[
                  styles.fabInnerCircle,
                  {
                    backgroundColor: palette.label,
                    shadowColor: isDark ? '#000000' : palette.glass.shadow,
                  },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      borderRadius: 24,
                      backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)',
                    },
                    fabPress.highlight,
                  ]}
                />
                <Symbol name="plus" size={21} color={palette.surface} weight="semibold" />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Derecha: Auditoría y Perfil */}
        {RIGHT_TABS.map((item) => (
          <TabSlot
            key={item.tab}
            icon={item.icon}
            label={t(item.labelKey)}
            active={active === item.tab}
            onPress={() => onChange(item.tab)}
          />
        ))}
      </GlassSurface>
    </View>
  );
}

function TabSlot({
  icon,
  label,
  active,
  onPress,
}: {
  icon: SymbolKey;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const press = usePressFeedback(0.93);
  const isDark = palette.mode === 'dark';

  return (
    <Animated.View style={[styles.tabSlot, press.container]}>
      <Pressable
        onPress={onPress}
        {...press.handlers}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        style={[
          styles.tabPill,
          active && [
            styles.tabPillActive,
            {
              backgroundColor: palette.glass.thumb,
              borderColor: palette.glass.border,
              shadowColor: isDark ? '#000000' : palette.glass.shadow,
            },
          ],
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.tabHighlight,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.65)',
            },
            press.highlight,
          ]}
        />
        <Symbol
          name={icon}
          size={19}
          color={active ? palette.label : palette.secondaryLabel}
          weight={active ? 'semibold' : 'regular'}
        />
        <Text
          variant="caption"
          weight={active ? '600' : '500'}
          color={active ? palette.label : palette.secondaryLabel}
          numberOfLines={1}
          style={styles.tabLabel}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  dockSurface: {
    overflow: 'visible',
  },
  dockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 64,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    alignSelf: 'stretch',
    marginHorizontal: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillActive: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabHighlight: {
    borderRadius: 22,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  fabSlot: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabOuterRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
