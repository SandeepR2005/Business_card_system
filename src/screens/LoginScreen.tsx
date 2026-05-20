import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { EVA } from '../utils/theme';
import { Icon, Button } from '../components/ui';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [id, setId] = useState('priya.rao@askeva.io');
  const [pwd, setPwd] = useState('••••••••••');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = () => {
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.greenInk }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={{ fontSize: 28, color: '#fff' }}>📱</Text>
            </View>
            <View>
              <Text style={styles.appName}>AskEva</Text>
              <Text style={styles.subtitle}>Card Capture</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.description}>
              Sign in to capture business cards into your Lead page.
            </Text>

            {/* Mode Switcher */}
            <View style={styles.modeSwitcher}>
              {[
                { k: 'password', l: 'Password' },
                { k: 'otp', l: 'OTP' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.k}
                  onPress={() => setMode(t.k as 'password' | 'otp')}
                  style={[
                    styles.modeButton,
                    mode === t.k && styles.modeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === t.k && styles.modeButtonTextActive,
                    ]}
                  >
                    {t.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {mode === 'password' ? (
                <>
                  <View style={styles.fieldWrapper}>
                    <View style={styles.fieldLabel}>
                      <Icon name="mail" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.fieldLabelText}>Email</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={id}
                      onChangeText={setId}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <View style={styles.fieldLabel}>
                      <Icon name="settings" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.fieldLabelText}>Password</Text>
                    </View>
                    <View style={styles.passwordField}>
                      <TextInput
                        style={styles.passwordInput}
                        value={showPwd ? pwd : '••••••••••'}
                        onChangeText={setPwd}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        secureTextEntry={!showPwd}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPwd(!showPwd)}
                      >
                        <Icon name="eye" size={16} color="rgba(255,255,255,0.45)" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: -8 }}>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.fieldWrapper}>
                    <View style={styles.fieldLabel}>
                      <Icon name="phone" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.fieldLabelText}>Phone</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                  <Text style={styles.otpHint}>
                    We'll text you a 6-digit code to verify it's you.
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {mode === 'otp' ? 'Send code' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.ssoButton}>
              <Icon name="building" size={16} color="#fff" />
              <Text style={styles.ssoButtonText}>Continue with SSO</Text>
            </TouchableOpacity>

            <Text style={styles.version}>v2.4.1 · AskEva Internal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    paddingTop: 60,
    paddingBottom: 36,
    backgroundColor: EVA.greenInk,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 44,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: EVA.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
    marginBottom: 28,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#fff',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: EVA.ink,
  },
  fieldsContainer: {
    gap: 10,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  fieldLabelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 12,
    color: EVA.green,
    fontWeight: '600',
    marginTop: 4,
  },
  otpHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  footer: {
    gap: 10,
  },
  submitButton: {
    backgroundColor: EVA.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  ssoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
});
