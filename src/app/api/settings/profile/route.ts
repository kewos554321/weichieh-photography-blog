import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProfileSettings {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  equipment: {
    cameras: string[];
    lenses: string[];
    accessories: string[];
  };
  philosophy: string;
  services: string[];
}

const DEFAULT_PROFILE: ProfileSettings = {
  name: "WeiChieh",
  title: "Photographer & Writer",
  bio: "以相機捕捉生活中的每一刻感動",
  avatar: "",
  email: "",
  location: "Taiwan",
  socialLinks: {
    instagram: "",
    twitter: "",
    youtube: "",
    website: "",
  },
  equipment: {
    cameras: [],
    lenses: [],
    accessories: [],
  },
  philosophy: "",
  services: [],
};

// GET /api/settings/profile - 取得個人資訊
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "profile" },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_PROFILE);
    }

    // Merge with defaults to ensure all fields exist
    const profile = {
      ...DEFAULT_PROFILE,
      ...(settings.value as object),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Get profile settings error:", error);
    return NextResponse.json(
      { error: "Failed to get profile settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/profile - 更新個人資訊
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.title) {
      return NextResponse.json(
        { error: "Name and title are required" },
        { status: 400 }
      );
    }

    const profile: ProfileSettings = {
      /* istanbul ignore next */
      name: data.name || DEFAULT_PROFILE.name,
      /* istanbul ignore next */
      title: data.title || DEFAULT_PROFILE.title,
      bio: data.bio || "",
      avatar: data.avatar || "",
      email: data.email || "",
      location: data.location || "",
      socialLinks: {
        instagram: data.socialLinks?.instagram || "",
        twitter: data.socialLinks?.twitter || "",
        youtube: data.socialLinks?.youtube || "",
        website: data.socialLinks?.website || "",
      },
      equipment: {
        cameras: data.equipment?.cameras || [],
        lenses: data.equipment?.lenses || [],
        accessories: data.equipment?.accessories || [],
      },
      philosophy: data.philosophy || "",
      services: data.services || [],
    };

    const settings = await prisma.siteSettings.upsert({
      where: { key: "profile" },
      update: { value: profile as unknown as Prisma.InputJsonValue },
      create: { key: "profile", value: profile as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(settings.value);
  } catch (error) {
    console.error("Update profile settings error:", error);
    return NextResponse.json(
      { error: "Failed to update profile settings" },
      { status: 500 }
    );
  }
}
