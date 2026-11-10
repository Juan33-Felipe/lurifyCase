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
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSettings, useTheme } from '../../context/SettingsContext';
import { fonts, radius } from '../../theme/theme';

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
  visibleMonth: { year: number; month: number }; // month: 0..11
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Start a new range
        setRange({ from: dateStr, to: null });
      } else {
        // Complete the range
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

  const goToMonth = useCallback(
    (year: number, month: number) => {
      setVisibleMonth((prev) => {
        const prevTotal = prev.year * 12 + prev.month;
        const nextTotal = year * 12 + month;
        setDirection(nextTotal >= prevTotal ? 'right' : 'left');
        return { year, month };
      });
    },
    []
  );

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
  const palette = useTheme();
  const { t } = useSettings();
  const { range, locale, label, open, setOpen, disabled } = useDateRangePicker();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(!open)}
        onPressIn={() => scale.set(withSpring(0.98, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={[
          styles.trigger,
          {
            backgroundColor: palette.secondaryCard,
            borderColor: open ? palette.charcoal : palette.border,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <View style={[styles.triggerIconWrap, { backgroundColor: palette.charcoal }]}>
          <Icon name="date-range" size={18} color="#FFFFFF" />
        </View>

        <View style={{ flex: 1 }}>
          {label ? (
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 11.5,
                color: palette.textMuted,
                marginBottom: 2,
              }}
            >
              {label}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: hasSelection ? fonts.semibold : fonts.body,
              fontSize: 13.5,
              color: hasSelection ? palette.text : palette.textMuted,
            }}
          >
            {displayText}
          </Text>
        </View>

        {totalDays > 0 ? (
          <View style={[styles.daysCountBadge, { backgroundColor: palette.charcoal }]}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 11, color: '#FFFFFF' }}>
              {totalDays}d
            </Text>
          </View>
        ) : null}

        <Icon
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20}
          color={palette.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Content (Popover/Modal)                        */
/* -------------------------------------------------------------------------- */

export function DateRangePickerContent({
  radius: cornerRadius = 24,
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
  const palette = useTheme();
  const { open, setOpen } = useDateRangePicker();

  if (!open) return null;

  if (inline) {
    return (
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(140)}
        style={[
          styles.inlineContent,
          {
            borderRadius: cornerRadius,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: shadow ? palette.shadow : 'transparent',
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
          entering={FadeIn.duration(180)}
          style={[
            styles.modalCard,
            {
              borderRadius: cornerRadius,
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.border,
              shadowColor: shadow ? palette.shadow : 'transparent',
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
  const palette = useTheme();
  const { showSummary: contextShowSummary } = useDateRangePicker();
  const displaySummary = showSummaryProp !== undefined ? showSummaryProp : contextShowSummary;

  return (
    <View
      style={[
        styles.calendarContainer,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
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
  const palette = useTheme();
  const { t } = useSettings();
  const { range, locale } = useDateRangePicker();
  const totalDays = diffDaysYMD(range.from, range.to);

  return (
    <View
      style={[
        styles.summaryBar,
        {
          backgroundColor: palette.secondaryCard,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <View style={styles.summaryColumn}>
        <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>
          {t('audit.deadline.from')}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.summaryValue,
            { color: range.from ? palette.text : palette.textMuted },
          ]}
        >
          {formatReadableDate(range.from, locale)}
        </Text>
      </View>

      <View style={[styles.summaryArrowBadge, { backgroundColor: palette.surface }]}>
        <Icon name="arrow-forward" size={14} color={palette.textMuted} />
      </View>

      <View style={[styles.summaryColumn, { alignItems: 'flex-end' }]}>
        <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>
          {t('audit.deadline.to')}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.summaryValue,
            { color: range.to ? palette.text : palette.textMuted },
          ]}
        >
          {formatReadableDate(range.to, locale)}
        </Text>
      </View>

      {totalDays > 0 ? (
        <View style={[styles.summaryDurationPill, { backgroundColor: palette.charcoal }]}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 11.5, color: '#FFFFFF' }}>
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
  const palette = useTheme();
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
            { backgroundColor: palette.secondaryCard, borderColor: palette.border },
          ]}
        >
          <Icon name="keyboard-double-arrow-left" size={18} color={palette.text} />
        </Pressable>
        <Pressable
          onPress={prevMonth}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            { backgroundColor: palette.secondaryCard, borderColor: palette.border },
          ]}
        >
          <Icon name="chevron-left" size={20} color={palette.text} />
        </Pressable>
      </View>

      <Pressable
        onPress={toggleMonthYearPicker}
        style={[
          styles.monthTitleButton,
          {
            backgroundColor: viewMode !== 'days' ? palette.charcoal : palette.secondaryCard,
            borderColor: viewMode !== 'days' ? palette.charcoal : palette.border,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 14.5,
            color: viewMode !== 'days' ? '#FFFFFF' : palette.text,
          }}
        >
          {monthTitle}
        </Text>
        <Icon
          name={viewMode === 'days' ? 'expand-more' : 'expand-less'}
          size={18}
          color={viewMode !== 'days' ? '#FFFFFF' : palette.textMuted}
        />
      </Pressable>

      <View style={styles.headerNavGroup}>
        <Pressable
          onPress={nextMonth}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            { backgroundColor: palette.secondaryCard, borderColor: palette.border },
          ]}
        >
          <Icon name="chevron-right" size={20} color={palette.text} />
        </Pressable>
        <Pressable
          onPress={nextYear}
          hitSlop={6}
          style={[
            styles.navIconBtn,
            { backgroundColor: palette.secondaryCard, borderColor: palette.border },
          ]}
        >
          <Icon name="keyboard-double-arrow-right" size={18} color={palette.text} />
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
  const palette = useTheme();
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

  const todayYMD = useMemo(() => formatYMD(new Date()), []);
  const weekdayLabels = language === 'es' ? WEEKDAY_ES : WEEKDAY_EN;

  const weeks = useMemo<CalendarDayCell[][]>(() => {
    const { year, month } = visibleMonth;
    const firstOfMonth = new Date(year, month, 1, 12, 0, 0);
    const startWeekday = firstOfMonth.getDay(); // 0 (Sun) .. 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0, 12, 0, 0).getDate();

    const cells: CalendarDayCell[] = [];

    // Leading days from previous month
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

    // Current month days
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

    // Trailing days to complete 6 rows (42 cells) for consistent calendar height
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

  // Direct Month & Year selector view
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
        {/* Year strip */}
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
                    backgroundColor: active ? palette.charcoal : palette.secondaryCard,
                    borderColor: active ? palette.charcoal : palette.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: active ? fonts.heading : fonts.medium,
                    fontSize: 13,
                    color: active ? '#FFFFFF' : palette.text,
                  }}
                >
                  {yr}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 12 Months grid */}
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
                    backgroundColor: active ? palette.charcoal : palette.secondaryCard,
                    borderColor: active ? palette.charcoal : palette.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: active ? fonts.heading : fonts.semibold,
                    fontSize: 13.5,
                    color: active ? '#FFFFFF' : palette.text,
                  }}
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
      {/* Weekday Header Row */}
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((dayName) => (
          <View key={dayName} style={styles.weekdayCell}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12,
                color: palette.textMuted,
              }}
            >
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      {/* Animated Month Page */}
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
  const palette = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rangeBandColor =
    palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(36, 36, 38, 0.09)';

  return (
    <View style={styles.dayCellOuter}>
      {/* Continuous range connector strip */}
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
              backgroundColor: palette.charcoal,
              shadowColor: palette.shadow,
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            },
            !isSelectedEndpoint &&
              cell.isToday && {
                borderWidth: 1.5,
                borderColor: palette.charcoal,
              },
          ]}
        >
          <Text
            style={{
              fontFamily: isSelectedEndpoint
                ? fonts.heading
                : cell.isToday
                  ? fonts.heading
                  : fonts.medium,
              fontSize: 13.5,
              color: isSelectedEndpoint
                ? '#FFFFFF'
                : disabled
                  ? palette.textMuted + '55'
                  : !cell.inCurrentMonth
                    ? palette.textMuted + '88'
                    : palette.text,
            }}
          >
            {cell.dayNumber}
          </Text>
          {cell.isToday ? (
            <View
              style={[
                styles.todayDot,
                {
                  backgroundColor: isSelectedEndpoint ? '#FFFFFF' : palette.charcoal,
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
  const palette = useTheme();
  const { range, selectPreset, disabled } = useDateRangePicker();
  const isActive = range.from === value.from && range.to === value.to && Boolean(value.from);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => selectPreset(value)}
      style={[
        styles.presetChip,
        {
          backgroundColor: isActive ? palette.charcoal : palette.secondaryCard,
          borderColor: isActive ? palette.charcoal : palette.border,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: isActive ? fonts.heading : fonts.medium,
          fontSize: 12.5,
          color: isActive ? '#FFFFFF' : palette.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
  const palette = useTheme();
  return (
    <View style={[styles.footerContainer, { borderTopColor: palette.border }, style]}>
      {children}
    </View>
  );
}

export function DateRangePickerSelection({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = useTheme();
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
      <Icon name="event-available" size={16} color={palette.textMuted} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.medium,
          fontSize: 12.5,
          color: range.from ? palette.text : palette.textMuted,
          flexShrink: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export function DateRangePickerClear({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = useTheme();
  const { t } = useSettings();
  const { range, clear, disabled } = useDateRangePicker();

  if (!range.from && !range.to) return null;

  return (
    <Pressable
      disabled={disabled}
      onPress={clear}
      style={[
        styles.clearBtn,
        {
          backgroundColor: palette.secondaryCard,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Icon name="restart-alt" size={14} color={palette.textMuted} />
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 12,
          color: palette.text,
        }}
      >
        {t('audit.deadline.clear')}
      </Text>
    </Pressable>
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
    borderRadius: radius.md,
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
    paddingVertical: 4,
    borderRadius: 999,
  },
  inlineContent: {
    marginTop: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 22, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  calendarContainer: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontFamily: fonts.heading,
    fontSize: 13,
    marginTop: 2,
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
    paddingVertical: 5,
    borderRadius: 999,
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
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
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
    paddingVertical: 7,
    borderRadius: 999,
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
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
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
    paddingVertical: 11,
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
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
