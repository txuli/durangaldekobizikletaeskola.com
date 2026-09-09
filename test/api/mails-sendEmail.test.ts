import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const sendMailMock = vi.fn();
vi.mock('nodemailer', () => ({
    default: {
        createTransport: () => ({ sendMail: sendMailMock }),
    },
}));
vi.mock('@react-email/components', () => ({
    render: vi.fn(async () => '<html>mock</html>'),
}));
vi.mock('@/app/[locale]/components/mail/newChildMail', () => ({
    Email: () => null,
}));

const { POST } = await import('@/app/api/mails/sendEmail/route');

beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({});
});

describe('POST /api/mails/sendEmail', () => {
    it('sends the rendered email to the configured recipient', async () => {
        const res = await POST(
            jsonRequest('http://localhost/api/mails/sendEmail', {
                name: 'Jon',
                birthDate: '2015-01-01',
                address: 'Calle 1',
                city: 'Durango',
                school: 'Ikastola',
                guardianName: 'Ane',
                phone: '600000000',
                email: 'ane@example.com',
                message: 'Hola',
            })
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.message).toMatch(/correo enviado/i);
        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({ to: process.env.EMAIL_RECIPIENT, subject: expect.any(String) })
        );
    });

    it('returns 500 when nodemailer throws', async () => {
        sendMailMock.mockRejectedValue(new Error('smtp down'));
        const res = await POST(
            jsonRequest('http://localhost/api/mails/sendEmail', {
                name: 'Jon',
                birthDate: '2015-01-01',
                city: 'Durango',
                guardianName: 'Ane',
                phone: '600000000',
                email: 'ane@example.com',
            })
        );
        expect(res.status).toBe(500);
    });

    // SECURITY FIX (see SECURITY_FINDINGS.md #14 - was MEDIUM): validation is re-enabled,
    // so a payload missing the required fields is now rejected before nodemailer runs.
    // (Rate limiting against spam/quota-abuse is still a follow-up - it needs
    // infrastructure like Upstash/Redis that this app doesn't have yet.)
    it('rejects a payload missing required fields', async () => {
        const res = await POST(jsonRequest('http://localhost/api/mails/sendEmail', {}));
        expect(res.status).toBe(400);
        expect(sendMailMock).not.toHaveBeenCalled();
    });
});
