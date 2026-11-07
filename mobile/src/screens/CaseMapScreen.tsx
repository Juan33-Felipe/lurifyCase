import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import {
  Chip,
  EmptyState,
  ErrorState,
  GlassButton,
  GlassInput,
  LoadingState,
  Reveal,
  ScreenHeader,
  Tab,
  WavePatternBackground,
  labelKeys,
} from '../components/ui';
import { useCases } from '../context/CasesContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { caseService } from '../services/caseService';
import { fonts, radius } from '../theme/theme';
import { CanvasNode, NodeType } from '../types/api.types';

const NODE_TYPES: NodeType[] = ['FACT', 'EVIDENCE', 'LAW', 'JURISPRUDENCE'];
const NODE_ICONS: Record<NodeType, React.ComponentProps<typeof Icon>['name']> = {
  FACT: 'push-pin',
  EVIDENCE: 'folder-special',
  LAW: 'account-balance',
  JURISPRUDENCE: 'menu-book',
};

export default function CaseMapScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const palette = useTheme();
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
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={t('map.title')}
        subtitle={selectedCase?.title ?? t('cases.subtitle')}
        right={
          graph ? (
            <View
              style={[
                styles.counterBadge,
                {
                  backgroundColor: palette.secondaryCard,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: palette.text }}>
                {graph.nodes.length}
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: palette.textMuted }}>
                {t('common.elements')}
              </Text>
            </View>
          ) : undefined
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!selectedCase ? (
          <EmptyState
            icon="folder-open"
            title={t('map.noCase.title')}
            body={t('map.noCase.body')}
            actionLabel={t('nav.cases')}
            onAction={() => onNavigate('cases')}
          />
        ) : canvas.loading && !canvas.data ? (
          <LoadingState />
        ) : canvas.error ? (
          <ErrorState onRetry={reloadCanvas} />
        ) : (
          <>
            {/* Category Filter Chips (Facts, Evidence, Statutes, Precedents) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip
                label={t('common.all')}
                active={filter === 'ALL'}
                onPress={() => setFilter('ALL')}
              />
              {NODE_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={t(labelKeys.filter(type))}
                  active={filter === type}
                  onPress={() => setFilter(type)}
                />
              ))}
            </ScrollView>

            {/* Case Elements List */}
            {graph && graph.nodes.length > 0 ? (
              nodes.length === 0 ? (
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: fonts.body,
                    color: palette.textMuted,
                    paddingVertical: 18,
                  }}
                >
                  {t('map.noNodesFilter')}
                </Text>
              ) : (
                <View style={styles.nodesList}>
                  {nodes.map((node, i) => {
                    const active = node.id === selectedNodeId;
                    return (
                      <Reveal key={node.id} index={Math.min(i, 8)}>
                        <Pressable onPress={() => setSelectedNodeId(active ? null : node.id)}>
                          <View
                            style={[
                              styles.nodeCard,
                              active
                                ? {
                                    backgroundColor: palette.charcoal,
                                    borderColor: palette.charcoal,
                                    shadowColor: palette.shadow,
                                    shadowOpacity: 0.16,
                                  }
                                : {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                    shadowColor: palette.shadow,
                                    shadowOpacity: 0.04,
                                  },
                            ]}
                          >
                            {active ? <WavePatternBackground variant="card" /> : null}
                            <View style={styles.nodeTopRow}>
                              <View
                                style={[
                                  styles.nodeIconCircle,
                                  {
                                    backgroundColor: active ? '#FFFFFF' : palette.secondaryCard,
                                  },
                                ]}
                              >
                                <Icon name={NODE_ICONS[node.type]} size={18} color="#1E1E20" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontFamily: fonts.medium,
                                    fontSize: 11.5,
                                    color: active ? palette.onCharcoalMuted : palette.textMuted,
                                  }}
                                >
                                  {t(labelKeys.nodeType(node.type))} •{' '}
                                  {node.origin === 'AI_GENERATED'
                                    ? t('map.aiGenerated')
                                    : t('map.userCreated')}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: fonts.heading,
                                    fontSize: 16,
                                    color: active ? palette.onCharcoal : palette.text,
                                    marginTop: 2,
                                  }}
                                >
                                  {node.title}
                                </Text>
                              </View>
                              <Icon
                                name={active ? 'expand-less' : 'expand-more'}
                                size={22}
                                color={active ? palette.onCharcoalMuted : palette.textMuted}
                              />
                            </View>

                            <Text
                              numberOfLines={active ? undefined : 2}
                              style={{
                                fontFamily: fonts.body,
                                fontSize: 13.5,
                                lineHeight: 19.5,
                                color: active ? palette.onCharcoalMuted : palette.textMuted,
                                marginTop: 10,
                              }}
                            >
                              {node.content}
                            </Text>

                            {active && relations.length > 0 ? (
                              <View style={styles.relationsSection}>
                                <Text
                                  style={{
                                    fontFamily: fonts.semibold,
                                    fontSize: 12,
                                    color: palette.onCharcoal,
                                    marginBottom: 6,
                                  }}
                                >
                                  {t('map.relations')}
                                </Text>
                                {relations.map((r) => (
                                  <View
                                    key={r.id}
                                    style={[
                                      styles.relationBadge,
                                      {
                                        backgroundColor:
                                          r.type === 'CONTRADICTS'
                                            ? 'rgba(229, 72, 77, 0.22)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                      },
                                    ]}
                                  >
                                    <Icon
                                      name={r.outgoing ? 'arrow-forward' : 'arrow-back'}
                                      size={15}
                                      color="#FFFFFF"
                                    />
                                    <Text
                                      style={{
                                        flex: 1,
                                        fontFamily: fonts.medium,
                                        fontSize: 12.5,
                                        color: '#FFFFFF',
                                      }}
                                    >
                                      {t(labelKeys.relation(r.type))} • {r.other?.title ?? '—'}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      </Reveal>
                    );
                  })}
                </View>
              )
            ) : (
              <EmptyState icon="hub" title={t('map.empty.title')} body={t('map.empty.body')} />
            )}

            {/* Conversational Narrative Ingestion Card (FR-001) */}
            <Reveal index={1}>
              <View
                style={[
                  styles.narrativeCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    shadowColor: palette.shadow,
                  },
                ]}
              >
                <View style={styles.narrativeHeader}>
                  <View
                    style={[
                      styles.nodeIconCircle,
                      { backgroundColor: palette.secondaryCard },
                    ]}
                  >
                    <Icon name="edit-note" size={20} color="#1E1E20" />
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.heading,
                      fontSize: 17,
                      color: palette.text,
                    }}
                  >
                    {t('map.narrative.title')}
                  </Text>
                </View>

                <GlassInput
                  placeholder={t('map.narrative.placeholder')}
                  value={narrative}
                  onChangeText={setNarrative}
                  multiline
                  style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 14 }}
                />

                {sendError ? (
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: palette.danger }}>
                    {t('common.networkError')}
                  </Text>
                ) : null}

                <GlassButton
                  label={sending ? t('map.narrative.sending') : t('map.narrative.send')}
                  icon="auto-awesome"
                  onPress={send}
                  loading={sending}
                  disabled={!narrative.trim()}
                />
              </View>
            </Reveal>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 18,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipRow: {
    gap: 8,
  },
  nodesList: {
    gap: 12,
  },
  nodeCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  nodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationsSection: {
    marginTop: 14,
    gap: 8,
  },
  relationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  narrativeCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
