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

const { POST } = await import('@/app/api/comment/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('POST /api/comment', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await POST(jsonRequest('http://localhost/api/comment', {}));
        expect(res.status).toBe(401);
    });

    it('requires carrera.evento_id and carrera.deportista_id', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(jsonRequest('http://localhost/api/comment', { carrera: {} }));
        expect(res.status).toBe(400);
    });

    it('lets an athlete rate themselves', async () => {
        mockSession({ id: 'athlete-1', role: 'runner' });
        prismaMock.deportistas.findUnique.mockResolvedValue({ user_id: 'athlete-1', entrenador_id: 9 });
        prismaMock.events_resultado.updateMany.mockResolvedValue({ count: 1 });

        const res = await POST(
            jsonRequest('http://localhost/api/comment', {
                carrera: { evento_id: 1, deportista_id: 2 },
                valoracion_deportista: 5,
            })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.events_resultado.updateMany).toHaveBeenCalledWith({
            where: { evento_id: 1, deportista_id: 2 },
            data: { valoracion_deportista: 5 },
        });
    });

    it('lets the athlete\'s own coach rate them', async () => {
        mockSession({ id: 'coach-1', role: 'coach' });
        prismaMock.deportistas.findUnique.mockResolvedValue({ user_id: 'athlete-1', entrenador_id: 9 });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 9 });
        prismaMock.events_resultado.updateMany.mockResolvedValue({ count: 1 });

        const res = await POST(
            jsonRequest('http://localhost/api/comment', {
                carrera: { evento_id: 1, deportista_id: 2 },
                valoracion_entrenador: 'buen ritmo',
            })
        );

        expect(res.status).toBe(200);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #9 - was MEDIUM): a caller can no longer
    // rate an athlete they have no relation to.
    it('rejects an authenticated user rating an athlete that is not themselves', async () => {
        mockSession({ id: 'attacker', role: 'runner' });
        prismaMock.deportistas.findUnique.mockResolvedValue({ user_id: 'someone-else', entrenador_id: 9 });

        const res = await POST(
            jsonRequest('http://localhost/api/comment', {
                carrera: { evento_id: 1, deportista_id: 'someone-elses-license' },
                valoracion_deportista: 'trolling',
            })
        );

        expect(res.status).toBe(403);
        expect(prismaMock.events_resultado.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a coach rating an athlete who is not theirs', async () => {
        mockSession({ id: 'coach-2', role: 'coach' });
        prismaMock.deportistas.findUnique.mockResolvedValue({ user_id: 'athlete-1', entrenador_id: 9 });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 42 }); // a different coach

        const res = await POST(
            jsonRequest('http://localhost/api/comment', {
                carrera: { evento_id: 1, deportista_id: 2 },
                valoracion_entrenador: 1,
            })
        );

        expect(res.status).toBe(403);
    });

    it('allows admin/staff to set either rating regardless of ownership', async () => {
        mockSession({ id: 'admin-1', role: 'admin' });
        prismaMock.deportistas.findUnique.mockResolvedValue({ user_id: 'someone-else', entrenador_id: 9 });
        prismaMock.events_resultado.updateMany.mockResolvedValue({ count: 1 });

        const res = await POST(
            jsonRequest('http://localhost/api/comment', {
                carrera: { evento_id: 1, deportista_id: 2 },
                valoracion_deportista: 'ok',
                valoracion_entrenador: 'ok',
            })
        );

        expect(res.status).toBe(200);
    });
});
