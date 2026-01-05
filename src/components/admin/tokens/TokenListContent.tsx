"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Key,
  Copy,
  Check,
  Loader2,
  Clock,
  Image as ImageIcon,
  Images,
} from "lucide-react";
import { TokenModal } from "./TokenModal";

interface AccessToken {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    photos: number;
    albums: number;
  };
}

export function TokenListContent() {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingToken, setEditingToken] = useState<AccessToken | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/tokens");
      const data = await res.json();
      setTokens(data || []);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleEdit = (token: AccessToken) => {
    setEditingToken(token);
    setShowModal(true);
  };

  const handleDelete = async (token: AccessToken) => {
    if (!confirm(`確定要刪除「${token.name}」Token 嗎？\n刪除後所有持有此 Token 的人將無法訪問私人內容。`)) return;

    try {
      const res = await fetch(`/api/admin/tokens/${token.id}`, { method: "DELETE" });
      if (res.ok) {
        setTokens(tokens.filter((t) => t.id !== token.id));
      } else {
        const data = await res.json();
        alert(data.error || "刪除失敗");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("刪除失敗");
    }
  };

  const handleToggleActive = async (token: AccessToken) => {
    try {
      const res = await fetch(`/api/admin/tokens/${token.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !token.isActive }),
      });
      if (res.ok) {
        setTokens(
          tokens.map((t) =>
            t.id === token.id ? { ...t, isActive: !t.isActive } : t
          )
        );
      }
    } catch (error) {
      console.error("Toggle failed:", error);
    }
  };

  const copyShareLink = async (token: AccessToken) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/private?token=${token.token}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedId(token.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      // Fallback: show the link in an alert
      prompt("複製此連結:", shareLink);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingToken(null);
    fetchTokens();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Access Tokens</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage visitor access to private content
          </p>
        </div>
        <button
          onClick={() => {
            setEditingToken(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Token
        </button>
      </div>

      {/* Tokens List */}
      {tokens.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Key className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">No access tokens yet</p>
          <p className="text-sm mt-1">Create tokens to share private content with visitors</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <div
              key={token.id}
              className={`bg-white rounded-lg border overflow-hidden ${
                !token.isActive || isExpired(token.expiresAt)
                  ? "border-stone-200 opacity-60"
                  : "border-stone-200"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-stone-900">{token.name}</h3>
                      {!token.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-stone-100 text-stone-500 rounded">
                          Disabled
                        </span>
                      )}
                      {token.isActive && isExpired(token.expiresAt) && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                          Expired
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-stone-500 mt-2">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {token._count.photos} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Images className="w-4 h-4" />
                        {token._count.albums} albums
                      </span>
                      {token.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Expires: {formatDate(token.expiresAt)}
                        </span>
                      )}
                    </div>

                    {/* Token preview */}
                    <div className="mt-2 font-mono text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded inline-block">
                      {token.token.slice(0, 8)}...{token.token.slice(-4)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyShareLink(token)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                      title="Copy share link"
                    >
                      {copiedId === token.id ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Share
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(token)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(token)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        token.isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {token.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(token)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TokenModal
          token={editingToken}
          onClose={() => {
            setShowModal(false);
            setEditingToken(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
