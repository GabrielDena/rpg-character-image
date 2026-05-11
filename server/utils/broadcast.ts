import type { Peer } from 'crossws';

const activePeers = new Set<Peer>();

export function registerPeer(peer: Peer) {
    activePeers.add(peer);
}

export function unregisterPeer(peer: Peer) {
    activePeers.delete(peer);
}

export function broadcast(payload: WSPayload) {
    const message = JSON.stringify(payload);
    for (const peer of activePeers) {
        peer.send(message);
    }
}

