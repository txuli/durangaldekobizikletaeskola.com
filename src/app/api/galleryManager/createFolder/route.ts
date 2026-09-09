import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
// The gallery lives on the (Linux) server at a fixed POSIX path regardless of the OS
// this code happens to run/build on, so path.posix is used explicitly here rather than
// the platform-dependent `path` module (which uses backslashes on Windows and would
// silently break this comparison there).
import path from 'path/posix';
import { withAdminAuth } from '@/lib/api-auth';

// Every gallery/cover folder this endpoint is allowed to create lives under this root.
const GALLERY_ROOT = '/www/wwwroot/photos.txuli.com/duranguesa';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { response } = await withAdminAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { folder } = body;

    if (!folder || typeof folder !== "string") {
      return new NextResponse("Error: Nombre de Album invalido", {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Resolve away any ".." segments and reject anything that escapes GALLERY_ROOT,
    // so this admin-only endpoint can't be used to create directories anywhere else
    // the Node process can write to. A relative `folder` resolves against process.cwd()
    // (not GALLERY_ROOT), so it will correctly fail this check too.
    const resolved = path.resolve(folder);
    if (resolved !== GALLERY_ROOT && !resolved.startsWith(GALLERY_ROOT + path.sep)) {
      return new NextResponse("Error: Ruta de album invalida", {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    await mkdir(resolved, { recursive: true });

    return new NextResponse(`Album '${folder}' creado correctamente.`, {
      status: 201,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error("Error al crear la carpeta:", error);
    return new NextResponse("Error: No se pudo crear el album.", {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
