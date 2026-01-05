import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/token - 訪客驗證 Token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // 查找 token
    const accessToken = await prisma.accessToken.findUnique({
      where: { token: token.trim() },
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 檢查是否啟用
    if (!accessToken.isActive) {
      return NextResponse.json(
        { error: "Token is disabled" },
        { status: 401 }
      );
    }

    // 檢查是否過期
    if (accessToken.expiresAt && accessToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 401 }
      );
    }

    // 設置 cookie（24 小時有效）
    const response = NextResponse.json({
      success: true,
      name: accessToken.name,
    });

    response.cookies.set("visitor_token", token.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 小時
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/token - 登出（清除 cookie）
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("visitor_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
