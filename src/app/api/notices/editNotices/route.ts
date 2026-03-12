import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth  } from "@/lib/api-auth";
//TODO use th correct handler
export async function POST(request: NextRequest) {
  const { response } = await withRoleAuth(request,["admin","staff"]);
  if (response) return response;

  try {
    
    const body = await request.json();
    let slug = body.slug+"Page";
    
   
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const locales = ["eus", "es"];

    const messages = await Promise.all(
      locales.map(async (locale) => {
        const filePath = path.join(process.cwd(), "messages", `${locale}.json`);
        const fileContents = await fs.promises.readFile(filePath, "utf-8");
        return JSON.parse(fileContents);
      })
    );

    const [eusMessages, esMessages] = messages;
    
    const eusData = eusMessages[slug];
    const esData = esMessages[slug];
    
    
    if (!eusData && !esData) {
      return NextResponse.json({ error: "Crónica no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      eus: eusData || null,
      es: esData || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
