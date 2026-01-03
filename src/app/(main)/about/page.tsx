"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Instagram, MapPin, Camera, Youtube, Globe, Twitter } from "lucide-react";
import { useState, useEffect } from "react";

interface ProfileData {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
    website: string;
  };
  equipment: {
    cameras: string[];
    lenses: string[];
    accessories: string[];
  };
  philosophy: string;
  services: string[];
}

export default function AboutPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <p className="text-stone-500">Failed to load profile</p>
      </main>
    );
  }

  // Combine all equipment items for display
  const allEquipment = [
    ...profile.equipment.cameras,
    ...profile.equipment.lenses,
    ...profile.equipment.accessories,
  ];

  // Extract Instagram username from URL if provided
  const getInstagramUsername = (url: string) => {
    if (!url) return null;
    const match = url.match(/instagram\.com\/([^/?]+)/);
    return match ? `@${match[1]}` : url;
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Profile Image */}
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden film-grain bg-stone-200">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-16 h-16 text-stone-400" />
              </div>
            )}
            <div className="absolute inset-0 vignette" />
          </div>

          {/* About Text */}
          <div className="space-y-6">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-stone-400 font-light mb-2">
                {profile.title}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-stone-800 font-light tracking-wide">
                {profile.name}
              </h1>
            </div>

            {profile.bio && (
              <div className="space-y-4 text-stone-600 font-light leading-relaxed">
                {profile.bio.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-8 pt-4 border-t border-stone-200">
              <div>
                <p className="text-2xl font-serif text-stone-700">5+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Years</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-stone-700">1000+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Photos</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-stone-700">50+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Stories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      {profile.philosophy && (
        <section className="bg-stone-100/50 py-16 mb-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-stone-400 font-light mb-4">
              Philosophy
            </p>
            <blockquote className="font-serif text-2xl md:text-3xl text-stone-700 font-light leading-relaxed italic">
              &ldquo;{profile.philosophy}&rdquo;
            </blockquote>
          </div>
        </section>
      )}

      {/* Services & Equipment */}
      {(profile.services.length > 0 || allEquipment.length > 0) && (
        <section className="max-w-4xl mx-auto px-4 md:px-6 mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Services */}
            {profile.services.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Camera className="w-5 h-5 text-[#6b9e9a]" />
                  <h2 className="font-serif text-xl text-stone-700">Services</h2>
                </div>
                <ul className="space-y-3 text-stone-600 font-light">
                  {profile.services.map((service, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-[#6b9e9a] rounded-full" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Equipment */}
            {allEquipment.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Camera className="w-5 h-5 text-[#6b9e9a]" />
                  <h2 className="font-serif text-xl text-stone-700">Equipment</h2>
                </div>
                <div className="space-y-4">
                  {profile.equipment.cameras.length > 0 && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Cameras</p>
                      <ul className="space-y-2 text-stone-600 font-light">
                        {profile.equipment.cameras.map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {profile.equipment.lenses.length > 0 && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Lenses</p>
                      <ul className="space-y-2 text-stone-600 font-light">
                        {profile.equipment.lenses.map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {profile.equipment.accessories.length > 0 && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Accessories</p>
                      <ul className="space-y-2 text-stone-600 font-light">
                        {profile.equipment.accessories.map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-stone-900 rounded-2xl p-8 md:p-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500 font-light mb-2">
            Get In Touch
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-white font-light mb-4">
            Contact
          </h2>
          <p className="text-stone-400 font-light mb-8 max-w-md mx-auto">
            If you have any collaboration proposals or photography needs, feel free to contact me.
          </p>

          {/* Contact Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-full hover:bg-stone-100 transition-colors duration-300"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm font-light">{profile.email}</span>
              </a>
            )}
            {profile.socialLinks.instagram && (
              <a
                href={profile.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 border border-stone-700 text-white rounded-full hover:border-stone-500 hover:bg-stone-800 transition-colors duration-300"
              >
                <Instagram className="w-4 h-4" />
                <span className="text-sm font-light">{getInstagramUsername(profile.socialLinks.instagram)}</span>
              </a>
            )}
          </div>

          {/* Other Social Links */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-stone-500 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {profile.socialLinks.youtube && (
              <a
                href={profile.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-stone-500 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {profile.socialLinks.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-stone-500 transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center justify-center gap-2 text-stone-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-light">Based in {profile.location}</span>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mt-16 text-center">
        <p className="text-stone-500 font-light mb-4">
          Want to see more work?
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-stone-300 text-stone-700 rounded-full hover:border-stone-500 hover:bg-stone-50 transition-colors duration-500 text-sm tracking-wider uppercase font-light"
        >
          View Portfolio
        </Link>
      </section>
    </main>
  );
}
