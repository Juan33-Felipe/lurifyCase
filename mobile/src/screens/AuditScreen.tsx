import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DateStripSelector,
  EmptyState,
  ErrorState,
  GlassButton,
  LoadingState,
  Reveal,
  Tab,
  TimelineAuditItem,
  labelKeys,
  toDateKey,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CasesContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts } from '../theme/theme';

interface TimelineEntry {
  id: string;
  variant: 'active' | 'inactive';
  title: string;
  timestamp: string;
  description: string;
  recommendation?: string;
  badges?: string[];
  targetTab: Tab;
}

/**
 * Screen 2 — Case Timeline & AI Audit Screen (Phase 3.2):
 * - Top: Date header (e.g., "Oct 19, 2026"), bold "Today" / Docket title, lawyer avatar,
 *   and 7-day horizontal <DateStripSelector /> with active dark charcoal vertical pill.
 * - Body: Vertical timeline combining AI Audit alerts (FR-004) in the prominent dark charcoal
 *   wave card and chronological case elements (Facts, Evidence, Statutes, Precedents) below.
 */
export default function AuditScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const palette = useTheme();
  const { t, language } = useSettings();
  const { user } = useAuth();
  const { selectedCase, canvas, audit, runAudit } = useCases();

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => toDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const formattedDateHeader = useMemo(
    () =>
      selectedDate.toLocaleDateString(language === 'es' ? 'es' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [selectedDate, language]
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(language === 'es' ? 'es' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

  const initials = (user?.fullName || 'LC')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const report = audit.data;
  const outdated = Boolean(report && canvas.data && report.canvasVersion !== canvas.data.version);
  const canvasEmpty = canvas.data ? canvas.data.canvas.nodes.length === 0 : false;

  // Build unified chronological timeline from real AI Audit findings + real Case Map elements
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!selectedCase) return [];
    const items: TimelineEntry[] = [];

    // 1. AI Audit findings (FR-004) — First/critical finding gets the prominent dark charcoal card
    if (report && report.alerts.length > 0) {
      const timeStr = formatTime(report.generatedAt);
      report.alerts.forEach((alert, idx) => {
        const isProminent = idx === 0 || alert.severity === 'HIGH';
        items.push({
          id: `alert-${alert.id}`,
          variant: isProminent ? 'active' : 'inactive',
          title: alert.title,
          timestamp: timeStr,
          description: alert.description,
          recommendation: alert.recommendation
            ? `${t('audit.recommendation')}: ${alert.recommendation}`
            : undefined,
          badges: [
            alert.severity === 'HIGH' ? 'CR' : alert.severity === 'MEDIUM' ? 'WN' : 'NT',
            'AI',
            `V${report.canvasVersion}`,
          ],
          targetTab: 'caseMap',
        });
      });
    } else if (report && report.alerts.length === 0) {
      items.push({
        id: `audit-clean-${report.auditId}`,
        variant: 'active',
        title: t('audit.clean.title'),
        timestamp: formatTime(report.generatedAt),
        description: t('audit.clean.body'),
        badges: ['OK', 'AI', `V${report.canvasVersion}`],
        targetTab: 'caseMap',
      });
    }

    // 2. Chronological Case Elements (Facts, Evidence, Statutes, Precedents)
    const nodes = canvas.data?.canvas.nodes ?? [];
    const canvasTime = canvas.data ? formatTime(canvas.data.updatedAt) : formatTime(selectedCase.updatedAt);

    nodes.forEach((node, idx) => {
      const makeActive = !report && idx === 0;
      const typeBadge =
        node.type === 'FACT'
          ? 'FC'
          : node.type === 'EVIDENCE'
            ? 'EV'
            : node.type === 'LAW'
              ? 'ST'
              : 'PR';
      items.push({
        id: `node-${node.id}`,
        variant: makeActive ? 'active' : 'inactive',
        title: `${t(labelKeys.nodeType(node.type))} • ${node.title}`,
        timestamp: canvasTime,
        description: node.content,
        badges: [typeBadge, node.origin === 'AI_GENERATED' ? 'AI' : ' JD', `V${selectedCase.canvasVersion}`],
        targetTab: 'caseMap',
      });
    });

    // 3. Docket Opening milestone
    items.push({
      id: `docket-created-${selectedCase.id}`,
      variant: items.length === 0 ? 'active' : 'inactive',
      title: selectedCase.title,
      timestamp: formatTime(selectedCase.createdAt),
      description:
        selectedCase.description && selectedCase.description.trim().length > 0
          ? selectedCase.description
          : t('cases.defaultSummary'),
      badges: ['DK', 'JD', `V${selectedCase.canvasVersion}`],
      targetTab: 'caseMap',
    });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase, report, canvas.data, language, t]);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        {/* Screen 2 Top Header: Date subtitle + Bold "Today" title + Circular Lawyer Avatar */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13.5,
                color: palette.textMuted,
                marginBottom: 4,
              }}
            >
              {formattedDateHeader}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.hero,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.5,
                color: palette.text,
              }}
            >
              {t('audit.today')}
            </Text>
          </View>

          <Pressable onPress={() => onNavigate('settings')} style={styles.avatarRing}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: palette.secondaryCard,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 14,
                  color: palette.text,
                }}
              >
                {initials}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Horizontal 7-Day Date Strip Selector */}
        <View style={styles.dateStripContainer}>
          <DateStripSelector
            selectedDateKey={selectedDateKey}
            onSelectDate={(key, date) => {
              setSelectedDateKey(key);
              setSelectedDate(date);
            }}
          />
        </View>

        {/* Active Docket Action Bar & Audit Trigger */}
        <View style={styles.bodyContainer}>
          {!selectedCase ? (
            <EmptyState
              icon="gavel"
              title={t('audit.noCase.title')}
              body={t('audit.noCase.body')}
              actionLabel={t('nav.cases')}
              onAction={() => onNavigate('cases')}
            />
          ) : canvas.loading && !canvas.data ? (
            <LoadingState />
          ) : canvas.error ? (
            <ErrorState />
          ) : (
            <>
              {/* Compact Docket Bar + Run AI Audit CTA */}
              <View
                style={[
                  styles.auditToolbar,
                  {
                    backgroundColor: palette.secondaryCard,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 14.5,
                      color: palette.text,
                    }}
                  >
                    {selectedCase.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: palette.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {canvasEmpty
                      ? t('audit.emptyCanvas')
                      : outdated
                        ? t('audit.outdated')
                        : `${canvas.data?.canvas.nodes.length ?? 0} ${t('common.elements')} • ${t('common.version')} ${selectedCase.canvasVersion}`}
                  </Text>
                </View>

                <GlassButton
                  label={audit.loading ? t('audit.running') : t('audit.run')}
                  icon="auto-awesome"
                  onPress={runAudit}
                  loading={audit.loading}
                  disabled={!canvas.data || canvasEmpty}
                />
              </View>

              {audit.error ? <ErrorState onRetry={runAudit} /> : null}

              {/* Vertical Timeline Combining AI Audit Alerts + Chronological Case Elements */}
              <View style={styles.timelineWrapper}>
                {timelineEntries.map((item, idx) => (
                  <Reveal key={item.id} index={idx}>
                    <TimelineAuditItem
                      variant={item.variant}
                      title={item.title}
                      timestamp={item.timestamp}
                      description={item.description}
                      recommendation={item.recommendation}
                      badges={item.badges}
                      isLast={idx === timelineEntries.length - 1}
                      onActionPress={() =>
                        canvasEmpty ? onNavigate('caseMap') : !report ? runAudit() : onNavigate(item.targetTab)
                      }
                    />
                  </Reveal>
                ))}
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
  topHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRing: {
    padding: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStripContainer: {
    paddingHorizontal: 18,
    marginTop: 14,
  },
  bodyContainer: {
    paddingHorizontal: 24,
    marginTop: 18,
    gap: 20,
  },
  auditToolbar: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineWrapper: {
    marginTop: 4,
  },
});
