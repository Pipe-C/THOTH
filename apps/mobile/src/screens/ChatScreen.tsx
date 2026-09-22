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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { Display, Subtitle, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { Badge } from '../components/Badge';
import { PaperResultViewer } from '../components/PaperResultViewer';
import { colors } from '../theme/tokens';
import { ChatMessage, MOCK_INITIAL_MESSAGES } from '../services/mockData';
import { DocumentType, UserProfileRole } from '../types';
import { styles } from '../styles/ChatScreen.styles';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
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
    setInputText('');
    setIsGenerating(true);

    // Simulation of RAG + Gemini 3.8 Flash (Phase 2 mock)
    setTimeout(() => {
      let mockAssistantResponse = '';
      if (activeRole === 'docente') {
        mockAssistantResponse = `**Plan Microcurricular y Guía de Evaluación:**\n\nCon base en el contenido programático institucional de la I.U. Pascual Bravo, la temática solicitada se estructura en tres momentos de aprendizaje:\n\n1. **Fase Conceptual:** Formulación del problema ingenieril y deducción analítica de variables de control.\n2. **Laboratorio Experimental:** Validación física en bancos de trabajo con instrumentos calibrados.\n3. **Criterio de Evaluación:** Rúbrica con 40% desempeño experimental, 30% rigor metodológico y 30% sustentación oral.\n\n*Nota institucional:* Esta guía se encuentra alineada con las competencias de egreso de la Facultad de Ingeniería.`;
      } else {
        mockAssistantResponse = `**Desarrollo Académico Fundamentado:**\n\nRevisando el pénsum y syllabus correspondiente de la I.U. Pascual Bravo, la respuesta técnica a tu consulta se desarrolla en los siguientes puntos:\n\n• **Fundamento Teórico:** Los principios matemáticos aplicados garantizan el modelado dinámico del sistema sin incurrir en aproximaciones arbitrarias.\n• **Aplicación Práctica:** En los laboratorios institucionales se implementa este procedimiento mediante protocolos estandarizados de medición.\n• **Defensa Académica:** Para sustentar este trabajo, enfócate en la relación entre los datos empíricos obtenidos y las ecuaciones de estado del modelo.\n\nEl documento cumple con los estándares exigidos para entregas académicas de la institución.`;
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        content: mockAssistantResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourcesUsed: ['institutional', 'web'],
        antiClicheApplied: antiClicheEnabled,
        documentType: selectedTemplate,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 1200);
  };

  const applyTemplate = (type: DocumentType, promptSnippet: string) => {
    setSelectedTemplate(type);
    setInputText(promptSnippet);
  };

  const handleCopyText = (content: string) => {
    Alert.alert('Copiado', 'El contenido ha sido copiado al portapapeles.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Superior Chat Header */}
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
              <Display style={styles.headerTitle} numberOfLines={1}>
                {docTitle}
              </Display>
              <MicroCopy style={styles.headerSub}>
                Modo: {activeRole === 'estudiante' ? 'Estudiante' : 'Docente'} • Gemini 3.8 Flash
              </MicroCopy>
            </View>

            <Badge
              label={activeRole === 'estudiante' ? 'Estudiante' : 'Docente'}
              variant="institutional"
            />
          </View>

          {/* Anti-Cliche fast configuration */}
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

        {/* Fast templates chips */}
        <View style={styles.templateBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateScroll}
            keyboardShouldPersistTaps="handled" // Permite clic inmediato sin cerrar teclado
          >
            {activeRole === 'estudiante' ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('informe_laboratorio', 'Redacta un informe de laboratorio sobre: [tema] siguiendo el syllabus institucional')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Informe de Laboratorio</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('ensayo', 'Escribe un ensayo académico sobre: [tema] fundamentado en el material institucional')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Ensayo Académico</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('consulta_libre', '¿Qué requisitos exige el reglamento estudiantil sobre: [consulta]?')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Consulta Reglamentos</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('guia_clase', 'Genera una guía de clase sobre: [tema] para el curso de [asignatura]')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Guía de Clase</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('articulo_investigacion', 'Redacta un artículo académico sobre: [tema] para revisión por pares')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Artículo Académico</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => applyTemplate('guia_clase', 'Estructura una rúbrica analítica de evaluación para la entrega de [proyecto]')}
                  style={styles.templateChip}
                >
                  <Text style={styles.templateChipText}>+ Rúbrica de Evaluación</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Messages and deliveries history */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <View key={msg.id} style={styles.userBubbleContainer}>
                  <View style={styles.userBubble}>
                    <Body style={styles.userBubbleText}>{msg.content}</Body>
                    <MicroCopy style={styles.timestampUser}>{msg.timestamp}</MicroCopy>
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
              <Body style={styles.generatingText}>
                Consultando RAG institucional y aplicando filtro anti-cliché...
              </Body>
            </View>
          )}
        </ScrollView>

        {/* Message entry bar */}
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