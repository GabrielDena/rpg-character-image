export interface BackgroundWithUrl {
    id: string;
    adventureId: string;
    locationId: string | null;
    name: string;
    storagePath: string;
    createdAt: Date;
    url: string | null;
}
