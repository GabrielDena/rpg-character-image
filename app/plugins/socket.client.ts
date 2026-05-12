export default defineNuxtPlugin(() => {
    const { open } = useSyncSocket();
    open();
});