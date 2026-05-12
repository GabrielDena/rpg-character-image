export default defineEventHandler(async (event) => {
    const body = await readBody<{ images: string[]; password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
    if (!Array.isArray(body?.images)) throw createError({ statusCode: 400, message: 'images must be an array' });

    setSelectedImages(body.images);
    saveCampaignState(getState().selectedFolder, body.images, getState().selectedBackground).catch(() => {});
    const imagesPaylod: ImagesPayload = {
        type: 'images-updated',
        data: {
            selectedImages: body.images,
        },
    };
    broadcast(imagesPaylod);

    return { selectedImages: getState().selectedImages };
});

