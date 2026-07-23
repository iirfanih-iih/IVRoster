import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth-store';
import { useThemeStore } from '../../stores/theme-store';
import { updatePassword, supabase } from '../../lib/supabase';

function validatePassword(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(pw)) errors.push('At least 1 uppercase letter');
  if (!/[0-9]/.test(pw)) errors.push('At least 1 number');
  if (!/[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(pw))
    errors.push('At least 1 special character');
  return errors;
}

export default function ForcePasswordScreen() {
  const { signOut, session, setForcePasswordChange } = useAuthStore();
  const { colors } = useThemeStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const validationErrors = validatePassword(password);
    if (validationErrors.length) {
      setError(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      // Remove force flag
      if (session) {
        await supabase
          .from('app_settings')
          .delete()
          .eq('key', `force_pw_change_${session.user.id}`);
      }
      setForcePasswordChange(false);
      Alert.alert(
        'Password Updated',
        'Your password has been updated. Please sign in again.',
        [{ text: 'OK', onPress: () => signOut() }]
      );
    } catch (e: any) {
      setError(e.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>
          You must set a new password before continuing.
        </Text>

        <View style={styles.requirements}>
          <Text style={styles.reqText}>Requirements:</Text>
          <Text style={styles.reqItem}>• At least 8 characters</Text>
          <Text style={styles.reqItem}>• 1 uppercase letter</Text>
          <Text style={styles.reqItem}>• 1 number</Text>
          <Text style={styles.reqItem}>• 1 special character (!@#$%^&*)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSecondary}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Updating…' : 'Update Password'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={signOut}>
          <Text style={styles.linkText}>Cancel & Sign Out</Text>
        </TouchableOpacity>
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
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    requirements: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    reqText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    reqItem: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 18,
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
      color: colors.red,
    },
    error: {
      color: colors.red,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
  });
}
