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
        onMessage(ws, event) {
            console.log('Message received:', event.data);
        },
    });

    return {
        status,
        open,
    };
};
