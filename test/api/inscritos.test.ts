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

const { GET, PUT } = await import('@/app/api/inscritos/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/inscritos', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await GET(getRequest('http://localhost/api/inscritos?carrera_id=1'));
        expect(res.status).toBe(401);
    });

    it('returns an empty list when carrera_id is missing', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/inscritos'));
        const body = await res.json();
        expect(body).toEqual([]);
        expect(prismaMock.listado_escuelas.findMany).not.toHaveBeenCalled();
    });

    it('returns the registrants for a race, ordered by dorsal', async () => {
        mockSession({ role: 'coach' });
        prismaMock.listado_escuelas.findMany.mockResolvedValue([{ dorsal: 1, nombre_apellido: 'A', confirmado: true }]);

        const res = await GET(getRequest('http://localhost/api/inscritos?carrera_id=5'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(1);
        expect(prismaMock.listado_escuelas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { carrera_id: 5 } })
        );
    });
});

describe('PUT /api/inscritos', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await PUT(jsonRequest('http://localhost/api/inscritos', { carrera_id: 1, dorsal: 2, confirmado: true }, { method: 'PUT' }));
        expect(res.status).toBe(401);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #10 - was MEDIUM): now uses withRoleAuth,
    // so a plain authenticated role (e.g. "runner") can no longer confirm registrations.
    it('rejects roles outside admin/staff/coach', async () => {
        mockSession({ role: 'runner' });
        const res = await PUT(
            jsonRequest('http://localhost/api/inscritos', { carrera_id: 1, dorsal: 7, confirmado: true }, { method: 'PUT' })
        );
        expect(res.status).toBe(403);
    });

    it('lets staff/coach confirm a registration', async () => {
        mockSession({ role: 'coach' });
        prismaMock.listado_escuelas.update.mockResolvedValue({});

        const res = await PUT(
            jsonRequest('http://localhost/api/inscritos', { carrera_id: 1, dorsal: 7, confirmado: true }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.listado_escuelas.update).toHaveBeenCalledWith({
            where: { carrera_id_dorsal: { carrera_id: 1, dorsal: 7 } },
            data: { confirmado: true },
        });
    });
});
