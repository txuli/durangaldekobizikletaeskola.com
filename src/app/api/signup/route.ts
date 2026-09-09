import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "better-auth";
import { withAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const {
            role,
            apellidos,
            dni,
            telefono,
            nacimiento,
            licencia,
            peso,
            altura,
            ftp,
            pulso,
        } = data;

        // Primero: inserta los datos extra SIN user_id
        if (role === "runner") {
            try {
                await prisma.deportistas.create({
                    data: {
                        numero_licencia: licencia,
                        nombre: "",
                        apellidos,
                        dni,
                        telefono: telefono ? Number(telefono) : null,
                        fecha_nacimiento: nacimiento ? new Date(nacimiento) : null,
                        peso: peso ? Number(peso) : null,
                        altura: altura ? Number(altura) : null,
                        ftp: ftp ? Number(ftp) : null,
                        pulso: pulso ? Number(pulso) : null,
                        user_id: null,
                    },
                });
            } catch (error: any) {
                if (error.code === "P2002" && error.meta?.target?.includes("dni")) {
                    return NextResponse.json({ error: "Ya existe un deportista con ese DNI" }, { status: 400 });
                }
                throw error;
            }
        } else if (role === "coach") {
            const maxIdObj = await prisma.entrenadores.aggregate({
                _max: { id: true }
            });
            const nextId = (maxIdObj._max.id ?? 0) + 1;
            //FEAT remove unnecessary data from coaches
            try {
                await prisma.entrenadores.create({
                    data: {
                        id: nextId,
                        nombre: "",
                        apellidos,
                        dni,
                        telefono: telefono ? Number(telefono) : null,
                        fecha_nacimiento: nacimiento ? new Date(nacimiento) : null,
                        user_id: null,
                    },
                });
            } catch (error: any) {
                if (error.code === "P2002" && error.meta?.target?.includes("dni")) {
                    return NextResponse.json({ error: "Ya existe un entrenador con ese DNI" }, { status: 400 });
                }
                throw error;
            }
        }

        // Si todo va bien, responde ok (el frontend debe ahora crear el usuario y luego hacer un PUT para asociar el user_id)
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        logger.error(error)
        return NextResponse.json({ error: "Error guardando los datos" }, { status: 500 });
    }
}

// Nuevo endpoint para asociar el user_id tras crear el usuario
export async function PUT(req: NextRequest) {
    // This step runs right after authClient.signUp.email() on the client, which signs
    // the new user in - so a session is expected to exist by the time this is called.
    const { session, response } = await withAuth(req);
    if (response) return response;

    try {
        const data = await req.json();
        const { role, dni, userId, name } = data;
        if (!role||(["coach", "runner"].includes(role) && (!userId || !dni )) || (["user", "staff", "instructor"].includes(role)&& !userId)) {
            return NextResponse.json({ error: "Faltan datos para asociar el usuario" }, { status: 400 });
        }

        // A caller may only associate/promote their OWN account this way - never someone
        // else's userId. Without this, anyone could grant an arbitrary account (including
        // "admin") the role of their choosing.
        if (userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Actualiza el user_id y nombre en la tabla correspondiente
        if (role === "runner") {
            await prisma.deportistas.updateMany({
                where: { dni },
                data: {
                    user_id: userId,
                    nombre: name || "",
                },
            });
        } else if (role === "coach") {
            await prisma.entrenadores.updateMany({
                where: { dni },
                data: {
                    user_id: userId,
                    nombre: name || "",
                },
            });
        }

        // Actualiza el rol en la tabla de usuarios
        await prisma.user.update({
            where: { id: userId },
            data: {
                role,
            },
        });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        logger.error(error);
        return NextResponse.json({ error: "Error actualizando el usuario" }, { status: 500 });
    }
}