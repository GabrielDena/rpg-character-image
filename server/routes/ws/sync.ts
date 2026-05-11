import { registerPeer, unregisterPeer } from '../../utils/broadcast';

export default defineWebSocketHandler({
    open(peer) {
        registerPeer(peer);
        peer.send(JSON.stringify({ type: 'state', data: getState() }));
    },
    close(peer) {
        unregisterPeer(peer);
    },
});

