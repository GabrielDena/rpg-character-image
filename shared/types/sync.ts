export type PayloadTypes = 'state' | 'folder-updated' | 'images-updated';

interface BasePayload {
    type: PayloadTypes;
    data: {
        [key: string]: string | string[] | null;
    };
}

export interface SyncPayload extends BasePayload {
    type: 'state';
    data: {
        selectedFolder: string | null;
        selectedImages: string[];
    };
}

export interface FolderPayload extends BasePayload {
    type: 'folder-updated';
    data: {
        selectedFolder: string | null;
    };
}

export interface ImagesPayload extends BasePayload {
    type: 'images-updated';
    data: {
        selectedImages: string[];
    };
}

export type WSPayload = SyncPayload | FolderPayload | ImagesPayload;
