export const useSyncSocket = () => {
    const store = useAppStore();

    function handleMessage(_ws: WebSocket, event: MessageEvent) {
        const message: WSPayload = JSON.parse(event.data);

        switch (message.type) {
            case 'background-updated':
            case 'adventure-updated':
            case 'character-updated':
                store.notifyDisplayStateUpdated();
                break;
            default:
                console.warn('Unknown message type:', (message as any).type);
        }
    }

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

