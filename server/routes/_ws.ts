import { addPeer, removePeer, getState, broadcast, setSelectedImages } from '../utils/state'

export default defineWebSocketHandler({
  open(peer) {
    addPeer(peer)
    peer.send(JSON.stringify({ type: 'state', data: getState() }))
  },

  message(_peer, message) {
    try {
      const data = JSON.parse(message.text())
      if (data.type === 'select-images' && Array.isArray(data.images)) {
        setSelectedImages(data.images)
        broadcast({ type: 'images-updated', data: { selectedImages: data.images } })
      }
    } catch {}
  },

  close(peer) {
    removePeer(peer)
  },
})
