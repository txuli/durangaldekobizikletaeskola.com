import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Writable } from 'stream';
import { mockSession } from '../mocks/auth';
import { multipartRequest } from '../helpers/multipart';

vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const chmodSyncMock = vi.fn();
const createWriteStreamMock = vi.fn((..._args: any[]) => new Writable({ write(_chunk, _enc, cb) { cb(); } }));
vi.mock('fs', () => ({
    default: {
        chmodSync: (...a: any[]) => chmodSyncMock(...a),
        createWriteStream: (...a: any[]) => createWriteStreamMock(...a),
    },
    chmodSync: (...a: any[]) => chmodSyncMock(...a),
    createWriteStream: (...a: any[]) => createWriteStreamMock(...a),
}));

const readFileMock = vi.fn();
const writeFileMock = vi.fn();
vi.mock('fs/promises', () => ({
    default: {
        readFile: (...a: any[]) => readFileMock(...a),
        writeFile: (...a: any[]) => writeFileMock(...a),
    },
    readFile: (...a: any[]) => readFileMock(...a),
    writeFile: (...a: any[]) => writeFileMock(...a),
}));

const { POST } = await import('@/app/api/content/route');

beforeEach(() => {
    chmodSyncMock.mockReset();
    createWriteStreamMock.mockClear();
    writeFileMock.mockReset();
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockReset();
    readFileMock.mockImplementation(async (filePath: string) => {
        const p = String(filePath);
        if (p.includes('notices.json')) return JSON.stringify([]);
        if (p.includes('eus.json')) return JSON.stringify({ noticeComponent: {} });
        return JSON.stringify({ noticeComponent: {} }); // es.json
    });
});

describe('POST /api/content', () => {
    // SECURITY FIX (see SECURITY_FINDINGS.md #4 - was CRITICAL): the route now requires
    // an admin/staff session, matching its sibling notice-editing routes.
    it('rejects requests without admin/staff role', async () => {
        mockSession({ role: 'runner' });
        const req = multipartRequest('http://localhost/api/content', { date: '2024-05-01' });
        const res = await POST(req);
        expect(res.status).toBe(403);
        expect(createWriteStreamMock).not.toHaveBeenCalled();
    });

    it('creates a public notice and writes the uploaded file for an admin/staff caller', async () => {
        mockSession({ role: 'staff' });
        const req = multipartRequest(
            'http://localhost/api/content',
            {
                date: '2024-05-01',
                titleKey: 'Título de la crónica',
                subtitleKey: 'Subtítulo',
                altKey: 'Alt',
                titleKeyEus: 'Eus título',
                subtitleKeyEus: 'Eus subtítulo',
                altKeyEus: 'Eus alt',
            },
            [{ fieldName: 'file', filename: 'foto.webp', contentType: 'image/webp', content: 'fake-image-bytes' }]
        );

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.message).toMatch(/creada correctamente/i);
        expect(createWriteStreamMock).toHaveBeenCalledTimes(1);
        expect(writeFileMock).toHaveBeenCalled();

        const noticesWrite = writeFileMock.mock.calls.find(([path]) => String(path).includes('notices.json'));
        expect(noticesWrite).toBeTruthy();
        const written = JSON.parse(noticesWrite![1] as string);
        expect(written[0].slug).toBe('cronica2024-05-01');
    });

    it('accepts arbitrary extra url/urltxt pairs and stores them on the notice', async () => {
        mockSession({ role: 'admin' });
        const req = multipartRequest('http://localhost/api/content', {
            date: '2024-06-01',
            url1: 'https://example.com',
            urltxt1: 'Clasificación',
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const noticesWrite = writeFileMock.mock.calls.find(([path]) => String(path).includes('notices.json'));
        const written = JSON.parse(noticesWrite![1] as string);
        expect(written[0].urls).toEqual([{ url: 'https://example.com', txt: 'Clasificación' }]);
    });
});
