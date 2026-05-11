export type PayloadTypes = 'state' | 'folder-updated' | 'images-updated' | 'image-uploaded';

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

export interface ImageUploadedPayload extends BasePayload {
    type: 'image-uploaded';
    data: {
        folder: string;
    };
}

export type WSPayload = SyncPayload | FolderPayload | ImagesPayload | ImageUploadedPayload;
