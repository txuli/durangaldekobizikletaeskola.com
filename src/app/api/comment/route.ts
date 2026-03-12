import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
    const { session, response } = await withAuth(req);
    if (response) return response;

    try {
        const body = await req.json();
        const { carrera, valoracion_deportista, valoracion_entrenador } = body;

        if (!carrera || !carrera.evento_id || !carrera.deportista_id) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Si viene valoracion_deportista, actualiza ese campo
        if (valoracion_deportista !== undefined) {
            await prisma.events_resultado.updateMany({
                where: {
                    evento_id: carrera.evento_id,
                    deportista_id: carrera.deportista_id,
                },
                data: {
                    valoracion_deportista
                }
            });
        }

        // Si viene valoracion_entrenador, actualiza ese campo
        if (valoracion_entrenador !== undefined) {
            await prisma.events_resultado.updateMany({
                where: {
                    evento_id: carrera.evento_id,
                    deportista_id: carrera.deportista_id,
                },
                data: {
                    valoracion_entrenador
                }
            });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Error al guardar la valoración" }, { status: 500 });
    }
}