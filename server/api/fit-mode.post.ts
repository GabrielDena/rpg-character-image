export default defineEventHandler(async (event) => {
    const body = await readBody<{ fitMode: 'cover' | 'contain'; password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
    if (body?.fitMode !== 'cover' && body?.fitMode !== 'contain') throw createError({ statusCode: 400, message: 'fitMode must be cover or contain' });

    setGalleryFitMode(body.fitMode);
    const payload: FitModePayload = {
        type: 'fit-mode-updated',
        data: {
            fitMode: body.fitMode,
        },
    };
    broadcast(payload);

    return { galleryFitMode: getState().galleryFitMode };
});
