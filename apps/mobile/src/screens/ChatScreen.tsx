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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Display, Subtitle, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { Badge } from '../components/Badge';
import { PaperResultViewer } from '../components/PaperResultViewer';
import { colors } from '../theme/tokens';
import { ChatMessage, MOCK_INITIAL_MESSAGES } from '../services/mockData';
import { DocumentType, UserProfileRole, toApiDocumentType } from '../types';
import { apiClient, isTothApiError } from '../services/apiClient';
import { useAuth } from '../services/AuthContext';
import { styles } from '../styles/ChatScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { session } = useAuth();
  const activeRole: UserProfileRole = route.params?.activeRole || 'estudiante';
  const initialDocType: DocumentType = route.params?.documentType || 'consulta_libre';
  const docTitle = route.params?.initialTitle || 'Nueva Consulta Académica';

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [antiClicheEnabled, setAntiClicheEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType>(initialDocType);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isGenerating]);

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsGenerating(true);

    // Phase 4: real call to the RAG + Groq backend
    void (async () => {
      try {
        const result = await apiClient.generate({
          prompt: currentInput,
          profile: activeRole,
          documentType: toApiDocumentType(selectedTemplate),
          userId: session?.uid ?? 'anonymous',
        });

        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'assistant',
          content: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sourcesUsed: result.sources_used.filter(
            (s): s is 'institutional' | 'web' => s !== 'none',
          ),
          antiClicheApplied: antiClicheEnabled,
          documentType: selectedTemplate,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorText = isTothApiError(err)
          ? err.message
          : 'Error inesperado al contactar el servidor.';

        const errorMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'assistant',
          content: `⚠️ ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsGenerating(false);
      }
    })();
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
                  createdAt={`Hoy, ${msg.timestamp}`}
                  onExportPdf={() => console.log('Mock: Exporting PDF')}
                  onExportDocx={() => console.log('Mock: Exporting Word')}
                  onCopy={() => console.log('Mock: Copied')}
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

