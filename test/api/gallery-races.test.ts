import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const { PATCH } = await import('@/app/api/gallery/races/route');

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('PATCH /api/gallery/races', () => {
    it('requires album, modalidad and race', async () => {
        const res = await PATCH(jsonRequest('http://localhost/api/gallery/races', {}, { method: 'PATCH' }));
        expect(res.status).toBe(400);
    });

    it('lists race subfolders, excluding files and "../"', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            text: async () => '<a href="../">..</a><a href="final/">final</a><a href="foto.jpg">foto</a>',
        });

        const res = await PATCH(
            jsonRequest(
                'http://localhost/api/gallery/races',
                { album: '2024', modalidad: 'btt', race: 'cat1', categoria: 'sub23' },
                { method: 'PATCH' }
            )
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(['final/']);
        // `categoria` is accepted and logged but never actually used to build the URL.
        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery/2024/btt/cat1');
    });
});
