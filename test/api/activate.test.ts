import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { jsonRequest } from '../helpers/request';

vi.mock('@/lib/prisma', async () => {
    const { prismaMock } = await import('../mocks/prisma');
    return { default: prismaMock };
});

const { POST } = await import('@/app/api/activate/route');

beforeEach(() => {
    resetPrismaMock();
});

describe('POST /api/activate', () => {
    it('rejects an unknown or expired code', async () => {
        prismaMock.activation_codes.findFirst.mockResolvedValue(null);

        const res = await POST(jsonRequest('http://localhost/api/activate', { code: 'BOGUS' }));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBeTruthy();
        expect(prismaMock.activation_codes.updateMany).not.toHaveBeenCalled();
    });

    it('returns the role and increments usage for a valid code', async () => {
        prismaMock.activation_codes.findFirst.mockResolvedValue({ id: 7, code: 'GOOD1234', role: 'runner', usos: 0, max_usos: 1 });
        prismaMock.activation_codes.updateMany.mockResolvedValue({ count: 1 });

        const res = await POST(jsonRequest('http://localhost/api/activate', { code: 'GOOD1234' }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.role).toBe('runner');
        expect(prismaMock.activation_codes.updateMany).toHaveBeenCalledWith({
            where: { id: 7, usos: { lt: 1 } },
            data: { usos: { increment: 1 } },
        });
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #8 - was HIGH): activation_codes now has a
    // max_usos column, checked both up front and atomically in the update's `where`
    // clause (closing the read-then-increment race), so a code can no longer be
    // redeemed past its limit.
    it('rejects a code that has already reached its max_usos', async () => {
        prismaMock.activation_codes.findFirst.mockResolvedValue({ id: 7, code: 'REUSE123', role: 'admin', usos: 1, max_usos: 1 });

        const res = await POST(jsonRequest('http://localhost/api/activate', { code: 'REUSE123' }));

        expect(res.status).toBe(400);
        expect(prismaMock.activation_codes.updateMany).not.toHaveBeenCalled();
    });

    it('rejects when the conditional increment loses the race (count: 0)', async () => {
        prismaMock.activation_codes.findFirst.mockResolvedValue({ id: 7, code: 'RACE123', role: 'runner', usos: 0, max_usos: 1 });
        prismaMock.activation_codes.updateMany.mockResolvedValue({ count: 0 });

        const res = await POST(jsonRequest('http://localhost/api/activate', { code: 'RACE123' }));

        expect(res.status).toBe(400);
    });
});
