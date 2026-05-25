export const useAppStore = defineStore('app', () => {
    const displayStateVersion = ref(0);

    function notifyDisplayStateUpdated() {
        displayStateVersion.value++;
    }

    return {
        displayStateVersion,
        notifyDisplayStateUpdated,
    };
});

