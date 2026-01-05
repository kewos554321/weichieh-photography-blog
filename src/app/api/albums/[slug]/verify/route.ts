import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/albums/[slug]/verify - 驗證密碼保護相簿
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({
      where: { slug },
      select: {
        id: true,
        visibility: true,
        accessPassword: true,
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (album.visibility !== "password") {
      return NextResponse.json(
        { error: "Album is not password protected" },
        { status: 400 }
      );
    }

    if (!album.accessPassword) {
      return NextResponse.json(
        { error: "Password not set" },
        { status: 500 }
      );
    }

    // 驗證密碼
    const isValid = await bcrypt.compare(password, album.accessPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // 設置 cookie（24 小時有效）
    const response = NextResponse.json({ success: true });
    response.cookies.set(`album_access_${album.id}`, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 小時
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify album password error:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
