/**
 * Mock data for Phase 2 Academic Delivery
 */

import { DocumentHistoryItem, User, UserProfileRole } from '../types';

export const MOCK_CURRENT_USER: User = {
  uid: 'user_pascual_101',
  email: 'estudiante.demo@pascualbravo.edu.co',
  displayName: 'Juan David Restrepo',
  activeProfile: 'estudiante',
};

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sourcesUsed?: ('institutional' | 'web')[];
  antiClicheApplied?: boolean;
  documentType?: string;
}

export const MOCK_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'user',
    content: '¿Cómo se estructura el informe final para el laboratorio de Circuitos Digitales según el syllabus del Pascual Bravo?',
    timestamp: '10:14 AM',
  },
  {
    id: 'msg_2',
    sender: 'assistant',
    content: `De acuerdo con el syllabus institucional de Circuitos Digitales de la I.U. Pascual Bravo, el informe final de laboratorio debe articularse en cinco secciones principales:

1. **Marco Teórico y Tablas de Verdad:** Justificación matemática y lógica del circuito implementado (mapas de Karnaugh y simplificación booleana).
2. **Esquema de Simulación:** Captura y validación en software con cronogramas de temporización.
3. **Registro Fotográfico y Mediciones:** Comparativa entre los valores teóricos y los voltajes/frecuencias medidos en el osciloscopio del laboratorio.
4. **Análisis de Discrepancias:** Explicación técnica de retardos de propagación o ruidos electromagnéticos observados.
5. **Conclusiones Técnicas:** Verificación del cumplimiento de las especificaciones de diseño.

Recuerda adjuntar las hojas de datos de los circuitos integrados utilizados en el anexo técnico.`,
    timestamp: '10:15 AM',
    sourcesUsed: ['institutional'],
    antiClicheApplied: true,
    documentType: 'informe_laboratorio',
  },
];

export const MOCK_DIRECTORY_ITEMS: DocumentHistoryItem[] = [
  {
    id: 'doc_01',
    title: 'Informe Lab: Circuitos Digitales y Mapas de Karnaugh',
    preview: 'Estructuración técnica del informe final conforme al microcurrículo...',
    documentType: 'informe_laboratorio',
    profile: 'estudiante',
    sourcesUsed: ['institutional'],
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: 'doc_02',
    title: 'Guía Docente: Robótica Industrial y Cinemática Directa',
    preview: 'Planeación de 4 sesiones de laboratorio con matrices de Denavit-Hartenberg...',
    documentType: 'guia_clase',
    profile: 'docente',
    sourcesUsed: ['institutional', 'web'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: 'doc_03',
    title: 'Ensayo Académico: Transición Energética en Antioquia',
    preview: 'Análisis crítico sobre la integración de matrices solares fotovoltaicas...',
    documentType: 'ensayo',
    profile: 'estudiante',
    sourcesUsed: ['institutional', 'web'],
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
  },
  {
    id: 'doc_04',
    title: 'Artículo: Optimización de Redes LoRaWAN en Campus',
    preview: 'Evaluación de pérdidas de propagación y latencia en entornos universitarios...',
    documentType: 'articulo_investigacion',
    profile: 'docente',
    sourcesUsed: ['institutional'],
    createdAt: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
  },
];
