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
import { styles } from '../styles/RegisterScreen.styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, setDemoSession } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const selectedProfile = 'estudiante' as const;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValidInstitutional = email.trim().toLowerCase().endsWith('@pascualbravo.edu.co');

  const handleRegister = () => {
    if (isLoading) return;
    setError(null);
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!email.trim()) {
      setError('El correo institucional es obligatorio.');
      return;
    }
    if (!isEmailValidInstitutional) {
      setError('El registro está restringido a correos institucionales @pascualbravo.edu.co');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    void (async () => {
      try {
        await register(email.trim(), password, fullName.trim(), selectedProfile);
        // AppNavigator switches to MainNavigator when the session is set.
      } catch (err) {
        setError(
          isAuthError(err)
            ? err.message
            : 'Error inesperado al crear la cuenta. Intenta de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    })();
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
            <Title style={styles.subtitle}>Crea tu cuenta</Title>
            <Body style={styles.headerDescription}>
              Usa tu correo del Pascual Bravo para acceder al fondo documental institucional.
            </Body>
          </View>

          {/* Formulario de Registro */}
          <Card style={styles.card}>
            <CardHeader style={styles.cardTitle}>Datos de la cuenta</CardHeader>
            <MicroCopy style={styles.formHint}>
              El registro solo acepta correos @pascualbravo.edu.co
            </MicroCopy>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Nombre Completo"
              placeholder="Ej. Juan David Restrepo"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

            <Input
              label="Correo Institucional (@pascualbravo.edu.co)"
              placeholder="usuario@pascualbravo.edu.co"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              helperText={
                email.length > 0 && !isEmailValidInstitutional
                  ? 'Debe terminar en @pascualbravo.edu.co'
                  : 'Se usará para validar permisos académicos'
              }
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              helperText="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleRegister}
              style={styles.submitButton}
            >
              Crear cuenta académica
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => setDemoSession('estudiante')}
              style={styles.skipButton}
            >
              Explorar sin cuenta
            </Button>
          </Card>

          {/* Enlace para Iniciar Sesión */}
          <View style={styles.footer}>
            <MicroCopy>¿Ya tienes cuenta?</MicroCopy>
            <TouchableOpacity
              accessibilityRole="link"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
