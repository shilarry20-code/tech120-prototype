import { TokenSource } from 'livekit-client';

/**
 * LiveKit Cloud development token server ID (Project Settings → Development token server).
 * DEVELOPMENT ONLY: anyone with this ID can join rooms in the project.
 * Before a real launch, replace this with your own token endpoint
 * (TokenSource.endpoint('https://your-server/getToken')).
 */
export const TOKEN_SERVER_ID = 'tech120prototype-jm1f6v';

/** Room naming: one room per concert, one per friend group. */
export const concertRoomName = (code: string) => `concert-${code.toUpperCase()}`;
export const groupRoomName = (code: string) => `group-${code.toUpperCase()}`;

/** Fetch connection details (server URL + token) for a room. */
export async function getConnectionDetails(roomName: string, identity: string, name: string) {
  // A fresh source per room, since a token source caches one response at a time.
  const source = TokenSource.developmentTokenServer(TOKEN_SERVER_ID);
  const res = await source.fetch({
    roomName,
    participantIdentity: identity,
    participantName: name,
  });
  return { serverUrl: res.serverUrl, token: res.participantToken };
}
