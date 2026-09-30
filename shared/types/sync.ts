export type PayloadTypes =
    | 'background-updated'
    | 'adventure-updated'
    | 'character-updated'
    | 'scene-updated'
    | 'alt-background-toggled'
    | 'display-transition'
    | 'tracking-card-updated';

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

export interface AltBackgroundToggledPayload extends BasePayload {
    type: 'alt-background-toggled';
    data: {
        useAltBackground: string; // 'true' | 'false' — data must be string per BasePayload
    };
}

export interface DisplayTransitionPayload extends BasePayload {
    type: 'display-transition';
    data: Record<string, never>;
}

export interface TrackingCardUpdatedPayload extends BasePayload {
    type: 'tracking-card-updated';
    data: {
        adventureId: string;
    };
}

export type WSPayload =
    | BackgroundPayload
    | AdventurePayload
    | CharacterUpdatedPayload
    | SceneUpdatedPayload
    | AltBackgroundToggledPayload
    | DisplayTransitionPayload
    | TrackingCardUpdatedPayload;

