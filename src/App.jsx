import React, { useState, useEffect } from "react";

export default function App() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("workoutLogs");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: "", weight: "", sets: "" });

  const [customExercises, setCustomExercises] = useState(() => {
    const saved = localStorage.getItem("customExercises");
    return saved ? JSON.parse(saved) : [];
  });
  const [newExercise, setNewExercise] = useState("");

  const muscleGroups = ["Chest", "Back", "Legs", "Abs"];

  useEffect(() => {
    localStorage.setItem("workoutLogs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("customExercises", JSON.stringify(customExercises));
  }, [customExercises]);

  const addLog = (exercise, reps, weight, sets) => {
    const newLog = { exercise, reps, weight, sets, date: new Date().toISOString() };
    setLogs([...logs, newLog]);
  };

  const deleteLog = (index) => {
    const updated = logs.filter((_, i) => i !== index);
    setLogs(updated);
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm({
      reps: logs[index].reps,
      weight: logs[index].weight,
      sets: logs[index].sets,
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ reps: "", weight: "", sets: "" });
  };

  const saveEdit = (index) => {
    const updated = [...logs];
    updated[index] = { ...updated[index], ...editForm };
    setLogs(updated);
    cancelEdit();
  };

  const handleCustomExerciseAdd = () => {
    if (newExercise.trim() !== "") {
      setCustomExercises([...customExercises, newExercise.trim()]);
      setNewExercise("");
    }
  };

  const calcProgress = (exercise) => {
    const filtered = logs.filter((log) => log.exercise === exercise);
    if (filtered.length < 2) return null;

    const first = filtered[0];
    const latest = filtered[filtered.length - 1];

    const repsChange = latest.reps - first.reps;
    const weightChange = latest.weight - first.weight;

    const repsPercent = ((repsChange / first.reps) * 100).toFixed(1);
    const weightPercent = ((weightChange / first.weight) * 100).toFixed(1);

    return {
      reps: { first: first.reps, latest: latest.reps, change: repsChange, percent: repsPercent },
      weight: { first: first.weight, latest: latest.weight, change: weightChange, percent: weightPercent },
    };
  };

  const ProgressDisplay = ({ progress }) => {
    if (!progress) return <span>No data</span>;

    const getColor = (val) => (val > 0 ? "text-green-600" : val < 0 ? "text-red-600" : "text-gray-600");

    return (
      <div>
        <div className={getColor(progress.weight.change)}>
          Weight: {progress.weight.first}kg → {progress.weight.latest}kg (
          {progress.weight.change >= 0 ? "+" : ""}
          {progress.weight.change}, {progress.weight.percent}%)
        </div>
        <div className={getColor(progress.reps.change)}>
          Reps: {progress.reps.first} → {progress.reps.latest} (
          {progress.reps.change >= 0 ? "+" : ""}
          {progress.reps.change}, {progress.reps.percent}%)
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Workout Tracker</h1>

      {/* Exercise Buttons */}
      {muscleGroups.map((group) => (
        <div key={group} className="mb-6">
          <h2 className="text-lg font-semibold">{group} Exercises</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Bench Press", "Push Ups", "Pull Ups", "Squats", "Lunges", "Plank", "Crunch"].map((ex) => (
              <button
                key={ex}
                onClick={() => addLog(ex, 10, 20, 3)}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-indigo-200"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Manual Abs Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Abs Exercises (select manually)</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Plank", "Crunch", "Russian Twists", "V-Ups", "Hanging Leg Raise"].map((ex) => (
            <button
              key={ex}
              onClick={() => addLog(ex, 15, 0, 3)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-indigo-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Exercise Adder */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add Custom Exercise</h2>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            placeholder="New exercise name"
            className="border rounded px-2 py-1"
          />
          <button onClick={handleCustomExerciseAdd} className="px-3 py-1 rounded bg-green-500 text-white">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {customExercises.map((ex) => (
            <button
              key={ex}
              onClick={() => addLog(ex, 12, 10, 3)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-indigo-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Logs</h2>
        {logs.length === 0 && <p className="text-sm text-gray-500">No logs yet.</p>}
        <ul className="space-y-2 mt-2">
          {logs.map((log, index) => (
            <li key={index} className="border p-2 rounded flex justify-between items-center">
              {editingIndex === index ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editForm.reps}
                    onChange={(e) => setEditForm({ ...editForm, reps: Number(e.target.value) })}
                    className="w-16 border rounded px-1"
                  />
                  <input
                    type="number"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                    className="w-20 border rounded px-1"
                  />
                  <input
                    type="number"
                    value={editForm.sets}
                    onChange={(e) => setEditForm({ ...editForm, sets: Number(e.target.value) })}
                    className="w-16 border rounded px-1"
                  />
                  <button onClick={() => saveEdit(index)} className="px-2 py-1 bg-green-500 text-white rounded">
                    ✅
                  </button>
                  <button onClick={cancelEdit} className="px-2 py-1 bg-gray-400 text-white rounded">
                    ❌
                  </button>
                </div>
              ) : (
                <div>
                  {log.exercise} — {log.reps} reps, {log.weight}kg, {log.sets} sets
                </div>
              )}
              <div className="flex gap-2">
                {editingIndex !== index && (
                  <button onClick={() => startEdit(index)} className="px-2 py-1 bg-blue-500 text-white rounded">
                    ✏️
                  </button>
                )}
                <button onClick={() => deleteLog(index)} className="px-2 py-1 bg-red-500 text-white rounded">
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress */}
      <div>
        <h2 className="text-lg font-semibold">Progress</h2>
        {muscleGroups.concat(customExercises).map((ex) => (
          <div key={ex} className="border-b py-2">
            <span className="font-semibold">{ex}</span>
            <ProgressDisplay progress={calcProgress(ex)} />
          </div>
        ))}
      </div>
    </div>
  );
}
