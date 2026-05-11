function handleMessage(_ws: WebSocket, event: MessageEvent) {
    const store = useAppStore();
    const message: WSPayload = JSON.parse(event.data);

    switch (message.type) {
        case 'state':
            store.setSelectedFolder(message.data.selectedFolder);
            store.setSelectedImages(message.data.selectedImages);
            break;
        case 'folder-updated':
            store.setSelectedFolder(message.data.selectedFolder);
            break;
        case 'images-updated':
            store.setSelectedImages(message.data.selectedImages);
            break;
        // case 'background-updated':
        //     // Handle background update
        //     break;
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

