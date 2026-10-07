export function signAdminProof(userId: string, sessionId: string, secret: string, now?: number): string;
export function validAdminProof(value: string | undefined, userId: string, sessionId: string, secret: string, now?: number): boolean;
