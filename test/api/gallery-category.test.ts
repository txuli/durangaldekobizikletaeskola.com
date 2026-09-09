import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const { PUT } = await import('@/app/api/gallery/category/route');

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('PUT /api/gallery/category', () => {
    it('requires album and modalidad', async () => {
        const res = await PUT(jsonRequest('http://localhost/api/gallery/category', { album: 'a' }, { method: 'PUT' }));
        expect(res.status).toBe(400);
    });

    it('returns 404 when the upstream directory does not exist', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404 });
        const res = await PUT(
            jsonRequest('http://localhost/api/gallery/category', { album: '2024', modalidad: 'btt' }, { method: 'PUT' })
        );
        expect(res.status).toBe(404);
    });

    it('strips a trailing slash from album/modalidad before building the URL', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });

        await PUT(
            jsonRequest('http://localhost/api/gallery/category', { album: '2024/', modalidad: 'btt/' }, { method: 'PUT' })
        );

        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery/2024/btt');
    });
});
