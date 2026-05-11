export const useAppStore = defineStore('app', () => {
    const selectedFolder = ref<string | null>(null);
    const selectedImages = ref<string[]>([]);
    const selectedBackground = ref<string | null>(null);
    const imageListVersion = ref(0);
    const galleryFitMode = ref<'cover' | 'contain'>('cover');

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

    function setSelectedImages(images: string[]) {
        selectedImages.value = images;
    }

    function setSelectedFolder(folder: string | null) {
        selectedFolder.value = folder;
    }

    function notifyImageUploaded() {
        imageListVersion.value++;
    }

    function setSelectedBackground(path: string | null) {
        selectedBackground.value = path;
        const password = import.meta.client ? (localStorage.getItem('app_password') ?? '') : '';
        $fetch('/api/background', { method: 'POST', body: { background: path, password } }).catch(() => {});
    }

    function setGalleryFitMode(mode: 'cover' | 'contain') {
        galleryFitMode.value = mode;
    }

    return {
        selectedFolder,
        selectedImages,
        selectedBackground,
        toggleImage,
        clearSelection,
        setSelectedImages,
        setSelectedFolder,
        setSelectedBackground,
        imageListVersion,
        notifyImageUploaded,
        galleryFitMode,
        setGalleryFitMode,
    };
});

