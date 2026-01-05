import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/tokens - 取得所有 Token 列表
export async function GET() {
  try {
    const tokens = await prisma.accessToken.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            photos: true,
            albums: true,
          },
        },
      },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Get tokens error:", error);
    return NextResponse.json(
      { error: "Failed to get tokens" },
      { status: 500 }
    );
  }
}

// POST /api/admin/tokens - 建立新 Token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, expiresAt } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // 產生唯一 token
    const token = crypto.randomUUID();

    const accessToken = await prisma.accessToken.create({
      data: {
        name: name.trim(),
        token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            photos: true,
            albums: true,
          },
        },
      },
    });

    return NextResponse.json(accessToken, { status: 201 });
  } catch (error) {
    console.error("Create token error:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
