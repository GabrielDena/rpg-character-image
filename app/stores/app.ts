export const useAppStore = defineStore('app', () => {
    const displayStateVersion = ref(0);
    const scenesVersion = ref(0);
    const altBackground = ref(false);
    const isFullscreen = ref(false);

    function notifyDisplayStateUpdated() {
        displayStateVersion.value++;
    }

    function notifyScenesUpdated() {
        scenesVersion.value++;
    }

    function setAltBackground(value: boolean) {
        altBackground.value = value;
    }

    function setFullscreen(value: boolean) {
        isFullscreen.value = value;
    }

    return {
        displayStateVersion,
        notifyDisplayStateUpdated,
        scenesVersion,
        notifyScenesUpdated,
        altBackground,
        setAltBackground,
        isFullscreen,
        setFullscreen,
    };
});
