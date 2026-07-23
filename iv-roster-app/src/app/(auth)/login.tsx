import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useThemeStore } from '../../stores/theme-store';
import { resetPasswordForEmail } from '../../lib/supabase';

export default function LoginScreen() {
  const { signIn, error, isLoading, clearError } = useAuthStore();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    await signIn(email.trim(), password);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }
    try {
      await resetPasswordForEmail(email.trim());
      Alert.alert(
        'Reset Link Sent',
        `Check your inbox at ${email.trim()} for a password reset link.`
      );
      setShowForgot(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send reset email.');
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IV</Text>
          </View>
          <Text style={styles.title}>IV Roster</Text>
          <Text style={styles.subtitle}>
            Auckland Jamatkhana · Ismaili Volunteers
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {!showForgot && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {showForgot ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
            >
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowForgot(false)}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowForgot(true)}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ AUTHORISED ACCESS ONLY</Text>
          <Text style={styles.warningText}>
            This system is for authorised Auckland Ismaili Volunteers only.
            Unauthorised access is strictly prohibited.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 24,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 32,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 28,
    },
    logoBox: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.blue2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    logoText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.navy,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    linkButton: {
      alignItems: 'center',
      marginTop: 14,
    },
    linkText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    error: {
      color: colors.red,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
    warningBox: {
      marginTop: 20,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(248,120,120,0.25)',
      backgroundColor: 'rgba(248,120,120,0.05)',
    },
    warningTitle: {
      fontSize: 9,
      fontWeight: '700',
      color: '#f88',
      textAlign: 'center',
      letterSpacing: 1,
      marginBottom: 4,
    },
    warningText: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 15,
    },
  });
}
