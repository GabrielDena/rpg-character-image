import type { BackgroundWithUrl } from './background';
import type { CharacterWithUrl } from './character';

export interface DisplayCharacter extends CharacterWithUrl {
    profileImageUrl: string | null;
}

export interface DisplayState {
    activeAdventureId: string | null;
    activeCharacters: DisplayCharacter[];
    selectedBackground: (BackgroundWithUrl & { url: string }) | null;
    galleryFitMode: 'cover' | 'contain';
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    seatAssignments: (string | null)[];
    showCharacters: boolean;
}
