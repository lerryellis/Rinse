"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface Team {
  id: number;
  name: string;
  plan: string;
  max_members: number;
  member_count: number;
}

interface Member {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
}

export default function TeamPage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const authHeaders: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : {};

  const fetchTeam = () => {
    if (!session?.access_token) return;
    fetch(`${apiUrl}/api/teams/my-team`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        setTeam(data.team);
        setMembers(data.members || []);
        setMyRole(data.my_role);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTeam(); }, [session]);

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    const res = await fetch(`${apiUrl}/api/teams/create`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: teamName }),
    });
    if (res.ok) {
      toast("Team created!", "success");
      fetchTeam();
    } else {
      const err = await res.json().catch(() => ({ detail: "Failed" }));
      toast(err.detail, "error");
    }
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const res = await fetch(`${apiUrl}/api/teams/invite`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: inviteEmail }),
    });
    if (res.ok) {
      toast(`Invited ${inviteEmail}!`, "success");
      setInviteEmail("");
      fetchTeam();
    } else {
      const err = await res.json().catch(() => ({ detail: "Failed" }));
      toast(err.detail, "error");
    }
    setInviting(false);
  };

  const handleRemove = async (userId: string, email: string) => {
    const res = await fetch(`${apiUrl}/api/teams/members/${userId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (res.ok) {
      toast(`Removed ${email}`, "info");
      fetchTeam();
    } else {
      const err = await res.json().catch(() => ({ detail: "Failed" }));
      toast(err.detail, "error");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to manage your team</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  }

  // No team yet — show create form
  if (!team) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Create a Team</h1>
        <p className="text-gray-500 mb-8">Collaborate with your colleagues under one account.</p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
          <input
            id="team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm mb-4 focus:outline-none focus:border-[#0282e5]"
          />
          <button type="button" onClick={handleCreate} disabled={creating || !teamName.trim()}
            className="w-full py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] disabled:opacity-60 transition-colors">
            {creating ? "Creating..." : "Create Team"}
          </button>
        </div>

        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Team benefits</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-[#00BB88] font-bold">+</span> Shared billing — one account for everyone</li>
            <li className="flex items-center gap-2"><span className="text-[#00BB88] font-bold">+</span> Up to 5 members (free) or more on paid plans</li>
            <li className="flex items-center gap-2"><span className="text-[#00BB88] font-bold">+</span> Team admin controls — invite, remove, manage roles</li>
          </ul>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">{team.name}</h1>
          <p className="text-sm text-gray-400">{team.member_count} of {team.max_members} members</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-[#0282e5]">{team.plan}</span>
      </div>

      {/* Invite */}
      {isOwnerOrAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Invite Member</h2>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0282e5]"
              aria-label="Email to invite"
            />
            <button type="button" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] disabled:opacity-60">
              {inviting ? "Inviting..." : "Invite"}
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m.user_id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[#0282e5] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{(m.full_name || m.email)[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{m.full_name || m.email}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                m.role === "owner" ? "bg-purple-100 text-purple-700" :
                m.role === "admin" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-500"
              }`}>{m.role}</span>
              {isOwnerOrAdmin && m.user_id !== user?.id && (
                <button type="button" onClick={() => handleRemove(m.user_id, m.email)}
                  className="text-xs text-red-500 hover:text-red-700">Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
