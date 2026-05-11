import { useSyncSocket } from "~/composables/useSyncSocket";

export default defineNuxtPlugin((nuxtApp) => {
    const { open } = useSyncSocket();
    open();
});