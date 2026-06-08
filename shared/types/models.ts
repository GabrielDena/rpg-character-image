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
    createdAt: Date;
}

export interface Background {
    id: string;
    adventureId: string;
    locationId: string | null;
    name: string;
    storagePath: string;
    createdAt: Date;
}

export interface Character {
    id: string;
    adventureId: string;
    name: string;
    type: string;
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

