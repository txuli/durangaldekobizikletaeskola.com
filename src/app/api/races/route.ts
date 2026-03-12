import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {  withRoleAuth, withAdminAuth} from "@/lib/api-auth";

// Obtener todas las carreras
export async function GET(req: NextRequest) {
     const { response } = await withRoleAuth(req,["coach","admin","staff"]);
    if (response) return response;
    const carreras = await prisma.events.findMany({
        orderBy: {
            fecha: "desc",
        },
    });
    return NextResponse.json(carreras);
}

// Crear una carrera
export async function POST(req: NextRequest) {
    const { response } = await withRoleAuth(req,["coach","admin","staff"]);
    if (response) return response;

    const data = await req.json();
    const carrera = await prisma.events.create({ data });
    return NextResponse.json(carrera);
}

// Editar una carrera
export async function PUT(req: NextRequest) {
    const { response } = await withAdminAuth(req);
    if (response) return response;

    const data = await req.json();
    const { id, ...rest } = data;
    const carrera = await prisma.events.update({
        where: { id },
        data: rest,
    });
    return NextResponse.json(carrera);
}

// Eliminar una carrera
export async function DELETE(req: NextRequest) {
    const { response } = await withAdminAuth(req);
    if (response) return response;

    const { id } = await req.json();

    await prisma.listado_escuelas.deleteMany({
        where: { carrera_id: id },
    });

    await prisma.events.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}