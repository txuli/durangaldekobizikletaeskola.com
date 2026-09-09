import { NextRequest } from 'next/server';

/** Build a NextRequest for a JSON API call, mirroring how the app's own fetch() calls look. */
export function jsonRequest(
    url: string,
    body?: unknown,
    init?: { method?: string; headers?: Record<string, string> }
) {
    return new NextRequest(url, {
        method: init?.method ?? 'POST',
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

/** Build a plain (bodyless / query-string) NextRequest, e.g. for GET requests. */
export function getRequest(url: string, headers?: Record<string, string>) {
    return new NextRequest(url, { method: 'GET', headers });
}
