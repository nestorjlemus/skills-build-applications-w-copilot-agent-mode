import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h2>Activities</h2>{loading && <p role="status">Loading activities...</p>}{
    error ? <p role="alert">Unable to load activities: {error}</p> :
    !loading && activities.length === 0 ? <p>No activities found.</p> :
    <ul>{activities.map((activity, index) => <li key={index}>{activity.type} - {activity.minutes} minutes - {activity.points} points</li>)}</ul>
  }</section>;
}
