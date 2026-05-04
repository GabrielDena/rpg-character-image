export const useAppStore = defineStore('app', () => {
    const selectedFolder = ref<string | null>(null);
    const selectedImages = ref<string[]>([]);
    const wsConnected = ref(false);

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
        if (!import.meta.client) return;
        if (ws && ws.readyState === WebSocket.OPEN) return;

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${location.host}/_ws`);

        ws.onopen = () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            const password = localStorage.getItem('app_password') ?? '';
            ws!.send(JSON.stringify({ type: 'auth', password }));
        };

        ws.onclose = () => {
            wsConnected.value = false;
            if (!reconnectTimer) {
                reconnectTimer = setTimeout(connect, 2000);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket encountered an error:', error);
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
            } catch {}
        };
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
        toggleImage,
        clearSelection,
    };
});
