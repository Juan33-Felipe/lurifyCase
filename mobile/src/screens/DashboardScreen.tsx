import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  AmbientBackground,
  GlassButton,
  GlassIconButton,
  GlassSurface,
  GroupedSection,
  HeroCard,
  SegmentedControl,
  Symbol,
  SymbolKey,
  Text,
  radii,
  usePalette,
  usePressFeedback,
} from '../components/apple';
import { Tab, formatShortDate, formatYMD, labelKeys } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CasesContext';
import { useSettings } from '../context/SettingsContext';
import { Case } from '../types/api.types';

type Filter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const CASE_SYMBOLS: SymbolKey[] = ['gavel', 'brand', 'doc', 'shield', 'folder'];

const APPLE_WARNING = '#FF9500';
const APPLE_SUCCESS = '#34C759';

interface AppleCaseCardProps {
  item: Case;
  selected: boolean;
  iconName: SymbolKey;
  onPress: () => void;
  onOpenMap: () => void;
  formatDate: (iso: string) => string;
  defaultSummaryLabel: string;
  updatedLabel: string;
}

/**
 * Tarjeta de caso con el kit estilo Apple (tarjeta redondeada, limpia y táctil).
 */
function AppleCaseCard({
  item,
  selected,
  iconName,
  onPress,
  onOpenMap,
  formatDate,
  defaultSummaryLabel,
  updatedLabel,
}: AppleCaseCardProps) {
  const palette = usePalette();
  const press = usePressFeedback(0.97);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.58, 210), 255);

  const summaryText =
    item.description && item.description.trim().length > 0
      ? item.description
      : `${updatedLabel} ${formatDate(item.updatedAt)} • ${defaultSummaryLabel}`;

  return (
    <Animated.View style={[press.container, { width: cardWidth }]}>
      <Pressable
        onPress={onPress}
        {...press.handlers}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={[
          styles.caseCard,
          {
            backgroundColor: palette.surface,
            borderColor: selected
              ? palette.mode === 'dark'
                ? 'rgba(255,255,255,0.28)'
                : 'rgba(28,28,30,0.18)'
              : palette.separator,
            shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
            shadowOpacity: selected ? 0.14 : 0.06,
          },
        ]}
      >
        {/* Fila superior: Ícono circular de vidrio + radicado / traducción */}
        <View style={styles.caseTopRow}>
          <View style={[styles.caseIconCircle, { backgroundColor: palette.groupedBackground }]}>
            <Symbol name={iconName} size={18} color={palette.label} />
          </View>
          <View style={styles.caseMetaRight}>
            {item.isTranslated && (
              <Symbol name="translate" size={13} color={palette.secondaryLabel} />
            )}
            {item.clientReference ? (
              <View style={[styles.referencePill, { backgroundColor: palette.groupedBackground }]}>
                <Text variant="caption" weight="500" color={palette.secondaryLabel} numberOfLines={1}>
                  {item.clientReference}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bloque central: Título en negrita y resumen limpio */}
        <View style={styles.caseTextBlock}>
          <Text variant="headline" numberOfLines={2} style={styles.caseTitle}>
            {item.title}
          </Text>
          <Text variant="footnote" color={palette.secondaryLabel} numberOfLines={3} style={styles.caseSummary}>
            {summaryText}
          </Text>
        </View>

        {/* Fila inferior: Fecha de actualización + botón flecha hacia el mapa */}
        <View style={styles.caseBottomRow}>
          <Text variant="caption" color={palette.secondaryLabel}>
            {formatDate(item.updatedAt)}
          </Text>
          <Pressable
            onPress={onOpenMap}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir mapa"
            style={[styles.caseArrowCircle, { backgroundColor: palette.groupedBackground }]}
          >
            <Symbol name="arrowRight" size={12} color={palette.label} weight="semibold" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Pantalla principal (Home / Casos) rediseñada con el kit estilo Apple de Iurify Case.
 * Sigue la dirección visual de la pantalla de inicio de sesión:
 * - Tarjeta héroe superior con degradado lavanda/gris, titular bold y controles de vidrio.
 * - Fondo agrupado de iOS (AmbientBackground) con manchas de color difuminadas.
 * - Barra de búsqueda de vidrio y selector segmentado animado.
 * - Carrusel de casos con tarjetas Apple de superficies limpias y tipografía nativa.
 * - Lista de acciones pendientes agrupada en tarjeta estilo iOS con filas y separadores.
 */
export default function DashboardScreen({
  onNavigate,
  onNewCase,
}: {
  onNavigate: (tab: Tab) => void;
  onNewCase: () => void;
}) {
  const palette = usePalette();
  const { t, language } = useSettings();
  const { user } = useAuth();
  const { cases, refreshCases, selectedCase, selectCase, canvas, audit, deadlines, toggleDeadline } =
    useCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  const filteredCases = useMemo(() => {
    const list = cases.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((c) => {
      const matchesStatus = filter === 'ALL' || c.status === filter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.originalTitle?.toLowerCase().includes(q) ?? false) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        (c.originalDescription?.toLowerCase().includes(q) ?? false) ||
        (c.clientReference?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cases.data, filter, searchQuery]);

  // Derivar acciones legales accionables a partir del caso seleccionado, canvas y auditoría
  const actionTasks = useMemo(() => {
    if (!selectedCase) return [];

    const items: {
      id: string;
      title: string;
      subtitle: string;
      statusColor: string;
      defaultChecked?: boolean;
      targetTab: Tab;
      deadlineId?: string;
    }[] = [];

    // 0. Plazos y Tiempos de Entrega procesales (máxima prioridad)
    const todayStr = formatYMD(new Date());
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    deadlines.forEach((dl) => {
      const isOverdue = dl.to < todayStr;
      const isDueToday = dl.to === todayStr;
      const statusColor = dl.completed
        ? APPLE_SUCCESS
        : isOverdue
          ? palette.danger
          : isDueToday || dl.priority === 'HIGH'
            ? APPLE_WARNING
            : palette.label;

      items.push({
        id: `deadline-${dl.id}`,
        title: dl.title,
        subtitle: `${selectedCase.title} • ${formatShortDate(dl.from, locale)} → ${formatShortDate(dl.to, locale)} (${t('audit.deadline.sectionTitle')})`,
        statusColor,
        defaultChecked: dl.completed,
        targetTab: 'audit',
        deadlineId: dl.id,
      });
    });

    const alerts = audit.data?.alerts ?? [];
    const nodes = Array.isArray(canvas.data?.canvas?.nodes) ? canvas.data.canvas.nodes : [];

    // 1. Alertas de auditoría IA
    alerts.forEach((alert) => {
      const color =
        alert.severity === 'HIGH'
          ? palette.danger
          : alert.severity === 'MEDIUM'
            ? APPLE_WARNING
            : APPLE_SUCCESS;
      items.push({
        id: `alert-${alert.id}`,
        title: `${alert.title} — ${alert.description}`,
        subtitle: `${selectedCase.title} • ${t(labelKeys.severity(alert.severity))}`,
        statusColor: color,
        targetTab: 'audit',
      });
    });

    // 2. Elementos del caso (Hechos, Pruebas, Leyes, Precedentes)
    nodes.forEach((node) => {
      items.push({
        id: `node-${node.id}`,
        title: `${node.title}: ${node.content}`,
        subtitle: `${selectedCase.title} • ${t(labelKeys.nodeType(node.type))}`,
        statusColor: node.type === 'EVIDENCE' ? APPLE_SUCCESS : palette.label,
        defaultChecked: node.userModified,
        targetTab: 'caseMap',
      });
    });

    // 3. Flujo procedimental
    if (nodes.length === 0) {
      items.push({
        id: `ingest-${selectedCase.id}`,
        title: t('tasks.ingestFacts'),
        subtitle: selectedCase.clientReference
          ? `${selectedCase.title} • ${selectedCase.clientReference}`
          : selectedCase.title,
        statusColor: APPLE_WARNING,
        targetTab: 'caseMap',
      });
    } else if (!audit.data) {
      items.push({
        id: `run-audit-${selectedCase.id}`,
        title: t('tasks.auditReady'),
        subtitle: `${selectedCase.title} • ${nodes.length} ${t('common.elements')}`,
        statusColor: APPLE_WARNING,
        targetTab: 'audit',
      });
    } else {
      items.push({
        id: `audit-done-${selectedCase.id}`,
        title: t('tasks.auditReviewed'),
        subtitle: selectedCase.title,
        statusColor: APPLE_SUCCESS,
        defaultChecked: true,
        targetTab: 'audit',
      });
    }

    return items;
  }, [selectedCase, deadlines, language, audit.data, canvas.data, palette, t]);

  const toggleTask = (id: string, defaultChecked?: boolean, deadlineId?: string) => {
    if (deadlineId) {
      toggleDeadline(deadlineId);
    }
    setCompletedTaskIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? defaultChecked ?? false),
    }));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'es' ? 'es' : 'en', {
      day: 'numeric',
      month: 'short',
    });

  const totalCases = cases.data?.length ?? 0;
  const greetingText = user?.fullName
    ? `${t('hero.greeting').split(',')[0]}, ${user.fullName.split(' ')[0]}`
    : t('hero.greeting');

  const handleOpenCaseMap = (c: Case) => {
    selectCase(c.id);
    onNavigate('caseMap');
  };

  return (
    <AmbientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={cases.loading && totalCases > 0}
            onRefresh={refreshCases}
            tintColor={palette.label}
          />
        }
      >
        {/* Tarjeta Héroe superior estilo Apple */}
        <HeroCard>
          <View style={styles.brandRow}>
            <Text variant="headline">
              Iurify <Text variant="headline" weight="500" color={palette.secondaryLabel}>Case</Text>
            </Text>
            <GlassIconButton
              icon="person"
              size={36}
              accessibilityLabel="Ajustes y perfil"
              onPress={() => onNavigate('settings')}
            />
          </View>

          <Animated.View entering={FadeIn.duration(260)} style={styles.heroText}>
            <Text variant="subheadline" weight="500" color={palette.secondaryLabel}>
              {greetingText}
            </Text>
            <Text variant="display" style={styles.headline} accessibilityRole="header">
              {t('hero.headline')}
            </Text>
          </Animated.View>

          {/* Barra de búsqueda con vidrio claro */}
          <View style={styles.searchContainer}>
            <GlassSurface radius={radii.pill} contentStyle={styles.searchBar}>
              <Symbol name="search" size={17} color={palette.secondaryLabel} />
              <TextInput
                placeholder={t('hero.searchPlaceholder')}
                placeholderTextColor={palette.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: palette.label }]}
                selectionColor={palette.label}
                keyboardAppearance={palette.mode}
                returnKeyType="search"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Borrar texto"
                  style={styles.clearBtn}
                >
                  <Symbol name="clear" size={16} color={palette.secondaryLabel} />
                </Pressable>
              )}
            </GlassSurface>
          </View>

          {/* Selector segmentado de filtros de vidrio */}
          <View style={styles.filterContainer}>
            <SegmentedControl
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: 'ALL', label: t('cases.filter.all') },
                { value: 'ACTIVE', label: t('cases.filter.active') },
                { value: 'ARCHIVED', label: t('cases.filter.archived') },
              ]}
            />
          </View>
        </HeroCard>

        {/* Contenido principal en el fondo agrupado de iOS */}
        <Animated.View entering={FadeInDown.duration(380).delay(60)} style={styles.contentBody}>
          {cases.loading && totalCases === 0 ? (
            <View style={[styles.stateCard, { backgroundColor: palette.surface }]}>
              <ActivityIndicator size="small" color={palette.label} />
              <Text variant="subheadline" color={palette.secondaryLabel} style={{ marginTop: 10 }}>
                {t('common.loading')}
              </Text>
            </View>
          ) : cases.error && totalCases === 0 ? (
            <View style={[styles.stateCard, { backgroundColor: palette.surface }]}>
              <Symbol name="error" size={32} color={palette.danger} />
              <Text variant="headline" style={{ marginTop: 10 }}>
                {t('common.error')}
              </Text>
              <GlassButton
                label={t('common.retry')}
                onPress={refreshCases}
                style={{ marginTop: 16, width: '100%' }}
              />
            </View>
          ) : totalCases === 0 ? (
            <View style={[styles.stateCard, { backgroundColor: palette.surface }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: palette.groupedBackground }]}>
                <Symbol name="folderOpen" size={32} color={palette.secondaryLabel} />
              </View>
              <Text variant="headline" style={styles.emptyTitle}>
                {t('cases.empty.title')}
              </Text>
              <Text variant="subheadline" color={palette.secondaryLabel} style={styles.emptySubtitle}>
                {t('cases.empty.body')}
              </Text>
              <GlassButton
                label={t('nav.newCase')}
                icon="plus"
                onPress={onNewCase}
                style={{ marginTop: 18, width: '100%' }}
              />
            </View>
          ) : (
            <>
              {/* Sección 1: Carrusel de Casos Activos */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text variant="title2" weight="700">
                    {t('cases.title')}
                  </Text>
                  <Pressable
                    onPress={() => onNavigate('caseMap')}
                    hitSlop={8}
                    style={styles.headerAction}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.viewAll')}
                  >
                    <Text variant="subheadline" weight="500" color={palette.secondaryLabel}>
                      {t('common.viewAll')}
                    </Text>
                    <Symbol name="chevronRight" size={13} color={palette.secondaryLabel} />
                  </Pressable>
                </View>

                {filteredCases.length === 0 ? (
                  <View style={[styles.emptyFilterCard, { backgroundColor: palette.surface }]}>
                    <Symbol name="search" size={24} color={palette.secondaryLabel} />
                    <Text variant="subheadline" color={palette.secondaryLabel} style={{ textAlign: 'center' }}>
                      {t('cases.noFilterResults')}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.carouselScroll}
                    contentContainerStyle={styles.carouselContent}
                  >
                    {filteredCases.map((c, idx) => {
                      const isPrimary = selectedCase ? c.id === selectedCase.id : idx === 0;
                      const iconName = CASE_SYMBOLS[idx % CASE_SYMBOLS.length];
                      return (
                        <AppleCaseCard
                          key={c.id}
                          item={c}
                          selected={isPrimary}
                          iconName={iconName}
                          onPress={() => selectCase(c.id)}
                          onOpenMap={() => handleOpenCaseMap(c)}
                          formatDate={formatDate}
                          defaultSummaryLabel={t('cases.defaultSummary')}
                          updatedLabel={t('cases.updated')}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Sección 2: Acciones Pendientes en tarjeta agrupada estilo iOS */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text variant="title2" weight="700">
                    {t('tasks.title')}
                  </Text>
                  <Pressable
                    onPress={() => onNavigate('audit')}
                    hitSlop={8}
                    style={styles.headerAction}
                    accessibilityRole="button"
                    accessibilityLabel={t('tasks.allTasks')}
                  >
                    <Text variant="subheadline" weight="500" color={palette.secondaryLabel}>
                      {t('tasks.allTasks')}
                    </Text>
                    <Symbol name="chevronRight" size={13} color={palette.secondaryLabel} />
                  </Pressable>
                </View>

                {actionTasks.length === 0 ? (
                  <View style={[styles.emptyFilterCard, { backgroundColor: palette.surface }]}>
                    <Symbol name="checkmark" size={24} color={APPLE_SUCCESS} />
                    <Text variant="subheadline" color={palette.secondaryLabel} style={{ textAlign: 'center' }}>
                      {t('tasks.empty')}
                    </Text>
                  </View>
                ) : (
                  <GroupedSection>
                    {actionTasks.map((task) => {
                      const isChecked = completedTaskIds[task.id] ?? task.defaultChecked ?? false;
                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => onNavigate(task.targetTab)}
                          style={styles.taskRow}
                          accessibilityRole="button"
                          accessibilityLabel={task.title}
                        >
                          {/* Casilla circular estilo Recordatorios de iOS */}
                          <Pressable
                            onPress={() => toggleTask(task.id, task.defaultChecked, task.deadlineId)}
                            hitSlop={12}
                            style={[
                              styles.taskCheckbox,
                              isChecked
                                ? { backgroundColor: palette.label, borderColor: palette.label }
                                : { backgroundColor: 'transparent', borderColor: task.statusColor },
                            ]}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isChecked }}
                          >
                            {isChecked ? (
                              <Symbol name="checkmark" size={11} color={palette.surface} weight="bold" />
                            ) : null}
                          </Pressable>

                          {/* Textos de la tarea */}
                          <View style={styles.taskTextColumn}>
                            <Text
                              variant="subheadline"
                              weight={isChecked ? '400' : '600'}
                              color={isChecked ? palette.secondaryLabel : palette.label}
                              numberOfLines={2}
                              style={isChecked ? styles.taskCheckedText : undefined}
                            >
                              {task.title}
                            </Text>
                            <Text
                              variant="caption"
                              color={palette.secondaryLabel}
                              numberOfLines={1}
                              style={styles.taskSubtitle}
                            >
                              {task.subtitle}
                            </Text>
                          </View>

                          <Symbol name="chevronRight" size={13} color={palette.secondaryLabel} />
                        </Pressable>
                      );
                    })}
                  </GroupedSection>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 125,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    marginTop: 22,
    gap: 4,
  },
  headline: {
    marginTop: 2,
  },
  searchContainer: {
    marginTop: 20,
  },
  searchBar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 14,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 26,
  },
  sectionBlock: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  carouselScroll: {
    marginHorizontal: -16,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingVertical: 4,
  },
  caseCard: {
    borderRadius: radii.group,
    padding: 16,
    height: 205,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  caseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  referencePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    maxWidth: 100,
  },
  caseTextBlock: {
    gap: 6,
    marginVertical: 4,
  },
  caseTitle: {
    lineHeight: 21,
  },
  caseSummary: {
    lineHeight: 17,
  },
  caseBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 56,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextColumn: {
    flex: 1,
    gap: 3,
  },
  taskSubtitle: {
    marginTop: 1,
  },
  taskCheckedText: {
    textDecorationLine: 'line-through',
  },
  stateCard: {
    borderRadius: radii.group,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  emptyFilterCard: {
    borderRadius: radii.group,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
