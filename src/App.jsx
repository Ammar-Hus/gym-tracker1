import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

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
const CUSTOM_ABS_KEY = 'gympro_custom_abs';
function uid(){ return Math.random().toString(36).slice(2,9); }

function groupByExercise(logs){
  const map = {};
  logs.forEach(l=>{
    if(!map[l.exercise]) map[l.exercise]=[];
    map[l.exercise].push(l);
  });
  Object.keys(map).forEach(k=> map[k].sort((a,b)=> new Date(a.date) - new Date(b.date)));
  return map;
}

export default function App(){
  const [logs, setLogs] = useState(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){return []} });
  const [customAbs, setCustomAbs] = useState(()=>{ try{ const raw = localStorage.getItem(CUSTOM_ABS_KEY); return raw? JSON.parse(raw): []; }catch(e){return []} });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [setsInput, setSetsInput] = useState([{set:1,reps:8,weight:0}]);
  const [date, setDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [tab, setTab] = useState('dashboard');
  const [addingAbs, setAddingAbs] = useState(false);
  const [newAbsName, setNewAbsName] = useState("");

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); },[logs]);
  useEffect(()=>{ localStorage.setItem(CUSTOM_ABS_KEY, JSON.stringify(customAbs)); },[customAbs]);

  function openDay(day){ 
    setSelectedDay(day); 
    setSelectedExercise(null); 
    setShowPanel(true); 
    setSetsInput([{set:1,reps:8,weight:0}]); 
  }
  function openExercise(ex){ 
    setSelectedExercise(ex); 
    setSetsInput([{set:1,reps:8,weight:0}]); 
  }
  function addSetRow(){ setSetsInput(prev=>[...prev, {set: prev.length+1, reps:8, weight:0}]); }
  function updateSet(idx, field, val){ const copy=[...setsInput]; copy[idx][field]=Number(val)||0; setSetsInput(copy); }
  function removeSet(idx){ const copy=[...setsInput]; copy.splice(idx,1); copy.forEach((r,i)=>r.set=i+1); setSetsInput(copy); }

  function saveExercise(){
    if(!selectedExercise) return;
    const newEntries = setsInput.map(s=>({
      id: uid(), date, day: selectedDay || format(parseISO(date),'EEEE'), exercise: selectedExercise,
      set: s.set, reps: Number(s.reps), weight: Number(s.weight)
    }));
    setLogs(prev=>[...prev, ...newEntries].sort((a,b)=> new Date(a.date) - new Date(b.date)));
    setSetsInput([{set:1,reps:8,weight:0}]);
    setSelectedExercise(null);
  }

  function addCustomAbs(){
    if(newAbsName.trim()){
      setCustomAbs(prev=>[...prev,newAbsName.trim()]);
      setNewAbsName("");
      setAddingAbs(false);
    }
  }
  function deleteCustomAbs(name){
    setCustomAbs(prev=> prev.filter(x=>x!==name));
  }

  function deleteLog(id){ setLogs(prev=> prev.filter(l=>l.id!==id)); }

  const exerciseMap = useMemo(()=> groupByExercise(logs), [logs]);

  const progressSummary = useMemo(()=>{
    const exs = Object.keys(exerciseMap).length ? Object.keys(exerciseMap) : SPLIT.flatMap(s=>s.exercises);
    return exs.map(ex=>{
      const arr = exerciseMap[ex]||[];
      if(!arr.length) return {exercise:ex, first:null, latest:null, weightDiff:null, repsDiff:null, pctWeight:null, pctReps:null};
      const first = arr[0];
      const latest = arr[arr.length-1];
      const weightDiff = latest.weight - first.weight;
      const repsDiff = latest.reps - first.reps;
      const pctWeight = first.weight? Math.round((weightDiff/first.weight)*100*100)/100 : null;
      const pctReps = first.reps? Math.round((repsDiff/first.reps)*100*100)/100 : null;
      return {exercise:ex, first, latest, weightDiff, repsDiff, pctWeight, pctReps};
    });
  }, [exerciseMap]);

  function chartDataForExercise(ex){
    const arr = (exerciseMap[ex]||[]).map(r=>({ date: r.date, weight: r.weight, reps: r.reps }));
    const map = {};
    arr.forEach(a=>{
      if(!map[a.date]) map[a.date]={weightSum:0,repsSum:0,count:0};
      map[a.date].weightSum += a.weight;
      map[a.date].repsSum += a.reps;
      map[a.date].count +=1;
    });
    return Object.keys(map).sort().map(d=>({ date:d, weight: Math.round((map[d].weightSum/map[d].count)*100)/100, reps: Math.round((map[d].repsSum/map[d].count)*100)/100 }));
  }

  function getWeekKey(d){
    const date = new Date(d);
    const onejan = new Date(date.getFullYear(),0,1);
    const week = Math.ceil((((date - onejan)/86400000)+onejan.getDay()+1)/7);
    return `${date.getFullYear()}-${week}`;
  }

  const primary = 'bg-gradient-to-r from-indigo-100 via-white to-pink-50';

  return (
    <div className={`min-h-screen ${primary} flex flex-col md:flex-row`}>
      {/* Sidebar */}
      <div className="md:w-64 p-4 bg-white shadow-md flex-shrink-0">
        <div className="text-xl font-bold mb-4 text-center">Gym Tracker</div>
        <button onClick={()=>setTab('dashboard')} className={`w-full p-2 mb-2 rounded ${tab==='dashboard'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Dashboard</button>
        <button onClick={()=>setTab('progress')} className={`w-full p-2 mb-2 rounded ${tab==='progress'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Progress</button>
        <button onClick={()=>setTab('weekly')} className={`w-full p-2 mb-2 rounded ${tab==='weekly'?'bg-indigo-500 text-white':'bg-gray-100'}`}>Weekly Strength</button>
        <button onClick={()=>{localStorage.removeItem(STORAGE_KEY); setLogs([]); localStorage.removeItem(CUSTOM_ABS_KEY); setCustomAbs([]);}} className="w-full p-2 mb-2 rounded bg-red-500 text-white">Reset All</button>
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

            {/* Panel when a day is selected */}
            {showPanel && selectedDay && (
              <div className="p-4 rounded-xl bg-white shadow mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-lg">{selectedDay}</div>
                  <button onClick={()=>setShowPanel(false)} className="text-red-500">Close</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {SPLIT.find(s=>s.day===selectedDay)?.exercises.map(ex=>(
                    <button key={ex} onClick={()=>openExercise(ex)} className={`p-2 rounded border ${selectedExercise===ex?'bg-indigo-500 text-white':'bg-gray-100'}`}>
                      {ex}
                    </button>
                  ))}
                  {customAbs.map(ex=>(
                    <button key={ex} onClick={()=>openExercise(ex)} className={`p-2 rounded border ${selectedExercise===ex?'bg-indigo-500 text-white':'bg-gray-100'}`}>
                      {ex}
                    </button>
                  ))}
                </div>

                {selectedExercise && (
                  <div className="mt-3">
                    <div className="font-semibold mb-2">Logging for: {selectedExercise}</div>
                    <div className="space-y-2">
                      {setsInput.map((s,idx)=>(
                        <div key={idx} className="flex items-center gap-2">
                          <span>Set {s.set}</span>
                          <input type="number" value={s.reps} onChange={e=>updateSet(idx,'reps',e.target.value)} className="w-20 p-1 border rounded" placeholder="Reps"/>
                          <input type="number" value={s.weight} onChange={e=>updateSet(idx,'weight',e.target.value)} className="w-24 p-1 border rounded" placeholder="Weight (kg)"/>
                          {setsInput.length>1 && <button onClick={()=>removeSet(idx)} className="text-red-500">✕</button>}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={addSetRow} className="px-2 py-1 rounded bg-gray-200">+ Add Set</button>
                      <button onClick={saveExercise} className="px-2 py-1 rounded bg-indigo-500 text-white">Save</button>
                    </div>
                  </div>
                )}
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
                  {item.first && item.latest ? (
                    <>
                      <div className="text-sm text-gray-500">First: {item.first.weight}kg × {item.first.reps} reps</div>
                      <div className="text-sm text-gray-500">Latest: {item.latest.weight}kg × {item.latest.reps} reps</div>
                      <div className="text-sm">Weight Change: {item.weightDiff}kg ({item.pctWeight || 0}%)</div>
                      <div className="text-sm">Reps Change: {item.repsDiff} reps ({item.pctReps || 0}%)</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">No logs yet</div>
                  )}
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Strength */}
        {tab==='weekly' && (
          <div>
            <div className="text-xl font-bold mb-3">Weekly Strength Overview</div>
            {SPLIT.map(day=>{
              const defaultExercises = day.exercises || [];
              const customExercisesLogged = logs
                .filter(log => log.day === day.day && !defaultExercises.includes(log.exercise))
                .map(log => log.exercise);
              const uniqueCustomExercises = [...new Set(customExercisesLogged)];
              const allExercises = [...defaultExercises, ...uniqueCustomExercises];

              return (
                <div key={day.day} className="mb-4 p-3 rounded-xl bg-white shadow">
                  <div className="font-semibold">{day.day} ({day.muscle})</div>
                  {allExercises.map(ex=>{
                    const arr = logs.filter(l=>l.exercise===ex && l.day===day.day).sort((a,b)=> new Date(a.date) - new Date(b.date));
                    if(!arr.length) return null;

                    const byWeek = {};
                    arr.forEach(l=>{
                      const w = getWeekKey(l.date);
                      if(!byWeek[w]) byWeek[w]=[];
                      byWeek[w].push(l);
                    });
                    const weeks = Object.keys(byWeek).sort();
                    if(weeks.length < 2){
                      return <div key={ex} className="text-sm text-gray-400">{ex}: Not enough weekly data</div>;
                    }
                    const lastWeek = weeks[weeks.length-2];
                    const thisWeek = weeks[weeks.length-1];
                    const prevEntry = byWeek[lastWeek][byWeek[lastWeek].length-1];
                    const currEntry = byWeek[thisWeek][byWeek[thisWeek].length-1];

                    const pctWeight = prevEntry.weight ? Math.round(((currEntry.weight - prevEntry.weight)/prevEntry.weight)*100*100)/100 : null;
                    const pctReps = prevEntry.reps ? Math.round(((currEntry.reps - prevEntry.reps)/prevEntry.reps)*100*100)/100 : null;

                    return (
                      <div key={ex} className="text-sm">
                        {ex}: {currEntry.weight}kg × {currEntry.reps} reps{" "}
                        {pctWeight!==null ? (
                          <span className={pctWeight>=0 ? "text-green-600" : "text-red-600"}>
                            ({pctWeight}% {pctWeight>=0 ? "↑" : "↓"} weight)
                          </span>
                        ) : <span className="text-gray-500">(New weight)</span>}
                        {" , "}
                        {pctReps!==null ? (
                          <span className={pctReps>=0 ? "text-green-600" : "text-red-600"}>
                            ({pctReps}% {pctReps>=0 ? "↑" : "↓"} reps)
                          </span>
                        ) : <span className="text-gray-500">(New reps)</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
