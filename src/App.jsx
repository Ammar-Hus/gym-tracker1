import React, { useState, useEffect } from "react";

// sample exercises per day
const defaultDays = {
  Monday: ["Bench Press", "Incline Smith Press", "Push Ups", "Dips"],
  Tuesday: ["Pull Ups", "Barbell Row", "Lat Pulldown", "Bicep Curl"],
  Wednesday: ["Squats", "Leg Press", "Lunges", "Leg Extension"],
  Thursday: ["Shoulder Press", "Lateral Raise", "Front Raise", "Shrugs"],
  Friday: ["Deadlift", "RDL", "Hamstring Curl", "Calf Raise"],
  Saturday: ["Chest Fly", "Cable Crossover", "Tricep Pushdown"],
  Sunday: [],
};

export default function App() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [days, setDays] = useState(defaultDays);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [logs, setLogs] = useState({});
  const [showPanel, setShowPanel] = useState(false);

  // save to localStorage
  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  // load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("logs");
    if (saved) {
      setLogs(JSON.parse(saved));
    }
  }, []);

  // add new log
  const addLog = (day, exercise, reps, weight) => {
    const newLog = { reps, weight, date: new Date().toISOString() };
    setLogs((prev) => {
      const dayLogs = prev[day] || {};
      const exLogs = dayLogs[exercise] || [];
      return {
        ...prev,
        [day]: {
          ...dayLogs,
          [exercise]: [...exLogs, newLog],
        },
      };
    });
  };

  // get suggestion for next session
  const getNextSuggestion = (exerciseLogs) => {
    if (!exerciseLogs || exerciseLogs.length === 0) return "No data yet";
    const last = exerciseLogs[exerciseLogs.length - 1];
    if (last.reps >= 12) {
      return `Next: +2.5kg (Last: ${last.reps} reps @ ${last.weight}kg)`;
    } else if (last.reps <= 6) {
      return `Next: -2.5kg (Last: ${last.reps} reps @ ${last.weight}kg)`;
    } else {
      return `Keep same, aim higher reps (Last: ${last.reps} reps @ ${last.weight}kg)`;
    }
  };

  // get monthly growth %
  const getMonthlyGrowth = (exerciseLogs) => {
    if (!exerciseLogs || exerciseLogs.length < 2) return "No growth data";
    const first = exerciseLogs[0];
    const last = exerciseLogs[exerciseLogs.length - 1];
    if (!first.weight || !last.weight) return "N/A";
    const diff = ((last.weight - first.weight) / first.weight) * 100;
    return `Growth: ${diff.toFixed(1)}% in 30 days`;
  };

  // reset all logs
  const resetAll = () => {
    if (window.confirm("Are you sure you want to reset all data?")) {
      setLogs({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6 space-y-6">
        <h1 className="text-2xl font-bold">Gym Tracker</h1>
        <nav className="space-y-4">
          <button
            onClick={() => setSelectedTab("dashboard")}
            className={`block w-full text-left ${
              selectedTab === "dashboard" ? "font-bold" : ""
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSelectedTab("progress")}
            className={`block w-full text-left ${
              selectedTab === "progress" ? "font-bold" : ""
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setSelectedTab("weekly")}
            className={`block w-full text-left ${
              selectedTab === "weekly" ? "font-bold" : ""
            }`}
          >
            Weekly Strength
          </button>
        </nav>
        <button
          onClick={resetAll}
          className="bg-red-500 px-3 py-1 rounded text-sm"
        >
          Reset All
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedTab === "dashboard" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(days).map((day) => (
                <div
                  key={day}
                  className="p-4 bg-white rounded shadow cursor-pointer"
                  onClick={() => {
                    setSelectedDay(day);
                    setShowPanel(true);
                    setSelectedExercise(null);
                  }}
                >
                  <h3 className="font-bold">{day}</h3>
                  <p>{days[day].length} exercises</p>
                </div>
              ))}
            </div>
            {showPanel && selectedDay && (
              <div className="mt-6 p-4 bg-gray-200 rounded">
                <h3 className="text-lg font-bold">{selectedDay}</h3>
                <div className="space-y-2 mt-2">
                  {days[selectedDay].map((exercise) => (
                    <div
                      key={exercise}
                      className="p-2 bg-white rounded shadow cursor-pointer"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      {exercise}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedExercise && (
              <div className="mt-4 p-4 bg-white rounded shadow">
                <h4 className="font-bold">{selectedExercise}</h4>
                <LogForm
                  day={selectedDay}
                  exercise={selectedExercise}
                  onAdd={addLog}
                />
                <div className="mt-3">
                  <h5 className="font-bold">Logs:</h5>
                  {(logs[selectedDay]?.[selectedExercise] || []).map(
                    (log, i) => (
                      <p key={i}>
                        {log.reps} reps @ {log.weight}kg on{" "}
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    )
                  )}
                  <p className="text-sm text-blue-600 mt-2">
                    {getNextSuggestion(logs[selectedDay]?.[selectedExercise])}
                  </p>
                  <p className="text-sm text-green-600">
                    {getMonthlyGrowth(logs[selectedDay]?.[selectedExercise])}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "progress" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Progress</h2>
            {Object.keys(logs).length === 0 && <p>No logs yet.</p>}
            {Object.keys(logs).map((day) => (
              <div key={day} className="mb-6">
                <h3 className="font-bold">{day}</h3>
                {Object.keys(logs[day]).map((exercise) => (
                  <div
                    key={exercise}
                    className="mt-2 p-3 bg-white rounded shadow"
                  >
                    <h4 className="font-bold">{exercise}</h4>
                    {logs[day][exercise].map((log, i) => (
                      <p key={i}>
                        {log.reps} reps @ {log.weight}kg on{" "}
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    ))}
                    <p className="text-sm text-blue-600 mt-2">
                      {getNextSuggestion(logs[day][exercise])}
                    </p>
                    <p className="text-sm text-green-600">
                      {getMonthlyGrowth(logs[day][exercise])}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {selectedTab === "weekly" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Weekly Strength</h2>
            {Object.keys(logs).length === 0 && <p>No logs yet.</p>}
            {Object.keys(logs).map((day) => (
              <div key={day} className="mb-6">
                <h3 className="font-bold">{day}</h3>
                {Object.keys(logs[day]).map((exercise) => {
                  const total = logs[day][exercise].reduce(
                    (acc, cur) => acc + cur.reps * cur.weight,
                    0
                  );
                  return (
                    <div
                      key={exercise}
                      className="mt-2 p-3 bg-white rounded shadow"
                    >
                      <h4 className="font-bold">{exercise}</h4>
                      <p>Total Volume: {total} kg</p>
                      <p className="text-sm text-green-600">
                        {getMonthlyGrowth(logs[day][exercise])}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Log form component
function LogForm({ day, exercise, onAdd }) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!reps || !weight) return;
    onAdd(day, exercise, parseInt(reps), parseFloat(weight));
    setReps("");
    setWeight("");
  };

  return (
    <form onSubmit={submit} className="flex space-x-2 mt-2">
      <input
        type="number"
        placeholder="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="border p-1 rounded w-20"
      />
      <input
        type="number"
        placeholder="Weight"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="border p-1 rounded w-24"
      />
      <button type="submit" className="bg-blue-500 text-white px-3 rounded">
        Add
      </button>
    </form>
  );
}
