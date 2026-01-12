"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Key,
  Copy,
  Check,
  Clock,
  Image as ImageIcon,
  Images,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { TokenModal } from "./TokenModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import {
  LoadingState,
  EmptyState,
  StatusBadge,
} from "../shared";

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

type SortField = "name" | "createdAt" | "expiresAt" | "isActive" | "photos" | "albums";
type SortDirection = "asc" | "desc";

export function TokenListContent() {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingToken, setEditingToken] = useState<AccessToken | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const {
    selectedCount,
    isAllSelected,
    isBulkUpdating,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    setIsBulkUpdating,
    isSelected,
  } = useBulkSelection({
    items: tokens,
    getItemId: (token) => token.id,
  });

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/tokens");
      const data = await res.json();
      setTokens(data || []);
    } catch {
      console.error("Failed to fetch tokens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Sort tokens
  const sortedTokens = [...tokens].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "expiresAt":
        const aExp = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const bExp = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        comparison = aExp - bExp;
        break;
      case "isActive":
        comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
        break;
      case "photos":
        comparison = a._count.photos - b._count.photos;
        break;
      case "albums":
        comparison = a._count.albums - b._count.albums;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    if (selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = tokens
        .filter((t) => isSelected(t.id))
        .map((token) =>
          fetch(`/api/admin/tokens/${token.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: status === "true" }),
          })
        );
      await Promise.all(promises);
      fetchTokens();
      clearSelection();
    } catch {
      alert("Failed to update tokens");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`確定要刪除 ${selectedCount} 個 Token 嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = tokens
        .filter((t) => isSelected(t.id))
        .map((token) =>
          fetch(`/api/admin/tokens/${token.id}`, { method: "DELETE" })
        );
      await Promise.all(promises);
      fetchTokens();
      clearSelection();
    } catch {
      alert("Failed to delete tokens");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: "status",
      label: "Change Status...",
      options: [
        { value: "true", label: "Enable" },
        { value: "false", label: "Disable" },
      ],
      onAction: (value) => value && handleBulkStatusChange(value),
    },
    {
      key: "delete",
      label: "Delete",
      variant: "danger",
      onAction: handleBulkDelete,
    },
  ];

  const handleEdit = (token: AccessToken) => {
    setEditingToken(token);
    setShowModal(true);
  };

  const handleDelete = async (token: AccessToken) => {
    if (!confirm(`確定要刪除「${token.name}」Token 嗎？`)) return;

    try {
      const res = await fetch(`/api/admin/tokens/${token.id}`, { method: "DELETE" });
      if (res.ok) {
        setTokens(tokens.filter((t) => t.id !== token.id));
      } else {
        const data = await res.json();
        alert(data.error || "刪除失敗");
      }
    } catch {
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
    } catch {
      console.error("Toggle failed");
    }
  };

  const copyShareLink = async (token: AccessToken) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/private?token=${token.token}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedId(token.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Access Tokens</h1>
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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={bulkActions}
        disabled={isBulkUpdating}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : tokens.length === 0 ? (
          <EmptyState
            icon={<Key className="w-full h-full" />}
            title="No access tokens yet"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("photos")}
                  >
                    <div className="flex items-center gap-1">
                      Photos
                      <SortIcon field="photos" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("albums")}
                  >
                    <div className="flex items-center gap-1">
                      Albums
                      <SortIcon field="albums" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("isActive")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="isActive" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("expiresAt")}
                  >
                    <div className="flex items-center gap-1">
                      Expires
                      <SortIcon field="expiresAt" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sortedTokens.map((token) => (
                  <tr
                    key={token.id}
                    className={`hover:bg-stone-50 ${isSelected(token.id) ? "bg-stone-50" : ""} ${
                      !token.isActive || isExpired(token.expiresAt) ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(token.id)}
                        onChange={() => toggleSelect(token.id)}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{token.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded inline-block">
                        {token.token.slice(0, 8)}...{token.token.slice(-4)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-stone-600">
                        <ImageIcon className="w-3 h-3" />
                        {token._count.photos}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-stone-600">
                        <Images className="w-3 h-3" />
                        {token._count.albums}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={!token.isActive ? "disabled" : isExpired(token.expiresAt) ? "expired" : "active"}
                        showIcon={false}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {token.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(token.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-stone-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {formatDate(token.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyShareLink(token)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                          title="Copy share link"
                        >
                          {copiedId === token.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleActive(token)}
                          className={`p-2 rounded ${
                            token.isActive
                              ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                              : "text-green-500 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title={token.isActive ? "Disable" : "Enable"}
                        >
                          {token.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(token)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(token)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
