// Concert list is still hard-coded. Each concert's audio lives in the LiveKit
// room "concert-<code>". Later this list would come from a server.

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
