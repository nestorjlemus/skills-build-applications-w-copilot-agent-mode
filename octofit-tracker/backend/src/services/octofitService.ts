import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Valid activity fields are required');
  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;
  if (!isObjectId(userId) || !isObjectId(teamId) || typeof type !== 'string' || typeof minutes !== 'number') {
    throw httpError(400, 'Valid userId, teamId, type, and minutes are required');
  }
  if (!Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Team name is required');
  const body = input as Record<string, unknown>;
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw httpError(400, 'Team name is required');
  }
  if (typeof body.mascot !== 'string' || body.mascot.trim().length === 0) {
    throw httpError(400, 'Team mascot is required');
  }

  const memberIds = Array.isArray(body.members)
    ? body.members.filter((member): member is string => isObjectId(member))
    : [];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id');
  const team = await Team.create({
    name: body.name.trim(),
    mascot: body.mascot.trim(),
    members: existingMembers.map((member) => member._id),
  });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const activities = await Activity.find().lean();
  const totals = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    totals.set(teamId, (totals.get(teamId) ?? 0) + activity.points);
  }
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totals.get(team._id.toString()) ?? 0,
      rank: 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: decodeURIComponent(userEmail) });
  if (!user) throw httpError(404, 'User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    walk: 'mobility',
    yoga: 'mobility',
  };
  const focus = recentActivity
    ? activityFocus[recentActivity.type.toLowerCase()] ?? user.fitnessGoal
    : user.fitnessGoal;
  const matches = await Workout.find({ focus }).lean();
  const fallback = matches.length ? matches : await Workout.find().lean();
  return fallback.map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Recommended for recent ${recentActivity.type} activity and ${focus} focus`
      : `Recommended for your ${focus} fitness goal`,
  })).slice(0, 5);
}

export { User };
