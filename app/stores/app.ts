export const useAppStore = defineStore('app', () => {
    const displayStateVersion = ref(0);
    const scenesVersion = ref(0);

    function notifyDisplayStateUpdated() {
        displayStateVersion.value++;
    }

    function notifyScenesUpdated() {
        scenesVersion.value++;
    }

    return {
        displayStateVersion,
        notifyDisplayStateUpdated,
        scenesVersion,
        notifyScenesUpdated,
    };
});

