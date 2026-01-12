import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultWatermarkSettings, WatermarkSettings } from "@/lib/watermark";
import { clearWatermarkCache } from "@/lib/serverWatermark";

const SETTINGS_KEY = "watermark";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!settings) {
      return NextResponse.json(defaultWatermarkSettings);
    }

    return NextResponse.json({
      ...defaultWatermarkSettings,
      ...(settings.value as object),
    });
  } catch (error) {
    console.error("Failed to fetch watermark settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data: Partial<WatermarkSettings> = await request.json();

    // Validate settings
    if (data.opacity !== undefined && (data.opacity < 0 || data.opacity > 100)) {
      return NextResponse.json(
        { error: "Opacity must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (data.padding !== undefined && data.padding < 0) {
      return NextResponse.json(
        { error: "Padding must be non-negative" },
        { status: 400 }
      );
    }

    // Get existing settings
    const existing = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const currentSettings = existing
      ? { ...defaultWatermarkSettings, ...(existing.value as object) }
      : defaultWatermarkSettings;

    const newSettings = {
      ...currentSettings,
      ...data,
    };

    // Upsert settings
    await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: newSettings,
      },
      update: {
        value: newSettings,
      },
    });

    // 清除伺服器端快取
    clearWatermarkCache();

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error("Failed to update watermark settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
