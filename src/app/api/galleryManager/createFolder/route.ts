import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import {log} from 'discord-logify'
export async function POST(req: NextRequest) {
  const logger = new log()
  try {
    const body = await req.json();
    const folder = body?.folder;
    logger.Info(folder)
    if (!folder || typeof folder !== "string") {
      return NextResponse.json(
        { ok: false, message: "Nombre de álbum inválido" },
        { status: 400 }
      );
    }

    await mkdir(folder, { recursive: true });

    return NextResponse.json(
      { ok: true, message: "Álbum creado correctamente.", folder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear la carpeta:", error);
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el álbum.", error: String(error) },
      { status: 500 }
    );
  }
}