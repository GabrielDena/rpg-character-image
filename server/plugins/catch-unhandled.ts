export default defineNitroPlugin((nitroApp) => {
    process.on('unhandledRejection', (reason: any, promise) => {
        if (reason && reason.code === 'ECONNRESET') {
            console.warn('⚠️ [Node TCP] Ignored an abrupt client disconnect (ECONNRESET).');
            return; 
        }

        console.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err: any) => {
        if (err && err.code === 'ECONNRESET') {
            console.warn('⚠️ [Node TCP] Ignored an uncaught socket reset (ECONNRESET).');
            return; 
        }

        console.error('Uncaught Exception:', err);
        process.exit(1);
    });

    console.log('🛡️ TCP ECONNRESET protection activated.');
});
