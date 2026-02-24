import { NextRequest, NextResponse } from "next/server";
import { log } from "discord-logify";
import path from "path";
import fs from "fs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const logger = new log();

  try {
    const formData = await req.formData();
    const files = formData.getAll("file");
    const dir = formData.get("dir")?.toString();
    const type = formData.get("type")?.toString();
    const album = formData.get("album")?.toString().split("/");

    if (!dir) {
      return NextResponse.json({ message: "Missing dir" }, { status: 400 });
    }

 
   if (files.length === 0) return NextResponse.json({ message: "No files" }, { status: 400 });

    for (const element of files) {
      if (!(element instanceof File)) continue;

      const bytes = await element.arrayBuffer();
      const buffer = Buffer.from(bytes);

   
      const filePath = path.join(dir, formData.get("name")?.toString()+".webp" as string);

      
       await fs.promises.writeFile(filePath, buffer);

      switch (type) {
        case "Año": {
          const name = formData.get("name")?.toString();
          if (name) {
            await prisma.years.create({
              data: {
                year: parseInt(name, 10),
                path: `${dir.slice(13)}/${name}.webp`,
              },
            });
          }
          logger.Info("year correctly created");
          break;
        }

        case "Modalidad": {
          const name = formData.get("name")?.toString();
          if (album?.[1] && name) {
            const albumId = await prisma.years.findUnique({
              where: { year: parseInt(album[1], 10) },
            });

            if (albumId?.id != null) {
              await prisma.modalities.create({
                data: {
                  path: dir.slice(13),
                  name: name,
                  year: { connect: { id: albumId.id } },
                },
              });
            }
          }
          logger.Info("modality correctly created");
          break;
        }
        case "Categoria":
          
          break

        default:
          logger.Error("Invalid type")
          return NextResponse.json({ message: "Invalid type" }, { status: 400 });
      }
    }

    
    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    logger.Error(String(error));
  
    return NextResponse.json(
      { message: "Internal error", error: String(error) },
      { status: 500 }
    );
  }
}