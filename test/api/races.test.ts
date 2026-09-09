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

const { GET, POST, PUT, DELETE } = await import('@/app/api/races/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/races', () => {
    it('rejects roles outside coach/admin/staff', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/races'));
        expect(res.status).toBe(403);
    });

    it('lists races ordered by date desc', async () => {
        mockSession({ role: 'coach' });
        prismaMock.events.findMany.mockResolvedValue([{ id: 1 }]);
        const res = await GET(getRequest('http://localhost/api/races'));
        expect(res.status).toBe(200);
        expect(prismaMock.events.findMany).toHaveBeenCalledWith({ orderBy: { fecha: 'desc' } });
    });
});

describe('POST /api/races', () => {
    it('rejects roles outside coach/admin/staff', async () => {
        mockSession(null);
        const res = await POST(jsonRequest('http://localhost/api/races', {}));
        expect(res.status).toBe(401);
    });

    it('creates a race from the request body', async () => {
        mockSession({ role: 'coach' });
        prismaMock.events.create.mockResolvedValue({ id: 9 });
        const res = await POST(jsonRequest('http://localhost/api/races', { nombre: 'Duranguesa' }));
        expect(res.status).toBe(200);
        expect(prismaMock.events.create).toHaveBeenCalledWith({ data: { nombre: 'Duranguesa' } });
    });
});

describe('PUT /api/races', () => {
    it('rejects non admin/staff/coach roles', async () => {
        mockSession({ role: 'runner' });
        const res = await PUT(jsonRequest('http://localhost/api/races', { id: 1 }, { method: 'PUT' }));
        expect(res.status).toBe(403);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #13 - was MEDIUM, mass assignment): the
    // update now goes through an explicit field allowlist, so unknown/unexpected keys in
    // the request body (like a hypothetical "internal_flag") are silently dropped.
    it('only applies allowlisted fields, dropping anything else in the body', async () => {
        mockSession({ role: 'coach' });
        prismaMock.events.update.mockResolvedValue({ id: 1, nombre: 'Nuevo' });

        const res = await PUT(
            jsonRequest('http://localhost/api/races', { id: 1, nombre: 'Nuevo', internal_flag: true }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.events.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { nombre: 'Nuevo' },
        });
    });
});

describe('DELETE /api/races', () => {
    it('rejects non admin/staff/coach roles', async () => {
        mockSession({ role: 'runner' });
        const res = await DELETE(jsonRequest('http://localhost/api/races', { id: 1 }, { method: 'DELETE' }));
        expect(res.status).toBe(403);
    });

    it('deletes the race and its registrants', async () => {
        mockSession({ role: 'admin' });
        prismaMock.listado_escuelas.deleteMany.mockResolvedValue({ count: 2 });
        prismaMock.events.delete.mockResolvedValue({ id: 1 });

        const res = await DELETE(jsonRequest('http://localhost/api/races', { id: 1 }, { method: 'DELETE' }));

        expect(res.status).toBe(200);
        expect(prismaMock.listado_escuelas.deleteMany).toHaveBeenCalledWith({ where: { carrera_id: 1 } });
        expect(prismaMock.events.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});
