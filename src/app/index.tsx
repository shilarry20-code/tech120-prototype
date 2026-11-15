// Join tab: enter a concert code or pick a nearby concert.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CONCERTS, findConcertByCode, type Concert } from '@/data/concerts';
import { useRaveCall } from '@/state/RaveCallContext';
import { Button, Card, LiveBadge, Screen, colors, styles } from '@/components/ui';

export default function JoinScreen() {
  const { concert, joinConcert, leaveConcert } = useRaveCall();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function join(c: Concert) {
    joinConcert(c);
    setCode('');
    setError(null);
    router.navigate('/concert');
  }

  function joinByCode() {
    const c = findConcertByCode(code);
    if (c) join(c);
    else setError('No concert found with that code. Try NEON42.');
  }

  return (
    <Screen title="RaveCall">
      <Text style={styles.hint}>
        Connect to the concert's sound and control the volume in your own earbuds.
      </Text>

      {concert && (
        <Card style={{ borderColor: colors.accent }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.h2}>Connected</Text>
            <LiveBadge />
          </View>
          <Text style={styles.body}>
            {concert.artist} · {concert.venue}
          </Text>
          <View style={[styles.row]}>
            <View style={{ flex: 1 }}>
              <Button label="Open" onPress={() => router.navigate('/concert')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Leave" variant="danger" onPress={leaveConcert} />
            </View>
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.h2}>Enter concert code</Text>
        <Text style={styles.hint}>The code is shown on the venue screens.</Text>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setError(null);
          }}
          placeholder="e.g. NEON42"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={styles.input}
          onSubmitEditing={joinByCode}
          returnKeyType="go"
        />
        {error && <Text style={{ color: colors.live }}>{error}</Text>}
        <Button label="Join concert" onPress={joinByCode} disabled={code.trim().length === 0} />
      </Card>

      <Text style={[styles.h2, { marginTop: 4 }]}>Nearby concerts</Text>
      {CONCERTS.map((c) => {
        const isLive = c.startsAt === 'Live now';
        const isCurrent = concert?.id === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => isLive && join(c)}
            style={({ pressed }) => ({ opacity: !isLive ? 0.5 : pressed ? 0.7 : 1 })}
          >
            <Card style={isCurrent ? { borderColor: colors.accent } : undefined}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.h2}>{c.artist}</Text>
                {isLive ? <LiveBadge /> : <Text style={styles.hint}>{c.startsAt}</Text>}
              </View>
              <Text style={styles.hint}>
                {c.venue} · code {c.code}
              </Text>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
