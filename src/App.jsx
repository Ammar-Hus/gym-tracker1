import React, { useState, useEffect } from "react";
import { format } from "date-fns";

const App = () => {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("workoutLogs");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeExercise, setActiveExercise] = useState(null);
  const [tab, setTab] = useState("log");

  const exercises = {
    Chest: ["Bench Press", "Incline Bench", "Dumbbell Fly"],
    Back: ["Pull Up", "Lat Pulldown", "Deadlift"],
    Legs: ["Squat", "Leg Press", "Lunges"],
    Shoulders: ["Overhead Press", "Lateral Raise"],
    Arms: ["Bicep Curl", "Tricep Dip"],
    Abs: ["Plank", "Crunch", "Russian Twists", "V-Ups", "Hanging Leg Raise"],
  };

  useEffect(() => {
    localStorage.setItem("workoutLogs", JSON.stringify(logs));
  }, [logs]);

  const openExercise = (ex) => {
    setActiveExercise({ name: ex, reps: "", weight: "" });
  };

  const saveExercise = () => {
    if (!activeExercise?.reps || !activeExercise?.weight) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const entry = {
      reps: Number(activeExercise.reps),
      weight: Number(activeExercise.weight),
      date: today,
    };
    setLogs((prev) => {
      const copy = { ...prev };
      if (!copy[activeExercise.name]) copy[activeExercise.name] = [];
      copy[activeExercise.name].push(entry);
      return copy;
    });
    setActiveExercise(null);
  };

  const renderLogTab = () => (
    <div className="p-4">
      {Object.entries(exercises).map(([group, exs]) => (
        <div key={group} className="mb-4">
          <h2 className="font-bold text-lg">{group}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {exs.map((ex) => (
              <button
                key={ex}
                onClick={() => openExercise(ex)}
                className="px-2 py-1 rounded bg-gray-100 hover:bg-indigo-200"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ))}
      {activeExercise && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <h3 className="font-semibold">{activeExercise.name}</h3>
          <input
            type="number"
            placeholder="Reps"
            value={activeExercise.reps}
            onChange={(e) =>
              setActiveExercise({ ...activeExercise, reps: e.target.value })
            }
            className="border p-1 rounded mr-2"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={activeExercise.weight}
            onChange={(e) =>
              setActiveExercise({ ...activeExercise, weight: e.target.value })
            }
            className="border p-1 rounded mr-2"
          />
          <button
            onClick={saveExercise}
            className="bg-indigo-500 text-white px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );

  const renderProgressTab = () => (
    <div className="p-4">
      {Object.keys(logs).length === 0 && (
        <p className="text-gray-500">No progress yet.</p>
      )}
      {Object.entries(logs).map(([ex, entries]) => {
        if (entries.length === 0) return null;

        const first = entries[0];
        const last = entries[entries.length - 1];

        const weightChange = last.weight - first.weight;
        const repsChange = last.reps - first.reps;

        const weightPercent =
          first.weight > 0
            ? ((weightChange / first.weight) * 100).toFixed(1)
            : "0";
        const repsPercent =
          first.reps > 0 ? ((repsChange / first.reps) * 100).toFixed(1) : "0";

        return (
          <div key={ex} className="mb-3 p-3 border rounded bg-gray-50">
            <h3 className="font-semibold">{ex}</h3>
            <p>
              Weight: {first.weight}kg → {last.weight}kg{" "}
              {entries.length > 1 && (
                <span className="text-sm text-gray-600">
                  ({weightChange >= 0 ? "+" : ""}
                  {weightChange}kg, {weightPercent}%)
                </span>
              )}
            </p>
            <p>
              Reps: {first.reps} → {last.reps}{" "}
              {entries.length > 1 && (
                <span className="text-sm text-gray-600">
                  ({repsChange >= 0 ? "+" : ""}
                  {repsChange}, {repsPercent}%)
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-around p-3 border-b">
        <button
          className={tab === "log" ? "font-bold" : ""}
          onClick={() => setTab("log")}
        >
          Log Workout
        </button>
        <button
          className={tab === "progress" ? "font-bold" : ""}
          onClick={() => setTab("progress")}
        >
          Progress
        </button>
      </div>
      {tab === "log" ? renderLogTab() : renderProgressTab()}
    </div>
  );
};

export default App;
