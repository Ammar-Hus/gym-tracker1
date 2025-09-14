import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subDays, startOfMonth, isAfter } from 'date-fns';

const SPLIT = [
  { day: 'Monday', muscle: 'Chest + Triceps + Abs', exercises: ['Bench Press','Incline DB Press','Dips','Pushdowns','Overhead DB Extension','Plank','Deadbug','Woodchoppers'] },
  { day: 'Tuesday', muscle: 'Back + Biceps', exercises: ['Pull-Ups','Barbell Rows','Seated Rows','Barbell Curls','DB Curls','Concentration Curl'] },
  { day: 'Wednesday', muscle: 'Legs + Shoulders', exercises: ['Squats','RDLs','Lunges','OHP','Lateral Raises','Rear Delt Flys','Hanging Leg Raise','Russian Twists'] },
  { day: 'Thursday', muscle: 'Chest + Triceps', exercises: ['Incline Bench','Chest Flys','Push-Ups','Skullcrushers','Rope Pushdowns','Dips'] },
  { day: 'Friday', muscle: 'Rest', exercises: [] },
  { day: 'Saturday', muscle: 'Back + Biceps', exercises: ['Lat Pulldown','T-Bar Row','DB Row','Incline DB Curl','Hammer Curl','Cable Curl','Decline Crunch','V-Ups','Cable Crunch'] },
  { day: 'Sunday', muscle: 'Legs + Shoulders', exercises: ['Leg Press','Leg Extension','Ham Curl','Arnold Press','Front Raise','Cable Lateral Raise','Stretch & Mobility'] }
];

const STORAGE_KEY = 'gympro_logs_v2';
const STORAGE_FIRST = 'gympro_first_entry_day';

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
  const [logs, setLogs] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }catch(e){return []} });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);

  function resetProgress(){
    if(window.confirm("Are you sure you want to reset all logs?")) setLogs([]);
  }

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

    setLogs(prev=>{
      const all = [...prev, ...newEntries].sort((a,b)=> a.date > b.date ? 1 : -1);

      // Save first entry per day+exercise if not exists
      const firstEntries = JSON.parse(localStorage.getItem(STORAGE_FIRST) || '{}');
      const key = `${selectedDay}-${selectedExercise}`;
      if(!firstEntries[key]){
        firstEntries[key] = { weight: newEntries[0].weight, reps: newEntries[0].reps };
        localStorage.setItem(STORAGE_FIRST, JSON.stringify(firstEntries));
      }

      return all;
    });

    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  function getPercentageIncrease(day, exercise, weight, reps){
    const firstEntries = JSON.parse(localStorage.getItem(STORAGE_FIRST) || '{}');
    const key = `${day}-${exercise}`;
    if(!firstEntries[key]) return { weightPct: 0, repsPct: 0 };
    const w0 = firstEntries[key].weight;
    const r0 = firstEntries[key].reps;
    return {
      weightPct: w0 ? Math.round(((weight - w0)/w0)*100*100)/100 : null,
      repsPct: r0 ? Math.round(((reps - r0)/r0)*100*100)/100 : null
    };
  }

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{ 
      if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0}; 
      map[a.date].weightSum += a.weight; map[a.date].repsSum += a.reps; map[a.date].count +=1; 
    });
    return Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  const primary = 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex`}>
      {/* Sidebar */}
      <div className="w-56 bg-white shadow p-4 flex flex-col space-y-2">
        <button onClick={()=>setTab('dashboard')} className={`p-2 rounded ${tab==='dashboard'?'bg-indigo-100 font-bold':''}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`p-2 rounded ${tab==='progress'?'bg-indigo-100 font-bold':''}`}>Progress</button>
        <button onClick={()=>setTab('weekly')} className={`p-2 rounded ${tab==='weekly'?'bg-indigo-100 font-bold':''}`}>Weekly Log</button>
        <button onClick={resetProgress} className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600">Reset Progress</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard */}
        {tab==='dashboard' && (
          <div className="space-y-4">
            <div className="text-xl font-bold">Select a Day</div>
            <div className="grid grid-cols-2 gap-3">
              {SPLIT.map(d=>(
                <button key={d.day} onClick={()=>openDay(d.day)} className="p-4 rounded-xl shadow bg-white text-left">
                  <div className="font-semibold">{d.day}</div>
                  <div className="text-xs text-gray-500">{d.muscle}</div>
                </button>
              ))}
            </div>

            {showPanel && selectedDay && (
              <div className="fixed inset-0 bg-black/40 flex justify-end">
                <div className="bg-white w-80 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold">{selectedDay} Exercises</div>
                    <button onClick={()=>setShowPanel(false)}>✕</button>
                  </div>
                  {!selectedExercise && (
                    <div className="space-y-2">
                      {(SPLIT.find(d=>d.day===selectedDay)?.exercises||[]).map(ex=>(
                        <button key={ex} onClick={()=>openExercise(ex)} className="block w-full text-left p-2 bg-indigo-50 rounded">{ex}</button>
                      ))}
                    </div>
                  )}
                  {selectedExercise && (
                    <div>
                      <div className="font-semibold mb-2">{selectedExercise}</div>
                      {setsInput.map((s,i)=>(
                        <div key={i} className="flex items-center space-x-2 mb-2">
                          <input type="number" value={s.reps} onChange={e=>updateSet(i,'reps',e.target.value)} className="border p-1 w-16" placeholder="Reps" />
                          <input type="number" value={s.weight} onChange={e=>updateSet(i,'weight',e.target.value)} className="border p-1 w-20" placeholder="Weight" />
                          <button onClick={()=>removeSet(i)} className="text-red-500">✕</button>
                        </div>
                      ))}
                      <button onClick={addSetRow} className="px-3 py-1 bg-gray-200 rounded">+ Set</button>
                      <button onClick={saveExercise} className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded">Save</button>
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
            {Object.keys(exerciseMap).map(ex=>{
              const logsEx = exerciseMap[ex];
              const last = logsEx[logsEx.length-1];
              const pct = getPercentageIncrease(last.day, ex, last.weight, last.reps);
              return (
                <div key={ex} className="p-3 rounded-xl bg-white shadow">
                  <div className="font-semibold mb-1">{ex}</div>
                  <div className="text-sm text-gray-500">Latest: {last.weight}kg × {last.reps} reps</div>
                  <div className="text-sm text-green-600">+{pct.weightPct}% Weight, +{pct.repsPct}% Reps vs first</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartDataForExercise(ex)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#6366F1" />
                      <Line type="monotone" dataKey="reps" stroke="#EC4899" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        )}

        {/* Weekly Log */}
        {tab==='weekly' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Weekly Logs</h2>
            {SPLIT.map(d => (
              <div key={d.day} className="mb-4 p-3 bg-white shadow rounded">
                <div className="font-semibold">{d.day} ({d.muscle})</div>
                {d.exercises.map(ex => {
                  const logsEx = exerciseMap[ex]?.filter(l => l.day===d.day) || [];
                  return (
                    <div key={ex} className="text-sm">
                      <strong>{ex}:</strong> {logsEx.map(l=>{
                        const pct = getPercentageIncrease(d.day, ex, l.weight, l.reps);
                        return `${l.reps} reps × ${l.weight}kg (+${pct.weightPct}%, +${pct.repsPct}%)`;
                      }).join(', ') || 'No entry'}
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
