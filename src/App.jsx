import React, { useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Sample workout data
  const [workouts] = useState([
    { date: "2025-09-01", exercise: "Bench Press", weight: 40, reps: 10 },
    { date: "2025-09-03", exercise: "Squat", weight: 60, reps: 8 },
    { date: "2025-09-06", exercise: "Deadlift", weight: 80, reps: 6 },
    { date: "2025-09-09", exercise: "Bench Press", weight: 45, reps: 9 },
    { date: "2025-09-12", exercise: "Squat", weight: 65, reps: 8 },
  ]);

  // Line chart data
  const lineData = {
    labels: workouts.map((w) => w.date),
    datasets: [
      {
        label: "Weight Progress (kg)",
        data: workouts.map((w) => w.weight),
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79,70,229,0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Pie chart data
  const exerciseCount = workouts.reduce((acc, w) => {
    acc[w.exercise] = (acc[w.exercise] || 0) + 1;
    return acc;
  }, {});
  const pieData = {
    labels: Object.keys(exerciseCount),
    datasets: [
      {
        data: Object.values(exerciseCount),
        backgroundColor: ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  // Stats
  const maxWeight = Math.max(...workouts.map((w) => w.weight));
  const totalSessions = workouts.length;
  const growthPercent = (
    ((workouts[workouts.length - 1].weight - workouts[0].weight) /
      workouts[0].weight) *
    100
  ).toFixed(1);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          background: "#f9fafb",
          padding: "20px",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontWeight: "bold" }}>Gym Tracker</h2>
        <button
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            background: activeTab === "dashboard" ? "#6366f1" : "#fff",
            color: activeTab === "dashboard" ? "#fff" : "#000",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            background: activeTab === "progress" ? "#6366f1" : "#fff",
            color: activeTab === "progress" ? "#fff" : "#000",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>
        <button
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            background: activeTab === "weekly" ? "#6366f1" : "#fff",
            color: activeTab === "weekly" ? "#fff" : "#000",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
          onClick={() => setActiveTab("weekly")}
        >
          Weekly Strength
        </button>
        <button
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            marginTop: "20px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
          }}
          onClick={() => alert("All data reset!")}
        >
          Reset All
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px", background: "#f0f4ff" }}>
        {activeTab === "dashboard" && <h2>Dashboard (same as before)</h2>}

        {activeTab === "weekly" && <h2>Weekly Strength (same as before)</h2>}

        {activeTab === "progress" && (
          <div>
            <h2 style={{ marginBottom: "20px", fontWeight: "bold" }}>
              📊 Progress Overview
            </h2>

            {/* Floating Summary Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  textAlign: "center",
                }}
              >
                <h4>Growth</h4>
                <p style={{ fontSize: "22px", fontWeight: "bold" }}>
                  {growthPercent}%
                </p>
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  textAlign: "center",
                }}
              >
                <h4>Max Weight</h4>
                <p style={{ fontSize: "22px", fontWeight: "bold" }}>
                  {maxWeight} kg
                </p>
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  textAlign: "center",
                }}
              >
                <h4>Total Sessions</h4>
                <p style={{ fontSize: "22px", fontWeight: "bold" }}>
                  {totalSessions}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              >
                <Line data={lineData} />
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              >
                <Pie data={pieData} />
              </div>
            </div>

            {/* Recent Workouts */}
            <div
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              }}
            >
              <h4 style={{ marginBottom: "10px" }}>Recent Workouts</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {workouts.slice(-5).map((w, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 0",
                      borderBottom:
                        i !== workouts.slice(-5).length - 1
                          ? "1px solid #eee"
                          : "none",
                    }}
                  >
                    <strong>{w.date}</strong> — {w.exercise}: {w.weight}kg ×{" "}
                    {w.reps} reps
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
