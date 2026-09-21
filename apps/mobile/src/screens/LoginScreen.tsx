import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Display, Subtitle, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { MOCK_CURRENT_USER } from '../services/mockData';
import { styles } from '../styles/LoginScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('estudiante.demo@pascualbravo.edu.co');
  const [password, setPassword] = useState('pascual123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    // Simulación mock de autenticación
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('Directory', { activeRole: 'estudiante' });
    }, 600);
  };

  const handleQuickFill = (role: 'estudiante' | 'docente') => {
    if (role === 'estudiante') {
      setEmail('estudiante.demo@pascualbravo.edu.co');
      setPassword('estudiante2026');
    } else {
      setEmail('docente.investigador@pascualbravo.edu.co');
      setPassword('docente2026');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Identity Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Display>TOTH</Display>
              <Badge label="I.U. Pascual Bravo" variant="institutional" />
            </View>
            <Subtitle style={styles.subtitle}>Iniciar Sesión</Subtitle>
            <Body style={styles.headerDescription}>
              Asistente de IA generativa académica con filtro anti-cliché y RAG institucional.
            </Body>
          </View>

          {/* Login Formulary*/}
          <Card style={styles.card}>
            <CardHeader style={styles.cardTitle}>Credenciales Institucionales</CardHeader>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Correo Institucional"
              placeholder="nombre.apellido@pascualbravo.edu.co"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleLogin}
              style={styles.submitButton}
            >
              Ingresar al Asistente
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => navigation.replace('RoleSelect')}
              style={styles.skipButton}
            >
              Omitir inicio de sesión — ver demo
            </Button>

            {/* Fast Access for Teacher Evaluation */}
            <View style={styles.demoFillContainer}>
              <MicroCopy style={styles.demoFillLabel}>Acceso rápido para prueba académica:</MicroCopy>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickFill('estudiante')}
                  style={styles.demoBadge}
                >
                  <Text style={styles.demoBadgeText}>Estudiante Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickFill('docente')}
                  style={styles.demoBadge}
                >
                  <Text style={styles.demoBadgeText}>Docente Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Register Link and Rol Selection */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <MicroCopy>¿No tienes cuenta institucional?</MicroCopy>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Register')}
                style={styles.registerLink}
              >
                <Text style={styles.registerLinkText}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('RoleSelect')}
              style={styles.roleConfigLink}
            >
              <Text style={styles.roleConfigLinkText}>Configurar Perfil Académico (Estudiante / Docente)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

