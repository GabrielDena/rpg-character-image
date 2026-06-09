export interface BackgroundWithUrl {
    id: string;
    adventureId: string;
    locationId: string | null;
    name: string;
    storagePath: string;
    altStoragePath: string | null;
    createdAt: Date;
    url: string | null;
    altUrl: string | null;
}
