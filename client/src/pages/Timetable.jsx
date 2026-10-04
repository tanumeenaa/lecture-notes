import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, SubjectMark } from '../components/Ui.jsx';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Timetable() {
  const [subjects, setSubjects] = useState([]);
  const [slots, setSlots] = useState(null);
  const [form, setForm] = useState({ subject: '', weekday: '1', startTime: '09:00', endTime: '10:00' });
  const [error, setError] = useState('');

  async function load() {
    try {
      const [subjectResponse, slotResponse] = await Promise.all([api.get('/api/subjects'), api.get('/api/timetable')]);
      setSubjects(subjectResponse.data.subjects);
      setSlots(slotResponse.data.slots);
      setForm((current) => ({ ...current, subject: current.subject || subjectResponse.data.subjects[0]?._id || '' }));
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  useEffect(() => { load(); }, []);

  async function addSlot(event) {
    event.preventDefault();
    try {
      await api.post('/api/timetable', { ...form, weekday: Number(form.weekday) });
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function removeSlot(id) {
    try { await api.delete(`/api/timetable/${id}`); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  if (!slots && !error) return <LoadingState />;

  return <>
    <PageHeading eyebrow="MAKE SPACE FOR WHAT MATTERS" title="Weekly timetable" description="Add your recurring classes. A matching slot appears on your dashboard when it is time." />
    {error && <ErrorState message={error} onRetry={load} />}
    {subjects.length > 0 && <form className="timetable-form" onSubmit={addSlot}>
      <span className="timetable-form-title"><CalendarDays size={17} />Add a weekly class</span>
      <label className="field-label">Subject<select className="select-input" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>{subjects.map((subject) => <option value={subject._id} key={subject._id}>{subject.name}</option>)}</select></label>
      <label className="field-label">Day<select className="select-input" value={form.weekday} onChange={(event) => setForm({ ...form, weekday: event.target.value })}>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
      <label className="field-label">Starts<input className="text-input" type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required /></label>
      <label className="field-label">Ends<input className="text-input" type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required /></label>
      <button className="primary-button"><Plus size={15} />Add slot</button>
    </form>}
    {!subjects.length && <EmptyState title="Add a subject first." detail="Your timetable slots need to belong to one of your subjects." action={<Link className="secondary-button" to="/subjects">Go to subjects</Link>} />}
    <div className="week-board">
      {weekdays.slice(1).concat(weekdays[0]).map((day) => {
        const dayIndex = weekdays.indexOf(day);
        const daySlots = (slots || []).filter((slot) => slot.weekday === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
        return <section className="weekday-row" key={day}>
          <div className="weekday-heading"><span>{day.slice(0, 3).toUpperCase()}</span><small>{daySlots.length ? `${daySlots.length} ${daySlots.length === 1 ? 'class' : 'classes'}` : '—'}</small></div>
          <div className="weekday-slots">{daySlots.length ? daySlots.map((slot) => <div className="timetable-slot" key={slot._id} style={{ '--subject-color': slot.subject.color }}>
            <SubjectMark color={slot.subject.color} small />
            <strong>{slot.subject.name}</strong>
            <span className="slot-time">{slot.startTime}<i>—</i>{slot.endTime}</span>
            <button className="icon-action remove-action" onClick={() => removeSlot(slot._id)} aria-label={`Remove ${slot.subject.name} slot`}><Trash2 size={14} /></button>
          </div>) : <span className="weekday-empty">No classes scheduled</span>}</div>
        </section>;
      })}
    </div>
  </>;
}