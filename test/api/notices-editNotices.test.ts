import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSession } from '../mocks/auth';
import { jsonRequest } from '../helpers/request';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const readFileMock = vi.fn();
vi.mock('fs', () => ({
    default: { promises: { readFile: (...args: unknown[]) => readFileMock(...args) } },
    promises: { readFile: (...args: unknown[]) => readFileMock(...args) },
}));

const { POST } = await import('@/app/api/notices/editNotices/route');

const eusMessages = JSON.stringify({ cronica1Page: { title: 'Eus title' } });
const esMessages = JSON.stringify({ cronica1Page: { title: 'Es title' } });

beforeEach(() => {
    readFileMock.mockReset();
    readFileMock.mockImplementation(async (filePath: string) => {
        if (String(filePath).includes('eus.json')) return eusMessages;
        return esMessages;
    });
});

describe('POST /api/notices/editNotices', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'coach' });
        const res = await POST(jsonRequest('http://localhost/api/notices/editNotices', { slug: 'cronica1' }));
        expect(res.status).toBe(403);
    });

    it('returns both locale blocks for a known slug', async () => {
        mockSession({ role: 'staff' });
        const res = await POST(jsonRequest('http://localhost/api/notices/editNotices', { slug: 'cronica1' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.es).toEqual({ title: 'Es title' });
        expect(body.eus).toEqual({ title: 'Eus title' });
    });

    it('returns 404 when the slug does not exist in either locale', async () => {
        mockSession({ role: 'admin' });
        const res = await POST(jsonRequest('http://localhost/api/notices/editNotices', { slug: 'unknown' }));
        expect(res.status).toBe(404);
    });
});
