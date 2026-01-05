import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/photos/[slug]/verify - 驗證密碼保護照片
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

    const photo = await prisma.photo.findUnique({
      where: { slug },
      select: {
        id: true,
        visibility: true,
        accessPassword: true,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.visibility !== "password") {
      return NextResponse.json(
        { error: "Photo is not password protected" },
        { status: 400 }
      );
    }

    if (!photo.accessPassword) {
      return NextResponse.json(
        { error: "Password not set" },
        { status: 500 }
      );
    }

    // 驗證密碼
    const isValid = await bcrypt.compare(password, photo.accessPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // 設置 cookie（24 小時有效）
    const response = NextResponse.json({ success: true });
    response.cookies.set(`photo_access_${photo.id}`, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 小時
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify photo password error:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
