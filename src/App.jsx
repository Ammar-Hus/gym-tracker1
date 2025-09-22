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
  Object.keys(map).forEach(k=> 
    map[k].sort((a,b)=> new Date(a.date) - new Date(b.date))
  );
  return map;
}

export default function App(){
  const [logs, setLogs] = useState([]);
  const [customAbs, setCustomAbs] = useState([]);
  const [tab, setTab] = useState('dashboard');

  useEffect(()=>{
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored) setLogs(JSON.parse(stored));
    const ca = localStorage.getItem(CUSTOM_ABS_KEY);
    if(ca) setCustomAbs(JSON.parse(ca));
  },[]);

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  },[logs]);
  useEffect(()=>{
    localStorage.setItem(CUSTOM_ABS_KEY, JSON.stringify(customAbs));
  },[customAbs]);

  const grouped = useMemo(()=>groupByExercise(logs),[logs]);

  function addLog(day, exercise){
    const d = format(new Date(),'yyyy-MM-dd');
    setLogs([...logs, {id:uid(), date:d, day, exercise, weight:0, reps:0}]);
  }
  function updateSet(id, field, val){
    setLogs(logs.map(l=> l.id===id ? {...l,[field]: Number(val)||0} : l));
  }
  function removeSet(id){
    setLogs(logs.filter(l=>l.id!==id));
  }
  function addCustomAbs(ex){
    if(ex && !customAbs.includes(ex)) setCustomAbs([...customAbs,ex]);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex gap-2 mb-4">
        {['dashboard','progress','weekly'].map(t=>(
          <button key={t}
            onClick={()=>setTab(t)}
            className={`px-3 py-1 rounded ${tab===t?'bg-blue-500 text-white':'bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab==='dashboard' && (
        <div>
          {SPLIT.map(day=>(
            <div key={day.day} className="mb-6">
              <div className="text-lg font-bold">{day.day} - {day.muscle}</div>
              {day.exercises.map(ex=>(
                <div key={ex} className="ml-4 mb-2">
                  <div className="font-semibold">{ex}</div>
                  {logs.filter(l=>l.day===day.day && l.exercise===ex).map(l=>(
                    <div key={l.id} className="flex items-center gap-2 ml-4 mb-1">
                      <input type="number" value={l.weight} onChange={e=>updateSet(l.id,'weight',e.target.value)} className="border p-1 w-20"/>
                      <span>kg ×</span>
                      <input type="number" value={l.reps} onChange={e=>updateSet(l.id,'reps',e.target.value)} className="border p-1 w-16"/>
                      <span>reps</span>
                      <button onClick={()=>removeSet(l.id)} className="text-red-500">x</button>
                    </div>
                  ))}
                  <button onClick={()=>addLog(day.day, ex)} className="ml-4 text-sm bg-green-200 px-2 py-1 rounded">Add Set</button>
                </div>
              ))}
              {day.muscle.includes('Abs') && (
                <div className="ml-4 mt-2">
                  <div className="font-semibold">Custom Abs Exercises</div>
                  {customAbs.map(ex=>(
                    <div key={ex} className="ml-2 mb-2">
                      <div>{ex}</div>
                      {logs.filter(l=>l.day===day.day && l.exercise===ex).map(l=>(
                        <div key={l.id} className="flex items-center gap-2 ml-4 mb-1">
                          <input type="number" value={l.weight} onChange={e=>updateSet(l.id,'weight',e.target.value)} className="border p-1 w-20"/>
                          <span>kg ×</span>
                          <input type="number" value={l.reps} onChange={e=>updateSet(l.id,'reps',e.target.value)} className="border p-1 w-16"/>
                          <span>reps</span>
                          <button onClick={()=>removeSet(l.id)} className="text-red-500">x</button>
                        </div>
                      ))}
                      <button onClick={()=>addLog(day.day, ex)} className="ml-4 text-sm bg-green-200 px-2 py-1 rounded">Add Set</button>
                    </div>
                  ))}
                  <input type="text" placeholder="Add Abs Exercise" onKeyDown={e=>{if(e.key==='Enter'){addCustomAbs(e.target.value); e.target.value='';}}} className="border p-1 mt-2"/>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {tab==='progress' && (
        <div>
          {Object.keys(grouped).map(ex=>{
            const data = grouped[ex].map(l=>({date:l.date, weight:l.weight, reps:l.reps}));
            return (
              <div key={ex} className="mb-6">
                <div className="font-bold mb-2">{ex}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data}>
                    <CartesianGrid stroke="#ccc"/>
                    <XAxis dataKey="date" tickFormatter={d=>d.slice(5)}/>
                    <YAxis/>
                    <Tooltip/>
                    <Line type="monotone" dataKey="weight" stroke="#8884d8"/>
                    <Line type="monotone" dataKey="reps" stroke="#82ca9d"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
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
                  const arr = logs
                    .filter(l=>l.exercise===ex && l.day===day.day)
                    .sort((a,b)=> new Date(a.date) - new Date(b.date));

                  if(!arr.length) return null;

                  // Group logs by week
                  const byWeek = {};
                  arr.forEach(l=>{
                    const d = new Date(l.date);
                    const week = `${d.getFullYear()}-${Math.ceil(((d - new Date(d.getFullYear(),0,1)) / 86400000 + d.getDay()+1)/7)}`;
                    if(!byWeek[week]) byWeek[week] = [];
                    byWeek[week].push(l);
                  });

                  const weeks = Object.keys(byWeek).sort();
                  if(weeks.length < 2) {
                    return (
                      <div key={ex} className="text-sm text-gray-500">
                        {ex}: Not enough weekly data yet
                      </div>
                    );
                  }

                  const lastWeek = weeks[weeks.length-2];
                  const thisWeek = weeks[weeks.length-1];

                  const prevEntry = byWeek[lastWeek][byWeek[lastWeek].length-1];
                  const currEntry = byWeek[thisWeek][byWeek[thisWeek].length-1];

                  const pctWeight = prevEntry.weight ? Math.round(((currEntry.weight - prevEntry.weight)/prevEntry.weight)*100*100)/100 : null;
                  const pctReps = prevEntry.reps ? Math.round(((currEntry.reps - prevEntry.reps)/prevEntry.reps)*100*100)/100 : null;

                  return (
                    <div key={ex} className="text-sm">
                      {ex}: {currEntry.weight}kg × {currEntry.reps} reps 
                      <span className={pctWeight > 0 ? "text-green-600" : pctWeight < 0 ? "text-red-600" : ""}>
                        {pctWeight !== null ? ` (${pctWeight}% ${pctWeight>0 ? "↑" : pctWeight<0 ? "↓" : ""} weight)` : " (New weight)"}
                      </span>
                      <span className={pctReps > 0 ? "text-green-600 ml-2" : pctReps < 0 ? "text-red-600 ml-2" : "ml-2"}>
                        {pctReps !== null ? ` (${pctReps}% ${pctReps>0 ? "↑" : pctReps<0 ? "↓" : ""} reps)` : " (New reps)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
