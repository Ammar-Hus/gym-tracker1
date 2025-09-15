import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns','Overhead DB Extension','Plank','Deadbug','Woodchoppers'] },
  { day: 'Tuesday', muscle: 'Back + Biceps + Abs', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls','DB Curls','Concentration Curl','Plank','Hanging Leg Raise'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders + Abs', exercises: ['Squats','RDLs','Lunges','OHP','Lateral Raises','Rear Delt Flys','Hanging Leg Raise','Russian Twists'] },
  { day: 'Thursday', muscle: 'Chest + Triceps + Abs', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers','Rope Pushdowns','Dips','Plank'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps + Abs', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl','Hammer Curl','Cable Curl','Decline Crunch','V-Ups','Cable Crunch'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders + Abs', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press','Front Raise','Cable Lateral Raise','Stretch & Mobility','Plank'] }
];

const STORAGE_KEY = 'gympro_logs_v2';
function uid(){ return Math.random().toString(36).slice(2,9); }

function groupByExercise(logs){
  const map = {};
  logs.forEach(l=>{
    if(!map[l.exercise]) map[l.exercise]=[];
    map[l.exercise].push(l);
  });
  Object.keys(map).forEach(k=> map[k].sort((a,b)=> a.date > b.date ? 1 : -1));
  return map;
}

export default function App(){
  const [logs, setLogs] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){return []}
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function openDay(day){ setSelectedDay(day); setSelectedExercise(null); setShowPanel(true); setSetsInput([{set:1,reps:8,weight:0}]); }
  function openExercise(ex){ setSelectedExercise(ex); setSetsInput([{set:1,reps:8,weight:0}]); }
  function addSetRow(){ setSetsInput(prev=>[...prev, {set: prev.length+1, reps:8, weight:0}]); }
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=val; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev, ...newEntries].sort((a,b)=> a.date > b.date ? 1 : -1));
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{ if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; });
    return Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  const progressSummary = useMemo(()=>{
    return Object.keys(exerciseMap).map(ex=>{
      const arr = exerciseMap[ex]||[];
      if(!arr.length) return {exercise:ex};
      const first = arr[0];
      const last = arr[arr.length-1];
      const weightDiff = last.weight - first.weight;
      const repsDiff = last.reps - first.reps;
      const weightPct = first.weight ? Math.round((weightDiff/first.weight)*100*100)/100 : null;
      const repsPct = first.reps ? Math.round((repsDiff/first.reps)*100*100)/100 : null;
      return {exercise:ex, first, last, weightDiff, repsDiff, weightPct, repsPct};
    });
  }, [exerciseMap]);

  const primary = 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col md:flex-row`}>
      {/* Sidebar */}
      <div className="md:w-64 p-4 bg-white shadow-md flex-shrink-0">
        <div className="text-xl font-bold mb-4 text-center">Gym Tracker</div>
        <button onClick={()=>setTab('dashboard')} className={`w-full p-2 mb-2 rounded ${tab==='dashboard'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`w-full p-2 mb-2 rounded ${tab==='progress'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Progress</button>
        <button onClick={()=>setTab('weekly')} className={`w-full p-2 mb-2 rounded ${tab==='weekly'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Weekly Strength</button>
        <button onClick={()=>{localStorage.removeItem(STORAGE_KEY); setLogs([]);}} className="w-full p-2 mb-2 rounded bg-red-500 text-white">Reset All</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard */}
        {tab==='dashboard' && (
          <div className="space-y-4">
            <div className="text-xl font-bold">Select a Day</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPLIT.map(d=>(
                <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white text-left">
                  <div className="font-semibold">{d.day}</div>
                  <div className="text-xs text-gray-500">{d.muscle}</div>
                </button>
              ))}
            </div>

            {showPanel && selectedDay && (
              <div className="fixed inset-0 bg-black/40 flex justify-center md:justify-end items-start pt-10 px-2">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md p-4 rounded-xl shadow overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold">{selectedDay} Exercises</div>
                    <button onClick={()=>setShowPanel(false)}>✕</button>
                  </div>

                  {!selectedExercise && (
                    <div className="space-y-2">
                      {(SPLIT.find(d=>d.day===selectedDay)?.exercises||[]).map(ex=>(
                        <button key={ex} onClick={()=>openExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 rounded">{ex}</button>
                      ))}

                      <div className="mt-3 text-sm font-semibold">Abs Exercises (select manually):</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['Plank','Crunch','Russian Twists','V-Ups','Hanging Leg Raise'].map(ex=>(
                          <button key={ex} onClick={()=>openExercise(ex)} className="px-2 py-1 rounded bg-gray-100 hover:bg-indigo-200">{ex}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedExercise && (
                    <div>
                      <div className="font-semibold mb-2">{selectedExercise}</div>
                      {setsInput.map((s,i)=>(
                        <div key={i} className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                          <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',e.target.value)} className="border p-1 w-full sm:w-16" placeholder="Reps" />
                          <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',e.target.value)} className="border p-1 w-full sm:w-20" placeholder="Weight" />
                          <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={addSetRow} className="px-3 py-1 bg-gray-200 rounded w-full sm:w-auto">+ Set</button>
                        <button onClick={saveExercise} className="px-3 py-1 bg-indigo-500 text-white rounded w-full sm:w-auto">Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {tab==='progress' && (
          <div className="space-y-6">
            <div className="text-xl font-bold">Progress Summary</div>
            <div className="grid gap-3">
              {progressSummary.map(item=>(
                <div key={item.exercise} className="p-3 rounded-xl bg-white shadow overflow-x-auto">
                  <div className="font-semibold mb-1">{item.exercise}</div>
                  {item.first && item.last ? (
                    <>
                      <div className="text-sm text-gray-500">First: {item.first.weight}kg × {item.first.reps} reps</div>
                      <div className="text-sm">Latest: {item.last.weight}kg × {item.last.reps} reps</div>
                      <div className="text-sm">Weight Change: {item.weightDiff}kg ({item.weightPct || 0}%)</div>
                      <div className="text-sm">Reps Change: {item.repsDiff} reps ({item.repsPct || 0}%)</div>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={chartDataForExercise(item.exercise)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight" stroke="#6366F1" />
                          <Line type="monotone" dataKey="reps" stroke="#EC4899" />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">No data yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Strength Tab */}
        {tab==='weekly' && (
          <div>
            <div className="text-xl font-bold mb-3">Weekly Strength Overview</div>
            {SPLIT.map(day=>(
              <div key={day.day} className="mb-4 p-3 rounded-xl bg-white shadow">
                <div className="font-semibold">{day.day} ({day.muscle})</div>
                {(day.exercises||[]).map(ex=>{
                  const arr = exerciseMap[ex]||[];
                  if(!arr.length) return null;
                  const last = arr[arr.length-1];
                  const first = arr[0];
                  const pct = first.weight? Math.round(((last.weight-first.weight)/first.weight)*100*100)/100 : null;
                  return (
                    <div key={ex} className="text-sm text-gray-700">
                      {ex}: {last.weight}kg × {last.reps} reps ({pct? pct+'% ↑': 'New'})
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
