"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { ProfileData } from "../types";
import {
  X,
  Upload,
  CheckCircle,
  Loader2,
  User,
} from "lucide-react";

export function ProfileManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    title: "",
    bio: "",
    avatar: "",
    email: "",
    location: "",
    socialLinks: { instagram: "", twitter: "", youtube: "", website: "" },
    equipment: { cameras: [], lenses: [], accessories: [] },
    philosophy: "",
    services: [],
  });
  const [newEquipment, setNewEquipment] = useState({ cameras: "", lenses: "", accessories: "" });
  const [newService, setNewService] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        alert("Profile saved successfully!");
      } else {
        alert("Failed to save profile");
      }
    } catch {
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, avatar: data.url });
      } else {
        alert("Failed to upload avatar");
      }
    } catch {
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const addEquipment = (type: "cameras" | "lenses" | "accessories") => {
    const value = newEquipment[type].trim();
    if (!value) return;
    setProfile({
      ...profile,
      equipment: {
        ...profile.equipment,
        [type]: [...profile.equipment[type], value],
      },
    });
    setNewEquipment({ ...newEquipment, [type]: "" });
  };

  const removeEquipment = (type: "cameras" | "lenses" | "accessories", index: number) => {
    setProfile({
      ...profile,
      equipment: {
        ...profile.equipment,
        [type]: profile.equipment[type].filter((_, i) => i !== index),
      },
    });
  };

  const addService = () => {
    const value = newService.trim();
    if (!value) return;
    setProfile({
      ...profile,
      services: [...profile.services, value],
    });
    setNewService("");
  };

  const removeService = (index: number) => {
    setProfile({
      ...profile,
      services: profile.services.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Avatar Section */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-200">
            {profile.avatar ? (
              <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-stone-400" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-stone-500 mt-2">Recommended: Square image, at least 200x200px</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Basic Information</h2>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Display Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="WeiChieh"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Photographer & Writer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
              placeholder="Tell visitors about yourself..."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Taiwan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Social Links</h2>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Instagram</label>
              <input
                type="url"
                value={profile.socialLinks.instagram}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, instagram: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Twitter / X</label>
              <input
                type="url"
                value={profile.socialLinks.twitter}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, twitter: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">YouTube</label>
              <input
                type="url"
                value={profile.socialLinks.youtube}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, youtube: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://youtube.com/@channel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
              <input
                type="url"
                value={profile.socialLinks.website}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, website: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Photography Philosophy</h2>
        <textarea
          value={profile.philosophy}
          onChange={(e) => setProfile({ ...profile, philosophy: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
          placeholder="Share your photography philosophy and approach..."
        />
      </div>

      {/* Equipment */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Equipment</h2>
        <div className="space-y-6">
          {/* Cameras */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Cameras</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.cameras}
                onChange={(e) => setNewEquipment({ ...newEquipment, cameras: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("cameras")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Sony A7R V"
              />
              <button
                onClick={() => addEquipment("cameras")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.cameras.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("cameras", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Lenses */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Lenses</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.lenses}
                onChange={(e) => setNewEquipment({ ...newEquipment, lenses: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("lenses")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Sony 24-70mm f/2.8 GM"
              />
              <button
                onClick={() => addEquipment("lenses")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.lenses.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("lenses", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Accessories</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.accessories}
                onChange={(e) => setNewEquipment({ ...newEquipment, accessories: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("accessories")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Peak Design Tripod"
              />
              <button
                onClick={() => addEquipment("accessories")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.accessories.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("accessories", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Services</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addService()}
            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
            placeholder="e.g., Portrait Photography"
          />
          <button
            onClick={addService}
            className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.services.map((service, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
            >
              {service}
              <button onClick={() => removeService(i)} className="text-stone-400 hover:text-stone-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}
