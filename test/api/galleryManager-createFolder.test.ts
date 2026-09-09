import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSession } from '../mocks/auth';
import { jsonRequest } from '../helpers/request';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const mkdirMock = vi.fn();
vi.mock('fs/promises', () => ({
    mkdir: (...args: unknown[]) => mkdirMock(...args),
}));

const { POST } = await import('@/app/api/galleryManager/createFolder/route');

beforeEach(() => {
    mkdirMock.mockReset();
    mkdirMock.mockResolvedValue(undefined);
});

describe('POST /api/galleryManager/createFolder', () => {
    it('rejects requests without admin/staff/coach role', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(jsonRequest('http://localhost/api/galleryManager/createFolder', { folder: '/tmp/x' }));
        expect(res.status).toBe(403);
    });

    it('requires a folder string', async () => {
        mockSession({ role: 'admin' });
        const res = await POST(jsonRequest('http://localhost/api/galleryManager/createFolder', {}));
        expect(res.status).toBe(400);
    });

    const GALLERY_ROOT = '/www/wwwroot/photos.txuli.com/duranguesa';

    it('creates the folder recursively when it is under the gallery root', async () => {
        mockSession({ role: 'admin' });
        const res = await POST(
            jsonRequest('http://localhost/api/galleryManager/createFolder', { folder: `${GALLERY_ROOT}/gallery/2024/btt` })
        );

        expect(res.status).toBe(201);
        expect(mkdirMock).toHaveBeenCalledWith(`${GALLERY_ROOT}/gallery/2024/btt`, { recursive: true });
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #7 - was HIGH): `folder` is now resolved
    // and checked against a fixed gallery root before being passed to fs.mkdir, so an
    // admin/staff/coach account can no longer create directories outside it.
    it('rejects a folder path that escapes the gallery root via ".."', async () => {
        mockSession({ role: 'coach' });

        const res = await POST(
            jsonRequest('http://localhost/api/galleryManager/createFolder', { folder: `${GALLERY_ROOT}/../../etc` })
        );

        expect(res.status).toBe(400);
        expect(mkdirMock).not.toHaveBeenCalled();
    });

    it('rejects an absolute path outside the gallery root entirely', async () => {
        mockSession({ role: 'admin' });

        const res = await POST(
            jsonRequest('http://localhost/api/galleryManager/createFolder', { folder: '/etc/cron.d/evil' })
        );

        expect(res.status).toBe(400);
        expect(mkdirMock).not.toHaveBeenCalled();
    });

    it('rejects a relative folder path', async () => {
        mockSession({ role: 'admin' });

        const res = await POST(
            jsonRequest('http://localhost/api/galleryManager/createFolder', { folder: 'relative/escape' })
        );

        expect(res.status).toBe(400);
        expect(mkdirMock).not.toHaveBeenCalled();
    });
});
