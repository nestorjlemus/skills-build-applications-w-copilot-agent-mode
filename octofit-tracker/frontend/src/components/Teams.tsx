import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Teams</h2>{loading && <p role="status">Loading teams...</p>}{
    error ? <p role="alert">Unable to load teams: {error}</p> :
    !loading && teams.length === 0 ? <p>No teams found.</p> :
    <ul>{teams.map((team, index) => <li key={index}>{team.name}{team.members?.length ? ` (${team.members.length} members)` : ''}</li>)}</ul>
  }</section>;
}
