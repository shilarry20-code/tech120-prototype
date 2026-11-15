// Friends tab: create/join a voice group, mic toggle, and per-person ducking.

import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useRaveCall, type GroupMember } from '@/state/RaveCallContext';
import { Button, Card, Screen, colors, styles } from '@/components/ui';

export default function FriendsScreen() {
  const {
    groupCode,
    members,
    createGroup,
    joinGroup,
    leaveGroup,
    micOn,
    toggleMic,
    duckLevel,
    setDuckLevel,
  } = useRaveCall();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!groupCode) {
    return (
      <Screen title="Friends">
        <Text style={styles.hint}>
          Make a group so you and your friends can talk to each other during the concert.
        </Text>
        <Card>
          <Text style={styles.h2}>Start a group</Text>
          <Text style={styles.hint}>You'll get a code to share with your friends.</Text>
          <Button label="Create group" onPress={createGroup} />
        </Card>
        <Card>
          <Text style={styles.h2}>Join a friend's group</Text>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setError(null);
            }}
            placeholder="Group code"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={styles.input}
          />
          {error && <Text style={{ color: colors.live }}>{error}</Text>}
          <Button
            label="Join group"
            disabled={code.trim().length === 0}
            onPress={() => {
              if (!joinGroup(code)) setError('Group codes are at least 4 characters.');
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Friends">
      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.hint}>GROUP CODE</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 4 }}>
          {groupCode}
        </Text>
        <Text style={styles.hint}>Share this code so friends can join.</Text>
      </Card>

      <Button
        label={micOn ? '🎙️  Mic on — tap to mute' : '🔇  Mic off — tap to talk'}
        variant={micOn ? 'primary' : 'secondary'}
        onPress={toggleMic}
      />

      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.h2}>Concert volume while talking</Text>
          <Text style={styles.body}>{Math.round(duckLevel * 100)}%</Text>
        </View>
        <Text style={styles.hint}>
          When a friend with "Lower concert" on is talking, the concert drops to this level.
        </Text>
        <Slider
          value={duckLevel}
          onValueChange={setDuckLevel}
          minimumValue={0}
          maximumValue={1}
          step={0.05}
          minimumTrackTintColor={colors.accent2}
          maximumTrackTintColor={colors.cardBorder}
          thumbTintColor={colors.text}
        />
      </Card>

      <Text style={[styles.h2, { marginTop: 4 }]}>In your group</Text>
      {members.map((m) => (
        <MemberRow key={m.id} member={m} />
      ))}

      <Button label="Leave group" variant="danger" onPress={leaveGroup} />
    </Screen>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  const { toggleDuckFor, simulateTalk } = useRaveCall();
  return (
    <Card style={member.talking ? { borderColor: member.color } : undefined}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={styles.row}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: member.color,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: member.talking ? 3 : 0,
              borderColor: colors.text,
            }}
          >
            <Text style={{ fontWeight: '900', color: colors.bg }}>{member.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.h2}>{member.name}</Text>
            <Text style={[styles.hint, member.talking && { color: member.color }]}>
              {member.talking ? '🔊 Talking…' : 'Listening'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => simulateTalk(member.id)} hitSlop={8}>
          <Text style={[styles.hint, { textDecorationLine: 'underline' }]}>Test talk</Text>
        </Pressable>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.body}>Lower concert when they talk</Text>
        <Switch
          value={member.duckWhenTalking}
          onValueChange={() => toggleDuckFor(member.id)}
          trackColor={{ false: colors.cardBorder, true: colors.accent }}
          thumbColor={colors.text}
        />
      </View>
    </Card>
  );
}
