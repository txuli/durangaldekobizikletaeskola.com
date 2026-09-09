import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession } from '../mocks/auth';
import { jsonRequest } from '../helpers/request';

vi.mock('@/lib/prisma', async () => {
    const { prismaMock } = await import('../mocks/prisma');
    return { default: prismaMock };
});
vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const { PUT } = await import('@/app/api/profile/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('PUT /api/profile', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await PUT(jsonRequest('http://localhost/api/profile', {}, { method: 'PUT' }));
        expect(res.status).toBe(401);
    });

    it('scopes runner updates to the caller\'s own deportistas row', async () => {
        mockSession({ id: 'u1', role: 'runner' });
        prismaMock.deportistas.updateMany.mockResolvedValue({ count: 1 });

        const res = await PUT(jsonRequest('http://localhost/api/profile', { apellidos: 'Etxeberria', peso: '70' }, { method: 'PUT' }));

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { user_id: 'u1' } })
        );
    });

    it('scopes coach updates to the caller\'s own entrenadores row', async () => {
        mockSession({ id: 'c1', role: 'coach' });
        prismaMock.entrenadores.updateMany.mockResolvedValue({ count: 1 });

        const res = await PUT(jsonRequest('http://localhost/api/profile', { apellidos: 'Etxeberria' }, { method: 'PUT' }));

        expect(res.status).toBe(200);
        expect(prismaMock.entrenadores.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { user_id: 'c1' } })
        );
    });

    it('is a no-op for roles without extra profile data (e.g. admin)', async () => {
        mockSession({ id: 'a1', role: 'admin' });
        const res = await PUT(jsonRequest('http://localhost/api/profile', {}, { method: 'PUT' }));

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.entrenadores.updateMany).not.toHaveBeenCalled();
    });
});
