import { addPeer, broadcast, getState, removePeer, setSelectedImages } from '../utils/state'
import { checkPassword } from '../utils/auth'

const authenticated = new Set<string>()

export default defineWebSocketHandler({
    open(_peer) {
        // Wait for auth message before adding to peers or sending state
    },

    message(peer, message) {
        try {
            const data = JSON.parse(message.text())

            if (!authenticated.has(peer.id)) {
                if (data.type === 'auth' && checkPassword(data.password)) {
                    authenticated.add(peer.id)
                    addPeer(peer)
                    try {
                        peer.send(JSON.stringify({ type: 'state', data: getState() }))
                    } catch (error: any) {
                        if (error?.code !== 'ECONNRESET') {
                            console.error('[WS Send Error]', error)
                        }
                    }
                } else {
                    try {
                        peer.close()
                    } catch (error: any) {
                        if (error?.code !== 'ECONNRESET') {
                            console.error('[WS Close Error]', error)
                        }
                    }
                }
                return
            }

            if (data.type === 'select-images' && Array.isArray(data.images)) {
                setSelectedImages(data.images)
                broadcast({ type: 'images-updated', data: { selectedImages: data.images } })
            }
        } catch (error: any) {
            console.error('[WS Message Error]', error)
        }
    },

    close(peer) {
        console.log(`[WS] Connection closed for peer: ${peer.id}`)
        authenticated.delete(peer.id)
        removePeer(peer)
    },

    error(peer, error) {
        console.warn(`WebSocket error (client dropped):`, error.message)
        authenticated.delete(peer.id)
        removePeer(peer)
    },
})
