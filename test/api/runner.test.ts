import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession } from '../mocks/auth';
import { jsonRequest, getRequest } from '../helpers/request';

vi.mock('@/lib/prisma', async () => {
    const { prismaMock } = await import('../mocks/prisma');
    return { default: prismaMock };
});
vi.mock('@/lib/auth', async () => {
    const { authMock } = await import('../mocks/auth');
    return { auth: authMock };
});

const { GET, PUT, DELETE } = await import('@/app/api/runner/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('GET /api/runner', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await GET(getRequest('http://localhost/api/runner'));
        expect(res.status).toBe(401);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #6 - was HIGH, PII exposure): the route now
    // requires admin/staff/coach, so a plain "runner" (athlete) account can no longer
    // pull every other athlete's full PII.
    it('rejects roles outside admin/staff/coach', async () => {
        mockSession({ role: 'runner' });
        const res = await GET(getRequest('http://localhost/api/runner'));
        expect(res.status).toBe(403);
    });

    it('scopes a coach to only their assigned athletes', async () => {
        mockSession({ id: 'coach-1', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 42 });
        prismaMock.deportistas.findMany.mockResolvedValue([]);

        await GET(getRequest('http://localhost/api/runner'));

        expect(prismaMock.deportistas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { entrenador_id: 42 } })
        );
    });

    it('returns unassigned athletes when ?available=true', async () => {
        mockSession({ role: 'coach' });
        prismaMock.deportistas.findMany.mockResolvedValue([]);

        await GET(getRequest('http://localhost/api/runner?available=true'));

        expect(prismaMock.deportistas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { entrenador_id: null } })
        );
    });

    it('returns every athlete for admin/staff', async () => {
        mockSession({ role: 'admin' });
        prismaMock.deportistas.findMany.mockResolvedValue([{ numero_licencia: 1, dni: '99999999X' }]);

        const res = await GET(getRequest('http://localhost/api/runner'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body[0].dni).toBe('99999999X');
        expect(prismaMock.deportistas.findMany).toHaveBeenCalledWith({ orderBy: { nombre: 'asc' } });
    });
});

describe('PUT /api/runner', () => {
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await PUT(jsonRequest('http://localhost/api/runner', {}, { method: 'PUT' }));
        expect(res.status).toBe(401);
    });

    it('rejects roles outside admin/staff/coach', async () => {
        mockSession({ role: 'runner' });
        const res = await PUT(jsonRequest('http://localhost/api/runner', { numero_licencia: 'L1' }, { method: 'PUT' }));
        expect(res.status).toBe(403);
    });

    it('lets a coach assign athletes by license number to themselves', async () => {
        mockSession({ id: 'coach-1', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 7 });
        prismaMock.deportistas.updateMany.mockResolvedValue({ count: 2 });

        const res = await PUT(
            jsonRequest('http://localhost/api/runner', { assignRunners: ['LIC1', 'LIC2'] }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.updateMany).toHaveBeenCalledWith({
            where: { numero_licencia: { in: ['LIC1', 'LIC2'] } },
            data: { entrenador_id: 7 },
        });
    });

    it('rejects assignRunners when the caller has no entrenador row', async () => {
        mockSession({ id: 'coach-1', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue(null);

        const res = await PUT(jsonRequest('http://localhost/api/runner', { assignRunners: ['LIC1'] }, { method: 'PUT' }));
        expect(res.status).toBe(400);
    });

    it('lets admin/staff edit any athlete, applying only the allowlisted fields', async () => {
        mockSession({ role: 'admin' });
        prismaMock.deportistas.update.mockResolvedValue({ numero_licencia: 'L1', dni: 'X' });

        const res = await PUT(
            jsonRequest(
                'http://localhost/api/runner',
                { numero_licencia: 'L1', dni: 'X', entrenador_id: 999 },
                { method: 'PUT' }
            )
        );

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.update).toHaveBeenCalledWith({
            where: { numero_licencia: 'L1' },
            data: { dni: 'X' }, // entrenador_id is deliberately not editable here
        });
    });

    it('lets a coach edit their own athlete', async () => {
        mockSession({ id: 'coach-1', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 7 });
        prismaMock.deportistas.findUnique.mockResolvedValue({ entrenador_id: 7 });
        prismaMock.deportistas.update.mockResolvedValue({ numero_licencia: 'L1' });

        const res = await PUT(
            jsonRequest('http://localhost/api/runner', { numero_licencia: 'L1', peso: 70 }, { method: 'PUT' })
        );

        expect(res.status).toBe(200);
        expect(prismaMock.deportistas.update).toHaveBeenCalledWith({
            where: { numero_licencia: 'L1' },
            data: { peso: 70 },
        });
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #5 - was HIGH, IDOR + mass assignment): a
    // coach editing an athlete that isn't theirs is now rejected, and the update is
    // restricted to an explicit field allowlist (checked in the admin/staff test above).
    it('rejects a coach editing an athlete that is not theirs', async () => {
        mockSession({ id: 'coach-2', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 99 });
        prismaMock.deportistas.findUnique.mockResolvedValue({ entrenador_id: 7 }); // belongs to a different coach

        const res = await PUT(
            jsonRequest('http://localhost/api/runner', { numero_licencia: 'VICTIM', dni: 'HACKED' }, { method: 'PUT' })
        );

        expect(res.status).toBe(403);
        expect(prismaMock.deportistas.update).not.toHaveBeenCalled();
    });
});

describe('DELETE /api/runner', () => {
    // SECURITY FIX (see SECURITY_FINDINGS.md #3 - was CRITICAL): identical pattern to
    // /api/coach's DELETE fix - this handler now requires admin/staff/coach.
    it('rejects unauthenticated requests', async () => {
        mockSession(null);
        const res = await DELETE(jsonRequest('http://localhost/api/runner', { numero_licencia: 'L1' }, { method: 'DELETE' }));
        expect(res.status).toBe(401);
    });

    it('rejects roles outside admin/staff/coach', async () => {
        mockSession({ role: 'runner' });
        const res = await DELETE(jsonRequest('http://localhost/api/runner', { numero_licencia: 'L1' }, { method: 'DELETE' }));
        expect(res.status).toBe(403);
    });

    it('lets admin/staff delete any athlete', async () => {
        mockSession({ role: 'staff' });
        prismaMock.deportistas.delete.mockResolvedValue({});

        const res = await DELETE(jsonRequest('http://localhost/api/runner', { numero_licencia: 'L1' }, { method: 'DELETE' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ ok: true });
        expect(prismaMock.deportistas.delete).toHaveBeenCalledWith({ where: { numero_licencia: 'L1' } });
    });

    it('rejects a coach deleting an athlete that is not theirs', async () => {
        mockSession({ id: 'coach-2', role: 'coach' });
        prismaMock.entrenadores.findFirst.mockResolvedValue({ id: 99 });
        prismaMock.deportistas.findUnique.mockResolvedValue({ entrenador_id: 7 });

        const res = await DELETE(jsonRequest('http://localhost/api/runner', { numero_licencia: 'VICTIM' }, { method: 'DELETE' }));

        expect(res.status).toBe(403);
        expect(prismaMock.deportistas.delete).not.toHaveBeenCalled();
    });
});
