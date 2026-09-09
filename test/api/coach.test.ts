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

const { GET, PUT, DELETE } = await import('@/app/api/coach/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/coach', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/coach'));
        expect(res.status).toBe(403);
    });

    it('joins the user and entrenadores tables for coach accounts', async () => {
        mockSession({ role: 'admin' });
        prismaMock.user.findMany.mockResolvedValue([{ id: 'u1', name: 'Ane' }]);
        prismaMock.entrenadores.findMany.mockResolvedValue([
            { id: 1, user_id: 'u1', apellidos: 'Etxeberria', dni: '123', telefono: 600111222n, fecha_nacimiento: new Date('1990-01-01') },
        ]);

        const res = await GET(getRequest('http://localhost/api/coach'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body[0]).toMatchObject({ user_id: 'u1', nombre: 'Ane', apellidos: 'Etxeberria' });
    });
});

describe('PUT /api/coach', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'coach' });
        const res = await PUT(jsonRequest('http://localhost/api/coach', { user_id: 'u1' }, { method: 'PUT' }));
        expect(res.status).toBe(403);
    });

    it('creates a new entrenador row when none exists yet', async () => {
        mockSession({ role: 'admin' });
        prismaMock.entrenadores.findFirst.mockResolvedValue(null);
        prismaMock.entrenadores.aggregate.mockResolvedValue({ _max: { id: 3 } });
        prismaMock.entrenadores.create.mockResolvedValue({});
        prismaMock.user.update.mockResolvedValue({});

        const res = await PUT(
            jsonRequest(
                'http://localhost/api/coach',
                { user_id: 'u1', nombre: 'Ane', apellidos: 'Etxeberria', dni: '123', telefono: '600111222' },
                { method: 'PUT' }
            )
        );

        expect(res.status).toBe(200);
        expect(prismaMock.entrenadores.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ id: 4, user_id: 'u1' }) })
        );
    });

    it('updates the existing entrenador row when one is found', async () => {
        mockSession({ role: 'staff' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 9, user_id: 'u1' });
        prismaMock.entrenadores.update.mockResolvedValue({});
        prismaMock.user.update.mockResolvedValue({});

        const res = await PUT(
            jsonRequest('http://localhost/api/coach', { user_id: 'u1', id: 9, nombre: 'Ane' }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.entrenadores.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 9 } })
        );
    });
});

describe('DELETE /api/coach', () => {
    // SECURITY (see SECURITY_FINDINGS.md #1 - CRITICAL): unlike GET/PUT on this same
    // route, DELETE never calls withAuth/withRoleAuth at all. This test documents the
    // current, unauthenticated behaviour rather than asserting it as desired.
    it('BUG: deletes a coach and their user account with no authentication check', async () => {
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 1, user_id: 'u1' });
        prismaMock.deportistas.updateMany.mockResolvedValue({});
        prismaMock.entrenadores.delete.mockResolvedValue({});
        prismaMock.account.deleteMany.mockResolvedValue({});
        prismaMock.user.delete.mockResolvedValue({});

        // No mockSession(...) call at all: there is no session, and the handler
        // still proceeds to delete the coach's user account.
        const res = await DELETE(jsonRequest('http://localhost/api/coach', { id: 1 }, { method: 'DELETE' }));

        expect(res.status).toBe(200);
        expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('returns 404 when the coach does not exist', async () => {
        prismaMock.entrenadores.findFirst.mockResolvedValue(null);

        const res = await DELETE(jsonRequest('http://localhost/api/coach', { id: 999 }, { method: 'DELETE' }));

        expect(res.status).toBe(404);
    });
});
