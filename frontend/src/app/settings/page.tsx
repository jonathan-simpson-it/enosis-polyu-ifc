"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.getMe();
        setUser(me);
        if (me.org_id) {
          const orgData = await api.getOrg(me.org_id);
          setOrg(orgData);
        }
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    load();
  }, []);

  async function handleRegenerateKey() {
    try {
      const res = await api.regenerateApiKey();
      alert(`New API Key: ${res.api_key}`);
      setUser((prev: any) => ({ ...prev, api_key: res.api_key }));
    } catch (err) {
      console.error("Key regeneration failed:", err);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {user && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Email:</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Role:</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">API Key:</dt>
              <dd className="font-mono text-xs">
                {user.api_key ? `${user.api_key.slice(0, 20)}...` : "N/A"}
              </dd>
            </div>
          </dl>
          <button
            onClick={handleRegenerateKey}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Regenerate API Key
          </button>
        </div>
      )}

      {org && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Organization</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Name:</dt>
              <dd>{org.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">BR Number:</dt>
              <dd>{org.br_number || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Plan:</dt>
              <dd className="capitalize">{org.subscription_tier}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">Usage:</dt>
              <dd>
                {org.usage_current} / {org.usage_limit}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
