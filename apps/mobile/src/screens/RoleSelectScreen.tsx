import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { Display, Title, Body, MicroCopy } from '../components/Typography';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { UserProfileRole } from '../types';
import { colors } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/RoleSelectScreen.styles';

type Props = NativeStackScreenProps<MainStackParamList, 'RoleSelect'>;

interface RolePointProps {
  label: string;
  text: string;
}

function RolePoint({ label, text }: Readonly<RolePointProps>) {
  return (
    <View style={styles.rolePoint}>
      <View style={styles.rolePointDot} />
      <Text style={styles.rolePointText}>
        <Text style={styles.boldText}>{label}: </Text>
        {text}
      </Text>
    </View>
  );
}

export const RoleSelectScreen: React.FC<Props> = ({ navigation, route }) => {
  const { updateProfile, session } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserProfileRole>(
    route.params?.currentRole ?? session?.profile ?? 'estudiante'
  );

  const handleContinue = () => {
    void updateProfile(selectedRole);
    navigation.navigate('Directory', { activeRole: selectedRole });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Identitario */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Display>TOTH</Display>
            <Badge label="Perfil Académico" variant="accent" />
          </View>
          <Title style={styles.subtitle}>Elige tu perfil</Title>
          <Body style={styles.headerDescription}>
            TOTH adapta el tono, la densidad técnica y la estructura de cada respuesta
            según tu rol institucional.
          </Body>
        </View>

        {/* Card: Perfil Estudiante */}
        <TouchableOpacity
          activeOpacity={0.9}
          accessibilityRole="radio"
          accessibilityLabel="Perfil Estudiante"
          accessibilityState={{ selected: selectedRole === 'estudiante' }}
          onPress={() => setSelectedRole('estudiante')}
          style={[
            styles.roleCard,
            selectedRole === 'estudiante' ? styles.roleCardActive : styles.roleCardInactive,
          ]}
        >
          <View style={styles.roleCardHeader}>
            <View style={styles.roleTitleGroup}>
              <Text style={styles.roleTitle}>Perfil Estudiante</Text>
              <Text style={styles.roleSubtitle}>Aprendizaje guiado y fundamentación</Text>
            </View>
            {selectedRole === 'estudiante' ? (
              <Badge
                label="Activo"
                variant="institutional"
                icon={<Check size={12} color={colors.primary} strokeWidth={2.5} />}
              />
            ) : null}
          </View>

          <View style={styles.rolePoints}>
            <RolePoint
              label="Tono pedagógico"
              text="Desarrollo conceptual paso a paso con explicaciones claras."
            />
            <RolePoint
              label="Entregables típicos"
              text="Informes de laboratorio, ensayos argumentados y resúmenes de estudio."
            />
            <RolePoint
              label="Rigor defendible"
              text="Argumentos basados en syllabus para sustentar frente al docente."
            />
          </View>
        </TouchableOpacity>

        {/* Card: Perfil Docente */}
        <TouchableOpacity
          activeOpacity={0.9}
          accessibilityRole="radio"
          accessibilityLabel="Perfil Docente"
          accessibilityState={{ selected: selectedRole === 'docente' }}
          onPress={() => setSelectedRole('docente')}
          style={[
            styles.roleCard,
            selectedRole === 'docente' ? styles.roleCardActive : styles.roleCardInactive,
          ]}
        >
          <View style={styles.roleCardHeader}>
            <View style={styles.roleTitleGroup}>
              <Text style={styles.roleTitle}>Perfil Docente</Text>
              <Text style={styles.roleSubtitle}>Alta densidad conceptual y evaluación</Text>
            </View>
            {selectedRole === 'docente' ? (
              <Badge
                label="Activo"
                variant="institutional"
                icon={<Check size={12} color={colors.primary} strokeWidth={2.5} />}
              />
            ) : null}
          </View>

          <View style={styles.rolePoints}>
            <RolePoint
              label="Tono analítico"
              text="Asume dominio experto, sin explicaciones elementales redundantes."
            />
            <RolePoint
              label="Entregables típicos"
              text="Guías de clase, rúbricas de evaluación y artículos cortos."
            />
            <RolePoint
              label="Alineación curricular"
              text="Enlace directo con microcurrículos de la I.U. Pascual Bravo."
            />
          </View>
        </TouchableOpacity>

        {/* Botón de Continuar */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
          >
            Continuar al directorio
          </Button>

          <MicroCopy style={styles.switchNotice}>
            Puedes cambiar de perfil en cualquier momento desde el directorio.
          </MicroCopy>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

