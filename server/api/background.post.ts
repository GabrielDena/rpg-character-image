import type { BackgroundPayload } from '../../shared/types/sync';
import { setSelectedBackground } from '../utils/state';
import { saveCampaignState } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody<{ background: string | null; password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    setSelectedBackground(body.background ?? null);
    saveCampaignState(getState().selectedFolder, getState().selectedImages, body.background ?? null).catch(() => {});

    const payload: BackgroundPayload = {
        type: 'background-updated',
        data: {
            selectedBackground: body.background ?? null,
        },
    };
    broadcast(payload);

    return { selectedBackground: getState().selectedBackground };
});
