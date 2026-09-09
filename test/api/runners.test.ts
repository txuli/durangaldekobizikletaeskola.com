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

const { GET, POST, DELETE } = await import('@/app/api/runners/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/runners', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/runners'));
        expect(res.status).toBe(403);
    });

    it('returns the max events_resultado id for ?search=maxId', async () => {
        mockSession({ role: 'admin' });
        prismaMock.events_resultado.aggregate.mockResolvedValue({ _max: { id: 41 } });

        const res = await GET(getRequest('http://localhost/api/runners?search=maxId'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ maxId: 41 });
    });

    it('searches athletes by name/surname (case-insensitive)', async () => {
        mockSession({ role: 'staff' });
        prismaMock.deportistas.findMany.mockResolvedValue([]);

        await GET(getRequest('http://localhost/api/runners?search=Jon'));

        expect(prismaMock.deportistas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { OR: [{ nombre: { contains: 'jon' } }, { apellidos: { contains: 'jon' } }] },
            })
        );
    });
});

describe('POST /api/runners', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(jsonRequest('http://localhost/api/runners', {}));
        expect(res.status).toBe(403);
    });

    it('creates an events_resultado row', async () => {
        mockSession({ role: 'admin' });
        prismaMock.events_resultado.create.mockResolvedValue({ id: 1 });

        const res = await POST(
            jsonRequest('http://localhost/api/runners', { tiempo: '01:00:00', posicion: 3, carrera_id: 2, participante_id: 'L1' })
        );

        expect(res.status).toBe(201);
        expect(prismaMock.events_resultado.create).toHaveBeenCalledWith({
            data: { id: undefined, tiempo: '01:00:00', posicion: 3, evento_id: 2, deportista_id: 'L1' },
        });
    });
});

describe('DELETE /api/runners', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const res = await DELETE(jsonRequest('http://localhost/api/runners', { id: 1 }, { method: 'DELETE' }));
        expect(res.status).toBe(403);
    });

    it('deletes the events_resultado row by id', async () => {
        mockSession({ role: 'staff' });
        prismaMock.events_resultado.delete.mockResolvedValue({});

        const res = await DELETE(jsonRequest('http://localhost/api/runners', { id: 1 }, { method: 'DELETE' }));

        expect(res.status).toBe(200);
        expect(prismaMock.events_resultado.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});
