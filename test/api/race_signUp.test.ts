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

const { POST } = await import('@/app/api/race_signUp/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('POST /api/race_signUp', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await POST(jsonRequest('http://localhost/api/race_signUp', { carrera_id: 1 }));
        expect(res.status).toBe(401);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #11 - was MEDIUM): the role gate now
    // matches the /carreras page this form lives on (admin/staff/coach/instructor/user).
    // "runner" (the athlete role) is a different flow and is correctly rejected.
    it('rejects roles outside the /carreras page\'s own gate', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(jsonRequest('http://localhost/api/race_signUp', { carrera_id: 1 }));
        expect(res.status).toBe(403);
    });

    it('requires a numeric carrera_id', async () => {
        mockSession({ role: 'user' });
        const res = await POST(jsonRequest('http://localhost/api/race_signUp', { carrera_id: 'nope' }));
        expect(res.status).toBe(400);
    });

    it('creates a confirmed sign-up for the given race', async () => {
        mockSession({ role: 'user' });
        prismaMock.listado_escuelas.create.mockResolvedValue({ id: 1 });

        const res = await POST(
            jsonRequest('http://localhost/api/race_signUp', { carrera_id: 3, nombre_apellido: 'Jon Doe', dorsal: 12 })
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.ok).toBe(true);
        expect(prismaMock.listado_escuelas.create).toHaveBeenCalledWith({
            data: {
                dorsal: 12,
                nombre_apellido: 'Jon Doe',
                confirmado: true,
                events: { connect: { id: 3 } },
            },
        });
    });

    it('returns 500 when the athlete is already signed up (unique constraint)', async () => {
        mockSession({ role: 'instructor' });
        prismaMock.listado_escuelas.create.mockRejectedValue(new Error('unique constraint'));

        const res = await POST(jsonRequest('http://localhost/api/race_signUp', { carrera_id: 3, nombre_apellido: 'Jon', dorsal: 1 }));
        expect(res.status).toBe(500);
    });
});
