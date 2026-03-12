import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";

// Obtener deportistas (GET)
export async function GET(req: NextRequest) {
    const { session, response } = await withAdminAuth(req);
    if (response) return response;
    const { search } = Object.fromEntries(new URL(req.url).searchParams);

    if (search === "maxId") {
        try {
            const maxId = await prisma.events_resultado.aggregate({
                _max: {
                    id: true,
                },
            });

            return NextResponse.json({ maxId: maxId._max.id || 0 }, { status: 200 });
        } catch (error) {
            console.error("Error al obtener el máximo ID:", error);
            return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
        }
    }

    try {
        const searchLower = search?.toLowerCase() || "";

        const athletes = await prisma.deportistas.findMany({
            where: searchLower
                ? {
                    OR: [
                        {
                            nombre: {
                                contains: searchLower,
                            },
                        },
                        {
                            apellidos: {
                                contains: searchLower,
                            },
                        },
                    ],
                }
                : undefined,
            orderBy: {
                nombre: "asc",
            },
            select: {
                numero_licencia: true,
                nombre: true,
                apellidos: true,
            },
        });

        return NextResponse.json(athletes, { status: 200 });
    } catch (error) {
        console.error("Error al buscar deportistas:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Crear un deportista (POST)
export async function POST(req: Request) {
    const { response } = await withAdminAuth(req as NextRequest);
    if (response) return response;

    try {
        const body = await req.json();

        const newAthlete = await prisma.events_resultado.create({
            data: {
                id: body.id,
                tiempo: body.tiempo,
                posicion: body.posicion,
                evento_id: body.carrera_id,
                deportista_id: body.participante_id,
            },
        });

        return NextResponse.json(newAthlete, { status: 201 });
    } catch (error) {
        console.error("Error al crear deportista:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Eliminar un deportista (DELETE)
export async function DELETE(req: Request) {
    const { response } = await withAdminAuth(req as NextRequest);
    if (response) return response;

    try {
        const { id } = await req.json();

        await prisma.events_resultado.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ message: "Resultado eliminado correctamente" }, { status: 200 });
    } catch (error) {
        console.error("Error al eliminar resultado:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}