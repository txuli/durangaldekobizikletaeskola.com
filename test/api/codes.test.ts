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

const { GET, POST, DELETE } = await import('@/app/api/codes/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/codes', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await GET(getRequest('http://localhost/api/codes'));
        expect(res.status).toBe(401);
    });

    it('rejects users without an admin/staff/coach role', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/codes'));
        expect(res.status).toBe(403);
    });

    it('returns non-expired codes by default', async () => {
        mockSession({ role: 'admin' });
        prismaMock.activation_codes.findMany.mockResolvedValue([{ id: 1, code: 'ABC' }]);

        const res = await GET(getRequest('http://localhost/api/codes'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([{ id: 1, code: 'ABC' }]);
        expect(prismaMock.activation_codes.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ OR: expect.any(Array) }),
            })
        );
    });

    it('returns expired codes when ?expired=true', async () => {
        mockSession({ role: 'staff' });
        prismaMock.activation_codes.findMany.mockResolvedValue([]);

        await GET(getRequest('http://localhost/api/codes?expired=true'));

        expect(prismaMock.activation_codes.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { expires_at: { lt: expect.any(Date) } },
            })
        );
    });
});

describe('POST /api/codes', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await POST(jsonRequest('http://localhost/api/codes', { role: 'runner' }));
        expect(res.status).toBe(401);
    });

    it('requires a role in the body', async () => {
        mockSession({ role: 'admin' });
        const res = await POST(jsonRequest('http://localhost/api/codes', {}));
        expect(res.status).toBe(400);
    });

    it('generates a unique code and persists it with a 1-month expiry', async () => {
        mockSession({ role: 'admin' });
        prismaMock.activation_codes.findFirst.mockResolvedValue(null);
        prismaMock.activation_codes.create.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));

        const res = await POST(jsonRequest('http://localhost/api/codes', { role: 'runner' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.role).toBe('runner');
        expect(body.usos).toBe(0);
        expect(typeof body.code).toBe('string');
        expect(body.code).toHaveLength(8);
    });

    it('retries generation until it finds a code that is not already taken', async () => {
        mockSession({ role: 'admin' });
        prismaMock.activation_codes.findFirst
            .mockResolvedValueOnce({ id: 99 }) // first generated code collides
            .mockResolvedValueOnce(null); // second attempt is free
        prismaMock.activation_codes.create.mockImplementation(async ({ data }: any) => ({ id: 2, ...data }));

        const res = await POST(jsonRequest('http://localhost/api/codes', { role: 'coach' }));

        expect(res.status).toBe(200);
        expect(prismaMock.activation_codes.findFirst).toHaveBeenCalledTimes(2);
    });
});

describe('DELETE /api/codes', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await DELETE(jsonRequest('http://localhost/api/codes', { id: 1 }, { method: 'DELETE' }));
        expect(res.status).toBe(401);
    });

    it('requires an id', async () => {
        mockSession({ role: 'admin' });
        const res = await DELETE(jsonRequest('http://localhost/api/codes', {}, { method: 'DELETE' }));
        expect(res.status).toBe(400);
    });

    it('deletes the code by id', async () => {
        mockSession({ role: 'admin' });
        prismaMock.activation_codes.delete.mockResolvedValue({ id: 5 });

        const res = await DELETE(jsonRequest('http://localhost/api/codes', { id: 5 }, { method: 'DELETE' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ ok: true });
        expect(prismaMock.activation_codes.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });
});
