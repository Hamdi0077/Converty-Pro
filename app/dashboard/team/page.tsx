"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TeamMember {
  id: string;
  user_email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const supabase = createClient();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const { data } = await supabase
        .from("team_members")
        .select("id, user_email, role, status, created_at")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error loading team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setIsInviting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const { error } = await supabase.from("team_members").insert({
        shop_id: shop.id,
        user_email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      });

      if (error) throw error;

      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("editor");
      loadTeamMembers();
    } catch (error) {
      console.error("Error inviting team member:", error);
      alert("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm("Remove this team member?")) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      loadTeamMembers();
    } catch (error) {
      console.error("Error removing team member:", error);
      alert("Failed to remove team member");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2">Manage your team members and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteTeamMember} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@example.com"
                  disabled={isInviting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={isInviting}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="editor">Editor (Full access)</option>
                  <option value="manager">Manager (Full access + settings)</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={isInviting} className="w-full">
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-muted-foreground">Loading team members...</div>
      ) : teamMembers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No team members yet. Invite your first team member to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date Added</th>
                    <th className="text-left py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{member.user_email}</td>
                      <td className="py-3 px-4 capitalize">{member.role}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(member.created_at)}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(member.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
