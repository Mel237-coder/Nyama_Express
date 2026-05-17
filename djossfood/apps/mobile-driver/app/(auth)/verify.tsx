import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { verifyOtp, fetchDriverProfile, sendOtp } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { setSession, setProfile, setDriver, setIsNewUser } = useAuthStore();

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === OTP_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otp?: string) => {
    const fullCode = otp || code.join('');
    if (fullCode.length < OTP_LENGTH) return;

    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone!, fullCode);
      if (result.error) {
        setError('Code invalide');
        setCode(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        triggerShake();
      } else if (result.session) {
        setSession(result.session);
        if (result.profile) setProfile(result.profile);

        if (result.isNewUser) {
          // New user — needs to register as driver
          setIsNewUser(true);
          router.replace('/(auth)/register');
        } else {
          // Existing user — check driver profile
          const driverResult = await fetchDriverProfile();
          if (driverResult.driver) {
            setDriver(driverResult.driver);
            if (driverResult.driver.is_approved) {
              router.replace('/(main)');
            } else {
              router.replace('/(auth)/pending');
            }
          } else {
            // No driver profile — needs to register
            router.replace('/(auth)/register');
          }
        }
      }
    } catch {
      setError('Vérifiez votre connexion');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);
    setCode(Array(OTP_LENGTH).fill(''));
    setError(null);
    inputRefs.current[0]?.focus();
    await sendOtp(phone!);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Entrez le code envoyé au {phone}
        </Text>

        {/* OTP Inputs */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpBox, error ? styles.otpBoxError : null]}
              value={code[i]}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </Animated.View>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verify Button */}
        <Button
          title="Vérifier"
          onPress={() => handleVerify()}
          loading={loading}
          disabled={code.join('').length < OTP_LENGTH}
          style={styles.verifyButton}
        />

        {/* Resend */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Renvoyer dans {resendTimer}s
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    backgroundColor: Colors.surface,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  resendContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: FontSizes.sm,
    color: Colors.primaryOrange,
    fontWeight: FontWeights.bold,
  },
});