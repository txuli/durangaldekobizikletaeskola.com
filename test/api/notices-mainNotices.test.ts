import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const readFileMock = vi.fn();
vi.mock('fs/promises', () => ({
    default: { readFile: (...args: unknown[]) => readFileMock(...args) },
    readFile: (...args: unknown[]) => readFileMock(...args),
}));

const { POST } = await import('@/app/api/notices/mainNotices/route');

const notices = [
    { slug: 'n1', image: 'i1.webp', altKey: 'alt1', date: '2024-01-01', titleKey: 'title1', categoryKey: 'cat1' },
    { slug: 'n2', image: 'i2.webp', altKey: 'alt2', date: '2024-02-01', titleKey: 'title2', categoryKey: 'cat2' },
    { slug: 'n3', image: 'i3.webp', altKey: 'alt3', date: '2024-03-01', titleKey: 'title3', categoryKey: 'cat3' },
    { slug: 'n4', image: 'i4.webp', altKey: 'alt4', date: '2024-04-01', titleKey: 'title4', categoryKey: 'cat4' },
];

beforeEach(() => {
    readFileMock.mockReset();
    readFileMock.mockImplementation(async (filePath: string) => {
        if (String(filePath).includes('notices.json')) return JSON.stringify(notices);
        return JSON.stringify({
            noticeComponent: { title1: 'T1', title2: 'T2', title3: 'T3', title4: 'T4' },
        });
    });
});

describe('POST /api/notices/mainNotices', () => {
    it('requires a locale', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/mainNotices', { path: 'mainNotices' }));
        expect(res.status).toBe(400);
    });

    it('returns the last 3 notices, most recent first, for path=mainNotices', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/mainNotices', { path: 'mainNotices', loc: 'es' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.map((n: any) => n.slug)).toEqual(['n4', 'n3', 'n2']);
    });

    it('returns every notice, most recent first, for path=allNotices', async () => {
        const res = await POST(jsonRequest('http://localhost/api/notices/mainNotices', { path: 'allNotices', loc: 'es' }));
        const body = await res.json();

        expect(body.data.map((n: any) => n.slug)).toEqual(['n4', 'n3', 'n2', 'n1']);
    });

    it('does not throw when a translation key is missing (safeTranslate swallows it)', async () => {
        readFileMock.mockImplementation(async (filePath: string) => {
            if (String(filePath).includes('notices.json')) return JSON.stringify([notices[0]]);
            return JSON.stringify({ noticeComponent: {} }); // no title1 key defined
        });

        const res = await POST(jsonRequest('http://localhost/api/notices/mainNotices', { path: 'mainNotices', loc: 'es' }));
        const body = await res.json();

        // next-intl's default onError does NOT throw for a missing key - it logs and
        // returns a `namespace.key` fallback string instead, so safeTranslate's
        // try/catch never actually engages here. This documents that, rather than the
        // (incorrect) assumption that a missing key falls back to the raw key.
        expect(res.status).toBe(200);
        expect(body.data[0].title).toBe('noticeComponent.title1');
    });

    it('returns 500 when reading the notices file fails', async () => {
        readFileMock.mockRejectedValue(new Error('disk error'));
        const res = await POST(jsonRequest('http://localhost/api/notices/mainNotices', { path: 'mainNotices', loc: 'es' }));
        expect(res.status).toBe(500);
    });
});
