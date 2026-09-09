import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { code } = await req.json();

    const result = await prisma.activation_codes.findFirst({
        where: {
            code,
            expires_at: { gte: new Date() }
        }
    });

    if (!result || (result.usos ?? 0) >= result.max_usos) {
        return NextResponse.json({ error: "El código introducido no es válido o ya ha caducado." }, { status: 400 });
    }

    // Atomic conditional update: only increments (and only succeeds) if `usos` is still
    // below max_usos at write time, closing the race where two requests both read the
    // count as available and both increment past the limit.
    const { count } = await prisma.activation_codes.updateMany({
        where: { id: result.id, usos: { lt: result.max_usos } },
        data: { usos: { increment: 1 } }
    });

    if (count === 0) {
        return NextResponse.json({ error: "El código introducido no es válido o ya ha caducado." }, { status: 400 });
    }

    return NextResponse.json({ role: result.role });
}
