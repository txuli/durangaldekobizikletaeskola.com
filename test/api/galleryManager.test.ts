import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockSession } from '../mocks/auth';
import { jsonRequest } from '../helpers/request';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const { POST } = await import('@/app/api/galleryManager/route');

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/galleryManager', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await POST(jsonRequest('http://localhost/api/galleryManager', { dir: 'gallery' }));
        expect(res.status).toBe(401);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #12 - was MEDIUM): now uses withAdminAuth
    // like its siblings createFolder/uploadImages, so a plain authenticated role (e.g.
    // "runner") is rejected instead of being allowed to use this admin-facing endpoint.
    it('rejects roles outside admin/staff/coach', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(jsonRequest('http://localhost/api/galleryManager', { dir: 'gallery' }));
        expect(res.status).toBe(403);
    });

    it('builds the deepest URL available from year/mode/category/race', async () => {
        mockSession({ role: 'admin' });
        fetchMock.mockResolvedValue({ text: async () => '<a href="x/">x</a>' });

        await POST(
            jsonRequest('http://localhost/api/galleryManager', {
                dir: 'gallery',
                year: '2024',
                mode: 'btt',
                category: 'sub23',
                race: 'final',
            })
        );

        expect(fetchMock).toHaveBeenCalledWith(
            'https://photos.txuli.com/duranguesa/gallery/2024/btt/sub23/final',
            { method: 'GET' }
        );
    });

    it('falls back to the base dir URL when no year is given', async () => {
        mockSession({ role: 'admin' });
        fetchMock.mockResolvedValue({ text: async () => '' });

        await POST(jsonRequest('http://localhost/api/galleryManager', { dir: 'gallery' }));

        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery', { method: 'GET' });
    });
});
