import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Writable } from 'stream';
import { mockSession } from '../mocks/auth';
import { multipartRequest } from '../helpers/multipart';
import { getRequest } from '../helpers/request';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

// Must default to false: the route's `while (fs.existsSync(destPath))` collision loop
// would otherwise spin forever, since this mock never actually creates a file on disk.
const existsSyncMock = vi.fn((..._args: any[]) => false);
const mkdirSyncMock = vi.fn();
const chmodSyncMock = vi.fn();
const createWriteStreamMock = vi.fn((..._args: any[]) => new Writable({ write(_chunk, _enc, cb) { cb(); } }));

vi.mock('fs', () => ({
    default: {
        existsSync: (...a: any[]) => existsSyncMock(...a),
        mkdirSync: (...a: any[]) => mkdirSyncMock(...a),
        chmodSync: (...a: any[]) => chmodSyncMock(...a),
        createWriteStream: (...a: any[]) => createWriteStreamMock(...a),
    },
    existsSync: (...a: any[]) => existsSyncMock(...a),
    mkdirSync: (...a: any[]) => mkdirSyncMock(...a),
    chmodSync: (...a: any[]) => chmodSyncMock(...a),
    createWriteStream: (...a: any[]) => createWriteStreamMock(...a),
}));

const { POST } = await import('@/app/api/galleryManager/uploadImages/route');

beforeEach(() => {
    existsSyncMock.mockReturnValue(false);
    mkdirSyncMock.mockReset();
    chmodSyncMock.mockReset();
    createWriteStreamMock.mockClear();
});

describe('POST /api/galleryManager/uploadImages', () => {
    it('rejects requests without admin/staff/coach role', async () => {
        mockSession({ role: 'runner' });
        const req = multipartRequest('http://localhost/api/galleryManager/uploadImages', {}, []);
        const res = await POST(req);
        expect(res.status).toBe(403);
    });

    it('writes uploaded files to disk and responds 201', async () => {
        mockSession({ role: 'admin' });
        const req = multipartRequest(
            'http://localhost/api/galleryManager/uploadImages',
            { dir: '/data/gallery/2024', name: 'foto' },
            [{ fieldName: 'file', filename: 'foto.jpg', contentType: 'image/jpeg', content: 'fake-image-bytes' }]
        );

        const res = await POST(req);
        const text = await res.text();

        expect(res.status).toBe(201);
        expect(text).toMatch(/subidas correctamente/i);
        expect(createWriteStreamMock).toHaveBeenCalledTimes(1);
    });

    it('responds 400 when no file is included', async () => {
        mockSession({ role: 'staff' });
        const req = multipartRequest('http://localhost/api/galleryManager/uploadImages', { dir: '/data/gallery' }, []);
        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
