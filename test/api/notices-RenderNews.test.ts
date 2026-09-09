import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const readFileMock = vi.fn();
vi.mock('fs/promises', () => ({
    default: { readFile: (...args: unknown[]) => readFileMock(...args) },
    readFile: (...args: unknown[]) => readFileMock(...args),
}));

const { POST } = await import('@/app/api/notices/RenderNews/route');

beforeEach(() => {
    readFileMock.mockReset();
    readFileMock.mockResolvedValue(
        JSON.stringify([{ slug: 'cronica-12-04-25', title: 'Crónica' }])
    );
});

describe('POST /api/notices/RenderNews', () => {
    it('is public (no auth required) and finds a notice ignoring dashes/case', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/RenderNews', { slug: 'CRONICA-1204-25' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toMatchObject({ slug: 'cronica-12-04-25' });
    });

    it('returns data: undefined when nothing matches', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/RenderNews', { slug: 'does-not-exist' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toBeUndefined();
    });

    it('returns 500 when the slug field is missing (calling .trim() on undefined throws)', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/RenderNews', {}));
        expect(res.status).toBe(500);
    });
});
