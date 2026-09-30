export const useAppStore = defineStore('app', () => {
    const displayStateVersion = ref(0);
    const displayTransitionVersion = ref(0);
    const scenesVersion = ref(0);
    const trackingCardsVersion = ref(0);
    const altBackground = ref(false);
    const isFullscreen = ref(false);
    const navCollapsed = ref(false);

    function notifyDisplayStateUpdated() {
        displayStateVersion.value++;
    }

    function notifyDisplayTransition() {
        displayTransitionVersion.value++;
    }

    function notifyScenesUpdated() {
        scenesVersion.value++;
    }

    function notifyTrackingCardsUpdated() {
        trackingCardsVersion.value++;
    }

    function setAltBackground(value: boolean) {
        altBackground.value = value;
    }

    function setFullscreen(value: boolean) {
        isFullscreen.value = value;
    }

    function setNavCollapsed(value: boolean) {
        navCollapsed.value = value;
    }

    return {
        displayStateVersion,
        displayTransitionVersion,
        notifyDisplayStateUpdated,
        notifyDisplayTransition,
        scenesVersion,
        notifyScenesUpdated,
        trackingCardsVersion,
        notifyTrackingCardsUpdated,
        altBackground,
        setAltBackground,
        isFullscreen,
        setFullscreen,
        navCollapsed,
        setNavCollapsed,
    };
});
