import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format, subDays } from "date-fns";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("gymLogs");
    return saved ? JSON.parse(saved) : [];
  });

  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");

  useEffect(() => {
    localStorage.setItem("gymLogs", JSON.stringify(logs));
  }, [logs]);

  const addLog = () => {
    if (!exercise || !weight || !reps || !sets) return;
    const newLog = {
      date: format(new Date(), "yyyy-MM-dd"),
      exercise,
      weight: Number(weight),
      reps: Number(reps),
      sets: Number(sets),
    };
    setLogs([...logs, newLog]);
    setExercise("");
    setWeight("");
    setReps("");
    setSets("");
  };

  const exercises = [...new Set(logs.map((l) => l.exercise))];

  const chartDataForExercise = (exName) => {
    return logs
      .filter((l) => l.exercise === exName)
      .map((l) => ({
        date: l.date,
        weight: l.weight,
        reps: l.reps,
      }));
  };

  const getProgressSummary = () => {
    return exercises.map((ex) => {
      const exLogs = logs.filter((l) => l.exercise === ex);
      if (exLogs.length === 0) return null;

      const first = exLogs[0];
      const last14 = exLogs.filter(
        (l) => new Date(l.date) > subDays(new Date(), 14)
      );
      const last30 = exLogs.filter(
        (l) => new Date(l.date) > subDays(new Date(), 30)
      );

      const avg14 =
        last14.reduce((a, b) => a + b.weight, 0) / (last14.length || 1);
      const avg30 =
        last30.reduce((a, b) => a + b.weight, 0) / (last30.length || 1);

      return {
        exercise: ex,
        first,
        avg14: { avgWeight: avg14.toFixed(1) },
        avgMonth: { avgWeight: avg30.toFixed(1) },
        pct14: (((avg14 - first.weight) / first.weight) * 100).toFixed(1),
        pctMonth: (((avg30 - first.weight) / first.weight) * 100).toFixed(1),
      };
    }).filter(Boolean);
  };

  const progressSummary = getProgressSummary();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Tabs */}
      <div className="flex justify-around mb-6">
        {["dashboard", "progress", "weekly"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg ${
              tab === t ? "bg-blue-600 text-white" : "bg-white shadow"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && (
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold">🏋️ Gym Tracker</h1>
          <input
            className="w-full p-2 border rounded"
            placeholder="Exercise"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Weight (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Reps"
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Sets"
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 text-white p-2 rounded"
            onClick={addLog}
          >
            Add Log
          </button>
        </div>
      )}

      {/* Progress */}
      {tab === "progress" && (
        <div className="space-y-6">
          <div className="text-2xl font-bold mb-4">📊 Progress Overview</div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl shadow">
              <div className="text-sm text-gray-500">Total Exercises</div>
              <div className="text-2xl font-bold">{progressSummary.length}</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow">
              <div className="text-sm text-gray-500">Logged Workouts</div>
              <div className="text-2xl font-bold">{logs.length}</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow">
              <div className="text-sm text-gray-500">Unique Days Tracked</div>
              <div className="text-2xl font-bold">
                {[...new Set(logs.map((l) => l.date))].length}
              </div>
            </div>
          </div>

          {/* Exercise Progress Cards */}
          <div className="grid gap-4">
            {progressSummary.map((item) => (
              <div key={item.exercise} className="p-4 rounded-xl bg-white shadow">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">{item.exercise}</div>
                  <div className="text-xs text-gray-500">
                    {item.first.date ? `Since ${item.first.date}` : "Not started"}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="text-gray-500">First</div>
                    <div>
                      {item.first.weight}kg × {item.first.reps}
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-gray-500">14d Avg</div>
                    <div>
                      {item.avg14.avgWeight}kg ({item.pct14 || 0}%)
                    </div>
                  </div>
                  <div className="bg-pink-50 p-2 rounded">
                    <div className="text-gray-500">Month Avg</div>
                    <div>
                      {item.avgMonth.avgWeight}kg ({item.pctMonth || 0}%)
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartDataForExercise(item.exercise)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#6366F1" />
                    <Line type="monotone" dataKey="reps" stroke="#EC4899" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly */}
      {tab === "weekly" && (
        <div className="space-y-4">
          <div className="text-2xl font-bold mb-4">📅 Weekly Strength</div>
          {exercises.map((ex) => (
            <div key={ex} className="p-4 bg-white rounded-xl shadow">
              <div className="font-semibold mb-2">{ex}</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartDataForExercise(ex)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#10B981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
