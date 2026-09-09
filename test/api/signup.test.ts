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
vi.mock('better-auth', () => ({ logger: { error: vi.fn() } }));

const { POST, PUT } = await import('@/app/api/signup/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('POST /api/signup', () => {
    it('creates a deportistas row (with no user_id yet) for role=runner', async () => {
        prismaMock.deportistas.create.mockResolvedValue({});
        const res = await POST(
            jsonRequest('http://localhost/api/signup', { role: 'runner', apellidos: 'Doe', dni: '123', licencia: 'L1' })
        );
        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ user_id: null, numero_licencia: 'L1' }) })
        );
    });

    it('returns 400 when the DNI is already taken', async () => {
        prismaMock.deportistas.create.mockRejectedValue({ code: 'P2002', meta: { target: ['dni'] } });
        const res = await POST(jsonRequest('http://localhost/api/signup', { role: 'runner', dni: '123' }));
        expect(res.status).toBe(400);
    });

    it('creates an entrenadores row for role=coach', async () => {
        prismaMock.entrenadores.aggregate.mockResolvedValue({ _max: { id: 4 } });
        prismaMock.entrenadores.create.mockResolvedValue({});
        const res = await POST(jsonRequest('http://localhost/api/signup', { role: 'coach', dni: '999' }));
        expect(res.status).toBe(200);
        expect(prismaMock.entrenadores.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ id: 5, user_id: null }) })
        );
    });
});

describe('PUT /api/signup', () => {
    it('rejects unauthenticated requests (this step runs right after signUp.email(), which signs the user in)', async () => {
        mockSession(null);
        const res = await PUT(jsonRequest('http://localhost/api/signup', { role: 'runner', dni: '1', userId: 'u1' }, { method: 'PUT' }));
        expect(res.status).toBe(401);
    });

    it('rejects when required fields are missing for the given role', async () => {
        mockSession({ id: 'u1', role: 'user' });
        const res = await PUT(jsonRequest('http://localhost/api/signup', { role: 'runner' }, { method: 'PUT' }));
        expect(res.status).toBe(400);
    });

    it('links a runner to their own user_id by dni and sets the role', async () => {
        mockSession({ id: 'u1', role: 'user' });
        prismaMock.deportistas.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.user.update.mockResolvedValue({});

        const res = await PUT(
            jsonRequest('http://localhost/api/signup', { role: 'runner', dni: '123', userId: 'u1', name: 'Jon' }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.updateMany).toHaveBeenCalledWith({
            where: { dni: '123' },
            data: { user_id: 'u1', nombre: 'Jon' },
        });
        expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: 'runner' } });
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #1 - was CRITICAL): the handler now
    // requires a session, and only lets a caller associate/promote THEIR OWN account
    // (userId must equal session.user.id) - so nobody can grant an arbitrary account
    // (including someone else's) a role, only their own after redeeming a valid code.
    it('rejects promoting a userId other than the caller\'s own, even to a lower-privilege role', async () => {
        mockSession({ id: 'attacker', role: 'user' });

        const res = await PUT(
            jsonRequest('http://localhost/api/signup', { role: 'admin', userId: 'someone-else' }, { method: 'PUT' })
        );

        expect(res.status).toBe(403);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('still allows a caller to set their OWN role (e.g. after redeeming an admin-granting code)', async () => {
        mockSession({ id: 'self', role: 'user' });
        prismaMock.user.update.mockResolvedValue({ id: 'self', role: 'admin' });

        const res = await PUT(
            jsonRequest('http://localhost/api/signup', { role: 'admin', userId: 'self' }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'self' }, data: { role: 'admin' } });
    });
});
