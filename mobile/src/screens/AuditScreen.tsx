import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
  Text,
  TextFieldRow,
  radii,
  usePalette,
  usePressFeedback,
} from '../components/apple';
import {
  DateRange,
  DateRangePreset,
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerClear,
  DateRangePickerContent,
  DateRangePickerFooter,
  DateRangePickerGrid,
  DateRangePickerHeader,
  DateRangePickerPresets,
  DateRangePickerSelection,
  DateRangePickerTrigger,
  Tab,
  addDaysYMD,
  diffDaysYMD,
  formatReadableDate,
  formatShortDate,
  formatYMD,
  labelKeys,
  toDateKey,
  ymdToLocalDate,
} from '../components/ui';
import { useCases } from '../context/CasesContext';
import { useSettings } from '../context/SettingsContext';
import { CaseDeadline, DeadlinePriority } from '../types/api.types';

interface TimelineEntry {
  id: string;
  variant: 'active' | 'inactive';
  title: string;
  timestamp: string;
  description: string;
  recommendation?: string;
  badges?: string[];
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  targetTab?: Tab;
  onPress?: () => void;
}

const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ES_WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Selector de 7 días estilo píldora de Apple.
 */
function AppleDateStrip({
  selectedDateKey,
  anchorDate,
  onSelectDate,
  language,
}: {
  selectedDateKey: string;
  anchorDate?: Date;
  onSelectDate: (key: string, date: Date) => void;
  language: string;
}) {
  const palette = usePalette();
  const days = useMemo(() => {
    const base = anchorDate ? new Date(anchorDate) : new Date();
    const labels = language === 'es' ? ES_WEEKDAYS : EN_WEEKDAYS;
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3;
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      return {
        key: toDateKey(d),
        date: d,
        dayNumber: String(d.getDate()).padStart(2, '0'),
        weekday: labels[d.getDay()],
      };
    });
  }, [anchorDate, language]);

  return (
    <View style={styles.dateStripRow}>
      {days.map((item) => {
        const isSelected = item.key === selectedDateKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelectDate(item.key, item.date)}
            style={[
              styles.datePill,
              isSelected
                ? [styles.datePillActive, { backgroundColor: palette.label }]
                : [
                    styles.datePillInactive,
                    {
                      backgroundColor:
                        palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.5)',
                    },
                  ],
            ]}
          >
            <Text
              variant="caption"
              weight="500"
              color={isSelected ? palette.surface : palette.secondaryLabel}
            >
              {item.weekday}
            </Text>
            <Text
              variant="subheadline"
              weight={isSelected ? '700' : '600'}
              color={isSelected ? palette.surface : palette.label}
              style={{ marginTop: 2 }}
            >
              {item.dayNumber}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Elemento de la línea de tiempo estilo Apple con eje vertical y tarjeta de vidrio/superficie.
 */
function AppleTimelineRow({
  item,
  isLast,
  onPress,
}: {
  item: TimelineEntry;
  isLast: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const press = usePressFeedback(0.98);
  const isHigh = item.severity === 'HIGH';

  return (
    <View style={styles.timelineRow}>
      {/* Eje vertical de la línea de tiempo */}
      <View style={styles.timelineAxis}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: isHigh
                ? palette.danger
                : item.variant === 'active'
                  ? palette.label
                  : palette.secondaryLabel,
              borderColor: palette.surface,
            },
          ]}
        />
        {!isLast && (
          <View style={[styles.timelineConnector, { backgroundColor: palette.separator }]} />
        )}
      </View>

      {/* Tarjeta del evento */}
      <Animated.View style={[press.container, { flex: 1 }]}>
        <Pressable
          onPress={onPress}
          {...press.handlers}
          style={[
            styles.timelineCard,
            {
              backgroundColor: palette.surface,
              borderColor: isHigh
                ? palette.danger
                : item.variant === 'active'
                  ? palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(28,28,30,0.14)'
                  : palette.separator,
              shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
              shadowOpacity: item.variant === 'active' ? 0.08 : 0.03,
            },
          ]}
        >
          {/* Fila superior: Título y fecha */}
          <View style={styles.timelineHeader}>
            <Text variant="headline" numberOfLines={2} style={{ flex: 1 }}>
              {item.title}
            </Text>
            {item.timestamp ? (
              <Text variant="caption" color={palette.secondaryLabel} style={{ marginLeft: 8 }}>
                {item.timestamp}
              </Text>
            ) : null}
          </View>

          {/* Descripción */}
          <Text variant="subheadline" color={palette.secondaryLabel} style={styles.timelineDesc}>
            {item.description}
          </Text>

          {/* Recomendación si existe */}
          {item.recommendation ? (
            <View
              style={[
                styles.recommendationBox,
                {
                  backgroundColor:
                    palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: palette.separator,
                },
              ]}
            >
              <Symbol name="sparkles" size={14} color={palette.label} />
              <Text variant="footnote" color={palette.label} style={{ flex: 1 }}>
                {item.recommendation}
              </Text>
            </View>
          ) : null}

          {/* Fila inferior: Badges e indicador flecha */}
          <View style={styles.timelineFooter}>
            <View style={styles.badgeRow}>
              {item.badges?.map((badge, i) => (
                <View
                  key={i}
                  style={[styles.badgePill, { backgroundColor: palette.groupedBackground }]}
                >
                  <Text variant="caption" weight="600" color={palette.secondaryLabel}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: palette.groupedBackground }]}>
              <Symbol name="chevronRight" size={12} color={palette.label} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/**
 * Pantalla de Auditoría Procesal IA y Plazos de Entrega (Screen 2).
 */
export default function AuditScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const palette = usePalette();
  const isDark = palette.mode === 'dark';
  const { t, language } = useSettings();
  const {
    selectedCase,
    canvas,
    audit,
    runAudit,
    deadlines,
    addDeadline,
    toggleDeadline,
    removeDeadline,
  } = useCases();

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const todayStr = useMemo(() => formatYMD(new Date()), []);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => toDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Estado del planificador de plazos con DateRangePicker
  const [showPlanner, setShowPlanner] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineNotes, setDeadlineNotes] = useState('');
  const [priority, setPriority] = useState<DeadlinePriority>('HIGH');
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(() => ({
    from: todayStr,
    to: addDaysYMD(todayStr, 6),
  }));
  const [formError, setFormError] = useState<string | null>(null);

  const presets = useMemo<DateRangePreset[]>(
    () => [
      {
        label: t('audit.deadline.preset3d'),
        value: { from: selectedDateKey, to: addDaysYMD(selectedDateKey, 2) },
      },
      {
        label: t('audit.deadline.preset7d'),
        value: { from: selectedDateKey, to: addDaysYMD(selectedDateKey, 6) },
      },
      {
        label: t('audit.deadline.preset15d'),
        value: { from: selectedDateKey, to: addDaysYMD(selectedDateKey, 14) },
      },
      {
        label: t('audit.deadline.preset30d'),
        value: { from: selectedDateKey, to: addDaysYMD(selectedDateKey, 29) },
      },
    ],
    [selectedDateKey, t]
  );

  const formattedDateHeader = useMemo(
    () =>
      selectedDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [selectedDate, locale]
  );

  const formatTime = (iso?: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const report = audit.data;
  const outdated = Boolean(report && canvas.data && report.canvasVersion !== canvas.data.version);
  const canvasEmpty = canvas.data ? canvas.data.canvas.nodes.length === 0 : false;

  const handleCreateDeadline = async () => {
    if (!deadlineTitle.trim()) {
      setFormError(t('audit.deadline.validationTitle'));
      return;
    }
    if (!selectedRange?.from || !selectedRange?.to) {
      setFormError(t('audit.deadline.validationRange'));
      return;
    }
    setFormError(null);
    await addDeadline({
      title: deadlineTitle,
      notes: deadlineNotes,
      from: selectedRange.from,
      to: selectedRange.to,
      priority,
    });
    setDeadlineTitle('');
    setDeadlineNotes('');
    setShowPlanner(false);
  };

  const getDeadlineStatusInfo = (dl: CaseDeadline) => {
    if (dl.completed) {
      return {
        label: t('audit.deadline.status.completed'),
        color: '#34C759',
        bgColor: 'rgba(52, 199, 89, 0.14)',
      };
    }
    if (dl.to < todayStr) {
      return {
        label: t('audit.deadline.status.overdue'),
        color: palette.danger,
        bgColor: 'rgba(217, 48, 54, 0.14)',
      };
    }
    if (dl.to === todayStr) {
      return {
        label: t('audit.deadline.status.dueToday'),
        color: '#FF9500',
        bgColor: 'rgba(255, 149, 0, 0.16)',
      };
    }
    const remaining = diffDaysYMD(todayStr, dl.to) - 1;
    return {
      label: `${remaining} ${
        remaining === 1 ? t('audit.deadline.status.dayLeft') : t('audit.deadline.status.daysLeft')
      }`,
      color: dl.priority === 'HIGH' ? '#FF9500' : palette.label,
      bgColor: dl.priority === 'HIGH' ? 'rgba(255, 149, 0, 0.14)' : palette.groupedBackground,
    };
  };

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!selectedCase) return [];
    const items: TimelineEntry[] = [];

    // 1. Alertas de auditoría IA
    if (report && report.alerts.length > 0) {
      const timeStr =
        formatTime(report.generatedAt) ||
        formatTime((report as any).auditedAt) ||
        formatTime((report as any).createdAt) ||
        formatTime(selectedCase.updatedAt) ||
        '';
      report.alerts.forEach((alert, idx) => {
        const isProminent = idx === 0 || alert.severity === 'HIGH';
        items.push({
          id: `alert-${alert.id}`,
          variant: isProminent ? 'active' : 'inactive',
          title: alert.title,
          timestamp: timeStr,
          description: alert.description,
          severity: alert.severity,
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
        timestamp: formatTime(report.generatedAt) || formatTime(selectedCase.updatedAt) || '',
        description: t('audit.clean.body'),
        badges: ['OK', 'AI', `V${report.canvasVersion}`],
        targetTab: 'caseMap',
      });
    }

    // 2. Plazos y entregas programadas con el DateRangePicker
    deadlines.forEach((dl, idx) => {
      const totalDays = diffDaysYMD(dl.from, dl.to);
      const status = getDeadlineStatusInfo(dl);
      const isUrgentActive = !dl.completed && (dl.priority === 'HIGH' || (!report && idx === 0));
      items.push({
        id: `deadline-${dl.id}`,
        variant: isUrgentActive ? 'active' : 'inactive',
        title: dl.title,
        timestamp: `${formatShortDate(dl.from, locale)} → ${formatShortDate(dl.to, locale)}`,
        description:
          dl.notes && dl.notes.trim().length > 0
            ? dl.notes
            : `${t('audit.deadline.rangeLabel')}: ${formatReadableDate(dl.from, locale)} – ${formatReadableDate(dl.to, locale)} (${totalDays} ${
                totalDays === 1 ? t('audit.deadline.day') : t('audit.deadline.days')
              }).`,
        severity: !dl.completed && dl.priority === 'HIGH' ? 'HIGH' : undefined,
        recommendation: `${status.label} • ${t(`audit.deadline.priority.${dl.priority}` as any)}`,
        badges: ['DL', `${totalDays}D`, dl.completed ? 'OK' : dl.priority === 'HIGH' ? 'UR' : 'TM'],
        onPress: () => toggleDeadline(dl.id),
      });
    });

    // 3. Elementos cronológicos del caso (Hechos, Pruebas, Leyes, Jurisprudencia)
    const nodes = canvas.data?.canvas.nodes ?? [];
    const canvasTime = canvas.data
      ? formatTime(canvas.data.updatedAt)
      : formatTime(selectedCase.updatedAt);

    nodes.forEach((node, idx) => {
      const makeActive = !report && deadlines.length === 0 && idx === 0;
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
        badges: [
          typeBadge,
          node.origin === 'AI_GENERATED' ? 'AI' : 'JD',
          `V${selectedCase.canvasVersion}`,
        ],
        targetTab: 'caseMap',
      });
    });

    // 4. Hito de apertura del expediente
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
  }, [selectedCase, report, deadlines, canvas.data, language, t]);

  return (
    <AmbientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tarjeta Héroe superior estilo Apple con fondo Gris Tornasol */}
        <HeroCard>
          <View style={styles.brandRow}>
            <Text variant="headline">
              Iurify{' '}
              <Text variant="headline" weight="500" color={palette.secondaryLabel}>
                Case
              </Text>
            </Text>
            <GlassIconButton
              icon="person"
              size={36}
              accessibilityLabel="Ajustes"
              onPress={() => onNavigate('settings')}
            />
          </View>

          <Animated.View entering={FadeIn.duration(260)} style={styles.heroText}>
            <Text variant="subheadline" weight="500" color={palette.secondaryLabel}>
              {formattedDateHeader}
            </Text>
            <Text variant="display" style={styles.headline} accessibilityRole="header">
              {t('audit.today')}
            </Text>
          </Animated.View>

          {/* Selector de 7 días */}
          <View style={styles.dateStripWrapper}>
            <AppleDateStrip
              selectedDateKey={selectedDateKey}
              anchorDate={selectedDate}
              onSelectDate={(key, date) => {
                setSelectedDateKey(key);
                setSelectedDate(date);
                setSelectedRange((prev) => ({
                  from: key,
                  to: prev?.to && prev.to >= key ? prev.to : addDaysYMD(key, 6),
                }));
              }}
              language={language}
            />
          </View>

          {/* Barra de acción del expediente seleccionado */}
          {selectedCase && (
            <View style={styles.docketBarWrapper}>
              <GlassSurface radius={radii.group} contentStyle={styles.docketBarContent}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text variant="headline" numberOfLines={1}>
                    {selectedCase.title}
                  </Text>
                  <Text
                    variant="caption"
                    color={palette.secondaryLabel}
                    numberOfLines={1}
                    style={{ marginTop: 2 }}
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
                  icon="sparkles"
                  onPress={runAudit}
                  loading={audit.loading}
                  disabled={!canvas.data || canvasEmpty}
                />
              </GlassSurface>
            </View>
          )}
        </HeroCard>

        {/* Cuerpo de la pantalla con Plazos (DateRangePicker) y Línea de Tiempo */}
        <Animated.View entering={FadeInDown.duration(380).delay(80)} style={styles.body}>
          {!selectedCase ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: palette.groupedBackground }]}>
                <Symbol name="folderOpen" size={32} color={palette.secondaryLabel} />
              </View>
              <Text variant="headline" style={styles.emptyTitle}>
                {t('audit.noCase.title')}
              </Text>
              <Text variant="subheadline" color={palette.secondaryLabel} style={styles.emptySubtitle}>
                {t('audit.noCase.body')}
              </Text>
              <GlassButton
                label={t('nav.cases')}
                icon="folder"
                onPress={() => onNavigate('cases')}
                style={{ marginTop: 18, width: '100%' }}
              />
            </View>
          ) : canvas.loading && !canvas.data ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
              <ActivityIndicator size="small" color={palette.label} />
              <Text variant="subheadline" color={palette.secondaryLabel} style={{ marginTop: 10 }}>
                {t('common.loading')}
              </Text>
            </View>
          ) : canvas.error ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
              <Symbol name="error" size={32} color={palette.danger} />
              <Text variant="headline" style={{ marginTop: 10 }}>
                {t('common.error')}
              </Text>
              <GlassButton
                label={t('common.retry')}
                onPress={runAudit}
                style={{ marginTop: 16, width: '100%' }}
              />
            </View>
          ) : (
            <>
              {/* Sección de Plazos y Tiempos de Entrega con Kit estilo Apple */}
              <View style={styles.deadlinesSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <View
                      style={[
                        styles.sectionIconCircle,
                        { backgroundColor: palette.groupedBackground },
                      ]}
                    >
                      <Symbol name="calendar" size={17} color={palette.label} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                      <Text variant="title2" weight="700" numberOfLines={1}>
                        {t('audit.deadline.sectionTitle')}
                      </Text>
                      {deadlines.length > 0 ? (
                        <Text
                          variant="caption"
                          color={palette.secondaryLabel}
                          numberOfLines={1}
                          style={{ marginTop: 1 }}
                        >
                          {deadlines.filter((d) => !d.completed).length} {t('tasks.title').toLowerCase()} • {deadlines.length} total
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <GlassButton
                    label={showPlanner ? t('audit.deadline.hideForm') : t('audit.deadline.addButton')}
                    icon={showPlanner ? 'close' : 'plus'}
                    onPress={() => {
                      setFormError(null);
                      setShowPlanner((prev) => !prev);
                    }}
                  />
                </View>

                {showPlanner ? (
                  <Animated.View
                    entering={FadeInDown.duration(240)}
                    style={[
                      styles.plannerCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        shadowColor: isDark ? '#000000' : palette.glass.shadow,
                      },
                    ]}
                  >
                    <View style={styles.plannerHeader}>
                      <View
                        style={[
                          styles.plannerIconWrap,
                          { backgroundColor: palette.groupedBackground },
                        ]}
                      >
                        <Symbol name="calendarBadgePlus" size={18} color={palette.label} />
                      </View>
                      <Text variant="headline" weight="700" style={{ flex: 1 }}>
                        {t('audit.deadline.formTitle')}
                      </Text>
                    </View>

                    {/* Entradas de texto agrupadas estilo iOS */}
                    <GroupedSection
                      style={{
                        backgroundColor: palette.groupedBackground,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      <TextFieldRow
                        icon="doc"
                        placeholder={t('audit.deadline.titlePlaceholder')}
                        value={deadlineTitle}
                        onChangeText={(txt) => {
                          setDeadlineTitle(txt);
                          if (formError) setFormError(null);
                        }}
                        maxLength={160}
                      />
                      <TextFieldRow
                        icon="notes"
                        placeholder={t('audit.deadline.notesPlaceholder')}
                        value={deadlineNotes}
                        onChangeText={setDeadlineNotes}
                        maxLength={400}
                      />
                    </GroupedSection>

                    {/* Selector de prioridad con SegmentedControl */}
                    <View style={styles.formFieldBlock}>
                      <Text
                        variant="caption"
                        weight="600"
                        color={palette.secondaryLabel}
                        style={{ marginLeft: 2 }}
                      >
                        {language === 'es' ? 'Prioridad del término' : 'Priority Level'}
                      </Text>
                      <SegmentedControl
                        value={priority}
                        onChange={(val) => setPriority(val as DeadlinePriority)}
                        options={[
                          { value: 'HIGH', label: t('audit.deadline.priority.HIGH') },
                          { value: 'MEDIUM', label: t('audit.deadline.priority.MEDIUM') },
                          { value: 'LOW', label: t('audit.deadline.priority.LOW') },
                        ]}
                      />
                    </View>

                    {/* Selector de rango de fechas DateRangePicker con diseño Apple */}
                    <View style={styles.formFieldBlock}>
                      <Text
                        variant="caption"
                        weight="600"
                        color={palette.secondaryLabel}
                        style={{ marginLeft: 2 }}
                      >
                        {t('audit.deadline.rangeLabel')}
                      </Text>
                      <DateRangePicker
                        defaultMonth={selectedRange?.from ?? todayStr}
                        value={selectedRange}
                        onValueChange={(range) => {
                          setSelectedRange(range);
                          if (range?.from) {
                            setSelectedDateKey(range.from);
                            setSelectedDate(ymdToLocalDate(range.from));
                          }
                          if (formError) setFormError(null);
                        }}
                        presets={presets}
                        locale={locale}
                        defaultOpen={true}
                      >
                        <DateRangePickerTrigger placeholder={t('audit.deadline.selectDates')} />
                        <DateRangePickerContent inline={true}>
                          <DateRangePickerCalendar showSummary={true} style={{ borderWidth: 0 }}>
                            <DateRangePickerHeader />
                            <DateRangePickerPresets />
                            <DateRangePickerGrid />
                            <DateRangePickerFooter>
                              <View style={styles.pickerFooterRow}>
                                <DateRangePickerSelection />
                                <DateRangePickerClear />
                              </View>
                            </DateRangePickerFooter>
                          </DateRangePickerCalendar>
                        </DateRangePickerContent>
                      </DateRangePicker>
                    </View>

                    {formError ? (
                      <View
                        style={[
                          styles.errorBanner,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 69, 58, 0.12)'
                              : 'rgba(217, 48, 54, 0.08)',
                            borderColor: palette.danger,
                          },
                        ]}
                      >
                        <Symbol name="error" size={15} color={palette.danger} />
                        <Text variant="footnote" color={palette.danger} style={{ flex: 1 }}>
                          {formError}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.plannerActions}>
                      <GlassButton
                        label={t('common.cancel')}
                        onPress={() => setShowPlanner(false)}
                        style={{ flex: 1 }}
                      />
                      <GlassButton
                        label={t('audit.deadline.save')}
                        icon="checkmark"
                        onPress={handleCreateDeadline}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </Animated.View>
                ) : null}

                {deadlines.length === 0 && !showPlanner ? (
                  <Pressable
                    onPress={() => setShowPlanner(true)}
                    style={[
                      styles.emptyDeadlinesBox,
                      {
                        backgroundColor: palette.surface,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
                        shadowColor: isDark ? '#000000' : palette.glass.shadow,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.emptyDeadlineIcon,
                        { backgroundColor: palette.groupedBackground },
                      ]}
                    >
                      <Symbol name="calendarBadgePlus" size={20} color={palette.label} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="subheadline" weight="600" color={palette.label}>
                        {t('audit.deadline.sectionTitle')}
                      </Text>
                      <Text
                        variant="caption"
                        color={palette.secondaryLabel}
                        style={{ lineHeight: 17 }}
                      >
                        {t('audit.deadline.empty')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.emptyAddCircle,
                        { backgroundColor: palette.groupedBackground },
                      ]}
                    >
                      <Symbol name="plus" size={14} color={palette.label} />
                    </View>
                  </Pressable>
                ) : (
                  <View style={styles.deadlinesList}>
                    {deadlines.map((dl) => {
                      const status = getDeadlineStatusInfo(dl);
                      const daysTotal = diffDaysYMD(dl.from, dl.to);
                      return (
                        <View
                          key={dl.id}
                          style={[
                            styles.deadlineCard,
                            {
                              backgroundColor: palette.surface,
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                              shadowColor: isDark ? '#000000' : palette.glass.shadow,
                            },
                          ]}
                        >
                          {/* Casilla circular estilo Recordatorios de iOS */}
                          <Pressable
                            onPress={() => toggleDeadline(dl.id)}
                            hitSlop={10}
                            style={[
                              styles.deadlineCheck,
                              dl.completed
                                ? { backgroundColor: palette.label, borderColor: palette.label }
                                : {
                                    backgroundColor: 'transparent',
                                    borderColor: dl.priority === 'HIGH' ? '#FF9500' : palette.separator,
                                  },
                            ]}
                          >
                            {dl.completed ? (
                              <Symbol name="checkmark" size={11} color={palette.surface} weight="bold" />
                            ) : null}
                          </Pressable>

                          <Pressable
                            style={{ flex: 1 }}
                            onPress={() => {
                              setSelectedDateKey(dl.from);
                              setSelectedDate(ymdToLocalDate(dl.from));
                            }}
                          >
                            <View style={styles.deadlineTopRow}>
                              <Text
                                variant="subheadline"
                                weight="600"
                                numberOfLines={1}
                                style={{
                                  flex: 1,
                                  textDecorationLine: dl.completed ? 'line-through' : 'none',
                                  opacity: dl.completed ? 0.55 : 1,
                                }}
                              >
                                {dl.title}
                              </Text>
                              <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
                                <Text variant="caption" weight="600" color={status.color}>
                                  {status.label}
                                </Text>
                              </View>
                            </View>

                            {dl.notes ? (
                              <Text
                                variant="caption"
                                color={palette.secondaryLabel}
                                numberOfLines={2}
                                style={{ marginTop: 3 }}
                              >
                                {dl.notes}
                              </Text>
                            ) : null}

                            <View style={styles.deadlineMetaRow}>
                              <View
                                style={[
                                  styles.metaPill,
                                  { backgroundColor: palette.groupedBackground },
                                ]}
                              >
                                <Symbol name="calendar" size={11} color={palette.secondaryLabel} />
                                <Text variant="caption" weight="500" color={palette.secondaryLabel}>
                                  {formatShortDate(dl.from, locale)} → {formatShortDate(dl.to, locale)}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.metaPill,
                                  { backgroundColor: palette.groupedBackground },
                                ]}
                              >
                                <Symbol
                                  name="flag"
                                  size={10}
                                  color={dl.priority === 'HIGH' ? '#FF9500' : palette.secondaryLabel}
                                />
                                <Text
                                  variant="caption"
                                  weight="600"
                                  color={dl.priority === 'HIGH' ? '#FF9500' : palette.secondaryLabel}
                                >
                                  {t(`audit.deadline.priority.${dl.priority}` as any)}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.metaPill,
                                  { backgroundColor: palette.groupedBackground },
                                ]}
                              >
                                <Text variant="caption" weight="600" color={palette.secondaryLabel}>
                                  {daysTotal}d
                                </Text>
                              </View>
                            </View>
                          </Pressable>

                          <Pressable
                            onPress={() => removeDeadline(dl.id)}
                            hitSlop={10}
                            style={[
                              styles.deleteBtn,
                              { backgroundColor: palette.groupedBackground },
                            ]}
                          >
                            <Symbol name="trash" size={13} color={palette.secondaryLabel} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.timelineList}>
                {timelineEntries.map((item, idx) => (
                  <AppleTimelineRow
                    key={item.id}
                    item={item}
                    isLast={idx === timelineEntries.length - 1}
                    onPress={() => {
                      if (item.onPress) {
                        item.onPress();
                      } else if (canvasEmpty) {
                        onNavigate('caseMap');
                      } else if (!report) {
                        runAudit();
                      } else if (item.targetTab) {
                        onNavigate(item.targetTab);
                      }
                    }}
                  />
                ))}
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
    paddingBottom: 130,
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
  dateStripWrapper: {
    marginTop: 18,
  },
  dateStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  datePill: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  datePillInactive: {},
  docketBarWrapper: {
    marginTop: 16,
  },
  docketBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 18,
  },
  deadlinesSection: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerCard: {
    borderRadius: radii.group,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  plannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formFieldBlock: {
    gap: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.segment,
    borderWidth: 1,
  },
  pickerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  plannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  emptyDeadlinesBox: {
    borderRadius: radii.group,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyDeadlineIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlinesList: {
    gap: 10,
  },
  deadlineCard: {
    borderRadius: radii.group,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  deadlineCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  deadlineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  deadlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineAxis: {
    width: 28,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    zIndex: 2,
  },
  timelineConnector: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    borderRadius: radii.group,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineDesc: {
    lineHeight: 19,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  timelineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
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
});
