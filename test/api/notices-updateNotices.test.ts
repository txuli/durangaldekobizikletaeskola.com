import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockSession } from '../mocks/auth';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const readFileMock = vi.fn();
const writeFileMock = vi.fn();
vi.mock('fs/promises', () => ({
    default: {
        readFile: (...args: unknown[]) => readFileMock(...args),
        writeFile: (...args: unknown[]) => writeFileMock(...args),
    },
    readFile: (...args: unknown[]) => readFileMock(...args),
    writeFile: (...args: unknown[]) => writeFileMock(...args),
}));

const { POST } = await import('@/app/api/notices/updateNotices/route');

function formDataRequest(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return new NextRequest('http://localhost/api/notices/updateNotices', { method: 'POST', body: fd });
}

beforeEach(() => {
    readFileMock.mockReset();
    writeFileMock.mockReset();
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockImplementation(async (filePath: string) => {
        if (String(filePath).includes('notices.json')) {
            return JSON.stringify([{ slug: 'cronica1', altKey: 'altKey3' }]);
        }
        return JSON.stringify({ noticeComponent: {} });
    });
});

describe('POST /api/notices/updateNotices', () => {
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const res = await POST(formDataRequest({ slug: 'cronica1', locale: 'es' }));
        expect(res.status).toBe(403);
    });

    it('requires slug and locale', async () => {
        mockSession({ role: 'staff' });
        const res = await POST(formDataRequest({ slug: 'cronica1' }));
        expect(res.status).toBe(400);
    });

    it('returns 404 when the slug or its altKey is not found', async () => {
        mockSession({ role: 'admin' });
        readFileMock.mockImplementation(async (filePath: string) => {
            if (String(filePath).includes('notices.json')) return JSON.stringify([]);
            return JSON.stringify({ noticeComponent: {} });
        });

        const res = await POST(formDataRequest({ slug: 'missing', locale: 'es' }));
        expect(res.status).toBe(404);
    });

    it('extracts the number from altKey and writes the updated title/subtitle', async () => {
        mockSession({ role: 'staff' });

        const res = await POST(
            formDataRequest({ slug: 'cronica1', locale: 'es', title: 'Nuevo título', subtitle: 'Nuevo subtítulo' })
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.updatedKeys).toEqual({ component: '3', translation: 'cronica1Page' });
        expect(writeFileMock).toHaveBeenCalledTimes(1);
        const written = JSON.parse(writeFileMock.mock.calls[0][1] as string);
        expect(written.noticeComponent.noticeTitle3).toBe('Nuevo título');
        expect(written.cronica1Page.title).toBe('Nuevo título');
    });
});
