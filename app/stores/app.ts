export const useAppStore = defineStore('app', () => {
    const selectedFolder = ref<string | null>(null);
    const selectedImages = ref<string[]>([]);

    function sendSelection(images: string[]) {
        const password = localStorage.getItem('app_password') ?? '';
        $fetch('/api/selection', { method: 'POST', body: { images, password } }).catch(() => {});
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
        toggleImage,
        clearSelection,
    };
});
