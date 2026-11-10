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
import { AuthStackParamList } from '../types/navigation';
import { Display, Title, CardHeader, Body, MicroCopy } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { useAuth, isAuthError } from '../context/AuthContext';
import type { UserProfileRole } from '../types';
import { styles } from '../styles/LoginScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, setDemoSession } = useAuth();
  const [email, setEmail] = useState('estudiante.demo@pascualbravo.edu.co');
  const [password, setPassword] = useState('estudiante2026');
  const [profile, setProfile] = useState<UserProfileRole>('estudiante');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (isLoading) return;
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    void (async () => {
      try {
        await login(email.trim(), password, profile);
        // AppNavigator switches to MainNavigator when the session is set.
      } catch (err) {
        setError(
          isAuthError(err)
            ? err.message
            : 'Error inesperado. Intenta de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleQuickFill = (role: UserProfileRole) => {
    setProfile(role);
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
        enabled={Platform.OS === 'ios'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header Identitario */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Display>TOTH</Display>
              <Badge label="I.U. Pascual Bravo" variant="institutional" />
            </View>
            <Title style={styles.subtitle}>Acceso institucional</Title>
            <Body style={styles.headerDescription}>
              Entra con tu cuenta del Pascual Bravo para continuar tu historial académico.
            </Body>
          </View>

          {/* Formulario de Login */}
          <Card style={styles.card}>
            <CardHeader style={styles.cardTitle}>Ingresa con tu cuenta</CardHeader>
            <MicroCopy style={styles.formHint}>
              Acceso restringido a correos @pascualbravo.edu.co
            </MicroCopy>

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
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <MicroCopy style={styles.roleLabel}>Perfil con el que ingresas</MicroCopy>
            <View style={styles.roleRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel="Perfil Estudiante"
                accessibilityState={{ selected: profile === 'estudiante' }}
                onPress={() => setProfile('estudiante')}
                style={[
                  styles.roleChip,
                  profile === 'estudiante' && styles.roleChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    profile === 'estudiante' && styles.roleChipTextActive,
                  ]}
                >
                  Estudiante
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel="Perfil Docente"
                accessibilityState={{ selected: profile === 'docente' }}
                onPress={() => setProfile('docente')}
                style={[
                  styles.roleChip,
                  profile === 'docente' && styles.roleChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    profile === 'docente' && styles.roleChipTextActive,
                  ]}
                >
                  Docente
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleLogin}
              style={styles.submitButton}
            >
              Ingresar al asistente
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => setDemoSession('estudiante')}
              style={styles.skipButton}
            >
              Explorar sin cuenta
            </Button>

            {/* Accesos rápidos para evaluación docente */}
            <View style={styles.demoFillContainer}>
              <MicroCopy style={styles.demoFillLabel}>Accesos de evaluación</MicroCopy>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Rellenar credenciales de estudiante demo"
                  activeOpacity={0.7}
                  onPress={() => handleQuickFill('estudiante')}
                  style={styles.demoBadge}
                >
                  <Text style={styles.demoBadgeText}>Estudiante demo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Rellenar credenciales de docente demo"
                  activeOpacity={0.7}
                  onPress={() => handleQuickFill('docente')}
                  style={styles.demoBadge}
                >
                  <Text style={styles.demoBadgeText}>Docente demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Enlace para Registro y Selección de Rol */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <MicroCopy>¿Aún no tienes cuenta?</MicroCopy>
              <TouchableOpacity
                accessibilityRole="link"
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                onPress={() => navigation.navigate('Register')}
                style={styles.registerLink}
              >
                <Text style={styles.registerLinkText}>Crear cuenta institucional</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

