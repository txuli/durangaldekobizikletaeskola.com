import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
interface image {
    id: number;
    path: string
}
export async function GET(req: NextRequest) {
    const { response, session } = await withAuth(req);
    if (session?.user.role != "staff") return NextResponse.json([], { status: 401 });
    if (response) return response;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    if (!page) return NextResponse.json([], { status: 400 });
    const images = await prisma.frontImages.findMany({ where: { site: page } });
    return NextResponse.json(images, { status: 200 })
}
export async function PUT(req: NextRequest) {
    const { response, session } = await withAuth(req);
    if (session?.user.role != "staff") return NextResponse.json([], { status: 401 });
    if (!req.body) return NextResponse.json([], { status: 400 });
    const body = await req.json();
    body.forEach(async (item: image) => {
        await prisma.frontImages.update({
            where: { id: item.id },
            data: { path: item.path }
        });
    });

}
