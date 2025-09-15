// src/components/ProgressTab.jsx
import React from "react";

const ProgressTab = () => {
  // Dummy workout progress data
  const progressData = [
    { date: "2025-09-01", exercise: "Bench Press", weight: "40kg", reps: "10" },
    { date: "2025-09-05", exercise: "Deadlift", weight: "70kg", reps: "8" },
    { date: "2025-09-10", exercise: "Squat", weight: "60kg", reps: "12" },
    { date: "2025-09-14", exercise: "Overhead Press", weight: "25kg", reps: "10" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📈 Workout Progress</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 px-4 py-2">Date</th>
              <th className="border border-gray-600 px-4 py-2">Exercise</th>
              <th className="border border-gray-600 px-4 py-2">Weight</th>
              <th className="border border-gray-600 px-4 py-2">Reps</th>
            </tr>
          </thead>
          <tbody>
            {progressData.map((entry, index) => (
              <tr key={index} className="text-center">
                <td className="border border-gray-600 px-4 py-2">{entry.date}</td>
                <td className="border border-gray-600 px-4 py-2">{entry.exercise}</td>
                <td className="border border-gray-600 px-4 py-2">{entry.weight}</td>
                <td className="border border-gray-600 px-4 py-2">{entry.reps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgressTab;
