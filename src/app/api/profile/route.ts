import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest) {
    const { session, response } = await withAuth(req);
    if (response) return response;

    const data = await req.json();

    try {
        // Actualiza datos extra según el rol
        if (session.user.role === "runner") {
            await prisma.deportistas.updateMany({
                where: { user_id: session.user.id },
                data: {
                    apellidos: data.apellidos,
                    dni: data.dni,
                    telefono: data.telefono ? Number(data.telefono) : null,
                    fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
                    numero_licencia: data.licencia,
                    peso: data.peso ? Number(data.peso) : null,
                    altura: data.altura ? Number(data.altura) : null,
                    ftp: data.ftp ? Number(data.ftp) : null,
                    pulso: data.pulso ? Number(data.pulso) : null,
                }
            });
        } else if (session.user.role === "coach") {
            await prisma.entrenadores.updateMany({
                where: { user_id: session.user.id },
                data: {
                    apellidos: data.apellidos,
                    dni: data.dni,
                    telefono: data.telefono ? Number(data.telefono) : null,
                    fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
                }
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}