import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRequest } from '../helpers/request';

const readFileMock = vi.fn();
vi.mock('fs/promises', () => ({
    default: { readFile: (...args: unknown[]) => readFileMock(...args) },
    readFile: (...args: unknown[]) => readFileMock(...args),
}));

const { GET } = await import('@/app/api/translations/route');

beforeEach(() => {
    readFileMock.mockReset();
});

describe('GET /api/translations', () => {
    it('rejects an unsupported/missing lang', async () => {
        const res = await GET(getRequest('http://localhost/api/translations?lang=fr'));
        expect(res.status).toBe(400);

        const res2 = await GET(getRequest('http://localhost/api/translations'));
        expect(res2.status).toBe(400);
    });

    it('returns the parsed messages file for a supported lang', async () => {
        readFileMock.mockResolvedValue(JSON.stringify({ hello: 'kaixo' }));
        const res = await GET(getRequest('http://localhost/api/translations?lang=eus'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ hello: 'kaixo' });
    });

    it('returns 500 when the file cannot be read', async () => {
        readFileMock.mockRejectedValue(new Error('missing file'));
        const res = await GET(getRequest('http://localhost/api/translations?lang=es'));
        expect(res.status).toBe(500);
    });
});
