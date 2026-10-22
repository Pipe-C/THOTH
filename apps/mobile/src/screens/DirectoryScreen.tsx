import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { CardHeader, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { loadConversations } from '../services/chatRepository';
import { useAuth } from '../services/AuthContext';
import { colors } from '../theme/tokens';
import { ConversationSummary, DocumentType, UserProfileRole } from '../types';
import { styles } from '../styles/DirectoryScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export const DirectoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { session } = useAuth();
  const [activeRole, setActiveRole] = useState<UserProfileRole>(
    route.params?.activeRole || session?.profile || 'estudiante',
  );
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

  const getDocTypeLabel = (type: DocumentType): string => {
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
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Superior con Perfil */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appTitle}>TOTH</Text>
              <MicroCopy style={styles.userEmail}>{displayEmail}</MicroCopy>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('RoleSelect', { currentRole: activeRole })}
              style={styles.profileBadge}
            >
              <Text style={styles.profileBadgeText}>
                Rol: {activeRole === 'estudiante' ? 'Estudiante' : 'Docente'} ▾
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <Button
              variant="primary"
              size="md"
              onPress={handleNewChat}
              style={styles.newChatButton}
            >
              + Nueva Consulta Académica
            </Button>
          </View>
        </View>

        {/* Barra de Filtros por Tipo de Documento */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              onPress={() => setSelectedFilter('all')}
              style={[
                styles.filterChip,
                selectedFilter === 'all' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                Todas ({items.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedFilter('informe_laboratorio')}
              style={[
                styles.filterChip,
                selectedFilter === 'informe_laboratorio' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'informe_laboratorio' && styles.filterChipTextActive,
                ]}
              >
                Laboratorios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedFilter('guia_clase')}
              style={[
                styles.filterChip,
                selectedFilter === 'guia_clase' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'guia_clase' && styles.filterChipTextActive,
                ]}
              >
                Guías de Clase
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedFilter('ensayo')}
              style={[
                styles.filterChip,
                selectedFilter === 'ensayo' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'ensayo' && styles.filterChipTextActive,
                ]}
              >
                Ensayos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedFilter('articulo_investigacion')}
              style={[
                styles.filterChip,
                selectedFilter === 'articulo_investigacion' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'articulo_investigacion' && styles.filterChipTextActive,
                ]}
              >
                Artículos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Listado de Conversaciones del Directorio */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              {isLoadingDocs ? (
                <>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <MicroCopy style={styles.emptySubtitle}>
                    Cargando historial de conversaciones...
                  </MicroCopy>
                </>
              ) : (
                <>
                  <CardHeader style={styles.emptyTitle}>
                    {loadError
                      ? 'No se pudo cargar el historial'
                      : 'Aún no hay conversaciones en esta categoría'}
                  </CardHeader>
                  <MicroCopy style={styles.emptySubtitle}>
                    {loadError ??
                      (session
                        ? 'Crea una nueva consulta para guardar el primer historial.'
                        : 'Crea una nueva consulta; en modo invitado se guardará en este dispositivo.')}
                  </MicroCopy>
                </>
              )}
            </Card>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenConversation(item)}
              style={styles.docItemCard}
            >
              <View style={styles.docHeader}>
                <Badge
                  label={getDocTypeLabel(item.documentType)}
                  variant="accent"
                />
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
                <Text style={styles.openHint}>Abrir conversación →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};
