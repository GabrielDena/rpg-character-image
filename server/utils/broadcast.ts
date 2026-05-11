import type { Peer } from 'crossws';

interface Payload {
    type: string;
    data: {
        [key: string]: string | string[] | null;
    };
}

export interface SyncPayload extends Payload {
    type: 'state';
    data: {
        selectedFolder: string | null;
        selectedImages: string[];
    };
}

const activePeers = new Set<Peer>();

export function registerPeer(peer: Peer) {
    activePeers.add(peer);
}

export function unregisterPeer(peer: Peer) {
    activePeers.delete(peer);
}

export function broadcast(payload: Payload) {
    const message = JSON.stringify(payload);
    for (const peer of activePeers) {
        peer.send(message);
    }
}

