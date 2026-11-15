// Concert tab: volume for your own earbuds, mute, and the ducking indicator.

import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useRaveCall } from '@/state/RaveCallContext';
import { Button, Card, LevelBar, LiveBadge, Screen, colors, styles } from '@/components/ui';

export default function ConcertScreen() {
  const {
    concert,
    volume,
    setVolume,
    muted,
    toggleMuted,
    effectiveVolume,
    duckingBy,
    groupCode,
  } = useRaveCall();

  if (!concert) {
    return (
      <Screen title="Concert">
        <Card>
          <Text style={styles.h2}>Not connected</Text>
          <Text style={styles.hint}>Join a concert first to control your volume.</Text>
          <Button label="Find a concert" onPress={() => router.navigate('/')} />
        </Card>
      </Screen>
    );
  }

  const ducked = duckingBy.length > 0 && !muted;
  const names = duckingBy.map((m) => m.name).join(' & ');

  return (
    <Screen title="Concert">
      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={[styles.h2, { fontSize: 22 }]}>{concert.artist}</Text>
          <LiveBadge />
        </View>
        <Text style={styles.hint}>{concert.venue}</Text>
      </Card>

      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={styles.hint}>IN YOUR EARBUDS</Text>
        <Text style={{ color: colors.text, fontSize: 64, fontWeight: '900' }}>
          {Math.round(effectiveVolume * 100)}%
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <LevelBar level={effectiveVolume} color={ducked ? colors.accent2 : colors.accent} />
        </View>
        <Text style={[styles.hint, { marginTop: 6, color: ducked ? colors.accent2 : colors.muted }]}>
          {muted
            ? 'Muted'
            : ducked
              ? `Lowered — ${names} ${duckingBy.length > 1 ? 'are' : 'is'} talking`
              : 'Full mix'}
        </Text>
      </Card>

      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.h2}>Volume</Text>
          <Text style={styles.body}>{Math.round(volume * 100)}%</Text>
        </View>
        <Slider
          value={volume}
          onValueChange={setVolume}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.cardBorder}
          thumbTintColor={colors.text}
          disabled={muted}
        />
        <Button
          label={muted ? '🔈  Unmute' : '🔇  Mute'}
          variant={muted ? 'primary' : 'secondary'}
          onPress={toggleMuted}
        />
      </Card>

      {!groupCode && (
        <Card>
          <Text style={styles.h2}>Here with friends?</Text>
          <Text style={styles.hint}>Start a group so you can talk during the show.</Text>
          <Button label="Go to Friends" variant="secondary" onPress={() => router.navigate('/friends')} />
        </Card>
      )}
    </Screen>
  );
}
