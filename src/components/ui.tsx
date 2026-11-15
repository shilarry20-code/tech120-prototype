import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const colors = {
  bg: '#0B0618',
  card: '#1A1030',
  cardBorder: '#2C1E4D',
  text: '#F4EEFF',
  muted: '#A497C2',
  accent: '#B14CFF',
  accent2: '#FF4FA3',
  live: '#FF3B5C',
  good: '#3DDC97',
};

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary' ? colors.accent : variant === 'danger' ? '#3A1426' : colors.cardBorder;
  const fg = variant === 'danger' ? colors.live : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Blinking red dot + LIVE label. */
export function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

/** Horizontal bar that smoothly animates to the given level (0..1). */
export function LevelBar({ level, color = colors.accent }: { level: number; color?: string }) {
  const anim = useRef(new Animated.Value(level)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: level, duration: 350, useNativeDriver: false }).start();
  }, [level, anim]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15 },
  hint: { color: colors.muted, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  button: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 18,
    letterSpacing: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.live },
  liveText: { color: colors.live, fontWeight: '800', letterSpacing: 1 },
  barTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    borderColor: colors.cardBorder,
    borderWidth: 1,
  },
  barFill: { height: '100%', borderRadius: 7 },
});
