export interface SavedScene {
    id: string;
    adventureId: string;
    name: string;
    characterIds: string[];
    backgroundId: string | null;
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    tableSideSeats: number;
    useAltBackground: boolean;
    createdAt: Date;
}
