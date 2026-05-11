function handleMessage(_ws: WebSocket, event: MessageEvent) {
    const store = useAppStore();
    const message: WSPayload = JSON.parse(event.data);

    switch (message.type) {
        case 'state':
            store.setSelectedFolder(message.data.selectedFolder);
            store.setSelectedImages(message.data.selectedImages);
            store.setGalleryFitMode(message.data.galleryFitMode);
            store.selectedBackground = message.data.selectedBackground;
            break;
        case 'folder-updated':
            store.setSelectedFolder(message.data.selectedFolder);
            break;
        case 'images-updated':
            store.setSelectedImages(message.data.selectedImages);
            break;
        case 'image-uploaded':
            store.notifyImageUploaded();
            break;
        case 'fit-mode-updated':
            store.setGalleryFitMode(message.data.fitMode);
            break;
        case 'background-updated':
            store.selectedBackground = message.data.selectedBackground;
            break;
        default:
            console.warn('Unknown message type:', (message as any).type);
    }
}

export const useSyncSocket = () => {
    const { status, open } = useWebSocket('/ws/sync', {
        autoReconnect: true,
        immediate: false,
        onConnected: () => {
            console.log('Connected to sync socket');
        },
        onDisconnected: () => {
            console.log('Disconnected from sync socket');
        },
        onMessage: handleMessage,
    });

    return {
        status,
        open,
    };
};

