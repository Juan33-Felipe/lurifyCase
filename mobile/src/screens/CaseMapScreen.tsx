import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  AmbientBackground,
  GlassButton,
  GlassIconButton,
  HeroCard,
  Symbol,
  SymbolKey,
  Text,
  radii,
  usePalette,
  usePressFeedback,
} from '../components/apple';
import { Tab, labelKeys } from '../components/ui';
import { useCases } from '../context/CasesContext';
import { useSettings } from '../context/SettingsContext';
import { caseService } from '../services/caseService';
import { CanvasNode, NodeType } from '../types/api.types';

const NODE_TYPES: NodeType[] = ['FACT', 'EVIDENCE', 'LAW', 'JURISPRUDENCE'];

const NODE_SYMBOLS: Record<NodeType, SymbolKey> = {
  FACT: 'pushPin',
  EVIDENCE: 'folder',
  LAW: 'brand',
  JURISPRUDENCE: 'book',
};

/**
 * Tarjeta de elemento procesal (Hecho, Prueba, Ley, Jurisprudencia) con estilo Apple.
 */
function AppleNodeCard({
  node,
  active,
  onPress,
  relations,
  nodeTypeLabel,
  originLabel,
  relationsTitle,
  relationLabel,
}: {
  node: CanvasNode;
  active: boolean;
  onPress: () => void;
  relations: { id: string; outgoing: boolean; type: string; other?: CanvasNode }[];
  nodeTypeLabel: string;
  originLabel: string;
  relationsTitle: string;
  relationLabel: (type: string) => string;
}) {
  const palette = usePalette();
  const press = usePressFeedback(0.98);
  const iconName = NODE_SYMBOLS[node.type];

  return (
    <Animated.View style={press.container}>
      <Pressable
        onPress={onPress}
        {...press.handlers}
        accessibilityRole="button"
        accessibilityLabel={node.title}
        style={[
          styles.nodeCard,
          {
            backgroundColor: palette.surface,
            borderColor: active
              ? palette.mode === 'dark'
                ? 'rgba(255,255,255,0.24)'
                : 'rgba(28,28,30,0.18)'
              : palette.separator,
            shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
            shadowOpacity: active ? 0.1 : 0.04,
          },
        ]}
      >
        {/* Fila superior: Ícono circular de categoría + meta y chevron */}
        <View style={styles.nodeTopRow}>
          <View style={[styles.nodeIconCircle, { backgroundColor: palette.groupedBackground }]}>
            <Symbol name={iconName} size={17} color={palette.label} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="500" color={palette.secondaryLabel}>
              {nodeTypeLabel} • {originLabel}
            </Text>
            <Text variant="headline" numberOfLines={active ? undefined : 1} style={{ marginTop: 2 }}>
              {node.title}
            </Text>
          </View>
          <Symbol name={active ? 'chevronUp' : 'chevronDown'} size={15} color={palette.secondaryLabel} />
        </View>

        {/* Contenido / descripción del elemento */}
        <Text
          variant="subheadline"
          color={palette.secondaryLabel}
          numberOfLines={active ? undefined : 2}
          style={styles.nodeContent}
        >
          {node.content}
        </Text>

        {/* Relaciones con otros elementos cuando está desplegado */}
        {active && relations.length > 0 && (
          <View style={styles.relationsWrapper}>
            <Text variant="footnote" weight="600" color={palette.label} style={{ marginBottom: 6 }}>
              {relationsTitle}
            </Text>
            {relations.map((r) => {
              const isContradiction = r.type === 'CONTRADICTS';
              return (
                <View
                  key={r.id}
                  style={[
                    styles.relationBadge,
                    {
                      backgroundColor: isContradiction
                        ? palette.mode === 'dark' ? 'rgba(255,69,58,0.2)' : 'rgba(217,48,54,0.1)'
                        : palette.groupedBackground,
                      borderColor: isContradiction ? palette.danger : palette.separator,
                    },
                  ]}
                >
                  <Symbol
                    name={r.outgoing ? 'arrowRight' : 'arrowLeft'}
                    size={13}
                    color={isContradiction ? palette.danger : palette.label}
                  />
                  <Text
                    variant="caption"
                    weight="500"
                    color={isContradiction ? palette.danger : palette.label}
                    style={{ flex: 1 }}
                  >
                    {relationLabel(r.type)} • {r.other?.title ?? '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Pantalla de Mapa del Caso y Grafo Probatorio rediseñada con el kit estilo Apple.
 */
export default function CaseMapScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const palette = usePalette();
  const { t, language } = useSettings();
  const { selectedCase, canvas, reloadCanvas, applyCanvas } = useCases();

  const [filter, setFilter] = useState<NodeType | 'ALL'>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const graph = canvas.data?.canvas;
  const nodes = useMemo(
    () => (graph?.nodes ?? []).filter((n) => filter === 'ALL' || n.type === filter),
    [graph, filter]
  );

  const selectedNode: CanvasNode | undefined = graph?.nodes.find((n) => n.id === selectedNodeId);
  const relations = useMemo(() => {
    if (!graph || !selectedNode) return [];
    return graph.edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => {
        const outgoing = e.source === selectedNode.id;
        const other = graph.nodes.find((n) => n.id === (outgoing ? e.target : e.source));
        return { id: e.id, outgoing, type: e.relationshipType, other };
      });
  }, [graph, selectedNode]);

  const send = async () => {
    if (!selectedCase || !narrative.trim()) return;
    setSending(true);
    setSendError(false);
    try {
      const result = await caseService.postNarrativeText(selectedCase.id, narrative.trim(), language);
      applyCanvas(result.canvas);
      setNarrative('');
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <AmbientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjeta Héroe superior estilo Apple */}
          <HeroCard>
            <View style={styles.brandRow}>
              <Text variant="headline">
                Iurify <Text variant="headline" weight="500" color={palette.secondaryLabel}>Case</Text>
              </Text>
              {graph ? (
                <View style={[styles.counterPill, { backgroundColor: palette.glass.thumb }]}>
                  <Text variant="caption" weight="600" color={palette.label}>
                    {graph.nodes.length} {t('common.elements')}
                  </Text>
                </View>
              ) : (
                <GlassIconButton
                  icon="person"
                  size={36}
                  accessibilityLabel="Ajustes"
                  onPress={() => onNavigate('settings')}
                />
              )}
            </View>

            <Animated.View entering={FadeIn.duration(260)} style={styles.heroText}>
              <Text variant="subheadline" weight="500" color={palette.secondaryLabel} numberOfLines={1}>
                {selectedCase?.title ?? t('cases.subtitle')}
              </Text>
              <Text variant="display" style={styles.headline} accessibilityRole="header">
                {t('map.title')}
              </Text>
            </Animated.View>

            {/* Chips de filtro horizontal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
              style={styles.chipRowWrapper}
            >
              <Pressable
                onPress={() => setFilter('ALL')}
                style={[
                  styles.filterChip,
                  filter === 'ALL'
                    ? [styles.filterChipActive, { backgroundColor: palette.label }]
                    : [styles.filterChipInactive, { backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }],
                ]}
              >
                <Text
                  variant="caption"
                  weight={filter === 'ALL' ? '700' : '500'}
                  color={filter === 'ALL' ? palette.surface : palette.label}
                >
                  {t('common.all')}
                </Text>
              </Pressable>

              {NODE_TYPES.map((type) => {
                const isActive = filter === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setFilter(type)}
                    style={[
                      styles.filterChip,
                      isActive
                        ? [styles.filterChipActive, { backgroundColor: palette.label }]
                        : [styles.filterChipInactive, { backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }],
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight={isActive ? '700' : '500'}
                      color={isActive ? palette.surface : palette.label}
                    >
                      {t(labelKeys.filter(type))}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </HeroCard>

          {/* Cuerpo principal con los elementos */}
          <Animated.View entering={FadeInDown.duration(380).delay(80)} style={styles.body}>
            {!selectedCase ? (
              <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: palette.groupedBackground }]}>
                  <Symbol name="folderOpen" size={32} color={palette.secondaryLabel} />
                </View>
                <Text variant="headline" style={styles.emptyTitle}>
                  {t('map.noCase.title')}
                </Text>
                <Text variant="subheadline" color={palette.secondaryLabel} style={styles.emptySubtitle}>
                  {t('map.noCase.body')}
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
                  onPress={reloadCanvas}
                  style={{ marginTop: 16, width: '100%' }}
                />
              </View>
            ) : (
              <>
                {/* Lista de Elementos Procesales */}
                {graph && graph.nodes.length > 0 ? (
                  nodes.length === 0 ? (
                    <View style={[styles.emptyFilterCard, { backgroundColor: palette.surface }]}>
                      <Symbol name="search" size={24} color={palette.secondaryLabel} />
                      <Text variant="subheadline" color={palette.secondaryLabel} style={{ textAlign: 'center' }}>
                        {t('map.noNodesFilter')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.nodesList}>
                      {nodes.map((node) => {
                        const active = node.id === selectedNodeId;
                        return (
                          <AppleNodeCard
                            key={node.id}
                            node={node}
                            active={active}
                            onPress={() => setSelectedNodeId(active ? null : node.id)}
                            relations={active ? relations : []}
                            nodeTypeLabel={t(labelKeys.nodeType(node.type))}
                            originLabel={
                              node.origin === 'AI_GENERATED' ? t('map.aiGenerated') : t('map.userCreated')
                            }
                            relationsTitle={t('map.relations')}
                            relationLabel={(type) => t(labelKeys.relation(type))}
                          />
                        );
                      })}
                    </View>
                  )
                ) : (
                  <View style={[styles.emptyCard, { backgroundColor: palette.surface }]}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: palette.groupedBackground }]}>
                      <Symbol name="folder" size={32} color={palette.secondaryLabel} />
                    </View>
                    <Text variant="headline" style={styles.emptyTitle}>
                      {t('map.empty.title')}
                    </Text>
                    <Text variant="subheadline" color={palette.secondaryLabel} style={styles.emptySubtitle}>
                      {t('map.empty.body')}
                    </Text>
                  </View>
                )}

                {/* Tarjeta de Ingesta Conversacional / Narrativa IA (FR-001) */}
                <View
                  style={[
                    styles.narrativeCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.separator,
                      shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
                    },
                  ]}
                >
                  <View style={styles.narrativeHeader}>
                    <View style={[styles.nodeIconCircle, { backgroundColor: palette.groupedBackground }]}>
                      <Symbol name="edit" size={17} color={palette.label} />
                    </View>
                    <Text variant="headline" style={{ flex: 1 }}>
                      {t('map.narrative.title')}
                    </Text>
                  </View>

                  <TextInput
                    placeholder={t('map.narrative.placeholder')}
                    placeholderTextColor={palette.placeholder}
                    value={narrative}
                    onChangeText={setNarrative}
                    multiline
                    selectionColor={palette.label}
                    keyboardAppearance={palette.mode}
                    style={[
                      styles.narrativeInput,
                      {
                        backgroundColor: palette.groupedBackground,
                        borderColor: palette.separator,
                        color: palette.label,
                      },
                    ]}
                  />

                  {sendError && (
                    <Text variant="footnote" color={palette.danger}>
                      {t('common.networkError')}
                    </Text>
                  )}

                  <GlassButton
                    label={sending ? t('map.narrative.sending') : t('map.narrative.send')}
                    icon="sparkles"
                    onPress={send}
                    loading={sending}
                    disabled={!narrative.trim()}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroText: {
    marginTop: 22,
    gap: 4,
  },
  headline: {
    marginTop: 2,
  },
  chipRowWrapper: {
    marginTop: 18,
    marginHorizontal: -22,
  },
  chipScroll: {
    paddingHorizontal: 22,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  filterChipActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipInactive: {},
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
  },
  nodesList: {
    gap: 12,
  },
  nodeCard: {
    borderRadius: radii.group,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  nodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeContent: {
    marginTop: 10,
    lineHeight: 19,
  },
  relationsWrapper: {
    marginTop: 14,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  relationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  narrativeCard: {
    borderRadius: radii.group,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  narrativeInput: {
    minHeight: 96,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
    textAlignVertical: 'top',
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
  emptyFilterCard: {
    borderRadius: radii.group,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
