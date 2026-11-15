// Fake concert data for the prototype. Later this would come from a server.

export type Concert = {
  id: string;
  code: string; // what the venue would show on screens / a QR code
  artist: string;
  venue: string;
  startsAt: string;
};

export const CONCERTS: Concert[] = [
  {
    id: 'c1',
    code: 'NEON42',
    artist: 'Neon Pulse',
    venue: 'Elliott Hall of Music',
    startsAt: 'Live now',
  },
  {
    id: 'c2',
    code: 'BASS77',
    artist: 'Low Frequency Club',
    venue: 'Mackey Arena',
    startsAt: 'Live now',
  },
  {
    id: 'c3',
    code: 'GLOW19',
    artist: 'Aurora Drift',
    venue: 'Lafayette Theater',
    startsAt: 'Starts 9:30 PM',
  },
];

export function findConcertByCode(code: string): Concert | undefined {
  const clean = code.trim().toUpperCase();
  return CONCERTS.find((c) => c.code === clean);
}

export type Friend = {
  id: string;
  name: string;
  color: string;
};

// Fake friends who "join" your group in the prototype.
export const FAKE_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Maya', color: '#FF5DA2' },
  { id: 'f2', name: 'Jordan', color: '#5DD6FF' },
  { id: 'f3', name: 'Sam', color: '#FFC85D' },
];
