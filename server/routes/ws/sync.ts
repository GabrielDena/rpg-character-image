import { registerPeer, unregisterPeer } from '../../utils/broadcast';

export default defineWebSocketHandler({
    open(peer) {
        registerPeer(peer);
    },
    close(peer) {
        unregisterPeer(peer);
    },
});

