import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonRequest } from '../helpers/request';

const sendMailMock = vi.fn();
vi.mock('nodemailer', () => ({
    default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

const { POST } = await import('@/app/api/mails/sendEmailClothes/route');

beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({});
});

describe('POST /api/mails/sendEmailClothes', () => {
    it('requires nombre, mail and a non-empty productos array', async () => {
        const res = await POST(jsonRequest('http://localhost/api/mails/sendEmailClothes', { nombre: 'Jon', mail: 'a@b.com', productos: [] }));
        expect(res.status).toBe(400);
        expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('formats the order into the email body and sends it', async () => {
        const res = await POST(
            jsonRequest('http://localhost/api/mails/sendEmailClothes', {
                nombre: 'Jon',
                mail: 'jon@example.com',
                productos: [{ name: 'Maillot', type: 'verano', talla: 'M' }],
            })
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.message).toMatch(/correo enviado/i);
        const sentArgs = sendMailMock.mock.calls[0][0];
        expect(sentArgs.text).toContain('Maillot');
        expect(sentArgs.text).toContain('Jon');
    });

    it('returns 500 when nodemailer throws', async () => {
        sendMailMock.mockRejectedValue(new Error('smtp down'));
        const res = await POST(
            jsonRequest('http://localhost/api/mails/sendEmailClothes', {
                nombre: 'Jon',
                mail: 'jon@example.com',
                productos: [{ name: 'Maillot', type: 'verano' }],
            })
        );
        expect(res.status).toBe(500);
    });
});
