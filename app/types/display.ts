import type { BackgroundWithUrl } from './background';
import type { CharacterWithUrl } from './character';

export interface DisplayCharacter extends CharacterWithUrl {
    profileImageUrl: string | null;
}

export interface DisplayItem {
    id: string;
    name: string;
    description: string | null;
    storagePath: string | null;
    url: string | null;
}

export interface DisplayState {
    activeAdventureId: string | null;
    activeCharacters: DisplayCharacter[];
    activeItems: DisplayItem[];
    selectedBackground: (BackgroundWithUrl & { url: string }) | null;
    galleryFitMode: 'cover' | 'contain';
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    tableSideSeats: number;
    seatAssignments: (string | null)[];
    showCharacters: boolean;
    showItems: boolean;
    useAltBackground: boolean;
}
