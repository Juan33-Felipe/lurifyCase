import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import {
  CaseCarouselCard,
  EmptyState,
  ErrorState,
  HeroHeader,
  LoadingState,
  QuickActionTaskCard,
  Reveal,
  Tab,
  labelKeys,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CasesContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts } from '../theme/theme';
import { Case } from '../types/api.types';

type Filter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const CASE_ICONS: React.ComponentProps<typeof Icon>['name'][] = [
  'gavel',
  'account-balance',
  'folder-special',
  'verified-user',
  'description',
];

/**
 * Screen 1 — Dashboard / Dockets Screen (Phase 3.1):
 * - Top: <HeroHeader /> with dark charcoal block, wave SVG overlay, lawyer greeting, avatar,
 *   and overlapping floating search bar to filter dockets.
 * - Middle ("Active Cases"): Horizontal ScrollView of <CaseCarouselCard /> fed by real
 *   `caseService.getCases()` data (`variant="primary"` for selected/lead docket, `variant="secondary"` for others).
 * - Bottom ("Pending Actions"): Vertical list of <QuickActionTaskCard /> derived from real
 *   docket/canvas/audit state with interactive checkboxes and status dot indicators.
 */
export default function DashboardScreen({
  onNavigate,
  onNewCase,
}: {
  onNavigate: (tab: Tab) => void;
  onNewCase: () => void;
}) {
  const palette = useTheme();
  const { t, language } = useSettings();
  const { user } = useAuth();
  const { cases, refreshCases, selectedCase, selectCase, canvas, audit } = useCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  const cycleFilter = () => {
    setFilter((prev) => (prev === 'ALL' ? 'ACTIVE' : prev === 'ACTIVE' ? 'ARCHIVED' : 'ALL'));
  };

  const activeFilterLabel =
    filter === 'ACTIVE'
      ? t('cases.filter.active')
      : filter === 'ARCHIVED'
        ? t('cases.filter.archived')
        : undefined;

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

  // Derive real actionable legal items from the selected case, its canvas elements, and audit alerts
  const actionTasks = useMemo(() => {
    if (!selectedCase) return [];

    const items: {
      id: string;
      title: string;
      subtitle: string;
      statusColor: string;
      defaultChecked?: boolean;
      targetTab: Tab;
    }[] = [];

    const alerts = audit.data?.alerts ?? [];
    const nodes = canvas.data?.canvas.nodes ?? [];

    // 1. Real AI Audit alerts (FR-004) become top-priority actionable tasks
    alerts.forEach((alert) => {
      const color =
        alert.severity === 'HIGH'
          ? palette.danger
          : alert.severity === 'MEDIUM'
            ? palette.warning
            : palette.success;
      items.push({
        id: `alert-${alert.id}`,
        title: `${alert.title} — ${alert.description}`,
        subtitle: `${selectedCase.title} • ${t(labelKeys.severity(alert.severity))}`,
        statusColor: color,
        targetTab: 'audit',
      });
    });

    // 2. Real case elements (Facts, Evidence, Statutes, Precedents)
    nodes.forEach((node) => {
      items.push({
        id: `node-${node.id}`,
        title: `${node.title}: ${node.content}`,
        subtitle: `${selectedCase.title} • ${t(labelKeys.nodeType(node.type))}`,
        statusColor: node.type === 'EVIDENCE' ? palette.success : palette.charcoal,
        defaultChecked: node.userModified,
        targetTab: 'caseMap',
      });
    });

    // 3. Procedural workflow actions based on real state of the selected case
    if (nodes.length === 0) {
      items.push({
        id: `ingest-${selectedCase.id}`,
        title: t('tasks.ingestFacts'),
        subtitle: selectedCase.clientReference
          ? `${selectedCase.title} • ${selectedCase.clientReference}`
          : selectedCase.title,
        statusColor: palette.warning,
        targetTab: 'caseMap',
      });
    } else if (!audit.data) {
      items.push({
        id: `run-audit-${selectedCase.id}`,
        title: t('tasks.auditReady'),
        subtitle: `${selectedCase.title} • ${nodes.length} ${t('common.elements')}`,
        statusColor: palette.warning,
        targetTab: 'audit',
      });
    } else {
      items.push({
        id: `audit-done-${selectedCase.id}`,
        title: t('tasks.auditReviewed'),
        subtitle: selectedCase.title,
        statusColor: palette.success,
        defaultChecked: true,
        targetTab: 'audit',
      });
    }

    return items;
  }, [selectedCase, audit.data, canvas.data, palette, t]);

  const toggleTask = (id: string, defaultChecked?: boolean) => {
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
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={cases.loading && totalCases > 0}
            onRefresh={refreshCases}
            tintColor={palette.text}
          />
        }
      >
        {/* Top Hero Header with Overlapping Search Bar */}
        <HeroHeader
          greeting={greetingText}
          headline={t('hero.headline')}
          userName={user?.fullName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('hero.searchPlaceholder')}
          onFilterPress={cycleFilter}
          activeFilterLabel={activeFilterLabel}
          onAvatarPress={() => onNavigate('settings')}
        />

        <View style={styles.bodyContainer}>
          {cases.loading && totalCases === 0 ? (
            <LoadingState />
          ) : cases.error && totalCases === 0 ? (
            <ErrorState onRetry={refreshCases} />
          ) : totalCases === 0 ? (
            <EmptyState
              icon="folder-open"
              title={t('cases.empty.title')}
              body={t('cases.empty.body')}
              actionLabel={t('nav.newCase')}
              onAction={onNewCase}
            />
          ) : (
            <>
              {/* Middle Section: Horizontal Carousel of Active Cases ("Project" section) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 19,
                      color: palette.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {t('cases.title')}
                  </Text>
                  <Pressable onPress={() => onNavigate('caseMap')} hitSlop={8}>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 12.5,
                        color: palette.textMuted,
                      }}
                    >
                      {t('common.viewAll')}
                    </Text>
                  </Pressable>
                </View>

                {filteredCases.length === 0 ? (
                  <View style={styles.emptyFilterBox}>
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13.5,
                        color: palette.textMuted,
                      }}
                    >
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
                      const icon = CASE_ICONS[idx % CASE_ICONS.length];
                      const summaryText =
                        c.description && c.description.trim().length > 0
                          ? c.description
                          : `${t('cases.updated')} ${formatDate(c.updatedAt)} • ${t('cases.defaultSummary')}`;

                      return (
                        <Reveal key={c.id} index={idx}>
                          <CaseCarouselCard
                            variant={isPrimary ? 'primary' : 'secondary'}
                            title={c.title}
                            summary={summaryText}
                            reference={c.clientReference}
                            icon={icon}
                            isTranslated={c.isTranslated}
                            onPress={() => selectCase(c.id)}
                            onArrowPress={() => handleOpenCaseMap(c)}
                          />
                        </Reveal>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Bottom Section: Vertical List of Pending Legal Actions ("Tasks" section) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 19,
                      color: palette.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {t('tasks.title')}
                  </Text>
                  <Pressable
                    onPress={() => onNavigate('audit')}
                    style={styles.allTasksAction}
                    hitSlop={8}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 12.5,
                        color: palette.textMuted,
                      }}
                    >
                      {t('tasks.allTasks')}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={16} color={palette.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.tasksList}>
                  {actionTasks.map((task, idx) => {
                    const isChecked = completedTaskIds[task.id] ?? task.defaultChecked ?? false;
                    return (
                      <Reveal key={task.id} index={idx}>
                        <QuickActionTaskCard
                          title={task.title}
                          subtitle={task.subtitle}
                          checked={isChecked}
                          statusColor={task.statusColor}
                          onToggle={() => toggleTask(task.id, task.defaultChecked)}
                          onPress={() => onNavigate(task.targetTab)}
                        />
                      </Reveal>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  bodyContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 26,
  },
  sectionBlock: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselScroll: {
    marginHorizontal: -24,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 16,
    paddingVertical: 4,
  },
  emptyFilterBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  allTasksAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tasksList: {
    gap: 12,
  },
});
