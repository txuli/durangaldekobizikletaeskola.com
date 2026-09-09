import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession } from '../mocks/auth';
import { jsonRequest, getRequest } from '../helpers/request';

vi.mock('@/lib/prisma', async () => {
    const { prismaMock } = await import('../mocks/prisma');
    return { default: prismaMock };
});
vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const { GET, PUT, DELETE } = await import('@/app/api/usersManagement/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/usersManagement', () => {
    it('rejects non admin/staff/coach roles', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/usersManagement'));
        expect(res.status).toBe(403);
    });

    it('defaults a null role to "defaultRole"', async () => {
        mockSession({ role: 'admin' });
        prismaMock.user.findMany.mockResolvedValue([{ id: '1', email: 'a@b.com', name: 'A', role: null }]);

        const res = await GET(getRequest('http://localhost/api/usersManagement'));
        const body = await res.json();

        expect(body[0].role).toBe('defaultRole');
    });
});

describe('PUT /api/usersManagement', () => {
    it('rejects non admin/staff/coach roles', async () => {
        mockSession({ role: 'runner' });
        const res = await PUT(jsonRequest('http://localhost/api/usersManagement', { id: '1' }, { method: 'PUT' }));
        expect(res.status).toBe(403);
    });

    it('updates a user with the given fields', async () => {
        mockSession({ role: 'admin' });
        prismaMock.user.update.mockResolvedValue({ id: '1' });

        const res = await PUT(jsonRequest('http://localhost/api/usersManagement', { id: '1', name: 'New name' }, { method: 'PUT' }));

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { name: 'New name' } });
    });

    // Mass assignment note (low severity here since it's already admin-gated): `rest` is
    // whatever the caller sent minus `id`, so an admin could set `role` (or any other
    // column) through this generic endpoint with no explicit allowlist.
    it('BUG: has no field allowlist, so role can be changed through this generic endpoint too', async () => {
        mockSession({ role: 'admin' });
        prismaMock.user.update.mockResolvedValue({ id: '1' });

        await PUT(jsonRequest('http://localhost/api/usersManagement', { id: '1', role: 'admin' }, { method: 'PUT' }));

        expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { role: 'admin' } });
    });
});

describe('DELETE /api/usersManagement', () => {
    it('rejects non admin/staff/coach roles', async () => {
        mockSession({ role: 'runner' });
        const res = await DELETE(jsonRequest('http://localhost/api/usersManagement', { id: '1' }, { method: 'DELETE' }));
        expect(res.status).toBe(403);
    });

    it('cascades: unlinks athletes, deletes their results, then deletes coach/athlete/account/user rows', async () => {
        mockSession({ role: 'admin' });
        prismaMock.account.deleteMany.mockResolvedValue({});
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 5 });
        prismaMock.deportistas.updateMany.mockResolvedValue({});
        prismaMock.deportistas.findMany.mockResolvedValue([{ numero_licencia: 'L1' }]);
        prismaMock.events_resultado.deleteMany.mockResolvedValue({});
        prismaMock.deportistas.deleteMany.mockResolvedValue({});
        prismaMock.entrenadores.deleteMany.mockResolvedValue({});
        prismaMock.user.delete.mockResolvedValue({ id: '1' });

        const res = await DELETE(jsonRequest('http://localhost/api/usersManagement', { id: '1' }, { method: 'DELETE' }));

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.updateMany).toHaveBeenCalledWith({
            where: { entrenador_id: 5 },
            data: { entrenador_id: null },
        });
        expect(prismaMock.events_resultado.deleteMany).toHaveBeenCalledWith({ where: { deportista_id: 'L1' } });
        expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
});
