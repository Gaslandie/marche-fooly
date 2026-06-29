"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthRole } from "@/types/auth";

type EditableRole = Extract<AuthRole, "customer" | "staff" | "admin">;

type Props = {
  userId: string;
  currentRole: EditableRole;
};

const ROLE_OPTIONS: Array<{ value: EditableRole; label: string }> = [
  { value: "customer", label: "Client" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export default function AdminUserRoleActions({ userId, currentRole }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<EditableRole>(currentRole);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const changed = role !== currentRole;

  async function submit() {
    if (!changed || pending) return;

    setPending(true);
    setMessage(null);

    let ok = false;
    let body: { success?: boolean; message?: string } | null = null;
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      ok = res.ok;
      body = await res.json();
    } catch {
      setPending(false);
      setMessage("Service indisponible.");
      return;
    }

    if (!ok || !body?.success) {
      setPending(false);
      setMessage(body?.message ?? "Action impossible.");
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="d-flex flex-column gap-1 align-items-end">
      <div className="d-flex gap-2">
        <select
          className="form-select form-select-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as EditableRole)}
          disabled={pending}
          aria-label="Modifier le rôle"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={submit}
          disabled={!changed || pending}
        >
          {pending ? "…" : "OK"}
        </button>
      </div>
      {message && <span className="text-danger small">{message}</span>}
    </div>
  );
}
