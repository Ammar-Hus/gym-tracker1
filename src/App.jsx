import React, { useState, useEffect } from "react";

// Split Plan
const SPLIT = [
  { day: "Monday", exercises: ["Bench Press", "Overhead Press", "Lateral Raise", "Tricep Pushdown", "Chest Fly"] },
  { day: "Tuesday", exercises: ["Lat Pulldown", "Barbell Row", "Dumbbell Row", "Bicep Curl", "Face Pull"] },
  { day: "Wednesday", exercises: ["Squat", "Lunge", "Leg Press", "Leg Curl", "Calf Raise"] },
  { day: "Thursday", exercises: [] },
  { day: "Friday", exercises: ["Incline Bench Press", "Shoulder Press", "Front Raise", "Skull Crusher", "Cable Crossover"] },
  { day: "Saturday", exercises: ["Pull-Up", "T-Bar Row", "Seated Row", "Hammer Curl", "Shrug"] },
  { day: "Sunday", exercises: ["Deadlift", "Leg Extension", "Bulgarian Split Squat", "Glute Bridge", "Standing Calf Raise"] },
];

// Helper to get week number
function getWeek(dateStr) {
  const d = new Date(dateStr);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
}

function App() {
  const [logs, setLogs] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  // Load logs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("logs");
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  // Add a new set
  const addSet = () => {
    if (!weight || !reps) return;
    const entry = {
      day: selectedDay,
      exercise: selectedExercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      date: new Date().toISOString().split("T")[0],
    };
    setLogs([...logs, entry]);
    setWeight("");
    setReps("");
  };

  // Weekly Strength comparison (last week vs current week)
  const getWeeklyProgress = () => {
    const weeks = {};

    logs.forEach((l) => {
      const week = getWeek(l.date);
      if (!weeks[week]) weeks[week] = {};
      if (!weeks[week][l.exercise]) weeks[week][l.exercise] = [];
      weeks[week][l.exercise].push(l);
    });

    const sortedWeeks = Object.keys(weeks).map((w) => parseInt(w)).sort((a, b) => a - b);
    const currentWeek = sortedWeeks[sortedWeeks.length - 1];
    const lastWeek = sortedWeeks[sortedWeeks.length - 2];

    if (!lastWeek) return [];

    const progress = [];

    Object.keys(weeks[currentWeek]).forEach((ex) => {
      const currentLogs = weeks[currentWeek][ex];
      const lastLogs = weeks[lastWeek]?.[ex];

      if (lastLogs && currentLogs.length > 0) {
        const currentLast = currentLogs[currentLogs.length - 1];
        const lastLast = lastLogs[lastLogs.length - 1];

        if (currentLast && lastLast) {
          const diff = currentLast.weight - lastLast.weight;
          progress.push({ exercise: ex, diff });
        }
      }
    });

    return progress;
  };

  const weeklyProgress = getWeeklyProgress();

  return (
    <div className="p-4 space-y-6">
      {/* Dashboard */}
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-2">
        {SPLIT.map((d) => (
          <button
            key={d.day}
            className="p-3 bg-indigo-100 rounded shadow"
            onClick={() => {
              setSelectedDay(d.day);
              setShowPanel(true);
              setSelectedExercise(null);
            }}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Weekly Strength Progress */}
      <div>
        <h2 className="font-semibold mb-2">Weekly Strength Progress</h2>
        <ul className="space-y-1">
          {weeklyProgress.length === 0 && <li className="text-sm text-gray-500">Not enough data</li>}
          {weeklyProgress.map((p, i) => (
            <li key={i} className="flex items-center">
              <span className="w-40">{p.exercise}</span>
              <span className={p.diff > 0 ? "text-green-600" : p.diff < 0 ? "text-red-600" : "text-gray-600"}>
                {p.diff > 0 ? `▲ +${p.diff}kg` : p.diff < 0 ? `▼ ${p.diff}kg` : "— no change"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Panel for Day/Exercise */}
      {showPanel && selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center md:justify-end items-start pt-10 px-2">
          <div className="bg-white w-full max-w-md p-4 rounded-xl shadow overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold">{selectedDay} Exercises</div>
              <button onClick={() => setShowPanel(false)}>✕</button>
            </div>

            {/* Show Exercise List */}
            {!selectedExercise && (
              <div className="space-y-2">
                {(SPLIT.find((d) => d.day === selectedDay)?.exercises || []).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setSelectedExercise(ex)}
                    className="block w-full text-left p-2 bg-indigo-50 rounded"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {/* Show Logs + Input for Exercise */}
            {selectedExercise && (
              <div>
                <h3 className="font-semibold mb-2">{selectedExercise}</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="border p-2 rounded w-1/2"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="border p-2 rounded w-1/2"
                  />
                </div>
                <button onClick={addSet} className="bg-indigo-500 text-white px-3 py-1 rounded">
                  Add Set
                </button>

                <div className="mt-4">
                  <h4 className="font-semibold">Logs</h4>
                  <ul className="text-sm space-y-1">
                    {logs
                      .filter((l) => l.exercise === selectedExercise && l.day === selectedDay)
                      .map((l, i) => (
                        <li key={i}>
                          {l.date} - {l.weight}kg × {l.reps}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
