import React, { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold text-center border-b border-gray-700">
          Gym Tracker
        </div>
        <nav className="flex flex-col mt-4">
          {["dashboard", "progress"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-left hover:bg-gray-800 transition ${
                activeTab === tab ? "bg-gray-700 font-semibold" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-700">
              Welcome to your Gym Tracker! Select a tab to continue.
            </p>
          </div>
        )}

        {activeTab === "progress" && (
          <ProgressPage onBack={() => setActiveTab("dashboard")} />
        )}
      </div>
    </div>
  );
}

/* ================================
   Progress Page Advanced Layout
================================= */
function ProgressPage({ onBack }) {
  // Fake progress data
  const stats = [
    { label: "Workouts Completed", value: 42 },
    { label: "Hours Trained", value: 68 },
    { label: "Calories Burned", value: "12,500" },
    { label: "PR Achieved", value: "Bench 80kg" },
  ];

  const weeklyProgress = [
    { day: "Mon", progress: 70 },
    { day: "Tue", progress: 90 },
    { day: "Wed", progress: 40 },
    { day: "Thu", progress: 85 },
    { day: "Fri", progress: 60 },
    { day: "Sat", progress: 95 },
    { day: "Sun", progress: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-900 flex items-center"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold">Progress Overview</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly Progress */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Weekly Performance</h2>
        <div className="grid grid-cols-7 gap-3">
          {weeklyProgress.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="relative w-6 h-24 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-blue-500"
                  style={{ height: `${day.progress}%` }}
                ></div>
              </div>
              <span className="text-sm mt-2">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-3">Workout Notes</h2>
        <textarea
          placeholder="Write your notes here..."
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring focus:ring-blue-300"
          rows={4}
        ></textarea>
      </div>
    </div>
  );
}
