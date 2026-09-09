import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const { POST } = await import('@/app/api/gallery/modalidad/route');

const fetchMock = vi.fn();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/gallery/modalidad', () => {
    it('is reachable with no authentication (public gallery browsing)', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });
        const res = await POST(jsonRequest('http://localhost/api/gallery/modalidad', { year: '2024' }));
        expect(res.status).toBe(200);
    });

    it('requires a year', async () => {
        const res = await POST(jsonRequest('http://localhost/api/gallery/modalidad', {}));
        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('parses directory hrefs out of the upstream HTML listing, excluding "../"', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            text: async () => `
                <a href="../">..</a>
                <a href="ruta/">ruta</a>
                <a href="btt/">btt</a>
            `,
        });

        const res = await POST(jsonRequest('http://localhost/api/gallery/modalidad', { year: '2024' }));
        const body = await res.json();

        expect(body).toEqual(['ruta/', 'btt/']);
        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery/2024');
    });

    it('returns 500 when the upstream request fails', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404 });
        const res = await POST(jsonRequest('http://localhost/api/gallery/modalidad', { year: '2024' }));
        expect(res.status).toBe(500);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #15 - was MEDIUM): `year` is now validated
    // as a single safe path segment before being used to build the upstream URL, so
    // path-traversal segments like ".." are rejected instead of being forwarded.
    it('rejects a "year" containing path-traversal segments', async () => {
        const res = await POST(jsonRequest('http://localhost/api/gallery/modalidad', { year: '../other-event' }));

        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
