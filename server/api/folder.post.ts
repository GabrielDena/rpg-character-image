import { setFolder } from '#imports';
import { saveCampaignState } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody<{ path: string; password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
    if (!body?.path) throw createError({ statusCode: 400, message: 'Path is required' });

    setFolder(body.path);
    saveCampaignState(body.path, getState().selectedImages, null).catch(() => {});
    const folderPayload: FolderPayload = {
        type: 'folder-updated',
        data: {
            selectedFolder: body.path,
        },
    };
    broadcast(folderPayload);

    return { folder: getState().selectedFolder };
});

