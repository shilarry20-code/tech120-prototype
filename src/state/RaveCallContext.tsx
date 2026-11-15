// All of the app's shared state lives here so every tab sees the same values.
// Everything is simulated (no real audio yet) so it runs in Expo Go.

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
import { FAKE_FRIENDS, type Concert, type Friend } from '@/data/concerts';

export type GroupMember = Friend & {
  talking: boolean;
  /** Per-person toggle: lower the concert while this friend talks. */
  duckWhenTalking: boolean;
};

type RaveCallState = {
  // Concert
  concert: Concert | null;
  joinConcert: (c: Concert) => void;
  leaveConcert: () => void;
  volume: number; // 0..1, what the user set with the slider
  setVolume: (v: number) => void;
  muted: boolean;
  toggleMuted: () => void;

  // Friends group
  groupCode: string | null;
  members: GroupMember[];
  createGroup: () => void;
  joinGroup: (code: string) => boolean;
  leaveGroup: () => void;
  micOn: boolean;
  toggleMic: () => void;
  toggleDuckFor: (friendId: string) => void;
  duckLevel: number; // 0..1, how loud the concert stays while ducked
  setDuckLevel: (v: number) => void;
  simulateTalk: (friendId: string) => void;

  // Derived
  duckingBy: GroupMember[]; // friends currently causing the concert to duck
  effectiveVolume: number; // what actually plays in the earbuds
};

const Ctx = createContext<RaveCallState | null>(null);

function randomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 4; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out + Math.floor(10 + Math.random() * 90);
}

const TALK_MS = 2500;

export function RaveCallProvider({ children }: { children: ReactNode }) {
  const [concert, setConcert] = useState<Concert | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [micOn, setMicOn] = useState(false);
  const [duckLevel, setDuckLevel] = useState(0.3);

  const talkTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const joinConcert = useCallback((c: Concert) => {
    setConcert(c);
    setMuted(false);
  }, []);
  const leaveConcert = useCallback(() => setConcert(null), []);
  const toggleMuted = useCallback(() => setMuted((m) => !m), []);

  const startGroup = useCallback((code: string) => {
    setGroupCode(code);
    setMembers(FAKE_FRIENDS.map((f) => ({ ...f, talking: false, duckWhenTalking: true })));
  }, []);

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

  const leaveGroup = useCallback(() => {
    Object.values(talkTimers.current).forEach(clearTimeout);
    talkTimers.current = {};
    setGroupCode(null);
    setMembers([]);
    setMicOn(false);
  }, []);

  const toggleMic = useCallback(() => setMicOn((m) => !m), []);

  const toggleDuckFor = useCallback((friendId: string) => {
    setMembers((ms) =>
      ms.map((m) => (m.id === friendId ? { ...m, duckWhenTalking: !m.duckWhenTalking } : m)),
    );
  }, []);

  // Make a friend "talk" for a couple of seconds.
  const simulateTalk = useCallback((friendId: string) => {
    setMembers((ms) => ms.map((m) => (m.id === friendId ? { ...m, talking: true } : m)));
    clearTimeout(talkTimers.current[friendId]);
    talkTimers.current[friendId] = setTimeout(() => {
      setMembers((ms) => ms.map((m) => (m.id === friendId ? { ...m, talking: false } : m)));
    }, TALK_MS);
  }, []);

  // While in a group, a random friend speaks every few seconds so the demo feels alive.
  useEffect(() => {
    if (!groupCode) return;
    const id = setInterval(() => {
      if (Math.random() < 0.5) return;
      const f = FAKE_FRIENDS[Math.floor(Math.random() * FAKE_FRIENDS.length)];
      simulateTalk(f.id);
    }, 6000);
    return () => clearInterval(id);
  }, [groupCode, simulateTalk]);

  // Clean up timers when the app unmounts.
  useEffect(() => {
    const timers = talkTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const duckingBy = useMemo(
    () => members.filter((m) => m.talking && m.duckWhenTalking),
    [members],
  );

  const effectiveVolume = useMemo(() => {
    if (!concert || muted) return 0;
    return duckingBy.length > 0 ? volume * duckLevel : volume;
  }, [concert, muted, volume, duckLevel, duckingBy]);

  const value: RaveCallState = {
    concert,
    joinConcert,
    leaveConcert,
    volume,
    setVolume,
    muted,
    toggleMuted,
    groupCode,
    members,
    createGroup,
    joinGroup,
    leaveGroup,
    micOn,
    toggleMic,
    toggleDuckFor,
    duckLevel,
    setDuckLevel,
    simulateTalk,
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
