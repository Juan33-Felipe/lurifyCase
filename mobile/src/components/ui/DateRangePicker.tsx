import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Symbol,
  Text,
  radii,
  usePalette,
  usePressFeedback,
} from '../apple';
import { useSettings } from '../../context/SettingsContext';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface DateRangePreset {
  label: string;
  value: DateRange;
}

export interface DateRangePickerProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  defaultMonth?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (date: string) => boolean;
  presets?: DateRangePreset[];
  locale?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showSummary?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
}

type PickerViewMode = 'days' | 'months' | 'years';

interface DateRangePickerContextValue {
  range: DateRange;
  setRange: (next: DateRange | null) => void;
  selectDate: (dateStr: string) => void;
  selectPreset: (preset: DateRange) => void;
  clear: () => void;
  visibleMonth: { year: number; month: number };
  direction: 'left' | 'right';
  goToMonth: (year: number, month: number) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  prevYear: () => void;
  nextYear: () => void;
  viewMode: PickerViewMode;
  setViewMode: (mode: PickerViewMode) => void;
  isDisabledDate: (dateStr: string) => boolean;
  presets: DateRangePreset[];
  locale: string;
  label?: string;
  disabled: boolean;
  showSummary: boolean;
  open: boolean;
  setOpen: (next: boolean) => void;
  closeOnSelect: boolean;
}

/* -------------------------------------------------------------------------- */
/*                           YYYY-MM-DD Date Helpers                          */
/* -------------------------------------------------------------------------- */

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYMD(ymd: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function ymdToLocalDate(ymd: string): Date {
  const parsed = parseYMD(ymd);
  if (!parsed) return new Date();
  return new Date(parsed.year, parsed.month, parsed.day, 12, 0, 0);
}

export function addDaysYMD(ymd: string, days: number): string {
  const d = ymdToLocalDate(ymd);
  d.setDate(d.getDate() + days);
  return formatYMD(d);
}

export function diffDaysYMD(from: string | null, to: string | null): number {
  if (!from || !to) return 0;
  const d1 = ymdToLocalDate(from);
  const d2 = ymdToLocalDate(to);
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff) + 1;
}

export function formatReadableDate(ymd: string | null, locale: string): string {
  if (!ymd) return '—';
  const parsed = parseYMD(ymd);
  if (!parsed) return ymd;
  const d = new Date(parsed.year, parsed.month, parsed.day, 12, 0, 0);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(ymd: string | null, locale: string): string {
  if (!ymd) return '—';
  const parsed = parseYMD(ymd);
  if (!parsed) return ymd;
  const d = new Date(parsed.year, parsed.month, parsed.day, 12, 0, 0);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

const DateRangePickerContext = createContext<DateRangePickerContextValue | null>(null);

export function useDateRangePicker(): DateRangePickerContextValue {
  const ctx = useContext(DateRangePickerContext);
  if (!ctx) {
    throw new Error('useDateRangePicker must be used within a <DateRangePicker />');
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                              Root Component                                */
/* -------------------------------------------------------------------------- */

export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  defaultMonth,
  min,
  max,
  isDateDisabled,
  presets = [],
  locale,
  label,
  disabled = false,
  showSummary = true,
  style,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnSelect = false,
}: DateRangePickerProps) {
  const { language } = useSettings();
  const resolvedLocale = locale ?? (language === 'es' ? 'es-ES' : 'en-US');

  const [internalRange, setInternalRange] = useState<DateRange>(
    () => value ?? defaultValue ?? { from: null, to: null }
  );
  const currentRange = useMemo<DateRange>(
    () => (value !== undefined ? (value ?? { from: null, to: null }) : internalRange),
    [internalRange, value]
  );

  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, disabled, onOpenChange]
  );

  const initialMonthObj = useMemo(() => {
    const seed = defaultMonth || currentRange.from || formatYMD(new Date());
    const parsed = parseYMD(seed);
    if (parsed) return { year: parsed.year, month: parsed.month };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [currentRange.from, defaultMonth]);

  const [visibleMonth, setVisibleMonth] = useState<{ year: number; month: number }>(initialMonthObj);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [viewMode, setViewMode] = useState<PickerViewMode>('days');

  const setRange = useCallback(
    (next: DateRange | null) => {
      const normalized = next ?? { from: null, to: null };
      if (value === undefined) {
        setInternalRange(normalized);
      }
      onValueChange?.(next && (next.from || next.to) ? normalized : null);
    },
    [onValueChange, value]
  );

  const isDisabledDate = useCallback(
    (dateStr: string) => {
      if (disabled) return true;
      if (min && dateStr < min) return true;
      if (max && dateStr > max) return true;
      if (isDateDisabled && isDateDisabled(dateStr)) return true;
      return false;
    },
    [disabled, isDateDisabled, max, min]
  );

  const selectDate = useCallback(
    (dateStr: string) => {
      if (isDisabledDate(dateStr)) return;

      const { from, to } = currentRange;
      if (!from || (from && to)) {
        setRange({ from: dateStr, to: null });
      } else {
        const nextRange: DateRange =
          dateStr < from ? { from: dateStr, to: from } : { from, to: dateStr };
        setRange(nextRange);
        if (closeOnSelect) {
          setOpen(false);
        }
      }
    },
    [closeOnSelect, currentRange, isDisabledDate, setOpen, setRange]
  );

  const selectPreset = useCallback(
    (preset: DateRange) => {
      if (disabled) return;
      setRange(preset);
      if (preset.from) {
        const parsed = parseYMD(preset.from);
        if (parsed) {
          setVisibleMonth({ year: parsed.year, month: parsed.month });
        }
      }
      if (closeOnSelect && preset.from && preset.to) {
        setOpen(false);
      }
    },
    [closeOnSelect, disabled, setOpen, setRange]
  );

  const clear = useCallback(() => {
    if (disabled) return;
    setRange(null);
  }, [disabled, setRange]);

  const goToMonth = useCallback((year: number, month: number) => {
    setVisibleMonth((prev) => {
      const prevTotal = prev.year * 12 + prev.month;
      const nextTotal = year * 12 + month;
      setDirection(nextTotal >= prevTotal ? 'right' : 'left');
      return { year, month };
    });
  }, []);

  const prevMonth = useCallback(() => {
    setDirection('left');
    setVisibleMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setDirection('right');
    setVisibleMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const prevYear = useCallback(() => {
    setDirection('left');
    setVisibleMonth((prev) => ({ year: prev.year - 1, month: prev.month }));
  }, []);

  const nextYear = useCallback(() => {
    setDirection('right');
    setVisibleMonth((prev) => ({ year: prev.year + 1, month: prev.month }));
  }, []);

  const ctxValue = useMemo<DateRangePickerContextValue>(
    () => ({
      range: currentRange,
      setRange,
      selectDate,
      selectPreset,
      clear,
      visibleMonth,
      direction,
      goToMonth,
      prevMonth,
      nextMonth,
      prevYear,
      nextYear,
      viewMode,
      setViewMode,
      isDisabledDate,
      presets,
      locale: resolvedLocale,
      label,
      disabled,
      showSummary,
      open: isOpen,
      setOpen,
      closeOnSelect,
    }),
    [
      clear,
      closeOnSelect,
      currentRange,
      direction,
      disabled,
      goToMonth,
      isDisabledDate,
      isOpen,
      label,
      nextMonth,
      nextYear,
      presets,
      prevMonth,
      prevYear,
      resolvedLocale,
      selectDate,
      selectPreset,
      setOpen,
      setRange,
      showSummary,
      viewMode,
      visibleMonth,
    ]
  );

  return (
    <DateRangePickerContext.Provider value={ctxValue}>
      <View style={style}>
        {children ? (
          children
        ) : (
          <DateRangePickerCalendar showSummary={showSummary}>
            <DateRangePickerHeader />
            {presets.length > 0 ? <DateRangePickerPresets /> : null}
            <DateRangePickerGrid />
            <DateRangePickerFooter>
              <View style={styles.footerRow}>
                <DateRangePickerSelection />
                <DateRangePickerClear />
              </View>
            </DateRangePickerFooter>
          </DateRangePickerCalendar>
        )}
      </View>
    </DateRangePickerContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Trigger                                  */
/* -------------------------------------------------------------------------- */

export function DateRangePickerTrigger({
  placeholder,
  style,
}: {
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const { t } = useSettings();
  const { range, locale, label, open, setOpen, disabled } = useDateRangePicker();
  const press = usePressFeedback(0.98);

  const hasSelection = Boolean(range.from || range.to);
  const totalDays = diffDaysYMD(range.from, range.to);

  const displayText = useMemo(() => {
    if (!range.from && !range.to) {
      return placeholder ?? t('audit.deadline.selectDates');
    }
    if (range.from && !range.to) {
      return `${formatReadableDate(range.from, locale)} → …`;
    }
    return `${formatReadableDate(range.from, locale)}  →  ${formatReadableDate(range.to, locale)}`;
  }, [locale, placeholder, range.from, range.to, t]);

  const isDark = palette.mode === 'dark';

  return (
    <Animated.View style={[press.container, style]}>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(!open)}
        {...press.handlers}
        style={[
          styles.trigger,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.72)',
            borderColor: open
              ? palette.label
              : isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(0, 0, 0, 0.08)',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={[styles.triggerIconWrap, { backgroundColor: palette.groupedBackground }]}>
          <Symbol name="calendar" size={17} color={palette.label} />
        </View>

        <View style={{ flex: 1 }}>
          {label ? (
            <Text
              variant="caption"
              weight="500"
              color={palette.secondaryLabel}
              style={{ marginBottom: 2 }}
            >
              {label}
            </Text>
          ) : null}
          <Text
            variant="subheadline"
            weight={hasSelection ? '600' : '400'}
            color={hasSelection ? palette.label : palette.secondaryLabel}
            numberOfLines={1}
          >
            {displayText}
          </Text>
        </View>

        {totalDays > 0 ? (
          <View style={[styles.daysCountBadge, { backgroundColor: palette.label }]}>
            <Text variant="caption" weight="700" color={palette.surface}>
              {totalDays}d
            </Text>
          </View>
        ) : null}

        <Symbol
          name={open ? 'chevronUp' : 'chevronDown'}
          size={14}
          color={palette.secondaryLabel}
        />
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Content (Popover/Modal)                        */
/* -------------------------------------------------------------------------- */

export function DateRangePickerContent({
  radius: cornerRadius = radii.group,
  shadow = true,
  inline = false,
  style,
  children,
}: {
  autoFocus?: boolean;
  side?: 'bottom' | 'top';
  align?: 'start' | 'end';
  sideOffset?: number;
  radius?: number;
  shadow?: boolean;
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const palette = usePalette();
  const { open, setOpen } = useDateRangePicker();
  const isDark = palette.mode === 'dark';

  if (!open) return null;

  if (inline) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(160)}
        style={[
          styles.inlineContent,
          {
            borderRadius: cornerRadius,
            backgroundColor: palette.surface,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
            shadowColor: shadow ? (isDark ? '#000000' : palette.glass.shadow) : 'transparent',
            shadowOpacity: shadow ? (isDark ? 0.35 : 0.08) : 0,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.modalCard,
            {
              borderRadius: cornerRadius,
              backgroundColor: palette.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
              shadowColor: isDark ? '#000000' : palette.glass.shadow,
              shadowOpacity: isDark ? 0.45 : 0.16,
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Calendar                                  */
/* -------------------------------------------------------------------------- */

export function DateRangePickerCalendar({
  showSummary: showSummaryProp,
  style,
  children,
}: {
  showSummary?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const palette = usePalette();
  const { showSummary: contextShowSummary } = useDateRangePicker();
  const displaySummary = showSummaryProp !== undefined ? showSummaryProp : contextShowSummary;
  const isDark = palette.mode === 'dark';

  return (
    <View
      style={[
        styles.calendarContainer,
        {
          backgroundColor: palette.surface,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
    >
      {displaySummary ? <DateRangePickerSummary /> : null}
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Summary                                  */
/* -------------------------------------------------------------------------- */

export function DateRangePickerSummary({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const { t } = useSettings();
  const { range, locale } = useDateRangePicker();
  const totalDays = diffDaysYMD(range.from, range.to);
  const isDark = palette.mode === 'dark';

  return (
    <View
      style={[
        styles.summaryBar,
        {
          backgroundColor: palette.groupedBackground,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}
    >
      <View style={styles.summaryColumn}>
        <Text variant="caption" weight="600" color={palette.secondaryLabel}>
          {t('audit.deadline.from')}
        </Text>
        <Text
          variant="subheadline"
          weight="600"
          color={range.from ? palette.label : palette.secondaryLabel}
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {formatReadableDate(range.from, locale)}
        </Text>
      </View>

      <View style={[styles.summaryArrowBadge, { backgroundColor: palette.surface }]}>
        <Symbol name="arrowRight" size={13} color={palette.secondaryLabel} />
      </View>

      <View style={[styles.summaryColumn, { alignItems: 'flex-end' }]}>
        <Text variant="caption" weight="600" color={palette.secondaryLabel}>
          {t('audit.deadline.to')}
        </Text>
        <Text
          variant="subheadline"
          weight="600"
          color={range.to ? palette.label : palette.secondaryLabel}
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {formatReadableDate(range.to, locale)}
        </Text>
      </View>

      {totalDays > 0 ? (
        <View style={[styles.summaryDurationPill, { backgroundColor: palette.label }]}>
          <Text variant="caption" weight="700" color={palette.surface}>
            {totalDays} {totalDays === 1 ? t('audit.deadline.day') : t('audit.deadline.days')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

export function DateRangePickerHeader({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const {
    visibleMonth,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    viewMode,
    setViewMode,
    locale,
  } = useDateRangePicker();

  const isDark = palette.mode === 'dark';

  const monthTitle = useMemo(() => {
    const d = new Date(visibleMonth.year, visibleMonth.month, 1, 12, 0, 0);
    const formatted = d.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [locale, visibleMonth.month, visibleMonth.year]);

  const toggleMonthYearPicker = () => {
    setViewMode(viewMode === 'days' ? 'months' : 'days');
  };

  return (
    <View style={[styles.headerRow, style]}>
      <View style={styles.headerNavGroup}>
        <Pressable
          onPress={prevYear}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            {
              backgroundColor: palette.groupedBackground,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Symbol name="arrowLeft" size={14} color={palette.label} />
        </Pressable>
        <Pressable
          onPress={prevMonth}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            {
              backgroundColor: palette.groupedBackground,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Symbol name="chevronLeft" size={14} color={palette.label} />
        </Pressable>
      </View>

      <Pressable
        onPress={toggleMonthYearPicker}
        style={[
          styles.monthTitleButton,
          {
            backgroundColor: viewMode !== 'days' ? palette.label : palette.groupedBackground,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <Text
          variant="subheadline"
          weight="600"
          color={viewMode !== 'days' ? palette.surface : palette.label}
        >
          {monthTitle}
        </Text>
        <Symbol
          name={viewMode === 'days' ? 'chevronDown' : 'chevronUp'}
          size={13}
          color={viewMode !== 'days' ? palette.surface : palette.secondaryLabel}
        />
      </Pressable>

      <View style={styles.headerNavGroup}>
        <Pressable
          onPress={nextMonth}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            {
              backgroundColor: palette.groupedBackground,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Symbol name="chevronRight" size={14} color={palette.label} />
        </Pressable>
        <Pressable
          onPress={nextYear}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            {
              backgroundColor: palette.groupedBackground,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Symbol name="arrowRight" size={14} color={palette.label} />
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Grid                                    */
/* -------------------------------------------------------------------------- */

interface CalendarDayCell {
  ymd: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

const WEEKDAY_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export function DateRangePickerGrid({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const { language } = useSettings();
  const {
    range,
    selectDate,
    visibleMonth,
    direction,
    goToMonth,
    viewMode,
    setViewMode,
    isDisabledDate,
    locale,
  } = useDateRangePicker();

  const isDark = palette.mode === 'dark';
  const todayYMD = useMemo(() => formatYMD(new Date()), []);
  const weekdayLabels = language === 'es' ? WEEKDAY_ES : WEEKDAY_EN;

  const weeks = useMemo<CalendarDayCell[][]>(() => {
    const { year, month } = visibleMonth;
    const firstOfMonth = new Date(year, month, 1, 12, 0, 0);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0, 12, 0, 0).getDate();

    const cells: CalendarDayCell[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum, 12, 0, 0);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        dayNumber: dayNum,
        inCurrentMonth: false,
        isToday: ymd === todayYMD,
      });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum, 12, 0, 0);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        dayNumber: dayNum,
        inCurrentMonth: true,
        isToday: ymd === todayYMD,
      });
    }

    const remaining = 42 - cells.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum, 12, 0, 0);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        dayNumber: dayNum,
        inCurrentMonth: false,
        isToday: ymd === todayYMD,
      });
    }

    const rows: CalendarDayCell[][] = [];
    for (let r = 0; r < 6; r++) {
      rows.push(cells.slice(r * 7, r * 7 + 7));
    }
    return rows;
  }, [todayYMD, visibleMonth]);

  if (viewMode === 'months' || viewMode === 'years') {
    const months = Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(visibleMonth.year, idx, 1, 12, 0, 0);
      const name = d.toLocaleDateString(locale, { month: 'short' });
      return {
        index: idx,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      };
    });

    const baseYear = visibleMonth.year - 4;
    const years = Array.from({ length: 12 }, (_, idx) => baseYear + idx);

    return (
      <Animated.View entering={FadeIn.duration(160)} style={[styles.pickerSubGrid, style]}>
        <View style={styles.yearGrid}>
          {years.map((yr) => {
            const active = yr === visibleMonth.year;
            return (
              <Pressable
                key={yr}
                onPress={() => goToMonth(yr, visibleMonth.month)}
                style={[
                  styles.yearChip,
                  {
                    backgroundColor: active ? palette.label : palette.groupedBackground,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight={active ? '700' : '500'}
                  color={active ? palette.surface : palette.label}
                >
                  {yr}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.monthGrid}>
          {months.map((m) => {
            const active = m.index === visibleMonth.month;
            return (
              <Pressable
                key={m.index}
                onPress={() => {
                  goToMonth(visibleMonth.year, m.index);
                  setViewMode('days');
                }}
                style={[
                  styles.monthCell,
                  {
                    backgroundColor: active ? palette.label : palette.groupedBackground,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Text
                  variant="subheadline"
                  weight={active ? '700' : '600'}
                  color={active ? palette.surface : palette.label}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    );
  }

  const enteringAnim =
    direction === 'right' ? SlideInRight.duration(180) : SlideInLeft.duration(180);

  return (
    <View style={[styles.gridContainer, style]}>
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((dayName) => (
          <View key={dayName} style={styles.weekdayCell}>
            <Text variant="caption" weight="600" color={palette.secondaryLabel}>
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      <Animated.View
        key={`${visibleMonth.year}-${visibleMonth.month}`}
        entering={enteringAnim}
        style={styles.weeksWrapper}
      >
        {weeks.map((week, rowIdx) => (
          <View key={rowIdx} style={styles.weekRow}>
            {week.map((cell) => {
              const isStart = range.from === cell.ymd;
              const isEnd = range.to === cell.ymd;
              const isSelectedEndpoint = isStart || isEnd;
              const isInRange =
                Boolean(range.from && range.to) &&
                cell.ymd > (range.from as string) &&
                cell.ymd < (range.to as string);
              const isRangeBounded = Boolean(range.from && range.to && range.from !== range.to);
              const disabled = isDisabledDate(cell.ymd);

              return (
                <DayCellButton
                  key={cell.ymd}
                  cell={cell}
                  isStart={isStart}
                  isEnd={isEnd}
                  isSelectedEndpoint={isSelectedEndpoint}
                  isInRange={isInRange}
                  isRangeBounded={isRangeBounded}
                  disabled={disabled}
                  onPress={() => selectDate(cell.ymd)}
                />
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function DayCellButton({
  cell,
  isStart,
  isEnd,
  isSelectedEndpoint,
  isInRange,
  isRangeBounded,
  disabled,
  onPress,
}: {
  cell: CalendarDayCell;
  isStart: boolean;
  isEnd: boolean;
  isSelectedEndpoint: boolean;
  isInRange: boolean;
  isRangeBounded: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rangeBandColor =
    palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(28, 28, 30, 0.08)';

  return (
    <View style={styles.dayCellOuter}>
      {isInRange ? (
        <View style={[styles.rangeBandFull, { backgroundColor: rangeBandColor }]} />
      ) : null}
      {isRangeBounded && isStart ? (
        <View style={[styles.rangeBandRightHalf, { backgroundColor: rangeBandColor }]} />
      ) : null}
      {isRangeBounded && isEnd ? (
        <View style={[styles.rangeBandLeftHalf, { backgroundColor: rangeBandColor }]} />
      ) : null}

      <Animated.View style={animStyle}>
        <Pressable
          disabled={disabled}
          onPress={onPress}
          onPressIn={() => scale.set(withSpring(0.88, { damping: 50, stiffness: 600 }))}
          onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
          style={[
            styles.dayButton,
            isSelectedEndpoint && {
              backgroundColor: palette.label,
              shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
              shadowOpacity: 0.18,
              shadowRadius: 5,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            },
            !isSelectedEndpoint &&
              cell.isToday && {
                borderWidth: 1.5,
                borderColor: palette.label,
              },
          ]}
        >
          <Text
            variant="caption"
            weight={isSelectedEndpoint || cell.isToday ? '700' : '500'}
            color={
              isSelectedEndpoint
                ? palette.surface
                : disabled
                  ? palette.placeholder
                  : !cell.inCurrentMonth
                    ? palette.secondaryLabel
                    : palette.label
            }
          >
            {cell.dayNumber}
          </Text>
          {cell.isToday ? (
            <View
              style={[
                styles.todayDot,
                {
                  backgroundColor: isSelectedEndpoint ? palette.surface : palette.label,
                },
              ]}
            />
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Presets                                  */
/* -------------------------------------------------------------------------- */

export function DateRangePickerPresets({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const { presets } = useDateRangePicker();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.presetsRow, style]}
    >
      {children
        ? children
        : presets.map((p) => (
            <DateRangePickerPreset key={p.label} label={p.label} value={p.value} />
          ))}
    </ScrollView>
  );
}

export function DateRangePickerPreset({
  value,
  label,
  style,
}: {
  value: DateRange;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const { range, selectPreset, disabled } = useDateRangePicker();
  const press = usePressFeedback(0.95);
  const isActive = range.from === value.from && range.to === value.to && Boolean(value.from);
  const isDark = palette.mode === 'dark';

  return (
    <Animated.View style={press.container}>
      <Pressable
        disabled={disabled}
        onPress={() => selectPreset(value)}
        {...press.handlers}
        style={[
          styles.presetChip,
          {
            backgroundColor: isActive ? palette.label : palette.groupedBackground,
            borderColor: isActive
              ? palette.label
              : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
          },
          style,
        ]}
      >
        <Text
          variant="caption"
          weight={isActive ? '700' : '500'}
          color={isActive ? palette.surface : palette.label}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Footer, Selection & Clear                          */
/* -------------------------------------------------------------------------- */

export function DateRangePickerFooter({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const palette = usePalette();
  const isDark = palette.mode === 'dark';
  return (
    <View
      style={[
        styles.footerContainer,
        { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function DateRangePickerSelection({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const { t } = useSettings();
  const { range, locale } = useDateRangePicker();
  const days = diffDaysYMD(range.from, range.to);

  const text = useMemo(() => {
    if (!range.from && !range.to) return t('audit.deadline.noSelection');
    if (range.from && !range.to) {
      return `${formatShortDate(range.from, locale)} → ${t('audit.deadline.pickEndDate')}`;
    }
    return `${formatShortDate(range.from, locale)} – ${formatShortDate(range.to, locale)} (${days} ${
      days === 1 ? t('audit.deadline.day') : t('audit.deadline.days')
    })`;
  }, [days, locale, range.from, range.to, t]);

  return (
    <View style={[styles.selectionWrap, style]}>
      <Symbol name="calendar" size={14} color={palette.secondaryLabel} />
      <Text
        variant="caption"
        weight="500"
        color={range.from ? palette.label : palette.secondaryLabel}
        numberOfLines={1}
        style={{ flexShrink: 1 }}
      >
        {text}
      </Text>
    </View>
  );
}

export function DateRangePickerClear({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const { t } = useSettings();
  const { range, clear, disabled } = useDateRangePicker();
  const press = usePressFeedback(0.95);
  const isDark = palette.mode === 'dark';

  if (!range.from && !range.to) return null;

  return (
    <Animated.View style={press.container}>
      <Pressable
        disabled={disabled}
        onPress={clear}
        {...press.handlers}
        style={[
          styles.clearBtn,
          {
            backgroundColor: palette.groupedBackground,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
          style,
        ]}
      >
        <Symbol name="refresh" size={12} color={palette.secondaryLabel} />
        <Text variant="caption" weight="600" color={palette.label}>
          {t('audit.deadline.clear')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Dropdown Composition                             */
/* -------------------------------------------------------------------------- */

export interface DateRangePickerDropdownProps extends DateRangePickerProps {
  placeholder?: string;
  triggerStyle?: StyleProp<ViewStyle>;
  calendarStyle?: StyleProp<ViewStyle>;
  inline?: boolean;
}

export function DateRangePickerDropdown({
  placeholder,
  triggerStyle,
  calendarStyle,
  inline = true,
  showSummary = false,
  ...pickerProps
}: DateRangePickerDropdownProps) {
  return (
    <DateRangePicker showSummary={showSummary} {...pickerProps}>
      <DateRangePickerTrigger placeholder={placeholder} style={triggerStyle} />
      <DateRangePickerContent inline={inline}>
        <DateRangePickerCalendar
          showSummary={showSummary}
          style={[{ borderWidth: 0 }, calendarStyle]}
        >
          <DateRangePickerHeader />
          {pickerProps.presets && pickerProps.presets.length > 0 ? (
            <DateRangePickerPresets />
          ) : null}
          <DateRangePickerGrid />
          <DateRangePickerFooter>
            <View style={styles.footerRow}>
              <DateRangePickerSelection />
              <DateRangePickerClear />
            </View>
          </DateRangePickerFooter>
        </DateRangePickerCalendar>
      </DateRangePickerContent>
    </DateRangePicker>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.group,
    borderWidth: 1,
  },
  triggerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  inlineContent: {
    marginTop: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 15, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  calendarContainer: {
    borderRadius: radii.group,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.group - 2,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryArrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDurationPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  headerNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  gridContainer: {
    gap: 6,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weeksWrapper: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCellOuter: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rangeBandFull: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 4,
  },
  rangeBandRightHalf: {
    position: 'absolute',
    left: '50%',
    right: 0,
    top: 4,
    bottom: 4,
  },
  rangeBandLeftHalf: {
    position: 'absolute',
    left: 0,
    right: '50%',
    top: 4,
    bottom: 4,
  },
  dayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    position: 'absolute',
    bottom: 3,
  },
  pickerSubGrid: {
    gap: 12,
    paddingVertical: 4,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  yearChip: {
    width: '23%',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectionWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
