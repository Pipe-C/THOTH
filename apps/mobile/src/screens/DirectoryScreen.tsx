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
import { Display, Subtitle, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MOCK_DIRECTORY_ITEMS, MOCK_CURRENT_USER } from '../services/mockData';
import { getUserDocuments } from '../services/firestoreClient';
import { useAuth } from '../services/AuthContext';
import { colors } from '../theme/tokens';
import { DocumentHistoryItem, DocumentType, UserProfileRole } from '../types';
import { styles } from '../styles/DirectoryScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

export const DirectoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { session } = useAuth();
  const [activeRole, setActiveRole] = useState<UserProfileRole>(
    route.params?.activeRole || session?.profile || 'estudiante'
  );
  const [selectedFilter, setSelectedFilter] = useState<'all' | DocumentType>('all');
  // Start with mock items while real data loads
  const [items, setItems] = useState<DocumentHistoryItem[]>(MOCK_DIRECTORY_ITEMS);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Reload Firestore history every time the screen regains focus so a
  // document generated in ChatScreen appears immediately.
  useFocusEffect(
    useCallback(() => {
      if (!session) return undefined;

      let isActive = true;
      setIsLoadingDocs(true);

      void getUserDocuments(session.uid, session.idToken).then((docs) => {
        if (!isActive) return;
        if (docs.length > 0) setItems(docs);
        setIsLoadingDocs(false);
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

  const handleOpenDoc = (item: DocumentHistoryItem) => {
    navigation.navigate('Chat', {
      docId: item.id,
      documentType: item.documentType,
      activeRole: item.profile,
      initialTitle: item.title,
    });
  };

  const displayEmail = session?.email ?? MOCK_CURRENT_USER.email;

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
                Todos ({items.length})
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

        {/* Listado de Documentos del Directorio */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoadingDocs ? (
              <Card style={styles.emptyCard}>
                <ActivityIndicator color={colors.primary} size="small" />
                <MicroCopy style={styles.emptySubtitle}>
                  Cargando documentos desde Firestore...
                </MicroCopy>
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <CardHeader style={styles.emptyTitle}>No hay documentos en esta categoría</CardHeader>
                <MicroCopy style={styles.emptySubtitle}>
                  Crea una nueva consulta para generar entregables con RAG institucional.
                </MicroCopy>
              </Card>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenDoc(item)}
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

