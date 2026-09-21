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
import { styles } from '../styles/RegisterScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValidInstitutional = email.trim().toLowerCase().endsWith('@pascualbravo.edu.co');

  const handleRegister = () => {
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
    // Simulación mock de registro
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('RoleSelect', { currentRole: 'estudiante' });
    }, 600);
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
        >
          {/* Identity Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Display>TOTH</Display>
              <Badge label="I.U. Pascual Bravo" variant="institutional" />
            </View>
            <Subtitle style={styles.subtitle}>Registro Institucional</Subtitle>
            <Body style={styles.headerDescription}>
              Crea tu cuenta académica para acceder al modelo RAG con fondos documentales de la institución.
            </Body>
          </View>

          {/* Register Formulary */}
          <Card style={styles.card}>
            <CardHeader style={styles.cardTitle}>Datos del Usuario</CardHeader>

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
            />

            <Input
              label="Correo Institucional (@pascualbravo.edu.co)"
              placeholder="usuario@pascualbravo.edu.co"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
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
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleRegister}
              style={styles.submitButton}
            >
              Crear Cuenta Académica
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => navigation.replace('RoleSelect')}
              style={styles.skipButton}
            >
              Omitir registro — ver demo
            </Button>
          </Card>

          {/* Login Link */}
          <View style={styles.footer}>
            <MicroCopy>¿Ya tienes una cuenta institucional?</MicroCopy>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Inicia sesión aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
