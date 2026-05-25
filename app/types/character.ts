export interface CharacterWithUrl {
    id: string;
    adventureId: string;
    name: string;
    type: string;
    playbook: string | null;
    description: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    createdAt: Date;
}
