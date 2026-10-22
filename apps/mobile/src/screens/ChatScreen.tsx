import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Badge } from '../components/Badge';
import { PaperResultViewer } from '../components/PaperResultViewer';
import { colors } from '../theme/tokens';
import { ChatMessage, DocumentType, UserProfileRole, toApiDocumentType } from '../types';
import { apiClient, isTothApiError } from '../services/apiClient';
import {
  appendMessage,
  createConversation,
  loadMessages,
  updateConversation,
} from '../services/chatRepository';
import { useAuth } from '../services/AuthContext';
import {
  DOCX_MIME_TYPE,
  PDF_MIME_TYPE,
  exportDocumentToPdf,
  exportDocumentToWord,
  publishExportedDocument,
  saveLocalRoomDocument,
  shareExportedDocument,
  type PublishedDocument,
} from '../services/nativeBridge';
import { styles } from '../styles/ChatScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const DEFAULT_TITLE = 'Nueva Consulta Académica';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return '';
}

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatResultDate(createdAt: number): string {
  const date = new Date(createdAt);
  return `${date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
  })}, ${formatTime(createdAt)}`;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeConversationTitle(prompt: string, fallback: string): string {
  if (fallback !== DEFAULT_TITLE) return fallback;

  const compact = prompt.replace(/\s+/g, ' ').trim();
  if (!compact) return fallback;
  return compact.length > 64 ? `${compact.slice(0, 61)}...` : compact;
}

function announceExport(label: string, document: PublishedDocument): void {
  const location = document.published
    ? `Guardado en ${document.location}.`
    : `Archivo generado en:\n${document.location}`;

  Alert.alert(`${label} listo`, location, [
    {
      text: 'Compartir',
      onPress: () => {
        void shareExportedDocument(document.uri, document.mimeType).catch(() => {
          Alert.alert('Error', 'No fue posible abrir el menú para compartir el archivo.');
        });
      },
    },
    { text: 'Aceptar', style: 'cancel' },
  ]);
}

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { session } = useAuth();
  const initialConversationId = route.params?.conversationId;
  const activeRole: UserProfileRole = route.params?.activeRole || 'estudiante';
  const initialDocType: DocumentType = route.params?.documentType || 'consulta_libre';
  const initialTitle = route.params?.initialTitle || DEFAULT_TITLE;

  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId,
  );
  const [docTitle, setDocTitle] = useState(initialTitle);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(
    Boolean(initialConversationId),
  );
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [antiClicheEnabled, setAntiClicheEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType>(initialDocType);

  const scrollViewRef = useRef<ScrollView>(null);
  const persistenceWarningShown = useRef(false);

  useEffect(() => {
    if (!initialConversationId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return undefined;
    }

    let isActive = true;
    setMessages([]);
    setIsLoadingHistory(true);
    setHistoryError(null);

    void loadMessages(session, initialConversationId)
      .then((loaded) => {
        if (!isActive) return;
        setMessages(loaded);
        setConversationId(initialConversationId);
      })
      .catch(() => {
        if (!isActive) return;
        setHistoryError(
          'No se pudo cargar esta conversación. Revisa tu sesión o la conexión.',
        );
      })
      .finally(() => {
        if (isActive) setIsLoadingHistory(false);
      });

    return () => {
      isActive = false;
    };
  }, [initialConversationId, session]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isGenerating]);

  const warnPersistence = () => {
    if (persistenceWarningShown.current) return;
    persistenceWarningShown.current = true;
    Alert.alert(
      'Historial no guardado',
      'La respuesta se generó, pero no se pudo guardar la conversación. Revisa tu sesión o la conexión.',
    );
  };

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;

    const currentInput = inputText.trim();
    const createdAt = Date.now();
    const activeId = conversationId ?? createId('conv');
    const isNewConversation = !conversationId;
    const nextTitle = isNewConversation
      ? makeConversationTitle(currentInput, docTitle)
      : docTitle;

    const userMsg: ChatMessage = {
      id: createId('msg'),
      sender: 'user',
      content: currentInput,
      createdAt,
      timestamp: formatTime(createdAt),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    if (isNewConversation) {
      setConversationId(activeId);
      setDocTitle(nextTitle);
    }

    void (async () => {
      let canPersist = true;

      try {
        if (isNewConversation) {
          await createConversation(session, {
            id: activeId,
            title: nextTitle,
            preview: currentInput.slice(0, 180),
            documentType: selectedTemplate,
            profile: activeRole,
            sourcesUsed: [],
            createdAt,
            updatedAt: createdAt,
          });
        } else {
          await updateConversation(session, activeId, {
            documentType: selectedTemplate,
            updatedAt: createdAt,
          });
        }
        await appendMessage(session, activeId, userMsg);
      } catch {
        canPersist = false;
        warnPersistence();
      }

      try {
        const result = await apiClient.generate({
          prompt: currentInput,
          profile: activeRole,
          documentType: toApiDocumentType(selectedTemplate),
          userId: session?.uid ?? 'anonymous',
          antiClicheEnabled,
        });

        const sourcesUsed = result.sources_used.filter(
          (source): source is 'institutional' | 'web' => source !== 'none',
        );

        const assistantCreatedAt = Date.now();
        const assistantMsg: ChatMessage = {
          id: createId('msg'),
          sender: 'assistant',
          content: result.text,
          createdAt: assistantCreatedAt,
          timestamp: formatTime(assistantCreatedAt),
          sourcesUsed,
          antiClicheApplied: antiClicheEnabled,
          documentType: selectedTemplate,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Caché offline local (Room/SQLite) vía bridge Kotlin
        void saveLocalRoomDocument({
          id: assistantMsg.id,
          title: nextTitle,
          content: result.text,
          documentType: selectedTemplate,
          profile: activeRole,
          createdAt: assistantCreatedAt,
        });

        if (canPersist) {
          try {
            await appendMessage(session, activeId, assistantMsg);
            await updateConversation(session, activeId, {
              preview: result.text.slice(0, 180),
              documentType: selectedTemplate,
              sourcesUsed,
              updatedAt: assistantCreatedAt,
            });
          } catch {
            warnPersistence();
          }
        }
      } catch (err) {
        const errorText = isTothApiError(err)
          ? err.message
          : 'Error inesperado al contactar el servidor.';

        const errorCreatedAt = Date.now();
        const errorMsg: ChatMessage = {
          id: createId('msg'),
          sender: 'assistant',
          content: `⚠️ ${errorText}`,
          createdAt: errorCreatedAt,
          timestamp: formatTime(errorCreatedAt),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const handleExportPdf = async (msg: ChatMessage) => {
    try {
      const filePath = await exportDocumentToPdf({
        title: docTitle,
        content: msg.content,
      });
      const document = await publishExportedDocument(filePath, PDF_MIME_TYPE);
      announceExport('PDF', document);
    } catch (err) {
      const detail = getErrorMessage(err);
      Alert.alert(
        'Error',
        `No fue posible exportar el documento PDF.${detail ? `\n${detail}` : ''}`,
      );
    }
  };

  const handleExportDocx = async (msg: ChatMessage) => {
    try {
      const filePath = await exportDocumentToWord({
        title: docTitle,
        content: msg.content,
      });
      const document = await publishExportedDocument(filePath, DOCX_MIME_TYPE);
      announceExport('Word (.docx)', document);
    } catch (err) {
      const detail = getErrorMessage(err);
      Alert.alert(
        'Error',
        `No fue posible exportar el documento Word.${detail ? `\n${detail}` : ''}`,
      );
    }
  };

  const handleCopy = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('Copiado', 'Contenido copiado al portapapeles.');
  };

  const applyTemplate = (type: DocumentType, promptSnippet: string) => {
    setSelectedTemplate(type);
    setInputText(promptSnippet);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header Superior del Chat */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {docTitle}
              </Text>
              <MicroCopy style={styles.headerSub}>
                Modo: {activeRole === 'estudiante' ? 'Estudiante' : 'Docente'} • Groq GPT-OSS 120B
              </MicroCopy>
            </View>

            <Badge
              label={activeRole === 'estudiante' ? 'Estudiante' : 'Docente'}
              variant="institutional"
            />
          </View>

          {/* Configuración Rápida Anti-Cliché */}
          <View style={styles.antiClicheBar}>
            <Toggle
              label="Filtro Anti-Cliché"
              description="Elimina muletillas y patrones sintácticos de IA"
              value={antiClicheEnabled}
              onValueChange={setAntiClicheEnabled}
              containerStyle={styles.toggleContainer}
            />
          </View>
        </View>

        {/* Chips de Plantillas Rápidas */}
        <View style={styles.templateBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
            {activeRole === 'estudiante' ? (
              <>
                <TouchableOpacity
                  onPress={() => applyTemplate('informe_laboratorio', 'Redacta un informe de laboratorio sobre: [tema] siguiendo el syllabus institucional')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Informe de Laboratorio</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => applyTemplate('ensayo', 'Escribe un ensayo académico sobre: [tema] fundamentado en el material institucional')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Ensayo Académico</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => applyTemplate('consulta_libre', '¿Qué requisitos exige el reglamento estudiantil sobre: [consulta]?')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Consulta Reglamentos</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => applyTemplate('guia_clase', 'Genera una guía de clase sobre: [tema] para el curso de [asignatura]')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Guía de Clase</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => applyTemplate('articulo_investigacion', 'Redacta un artículo académico sobre: [tema] para revisión por pares')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Artículo Académico</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => applyTemplate('guia_clase', 'Estructura una rúbrica analítica de evaluación para la entrega de [proyecto]')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Rúbrica de Evaluación</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Historial de Mensajes y Entregables */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {historyError ? (
            <View style={styles.historyError}>
              <Text style={styles.historyErrorText}>{historyError}</Text>
            </View>
          ) : null}

          {isLoadingHistory ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.generatingText}>Cargando historial...</Text>
            </View>
          ) : null}

          {!isLoadingHistory && messages.length === 0 && !historyError ? (
            <Card style={styles.emptyChatCard}>
              <CardHeader style={styles.emptyChatTitle}>
                Inicia una conversación académica
              </CardHeader>
              <Body style={styles.emptyChatBody}>
                Formula tu consulta y TOTH priorizará el fondo documental del Pascual
                Bravo antes de complementar con búsqueda web.
              </Body>
              <MicroCopy>
                {session
                  ? 'Tu historial se guardará en la nube y aparecerá en el directorio.'
                  : 'Modo invitado: el historial queda guardado en este dispositivo.'}
              </MicroCopy>
            </Card>
          ) : null}

          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <View key={msg.id} style={styles.userBubbleContainer}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{msg.content}</Text>
                    <Text style={styles.timestampUser}>{msg.timestamp}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id} style={styles.assistantViewerContainer}>
                <PaperResultViewer
                  title="Respuesta Académica TOTH"
                  content={msg.content}
                  sourcesUsed={msg.sourcesUsed || ['institutional']}
                  antiClicheApplied={msg.antiClicheApplied ?? true}
                  createdAt={formatResultDate(msg.createdAt)}
                  onExportPdf={() => void handleExportPdf(msg)}
                  onExportDocx={() => void handleExportDocx(msg)}
                  onCopy={() => handleCopy(msg.content)}
                />
              </View>
            );
          })}

          {isGenerating && (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.generatingText}>
                Consultando RAG institucional y aplicando filtro anti-cliché...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Barra de Entrada de Mensaje */}
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu consulta o petición académica..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!inputText.trim() || isGenerating}
              onPress={handleSend}
              style={[
                styles.sendButton,
                (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
          <MicroCopy style={styles.ragDisclaimer}>
            Prioridad: Fondo institucional Pascual Bravo • Web grounding como complemento
          </MicroCopy>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
