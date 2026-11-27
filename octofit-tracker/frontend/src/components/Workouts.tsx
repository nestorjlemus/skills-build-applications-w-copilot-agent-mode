import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Workout suggestions</h2>{loading && <p role="status">Loading workout suggestions...</p>}{
    error ? <p role="alert">Unable to load workout suggestions: {error}</p> :
    !loading && suggestions.length === 0 ? <p>No workout suggestions found.</p> :
    <ul>{suggestions.map((suggestion, index) => <li key={index}><strong>{suggestion.title}</strong>{suggestion.reason ? ` - ${suggestion.reason}` : ''}</li>)}</ul>
  }</section>;
}
