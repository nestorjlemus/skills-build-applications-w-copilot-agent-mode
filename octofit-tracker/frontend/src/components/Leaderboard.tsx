import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Leaderboard</h2>{loading && <p role="status">Loading leaderboard...</p>}{
    error ? <p role="alert">Unable to load leaderboard: {error}</p> :
    !loading && entries.length === 0 ? <p>No leaderboard rankings found.</p> :
    <ol>{entries.map((entry) => <li key={entry.teamName}>{entry.teamName} - {entry.totalPoints} points</li>)}</ol>
  }</section>;
}
