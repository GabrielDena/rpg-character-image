export interface CharacterWithUrl {
    id: string;
    adventureId: string;
    name: string;
    type: 'pc' | 'npc';
    playbook: string | null;
    description: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    groupIds: string[];
    createdAt: Date;
}
