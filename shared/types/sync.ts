export type PayloadTypes =
    | 'background-updated'
    | 'adventure-updated'
    | 'character-updated'
    | 'scene-updated';

interface BasePayload {
    type: PayloadTypes;
    data: {
        [key: string]: string | string[] | null;
    };
}

export interface BackgroundPayload extends BasePayload {
    type: 'background-updated';
    data: {
        selectedBackground: string | null;
    };
}

export interface AdventurePayload extends BasePayload {
    type: 'adventure-updated';
    data: {
        activeAdventureId: string | null;
    };
}

export interface CharacterUpdatedPayload extends BasePayload {
    type: 'character-updated';
    data: {
        characterId: string;
    };
}

export interface SceneUpdatedPayload extends BasePayload {
    type: 'scene-updated';
    data: {
        adventureId: string;
    };
}

export type WSPayload =
    | BackgroundPayload
    | AdventurePayload
    | CharacterUpdatedPayload
    | SceneUpdatedPayload;

