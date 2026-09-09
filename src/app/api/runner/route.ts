import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withRoleAuth } from "@/lib/api-auth";

// Only these columns may be changed through the generic "individual edit" form -
// user_id and entrenador_id are relationship fields with their own dedicated flows
// (signup association and assignRunners respectively) and must never be mass-assigned.
const EDITABLE_FIELDS = [
    "nombre",
    "apellidos",
    "dni",
    "telefono",
    "fecha_nacimiento",
    "peso",
    "altura",
    "ftp",
    "pulso",
] as const;

function pickEditableFields(data: Record<string, any>) {
    const picked: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
        if (field in data) picked[field] = data[field];
    }
    return picked;
}

function replacerBigInt(_: string, value: any) {
    return typeof value === "bigint" ? value.toString() : value;
}

// Obtener todos los deportistas (GET)
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const available = url.searchParams.get("available");

    const { session, response } = await withRoleAuth(req, ["admin", "staff", "coach"]);
    if (response) return response;

    const userId = session.user.id;
    const rol = session.user.role;

    let deportistas;
    if (available === "true") {
        deportistas = await prisma.deportistas.findMany({
            where: { entrenador_id: null },
            orderBy: { nombre: "asc" }
        });
    } else {
        if (rol === "coach") {
            const entrenador = await prisma.entrenadores.findFirst({
                where: { user_id: userId },
                select: { id: true }
            });

            deportistas = await prisma.deportistas.findMany({
                where: { entrenador_id: entrenador?.id },
                orderBy: { nombre: "asc" }
            });
        } else {
            // Only admin/staff reach this branch now (withRoleAuth above already
            // excludes every other role), so returning every athlete is intentional.
            deportistas = await prisma.deportistas.findMany({
                orderBy: { nombre: "asc" }
            });
        }
    }

    return new NextResponse(
        JSON.stringify(deportistas, replacerBigInt),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}

// Editar o asignar deportistas (PUT)
export async function PUT(req: NextRequest) {
    const { session, response } = await withRoleAuth(req, ["admin", "staff", "coach"]);
    if (response) return response;

    const userId = session.user.id;
    const rol = session.user.role;

    const data = await req.json();

    if (data.assignRunners && Array.isArray(data.assignRunners)) {
        const entrenador = await prisma.entrenadores.findFirst({
            where: { user_id: userId },
            select: { id: true }
        });

        if (!entrenador) {
            return new NextResponse(
                JSON.stringify({ error: "Entrenador no encontrado" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        await prisma.deportistas.updateMany({
            where: { numero_licencia: { in: data.assignRunners } },
            data: { entrenador_id: entrenador.id }
        });

        return new NextResponse(
            JSON.stringify({ ok: true }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }

    // Edición individual: un coach solo puede editar a sus propios deportistas.
    const { numero_licencia } = data;
    if (rol === "coach") {
        const entrenador = await prisma.entrenadores.findFirst({
            where: { user_id: userId },
            select: { id: true }
        });
        const target = await prisma.deportistas.findUnique({
            where: { numero_licencia },
            select: { entrenador_id: true }
        });
        if (!target || !entrenador || target.entrenador_id !== entrenador.id) {
            return new NextResponse(
                JSON.stringify({ error: "No autorizado" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    const deportista = await prisma.deportistas.update({
        where: { numero_licencia },
        data: pickEditableFields(data),
    });

    // Serializa BigInt a string antes de responder
    return new NextResponse(
        JSON.stringify(deportista, replacerBigInt),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}

// Eliminar un deportista (DELETE)
export async function DELETE(req: NextRequest) {
    const { session, response } = await withRoleAuth(req, ["admin", "staff", "coach"]);
    if (response) return response;

    const { numero_licencia } = await req.json();

    if (session.user.role === "coach") {
        const entrenador = await prisma.entrenadores.findFirst({
            where: { user_id: session.user.id },
            select: { id: true }
        });
        const target = await prisma.deportistas.findUnique({
            where: { numero_licencia },
            select: { entrenador_id: true }
        });
        if (!target || !entrenador || target.entrenador_id !== entrenador.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }
    }

    await prisma.deportistas.delete({ where: { numero_licencia } });
    return NextResponse.json({ ok: true });
}