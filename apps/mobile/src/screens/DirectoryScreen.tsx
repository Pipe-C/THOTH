import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  MessageSquareText,
  Plus,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Body, CardHeader, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { loadConversations } from '../services/chatRepository';
import { useAuth } from '../services/AuthContext';
import { colors } from '../theme/tokens';
import { ConversationSummary, DocumentType, UserProfileRole } from '../types';
import { styles } from '../styles/DirectoryScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

const DOC_FILTERS: ReadonlyArray<{
  value: 'all' | DocumentType;
  label: string;
}> = [
  { value: 'all', label: 'Todas' },
  { value: 'informe_laboratorio', label: 'Laboratorios' },
  { value: 'guia_clase', label: 'Guías de Clase' },
  { value: 'ensayo', label: 'Ensayos' },
  { value: 'articulo_investigacion', label: 'Artículos' },
];

function getDocTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'informe_laboratorio':
      return 'Informe Lab';
    case 'guia_clase':
      return 'Guía Docente';
    case 'ensayo':
      return 'Ensayo';
    case 'articulo_investigacion':
      return 'Artículo';
    case 'consulta_libre':
    default:
      return 'Consulta';
  }
}

interface EmptyHistoryProps {
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;
}

function EmptyHistory({
  isLoading,
  error,
  isGuest,
}: Readonly<EmptyHistoryProps>) {
  if (isLoading) {
    return (
      <Card style={styles.emptyCard}>
        <ActivityIndicator color={colors.primary} size="small" />
        <MicroCopy style={styles.emptySubtitle}>
          Cargando historial de conversaciones...
        </MicroCopy>
      </Card>
    );
  }

  const title = error
    ? 'No se pudo cargar el historial'
    : 'Aún no hay conversaciones en esta categoría';
  const defaultMessage = isGuest
    ? 'Crea una nueva consulta; en modo invitado se guardará en este dispositivo.'
    : 'Crea una nueva consulta para guardar el primer historial.';

  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MessageSquareText size={20} color={colors.primary} strokeWidth={1.8} />
      </View>
      <CardHeader style={styles.emptyTitle}>{title}</CardHeader>
      <Body style={styles.emptyBody}>
        {error ?? defaultMessage}
      </Body>
    </Card>
  );
}

interface ConversationCardProps {
  item: ConversationSummary;
  onOpen: (item: ConversationSummary) => void;
}

function ConversationCard({
  item,
  onOpen,
}: Readonly<ConversationCardProps>) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversación: ${item.title}`}
      onPress={() => onOpen(item)}
      style={styles.docItemCard}
    >
      <View style={styles.docHeader}>
        <Badge label={getDocTypeLabel(item.documentType)} variant="accent" />
        <View style={styles.ragBadges}>
          {item.sourcesUsed.includes('institutional') && (
            <Badge label="RAG Pascual Bravo" variant="institutional" />
          )}
          {item.sourcesUsed.includes('web') && (
            <Badge label="Web Grounding" variant="web" />
          )}
        </View>
      </View>

      <Text style={styles.docTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.docPreview} numberOfLines={2}>
        {item.preview}
      </Text>

      <View style={styles.docFooter}>
        <MicroCopy>
          Perfil: {item.profile === 'estudiante' ? 'Estudiante' : 'Docente'}
        </MicroCopy>
        <View style={styles.openHintRow}>
          <Text style={styles.openHint}>Abrir</Text>
          <ChevronRight size={14} color={colors.accentStrong} strokeWidth={2.2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const DirectoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { session, logout } = useAuth();
  const activeRole: UserProfileRole =
    route.params?.activeRole || session?.profile || 'estudiante';
  const [selectedFilter, setSelectedFilter] = useState<'all' | DocumentType>('all');
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reload history every time the screen regains focus so a conversation
  // generated in ChatScreen appears immediately.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoadingDocs(true);
      setLoadError(null);

      void loadConversations(session)
        .then((conversations) => {
          if (!isActive) return;
          setItems(conversations);
        })
        .catch(() => {
          if (!isActive) return;
          setItems([]);
          setLoadError(
            session
              ? 'No se pudo cargar el historial desde Firestore.'
              : 'No se pudo leer el historial local de este dispositivo.',
          );
        })
        .finally(() => {
          if (isActive) setIsLoadingDocs(false);
        });

      return () => {
        isActive = false;
      };
    }, [session]),
  );

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.documentType === selectedFilter;
  });

  const handleOpenConversation = (item: ConversationSummary) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      documentType: item.documentType,
      activeRole: item.profile,
      initialTitle: item.title,
    });
  };

  const displayEmail = session?.email ?? 'Invitado · historial local';

  const handleNewChat = () => {
    navigation.navigate('Chat', {
      activeRole,
      documentType: 'consulta_libre',
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que deseas salir de tu cuenta institucional?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Superior con Perfil */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.identityBlock}>
              <Text style={styles.appTitle}>TOTH</Text>
              <MicroCopy style={styles.userEmail} numberOfLines={1}>
                {displayEmail}
              </MicroCopy>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cambiar perfil académico"
              onPress={() => navigation.navigate('RoleSelect', { currentRole: activeRole })}
              style={styles.profileBadge}
            >
              <Text style={styles.profileBadgeText}>
                Rol: {activeRole === 'estudiante' ? 'Estudiante' : 'Docente'}
              </Text>
              <ChevronDown size={14} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} color={colors.surface} strokeWidth={2.4} />}
              onPress={handleNewChat}
              style={styles.newChatButton}
            >
              Nueva consulta
            </Button>
            {session ? (
              <Button
                variant="ghost"
                size="sm"
                accessibilityLabel="Cerrar sesión"
                leftIcon={<LogOut size={15} color={colors.textSecondary} strokeWidth={1.9} />}
                onPress={handleLogout}
              >
                Salir
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate('Login')}
              >
                Iniciar sesión
              </Button>
            )}
          </View>
        </View>

        {/* Barra de Filtros por Tipo de Documento */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {DOC_FILTERS.map((filter) => {
              const isActive = selectedFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setSelectedFilter(filter.value)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.value === 'all'
                      ? `${filter.label} (${items.length})`
                      : filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Listado de Conversaciones del Directorio */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyHistory
              isLoading={isLoadingDocs}
              error={loadError}
              isGuest={!session}
            />
          }
          renderItem={({ item }) => (
            <ConversationCard item={item} onOpen={handleOpenConversation} />
          )}
        />
      </View>
    </SafeAreaView>
  );
};
