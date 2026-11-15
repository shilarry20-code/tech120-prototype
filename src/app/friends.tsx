// Friends tab: create/join a voice group, mic toggle, and per-person ducking.

import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { ActivityIndicator, Switch, Text, TextInput, View } from 'react-native';
import { useRaveCall, type GroupMember } from '@/state/RaveCallContext';
import { Button, Card, Screen, colors, styles } from '@/components/ui';

export default function FriendsScreen() {
  const {
    myName,
    setMyName,
    groupCode,
    groupStatus,
    groupError,
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
          <Text style={styles.h2}>Your name</Text>
          <TextInput
            value={myName}
            onChangeText={setMyName}
            placeholder="What friends will see"
            placeholderTextColor={colors.muted}
            maxLength={20}
            style={[styles.input, { letterSpacing: 0 }]}
          />
        </Card>
        <Card>
          <Text style={styles.h2}>Start a group</Text>
          <Text style={styles.hint}>You'll get a code to share with your friends.</Text>
          <Button label="Create group" onPress={createGroup} disabled={!myName.trim()} />
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
            disabled={code.trim().length === 0 || !myName.trim()}
            onPress={() => {
              if (!joinGroup(code)) setError('Group codes are at least 4 characters.');
            }}
          />
        </Card>
      </Screen>
    );
  }

  const others = members.filter((m) => !m.isMe);
  const me = members.find((m) => m.isMe);

  return (
    <Screen title="Friends">
      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.hint}>GROUP CODE</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 4 }}>
          {groupCode}
        </Text>
        <Text style={styles.hint}>Share this code so friends can join.</Text>
        {groupStatus === 'connecting' && <ActivityIndicator color={colors.accent} />}
      </Card>

      {groupError && (
        <Card style={{ borderColor: colors.live }}>
          <Text style={{ color: colors.live }}>{groupError}</Text>
          {groupStatus === 'error' && (
            <Button label="Try again" onPress={() => joinGroup(groupCode)} />
          )}
        </Card>
      )}

      <Button
        label={
          micOn
            ? me?.talking
              ? '🎙️  Talking… (tap to mute)'
              : '🎙️  Mic on — tap to mute'
            : '🔇  Mic off — tap to talk'
        }
        variant={micOn ? 'primary' : 'secondary'}
        onPress={toggleMic}
        disabled={groupStatus !== 'connected'}
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
      {groupStatus === 'connected' && others.length === 0 && (
        <Card>
          <Text style={styles.hint}>
            No one else is here yet. Share the code {groupCode} with a friend.
          </Text>
        </Card>
      )}
      {others.map((m) => (
        <MemberRow key={m.identity} member={m} />
      ))}

      <Button label="Leave group" variant="danger" onPress={leaveGroup} />
    </Screen>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  const { toggleDuckFor } = useRaveCall();
  return (
    <Card style={member.talking ? { borderColor: member.color } : undefined}>
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
          <Text style={{ fontWeight: '900', color: colors.bg }}>
            {member.name[0]?.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.h2}>{member.name}</Text>
          <Text style={[styles.hint, member.talking && { color: member.color }]}>
            {member.talking ? '🔊 Talking…' : 'Listening'}
          </Text>
        </View>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.body}>Lower concert when they talk</Text>
        <Switch
          value={member.duckWhenTalking}
          onValueChange={() => toggleDuckFor(member.identity)}
          trackColor={{ false: colors.cardBorder, true: colors.accent }}
          thumbColor={colors.text}
        />
      </View>
    </Card>
  );
}
