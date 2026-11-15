// All of the app's shared state lives here so every tab sees the same values.
// Two LiveKit rooms can be open at once:
//   - the concert room (you listen to the venue's audio)
//   - your friend group room (voice chat)

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { RemoteAudioTrack, Room, RoomEvent, type Participant } from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import { type Concert } from '@/data/concerts';
import { concertRoomName, getConnectionDetails, groupRoomName } from '@/livekit/config';

export type Status = 'idle' | 'connecting' | 'connected' | 'error';

export type GroupMember = {
  identity: string;
  name: string;
  color: string;
  talking: boolean;
  isMe: boolean;
  /** Per-person toggle: lower the concert while this friend talks. */
  duckWhenTalking: boolean;
};

type RaveCallState = {
  myName: string;
  setMyName: (n: string) => void;

  // Concert
  concert: Concert | null;
  concertStatus: Status;
  concertError: string | null;
  venueLive: boolean; // is the venue actually sending audio right now?
  joinConcert: (c: Concert) => void;
  leaveConcert: () => void;
  volume: number; // 0..1, what the user set with the slider
  setVolume: (v: number) => void;
  muted: boolean;
  toggleMuted: () => void;

  // Friends group
  groupCode: string | null;
  groupStatus: Status;
  groupError: string | null;
  members: GroupMember[]; // includes you (isMe) first
  createGroup: () => void;
  joinGroup: (code: string) => boolean;
  leaveGroup: () => void;
  micOn: boolean;
  toggleMic: () => void;
  toggleDuckFor: (identity: string) => void;
  duckLevel: number; // 0..1, how loud the concert stays while ducked
  setDuckLevel: (v: number) => void;

  // Derived
  duckingBy: GroupMember[]; // friends currently causing the concert to duck
  effectiveVolume: number; // what actually plays in the earbuds
};

const Ctx = createContext<RaveCallState | null>(null);

const COLORS = ['#FF5DA2', '#5DD6FF', '#FFC85D', '#3DDC97', '#B14CFF', '#FF8A5D'];
function colorFor(identity: string) {
  let h = 0;
  for (let i = 0; i < identity.length; i++) h = (h * 31 + identity.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function randomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 4; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out + Math.floor(10 + Math.random() * 90);
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

async function ensureMicPermission() {
  if (Platform.OS !== 'android') return true; // iOS asks automatically
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

// Re-render whenever anything in a room changes.
const ROOM_EVENTS = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.ActiveSpeakersChanged,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.ConnectionStateChanged,
] as const;

export function RaveCallProvider({ children }: { children: ReactNode }) {
  const identity = useRef(`user-${Math.random().toString(36).slice(2, 10)}`).current;
  const [myName, setMyName] = useState(`Guest ${Math.floor(1000 + Math.random() * 9000)}`);

  // Bumped on every room event so the UI re-reads room state.
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const concertRoom = useRef<Room | null>(null);
  const groupRoom = useRef<Room | null>(null);
  const audioStarted = useRef(false);

  const [concert, setConcert] = useState<Concert | null>(null);
  const [concertStatus, setConcertStatus] = useState<Status>('idle');
  const [concertError, setConcertError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [groupStatus, setGroupStatus] = useState<Status>('idle');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [duckLevel, setDuckLevel] = useState(0.3);
  const [duckPrefs, setDuckPrefs] = useState<Record<string, boolean>>({});

  // ---------- audio session ----------
  const startAudio = useCallback(async () => {
    if (audioStarted.current || Platform.OS === 'web') return;
    audioStarted.current = true;
    await AudioSession.startAudioSession();
  }, []);

  const stopAudioIfIdle = useCallback(async () => {
    if (!audioStarted.current || concertRoom.current || groupRoom.current) return;
    audioStarted.current = false;
    await AudioSession.stopAudioSession();
  }, []);

  /** Create a room, hook up events, and connect. */
  const connectRoom = useCallback(
    async (roomName: string, onDisconnected: () => void) => {
      await startAudio();
      const room = new Room({ adaptiveStream: false, dynacast: false });
      ROOM_EVENTS.forEach((ev) => room.on(ev, bump));
      room.on(RoomEvent.Disconnected, onDisconnected);
      const { serverUrl, token } = await getConnectionDetails(roomName, identity, myName);
      await room.connect(serverUrl, token, { autoSubscribe: true });
      return room;
    },
    [bump, identity, myName, startAudio],
  );

  // ---------- concert ----------
  const leaveConcert = useCallback(() => {
    const room = concertRoom.current;
    concertRoom.current = null;
    setConcert(null);
    setConcertStatus('idle');
    setConcertError(null);
    room?.disconnect().finally(stopAudioIfIdle);
  }, [stopAudioIfIdle]);

  const joinConcert = useCallback(
    (c: Concert) => {
      if (concertRoom.current) {
        const old = concertRoom.current;
        concertRoom.current = null;
        old.disconnect();
      }
      setConcert(c);
      setMuted(false);
      setConcertStatus('connecting');
      setConcertError(null);
      connectRoom(concertRoomName(c.code), () => {
        if (concertRoom.current) {
          concertRoom.current = null;
          setConcertStatus('error');
          setConcertError('Lost connection to the concert.');
        }
      })
        .then((room) => {
          concertRoom.current = room;
          setConcertStatus('connected');
          bump();
        })
        .catch((e) => {
          setConcertStatus('error');
          setConcertError(errorText(e));
        });
    },
    [bump, connectRoom],
  );

  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  // ---------- group ----------
  const leaveGroup = useCallback(() => {
    const room = groupRoom.current;
    groupRoom.current = null;
    setGroupCode(null);
    setGroupStatus('idle');
    setGroupError(null);
    setMicOn(false);
    room?.disconnect().finally(stopAudioIfIdle);
  }, [stopAudioIfIdle]);

  const startGroup = useCallback(
    (code: string) => {
      if (groupRoom.current) {
        const old = groupRoom.current;
        groupRoom.current = null;
        old.disconnect();
      }
      setGroupCode(code);
      setGroupStatus('connecting');
      setGroupError(null);
      setMicOn(false);
      connectRoom(groupRoomName(code), () => {
        if (groupRoom.current) {
          groupRoom.current = null;
          setGroupStatus('error');
          setGroupError('Lost connection to the group.');
          setMicOn(false);
        }
      })
        .then((room) => {
          groupRoom.current = room;
          setGroupStatus('connected');
          bump();
        })
        .catch((e) => {
          setGroupStatus('error');
          setGroupError(errorText(e));
        });
    },
    [bump, connectRoom],
  );

  const createGroup = useCallback(() => startGroup(randomCode()), [startGroup]);

  const joinGroup = useCallback(
    (code: string) => {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) return false;
      startGroup(clean);
      return true;
    },
    [startGroup],
  );

  const toggleMic = useCallback(async () => {
    const room = groupRoom.current;
    if (!room) return;
    const next = !micOn;
    try {
      if (next && !(await ensureMicPermission())) {
        setGroupError('Microphone permission is needed to talk.');
        return;
      }
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
      setGroupError(null);
    } catch (e) {
      setGroupError(errorText(e));
    }
  }, [micOn]);

  const toggleDuckFor = useCallback((id: string) => {
    setDuckPrefs((p) => ({ ...p, [id]: !(p[id] ?? true) }));
  }, []);

  // ---------- derived state (re-read from the rooms on every tick) ----------
  const members = useMemo<GroupMember[]>(() => {
    void tick;
    const room = groupRoom.current;
    if (!room) return [];
    const toMember = (p: Participant, isMe: boolean): GroupMember => ({
      identity: p.identity,
      name: p.name || p.identity,
      color: colorFor(p.identity),
      talking: p.isSpeaking,
      isMe,
      duckWhenTalking: duckPrefs[p.identity] ?? true,
    });
    return [
      toMember(room.localParticipant, true),
      ...Array.from(room.remoteParticipants.values()).map((p) => toMember(p, false)),
    ];
  }, [tick, duckPrefs]);

  const duckingBy = useMemo(
    () => members.filter((m) => !m.isMe && m.talking && m.duckWhenTalking),
    [members],
  );

  const venueLive = useMemo(() => {
    void tick;
    const room = concertRoom.current;
    if (!room) return false;
    for (const p of room.remoteParticipants.values()) {
      for (const pub of p.audioTrackPublications.values()) {
        if (pub.track && !pub.isMuted) return true;
      }
    }
    return false;
  }, [tick]);

  const effectiveVolume = useMemo(() => {
    if (!concert || muted || !venueLive) return 0;
    return duckingBy.length > 0 ? volume * duckLevel : volume;
  }, [concert, muted, venueLive, volume, duckLevel, duckingBy]);

  // Apply volume / mute to the real concert audio tracks.
  useEffect(() => {
    const room = concertRoom.current;
    if (!room) return;
    for (const p of room.remoteParticipants.values()) {
      for (const pub of p.audioTrackPublications.values()) {
        // Muting stops the venue audio from being sent to you at all (saves data).
        if (pub.isEnabled === muted) pub.setEnabled(!muted);
        if (pub.track instanceof RemoteAudioTrack) {
          pub.track.setVolume(duckingBy.length > 0 ? volume * duckLevel : volume);
        }
      }
    }
  }, [tick, muted, volume, duckLevel, duckingBy]);

  // Disconnect everything if the app's state is torn down.
  useEffect(() => {
    return () => {
      concertRoom.current?.disconnect();
      groupRoom.current?.disconnect();
    };
  }, []);

  const value: RaveCallState = {
    myName,
    setMyName,
    concert,
    concertStatus,
    concertError,
    venueLive,
    joinConcert,
    leaveConcert,
    volume,
    setVolume,
    muted,
    toggleMuted,
    groupCode,
    groupStatus,
    groupError,
    members,
    createGroup,
    joinGroup,
    leaveGroup,
    micOn,
    toggleMic,
    toggleDuckFor,
    duckLevel,
    setDuckLevel,
    duckingBy,
    effectiveVolume,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRaveCall() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRaveCall must be used inside <RaveCallProvider>');
  return v;
}
