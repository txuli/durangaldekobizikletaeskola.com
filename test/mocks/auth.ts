import { vi } from 'vitest';

export const getSessionMock = vi.fn();

export const authMock = {
    api: {
        getSession: getSessionMock,
    },
};

export function mockSession(user: { id?: string; role?: string } | null) {
    if (user === null) {
        getSessionMock.mockResolvedValue(null);
        return;
    }
    getSessionMock.mockResolvedValue({
        user: { id: user.id ?? 'user-1', role: user.role ?? 'user' },
        session: { id: 'session-1' },
    });
}

export default authMock;
