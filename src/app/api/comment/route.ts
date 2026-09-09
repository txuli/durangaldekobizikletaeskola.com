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

        const rol = session.user.role;
        const isStaff = rol === "admin" || rol === "staff";
        const deportista = await prisma.deportistas.findUnique({
            where: { numero_licencia: carrera.deportista_id },
            select: { user_id: true, entrenador_id: true },
        });

        // Un deportista solo puede valorarse a sí mismo (o admin/staff en su nombre).
        if (valoracion_deportista !== undefined && !isStaff && deportista?.user_id !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Un entrenador solo puede valorar a sus propios deportistas (o admin/staff).
        if (valoracion_entrenador !== undefined && !isStaff) {
            const entrenador = rol === "coach"
                ? await prisma.entrenadores.findFirst({ where: { user_id: session.user.id }, select: { id: true } })
                : null;
            if (!entrenador || deportista?.entrenador_id !== entrenador.id) {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 });
            }
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