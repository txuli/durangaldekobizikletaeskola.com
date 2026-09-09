import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRequest } from '../helpers/request';

const { POST } = await import('@/app/api/gallery/route');

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/gallery', () => {
    it('lists the top-level gallery years with no auth required', async () => {
        fetchMock.mockResolvedValue({ text: async () => '<a href="2024/">2024</a><a href="2023/">2023</a>' });

        const res = await POST(getRequest('http://localhost/api/gallery'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(['2024/', '2023/']);
        expect(fetchMock).toHaveBeenCalledWith('https://photos.txuli.com/duranguesa/gallery', { method: 'GET' });
    });

    it('returns 500 when the fetch throws', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));
        const res = await POST(getRequest('http://localhost/api/gallery'));
        expect(res.status).toBe(500);
    });
});
