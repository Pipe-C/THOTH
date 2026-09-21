import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Display, Subtitle, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { UserProfileRole } from '../types';
import { styles } from '../styles/RoleSelectScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

export const RoleSelectScreen: React.FC<Props> = ({ navigation, route }) => {
  const [selectedRole, setSelectedRole] = useState<UserProfileRole>(
    route.params?.currentRole || 'estudiante'
  );

  const handleContinue = () => {
    navigation.navigate('Directory', { activeRole: selectedRole });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Header */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Display>TOTH</Display>
            <Badge label="Perfil Académico" variant="accent" />
          </View>
          <Subtitle style={styles.subtitle}>Selecciona tu Perfil de Uso</Subtitle>
          <Body style={styles.headerDescription}>
            TOTH adapta el tono, la densidad técnica y la estructura de cada respuesta
            según el rol institucional que elijas.
          </Body>
        </View>

        {/* Card: Student Profile  */}
        <TouchableOpacity
          activeOpacity={0.9}
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
              <Badge label="Activo" variant="institutional" />
            ) : null}
          </View>

          <Body style={styles.roleBody}>
            • <Text style={styles.boldText}>Tono pedagógico:</Text> Desarrollo conceptual paso a paso con explicaciones claras.{'\n'}
            • <Text style={styles.boldText}>Entregables típicos:</Text> Informes de laboratorio, ensayos argumentados y resúmenes de estudio.{'\n'}
            • <Text style={styles.boldText}>Rigor defendible:</Text> Argumentos basados en syllabus para sustentar frente al docente.
          </Body>
        </TouchableOpacity>

        {/* Card: Teacher Profile  */}
        <TouchableOpacity
          activeOpacity={0.9}
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
              <Badge label="Activo" variant="institutional" />
            ) : null}
          </View>

          <Body style={styles.roleBody}>
            • <Text style={styles.boldText}>Tono analítico:</Text> Asume dominio experto; sin explicaciones elementales redundantes.{'\n'}
            • <Text style={styles.boldText}>Entregables típicos:</Text> Guías de clase, rúbricas de evaluación y artículos cortos.{'\n'}
            • <Text style={styles.boldText}>Alineación curricular:</Text> Enlace directo con microcurrículos de la I.U. Pascual Bravo.
          </Body>
        </TouchableOpacity>

        {/* Continue Button */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
          >
            Continuar al Directorio Académico
          </Button>

          <MicroCopy style={styles.switchNotice}>
            Puedes alternar de perfil en cualquier momento desde el menú superior.
          </MicroCopy>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

