export type PayloadTypes = 'state' | 'folder-updated' | 'images-updated' | 'image-uploaded' | 'fit-mode-updated' | 'background-updated';

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
        galleryFitMode: 'cover' | 'contain';
        selectedBackground: string | null;
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

export interface FitModePayload extends BasePayload {
    type: 'fit-mode-updated';
    data: {
        fitMode: 'cover' | 'contain';
    };
}

export interface BackgroundPayload extends BasePayload {
    type: 'background-updated';
    data: {
        selectedBackground: string | null;
    };
}

export type WSPayload = SyncPayload | FolderPayload | ImagesPayload | ImageUploadedPayload | FitModePayload | BackgroundPayload;
