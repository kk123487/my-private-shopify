


import React, { useState, useEffect } from 'react';
import { withRoleAuth } from '../../lib/withRoleAuth';
import { useAuth } from '../../lib/AuthContext';
import styles from './teams.module.css';

function TeamsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  // Create a new team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreatingTeam(true);
    setMessage('');
    const res = await fetch('/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName, userId: user.id }),
    });
    const data = await res.json();
    setCreatingTeam(false);
    if (res.ok) {
      setMessage('Team created!');
      setNewTeamName('');
      // Refresh teams
      fetch(`/api/teams/list?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setTeams(data.teams || []);
          if (data.teams && data.teams.length > 0) {
            setSelectedTeam(data.teams[0].id);
          }
        });
    } else {
      setMessage(data.error || 'Failed to create team.');
    }
  };

  // Fetch user's teams
  useEffect(() => {
    if (!user) return;
    fetch(`/api/teams/list?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setTeams(data.teams || []);
        if (data.teams && data.teams.length > 0) {
          setSelectedTeam(data.teams[0].id);
        }
      });
  }, [user]);

  // Fetch team members when team changes
  useEffect(() => {
    if (!selectedTeam) return;
    fetch(`/api/teams/members?teamId=${selectedTeam}`)
      .then(res => res.json())
      .then(data => setMembers(data.members || []));
  }, [selectedTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const invitedBy = user?.id;
    const res = await fetch('/api/teams/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeam, email, invitedBy }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Invitation sent!');
      setEmail('');
    } else {
      setMessage(data.error || 'Failed to invite user.');
    }
  };

  return (
    <div className={styles.teamsContainer}>
      <h1>Team Management</h1>
      <form onSubmit={handleCreateTeam} className={styles.formWithMargin}>
        <label>
          New Team Name:
          <input
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            required
            className={styles.inputWithMargin}
          />
        </label>
        <button type="submit" disabled={creatingTeam}>
          {creatingTeam ? 'Creating...' : 'Create Team'}
        </button>
      </form>

      <form onSubmit={handleInvite} className={styles.formWithMargin}>
        <label>
          Select Team:
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            required
            className={styles.inputWithMargin}
          >
            {teams.map((team: any) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>
        <label>
          User Email:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles.inputWithMargin}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Inviting...' : 'Invite User'}
        </button>
      </form>
      {message && <p>{message}</p>}
      <h2>Team Members</h2>
      <ul>
        {members.map((member: any) => (
          <li key={member.id}>{member.email} ({member.role})</li>
        ))}
      </ul>
      <p>Invite users to your team by email. Team selection and member list are now automatic!</p>
    </div>
  );
}

export default withRoleAuth(TeamsPage, ['super_admin', 'store_admin']);
