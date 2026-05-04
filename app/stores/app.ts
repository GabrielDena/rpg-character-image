export const useAppStore = defineStore('app', () => {
    const selectedFolder = ref<string | null>(null);
    const selectedImages = ref<string[]>([]);
    const wsConnected = ref(false);

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let manualDisconnect = false;

    const INITIAL_RECONNECT_DELAY = 1000; // 1 second
    const MAX_RECONNECT_DELAY = 30000; // 30 seconds
    const MAX_RECONNECT_ATTEMPTS = 10;

    function getReconnectDelay(): number {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
        const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
            MAX_RECONNECT_DELAY
        );
        return delay;
    }

    function scheduleReconnect() {
        if (manualDisconnect) return;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.warn('[WS] Max reconnection attempts reached. Stopping reconnection.');
            return;
        }

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }

        const delay = getReconnectDelay();
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            connect();
        }, delay);
    }

    function connect() {
        if (!import.meta.client) return;
        if (ws && ws.readyState === WebSocket.OPEN) return;
        if (manualDisconnect) return;

        // Clean up existing connection
        if (ws) {
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            ws.onopen = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            ws = null;
        }

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${location.host}/_ws`);

        ws.onopen = () => {
            console.log('[WS] Connected');
            reconnectAttempts = 0; // Reset on successful connection
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            const password = localStorage.getItem('app_password') ?? '';
            ws!.send(JSON.stringify({ type: 'auth', password }));
        };

        ws.onclose = (event) => {
            console.log(`[WS] Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
            wsConnected.value = false;
            
            // Don't reconnect if it was a normal closure or manual disconnect
            if (event.code === 1000 || manualDisconnect) {
                return;
            }
            
            scheduleReconnect();
        };

        ws.onerror = (error) => {
            console.error('[WS] Error:', error);
            wsConnected.value = false;
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string);
                if (msg.type === 'state') {
                    wsConnected.value = true;
                    selectedFolder.value = msg.data.selectedFolder ?? null;
                    selectedImages.value = msg.data.selectedImages ?? [];
                } else if (msg.type === 'images-updated') {
                    selectedImages.value = msg.data.selectedImages ?? [];
                } else if (msg.type === 'folder-changed') {
                    selectedFolder.value = msg.data.folder ?? null;
                    selectedImages.value = [];
                }
            } catch (error) {
                console.error('[WS] Failed to parse message:', error);
            }
        };
    }

    function disconnect() {
        manualDisconnect = true;
        wsConnected.value = false;
        
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
        if (ws) {
            ws.close(1000, 'Manual disconnect');
            ws = null;
        }
        
        reconnectAttempts = 0;
    }

    function reconnect() {
        manualDisconnect = false;
        reconnectAttempts = 0;
        connect();
    }

    function sendSelection(images: string[]) {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'select-images', images }));
        } else {
            const password = localStorage.getItem('app_password') ?? '';
            $fetch('/api/selection', { method: 'POST', body: { images, password } }).catch(() => {});
        }
    }

    function toggleImage(filename: string) {
        const next = new Set(selectedImages.value);
        if (next.has(filename)) {
            next.delete(filename);
        } else {
            next.add(filename);
        }
        selectedImages.value = [...next];
        sendSelection(selectedImages.value);
    }

    function clearSelection() {
        selectedImages.value = [];
        sendSelection([]);
    }

    return {
        selectedFolder,
        selectedImages,
        wsConnected,
        connect,
        disconnect,
        reconnect,
        toggleImage,
        clearSelection,
    };
});
