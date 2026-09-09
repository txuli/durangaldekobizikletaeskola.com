import { NextRequest } from 'next/server';

interface MultipartFile {
    fieldName: string;
    filename: string;
    contentType: string;
    content: string | Buffer;
}

/** Build a real multipart/form-data NextRequest, so routes using Busboy parse a real body. */
export function multipartRequest(url: string, fields: Record<string, string> = {}, files: MultipartFile[] = []) {
    const boundary = `----vitestBoundary${Math.random().toString(16).slice(2)}`;
    const parts: Buffer[] = [];

    for (const [name, value] of Object.entries(fields)) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    }

    for (const file of files) {
        parts.push(
            Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
            )
        );
        parts.push(Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content));
        parts.push(Buffer.from('\r\n'));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const body = Buffer.concat(parts);

    return new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body,
    });
}
