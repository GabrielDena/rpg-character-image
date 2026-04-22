import { addPeer, broadcast, getState, removePeer, setSelectedImages } from '../utils/state';

export default defineWebSocketHandler({
    open(peer) {
        addPeer(peer);
        peer.send(JSON.stringify({ type: 'state', data: getState() }));
    },

    message(_peer, message) {
        try {
            const data = JSON.parse(message.text());
            if (data.type === 'select-images' && Array.isArray(data.images)) {
                setSelectedImages(data.images);
                broadcast({ type: 'images-updated', data: { selectedImages: data.images } });
            }
        } catch {}
    },

    close(peer) {
        console.log(`[WS] Connection closed/dropped for peer: ${peer.id}`);
        removePeer(peer);
    },

    error(peer, error) {
        // We catch the ECONNRESET here.
        // You can log it for debugging, but crucially, it stops the crash.
        console.warn(`WebSocket error (Client dropped):`, error.message);

        // Ensure we clean up the peer even if they errored out instead of closing cleanly
        removePeer(peer);
    },
});

