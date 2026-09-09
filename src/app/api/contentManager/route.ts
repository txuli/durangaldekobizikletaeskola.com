import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withRoleAuth } from "@/lib/api-auth";
interface image {
    id: number;
    path: string
}
export async function GET(req: NextRequest) {
    const { response } = await withRoleAuth(req, ["admin", "staff"]);
    if (response) return response;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    if (!page) return NextResponse.json([], { status: 400 });
    const images = await prisma.frontImages.findMany({ where: { site: page } });
    return NextResponse.json(images, { status: 200 })
}
export async function PUT(req: NextRequest) {
    const { response } = await withRoleAuth(req, ["admin", "staff"]);
    if (response) return response;
    if (!req.body) return NextResponse.json([], { status: 400 });
    const body = await req.json();
    await Promise.all(
        body.map((item: image) =>
            prisma.frontImages.update({
                where: { id: item.id },
                data: { path: item.path }
            })
        )
    );
    return NextResponse.json({ ok: true }, { status: 200 });
}
