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

const { GET, PUT } = await import('@/app/api/contentManager/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/contentManager', () => {
    it('rejects roles outside admin/staff', async () => {
        mockSession({ role: 'coach' });
        const res = await GET(getRequest('http://localhost/api/contentManager?page=home'));
        expect(res.status).toBe(403);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #17): now uses withRoleAuth like its
    // siblings, so admin accounts (previously excluded by an exact `=== "staff"` check)
    // can manage content too.
    it('allows admin (not just staff)', async () => {
        mockSession({ role: 'admin' });
        prismaMock.frontImages.findMany.mockResolvedValue([]);
        const res = await GET(getRequest('http://localhost/api/contentManager?page=home'));
        expect(res.status).toBe(200);
    });

    it('requires a page query param', async () => {
        mockSession({ role: 'staff' });
        const res = await GET(getRequest('http://localhost/api/contentManager'));
        expect(res.status).toBe(400);
    });

    it('returns the frontImages rows for the given site', async () => {
        mockSession({ role: 'staff' });
        prismaMock.frontImages.findMany.mockResolvedValue([{ id: 1, site: 'home', path: 'a.webp' }]);

        const res = await GET(getRequest('http://localhost/api/contentManager?page=home'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([{ id: 1, site: 'home', path: 'a.webp' }]);
        expect(prismaMock.frontImages.findMany).toHaveBeenCalledWith({ where: { site: 'home' } });
    });
});

describe('PUT /api/contentManager', () => {
    it('rejects roles outside admin/staff', async () => {
        mockSession({ role: 'coach' });
        const res = await PUT(jsonRequest('http://localhost/api/contentManager', [{ id: 1, path: 'x' }], { method: 'PUT' }));
        expect(res.status).toBe(403);
    });

    it('updates every image in the payload and awaits all writes', async () => {
        mockSession({ role: 'staff' });
        prismaMock.frontImages.update.mockResolvedValue({});

        const res = await PUT(
            jsonRequest('http://localhost/api/contentManager', [{ id: 1, path: 'a.webp' }, { id: 2, path: 'b.webp' }], {
                method: 'PUT',
            })
        );

        expect(prismaMock.frontImages.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { path: 'a.webp' } });
        expect(prismaMock.frontImages.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { path: 'b.webp' } });
        // SECURITY/CORRECTNESS FIX (see SECURITY_FINDINGS.md #16): the handler now
        // awaits every update (Promise.all) and returns a real response - this is the
        // endpoint the new EditImages component's "save" action calls.
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ ok: true });
    });
});
