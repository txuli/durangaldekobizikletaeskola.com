import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const { POST } = await import('@/app/api/gallery/photos/route');

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/gallery/photos', () => {
    it('requires album, modalidad and race', async () => {
        const res = await POST(jsonRequest('http://localhost/api/gallery/photos', { album: 'a' }));
        expect(res.status).toBe(400);
    });

    it('lists files from the upstream album directory', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            text: async () => '<a href="foto1.jpg">foto1</a><a href="../">..</a>',
        });

        const res = await POST(
            jsonRequest('http://localhost/api/gallery/photos', { album: '2024', modalidad: 'btt', race: 'final' })
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(['foto1.jpg']);
        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery/2024/btt/final');
    });

    it('returns 500 on upstream failure', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 });
        const res = await POST(
            jsonRequest('http://localhost/api/gallery/photos', { album: '2024', modalidad: 'btt', race: 'final' })
        );
        expect(res.status).toBe(500);
    });
});
