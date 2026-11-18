export interface System {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
}

export interface Adventure {
    id: string;
    systemId: string;
    name: string;
    description: string | null;
    playbookLabel: string | null;
    createdAt: Date;
}

export interface Background {
    id: string;
    adventureId: string;
    locationId: string | null;
    name: string;
    storagePath: string;
    altStoragePath: string | null;
    createdAt: Date;
}

export interface Character {
    id: string;
    adventureId: string;
    name: string;
    type: 'pc' | 'npc';
    playbook: string | null;
    description: string | null;
    avatarPath: string | null;
    createdAt: Date;
}

export interface Location {
    id: string;
    adventureId: string;
    name: string;
    createdAt: Date;
}

export interface CharacterImage {
    id: string;
    characterId: string;
    storagePath: string;
    isProfile: boolean;
    createdAt: Date;
    url?: string | null;
}

export interface ItemCategory {
    id: string;
    adventureId: string;
    name: string;
    createdAt: Date;
}

export interface Item {
    id: string;
    adventureId: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    storagePath: string | null;
    createdAt: Date;
    url?: string | null;
}

export interface CharacterGroup {
    id: string;
    adventureId: string;
    name: string;
    createdAt: Date;
    memberIds?: string[];
}

export type TrackingCardType = 'clue' | 'juice' | 'tag' | 'status' | 'score';

export interface TrackingCard {
    id: string;
    adventureId: string;
    title: string;
    type: TrackingCardType;
    value: number | null;
    characterId: string | null;
    sortOrder: number;
    createdAt: Date;
}

