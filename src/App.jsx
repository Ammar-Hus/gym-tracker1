import React, { useState, useEffect } from "react";

export default function App() {
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [customAbsExercises, setCustomAbsExercises] = useState([]);
  const [logs, setLogs] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [editedValues, setEditedValues] = useState({ reps: "", weight: "", sets: "" });

  // Load from localStorage
  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem("gymLogs")) || {};
    const savedCustomAbs = JSON.parse(localStorage.getItem("customAbs")) || [];
    setLogs(savedLogs);
    setCustomAbsExercises(savedCustomAbs);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("gymLogs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("customAbs", JSON.stringify(customAbsExercises));
  }, [customAbsExercises]);

  // Add log
  const addLog = (exercise, reps, weight, sets) => {
    const newLog = { reps, weight, sets, date: new Date().toLocaleString() };
    setLogs((prev) => ({
      ...prev,
      [exercise]: prev[exercise] ? [...prev[exercise], newLog] : [newLog],
    }));
  };

  // Delete log
  const deleteLog = (exercise, index) => {
    setLogs((prev) => {
      const updated = { ...prev };
      updated[exercise].splice(index, 1);
      if (updated[exercise].length === 0) delete updated[exercise];
      return updated;
    });
  };

  // Start editing log
  const startEditing = (exercise, index, log) => {
    setEditingLog({ exercise, index });
    setEditedValues({ reps: log.reps, weight: log.weight, sets: log.sets });
  };

  // Save edited log
  const saveEditedLog = () => {
    setLogs((prev) => {
      const updated = { ...prev };
      updated[editingLog.exercise][editingLog.index] = {
        ...updated[editingLog.exercise][editingLog.index],
        ...editedValues,
      };
      return updated;
    });
    setEditingLog(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLog(null);
    setEditedValues({ reps: "", weight: "", sets: "" });
  };

  // Add custom abs exercise
  const addCustomAbsExercise = (name) => {
    if (name && !customAbsExercises.includes(name)) {
      setCustomAbsExercises([...customAbsExercises, name]);
    }
  };

  // Exercise groups
  const exerciseGroups = {
    Chest: ["Bench Press", "Incline Press", "Chest Fly"],
    Back: ["Pull Ups", "Lat Pulldown", "Deadlift"],
    Legs: ["Squat", "Lunges", "Leg Press"],
    Abs: ["Plank", "Crunch", "Russian Twists", "V-Ups", "Hanging Leg Raise", ...customAbsExercises],
  };

  // UI states
  const [showAddAbsInput, setShowAddAbsInput] = useState(false);
  const [newAbsName, setNewAbsName] = useState("");

  // Progress calculation
  const calculateProgress = (exercise) => {
    const entries = logs[exercise];
    if (!entries || entries.length < 2) return null;
    const first = entries[0];
    const last = entries[entries.length - 1];

    const weightDiff = last.weight - first.weight;
    const repsDiff = last.reps - first.reps;

    const weightPercent = first.weight ? ((weightDiff / first.weight) * 100).toFixed(1) : "0";
    const repsPercent = first.reps ? ((repsDiff / first.reps) * 100).toFixed(1) : "0";

    return {
      first,
      last,
      weightDiff,
      repsDiff,
      weightPercent,
      repsPercent,
    };
  };

  return (
    <div className="p-6 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">🏋️ Gym Tracker</h1>

      {/* Body part selection */}
      <div className="flex gap-2 mb-4">
        {Object.keys(exerciseGroups).map((part) => (
          <button
            key={part}
            className={`px-3 py-2 rounded ${selectedBodyPart === part ? "bg-indigo-500 text-white" : "bg-gray-200"}`}
            onClick={() => {
              setSelectedBodyPart(part);
              setSelectedExercise(null);
            }}
          >
            {part}
          </button>
        ))}
      </div>

      {/* Exercises list */}
      {selectedBodyPart && !selectedExercise && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{selectedBodyPart} Exercises</h2>
          <div className="flex flex-wrap gap-2">
            {exerciseGroups[selectedBodyPart].map((ex) => (
              <button
                key={ex}
                className="px-2 py-1 rounded bg-gray-100 hover:bg-indigo-200"
                onClick={() => setSelectedExercise(ex)}
              >
                {ex}
              </button>
            ))}
            {selectedBodyPart === "Abs" && (
              <div>
                {showAddAbsInput ? (
                  <div className="flex gap-2">
                    <input
                      className="border px-2 py-1 rounded"
                      value={newAbsName}
                      onChange={(e) => setNewAbsName(e.target.value)}
                    />
                    <button
                      className="bg-green-500 text-white px-2 rounded"
                      onClick={() => {
                        addCustomAbsExercise(newAbsName);
                        setNewAbsName("");
                        setShowAddAbsInput(false);
                      }}
                    >
                      Add
                    </button>
                    <button
                      className="bg-gray-300 px-2 rounded"
                      onClick={() => {
                        setShowAddAbsInput(false);
                        setNewAbsName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-2 py-1 rounded bg-yellow-200 hover:bg-yellow-300"
                    onClick={() => setShowAddAbsInput(true)}
                  >
                    + Add Custom Abs Exercise
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log entry form */}
      {selectedExercise && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">{selectedExercise}</h2>
          <LogForm exercise={selectedExercise} addLog={addLog} goBack={() => setSelectedExercise(null)} />
          <div className="mt-4">
            <h3 className="font-semibold">Logs:</h3>
            <div className="space-y-2">
              {logs[selectedExercise]?.map((log, idx) => (
                <div key={idx} className="p-2 border rounded flex justify-between items-center">
                  {editingLog && editingLog.exercise === selectedExercise && editingLog.index === idx ? (
                    <div className="flex gap-2">
                      <input
                        className="border px-2 w-16"
                        value={editedValues.reps}
                        onChange={(e) => setEditedValues({ ...editedValues, reps: e.target.value })}
                      />
                      <input
                        className="border px-2 w-16"
                        value={editedValues.weight}
                        onChange={(e) => setEditedValues({ ...editedValues, weight: e.target.value })}
                      />
                      <input
                        className="border px-2 w-16"
                        value={editedValues.sets}
                        onChange={(e) => setEditedValues({ ...editedValues, sets: e.target.value })}
                      />
                      <button className="bg-green-500 text-white px-2 rounded" onClick={saveEditedLog}>
                        ✅
                      </button>
                      <button className="bg-gray-300 px-2 rounded" onClick={cancelEditing}>
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold">{log.reps} reps × {log.weight}kg × {log.sets} sets</span>
                      <span className="text-xs text-gray-500 ml-2">{log.date}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className="text-blue-500" onClick={() => startEditing(selectedExercise, idx, log)}>✏️</button>
                    <button className="text-red-500" onClick={() => deleteLog(selectedExercise, idx)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress Tab */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">📊 Progress</h2>
        <div className="space-y-3">
          {Object.keys(logs).map((exercise) => {
            const prog = calculateProgress(exercise);
            if (!prog) return (
              <div key={exercise} className="p-2 border rounded">
                <h3 className="font-semibold">{exercise}</h3>
                <p className="text-sm text-gray-500">Not enough data yet.</p>
              </div>
            );

            return (
              <div key={exercise} className="p-2 border rounded">
                <h3 className="font-semibold">{exercise}</h3>
                <p>
                  Weight:{" "}
                  <span className={prog.weightDiff > 0 ? "text-green-600" : prog.weightDiff < 0 ? "text-red-600" : "text-gray-600"}>
                    {prog.first.weight}kg → {prog.last.weight}kg ({prog.weightDiff >= 0 ? "+" : ""}{prog.weightDiff}kg, {prog.weightPercent}%)
                  </span>
                </p>
                <p>
                  Reps:{" "}
                  <span className={prog.repsDiff > 0 ? "text-green-600" : prog.repsDiff < 0 ? "text-red-600" : "text-gray-600"}>
                    {prog.first.reps} → {prog.last.reps} ({prog.repsDiff >= 0 ? "+" : ""}{prog.repsDiff}, {prog.repsPercent}%)
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Log form component
function LogForm({ exercise, addLog, goBack }) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [sets, setSets] = useState("");

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="border px-2 py-1 rounded w-20"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input
          className="border px-2 py-1 rounded w-20"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          className="border px-2 py-1 rounded w-20"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
        />
        <button
          className="bg-indigo-500 text-white px-3 rounded"
          onClick={() => {
            if (reps && weight && sets) {
              addLog(exercise, Number(reps), Number(weight), Number(sets));
              setReps("");
              setWeight("");
              setSets("");
            }
          }}
        >
          Save
        </button>
        <button className="bg-gray-300 px-3 rounded" onClick={goBack}>
          Back
        </button>
      </div>
    </div>
  );
}
