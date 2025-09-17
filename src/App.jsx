import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

function App() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem("gymLogs");
    return saved ? JSON.parse(saved) : [];
  });
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Local storage update
  useEffect(() => {
    localStorage.setItem("gymLogs", JSON.stringify(logs));
  }, [logs]);

  // Add new log entry
  const addLog = () => {
    if (!exercise || !weight || !reps) return;
    const newLog = {
      date: new Date().toLocaleDateString(),
      exercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
    };
    setLogs([...logs, newLog]);
    setExercise("");
    setWeight("");
    setReps("");
  };

  // Logs grouped by exercise
  const logsByExercise = useMemo(() => {
    return logs.reduce((acc, log) => {
      if (!acc[log.exercise]) acc[log.exercise] = [];
      acc[log.exercise].push(log);
      return acc;
    }, {});
  }, [logs]);

  // Weekly progress
  const weeklyProgress = useMemo(() => {
    const weeks = {};
    logs.forEach((log) => {
      const week = new Date(log.date).getWeekNumber();
      if (!weeks[week]) weeks[week] = [];
      weeks[week].push(log);
    });
    const result = {};
    for (let week in weeks) {
      const weekLogs = weeks[week];
      const grouped = weekLogs.reduce((acc, log) => {
        if (!acc[log.exercise]) acc[log.exercise] = [];
        acc[log.exercise].push(log);
        return acc;
      }, {});
      result[week] = grouped;
    }
    return result;
  }, [logs]);

  // Suggestion logic
  const getSuggestion = (exerciseLogs) => {
    if (!exerciseLogs || exerciseLogs.length === 0) return "No data yet.";
    const lastLog = exerciseLogs[exerciseLogs.length - 1];
    if (lastLog.reps >= 10) {
      return `Next time: +2.5kg (since you hit ${lastLog.reps} reps at ${lastLog.weight}kg).`;
    } else if (lastLog.reps <= 6) {
      return `Keep ${lastLog.weight}kg, focus on more reps.`;
    } else {
      return `Maintain ${lastLog.weight}kg, push higher reps.`;
    }
  };

  // Monthly % growth
  const getMonthlyGrowth = (exerciseLogs) => {
    if (!exerciseLogs || exerciseLogs.length < 2) return "No growth data yet.";
    const first = exerciseLogs[0];
    const last = exerciseLogs[exerciseLogs.length - 1];
    const weightGrowth = (
      ((last.weight - first.weight) / first.weight) *
      100
    ).toFixed(1);
    const repGrowth = (
      ((last.reps - first.reps) / first.reps) *
      100
    ).toFixed(1);
    return `Weight: ${weightGrowth}% | Reps: ${repGrowth}% (1 month)`;
  };

  return (
    <div className="App">
      <h1>Gym Tracker</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "progress" ? "active" : ""}
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>
        <button
          className={activeTab === "weekly" ? "active" : ""}
          onClick={() => setActiveTab("weekly")}
        >
          Weekly
        </button>
      </div>

      {/* ------------------ DASHBOARD TAB ------------------ */}
      {activeTab === "dashboard" && (
        <div className="dashboard">
          <h2>Add Log</h2>
          <div className="form">
            <input
              type="text"
              placeholder="Exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <button onClick={addLog}>Add</button>
          </div>
          <div className="recent-logs">
            <h3>Recent Logs</h3>
            <ul>
              {logs.slice(-5).map((log, i) => (
                <li key={i}>
                  {log.date} — {log.exercise}: {log.weight}kg × {log.reps} reps
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ------------------ PROGRESS TAB ------------------ */}
      {activeTab === "progress" && (
        <div className="progress">
          <h2>Progress by Exercise</h2>
          {Object.keys(logsByExercise).map((ex) => (
            <div key={ex} className="exercise-card">
              <h3>{ex}</h3>
              <ul>
                {logsByExercise[ex].map((log, i) => (
                  <li key={i}>
                    {log.date} — {log.weight}kg × {log.reps} reps
                  </li>
                ))}
              </ul>
              <div className="extra-info">
                <p>
                  <strong>Suggestion:</strong> {getSuggestion(logsByExercise[ex])}
                </p>
                <p>
                  <strong>Monthly Growth:</strong>{" "}
                  {getMonthlyGrowth(logsByExercise[ex])}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------ WEEKLY TAB ------------------ */}
      {activeTab === "weekly" && (
        <div className="weekly">
          <h2>Weekly Progress</h2>
          {Object.keys(weeklyProgress).map((week) => (
            <div key={week} className="week-card">
              <h3>Week {week}</h3>
              {Object.keys(weeklyProgress[week]).map((ex) => (
                <div key={ex} className="weekly-exercise">
                  <h4>{ex}</h4>
                  <ul>
                    {weeklyProgress[week][ex].map((log, i) => (
                      <li key={i}>
                        {log.date} — {log.weight}kg × {log.reps} reps
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Week number helper
Date.prototype.getWeekNumber = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

export default App;
