import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, SubjectMark } from '../components/Ui.jsx';

const palette = ['#d7ee69', '#f08b72', '#72c9b7', '#a4a0ef', '#efc76e', '#6fa8df', '#e58db0', '#b4c88b'];

export function Subjects() {
  const [subjects, setSubjects] = useState(null);
  const [draft, setDraft] = useState({ name: '', color: palette[0] });
  const [editing, setEditing] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setSubjects((await api.get('/api/subjects')).data.subjects); setMessage(''); }
    catch (error) { setMessage(errorMessage(error)); }
  }

  useEffect(() => { load(); }, []);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/subjects', draft);
      setDraft({ name: '', color: palette[Math.floor(Math.random() * palette.length)] });
      await load();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }

  async function save(subject) {
    setBusy(true);
    try {
      await api.patch(`/api/subjects/${subject._id}`, { name: subject.name, color: subject.color });
      setEditing('');
      await load();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }

  async function remove(subject) {
    if (!window.confirm(`Delete ${subject.name} and all its lectures?`)) return;
    try { await api.delete(`/api/subjects/${subject._id}`); await load(); }
    catch (error) { setMessage(errorMessage(error)); }
  }

  if (!subjects && !message) return <LoadingState />;

  return <>
    <PageHeading eyebrow="BUILD YOUR COURSE MAP" title="Subjects" description="Each subject keeps its timetable, lecture history, and growing notes together." />
    {message && <ErrorState message={message} onRetry={load} />}
    <form className="subject-create" onSubmit={create}>
      <span className="create-index">01</span>
      <label className="subject-name-field"><span className="micro-label">NEW SUBJECT</span><input className="text-input" placeholder="e.g. Cognitive Psychology" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={80} required /></label>
      <label className="color-select"><span className="micro-label">COLOR</span><input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} aria-label="Subject color" /></label>
      <button className="primary-button" disabled={busy}><Plus size={16} />Add subject</button>
    </form>
    <div className="section-title listing-heading"><div><span className="micro-label">YOUR COURSE MAP</span><h2>{subjects?.length ?? 0} subjects</h2></div></div>
    {subjects?.length ? <div className="subject-list">
      {subjects.map((subject, index) => <div className="subject-row" key={subject._id}>
        <span className="subject-count">{String(index + 1).padStart(2, '0')}</span>
        {editing === subject._id ? <>
          <SubjectMark color={subject.color} />
          <input className="text-input edit-subject-input" autoFocus value={subject.name} onChange={(event) => setSubjects(subjects.map((item) => item._id === subject._id ? { ...item, name: event.target.value } : item))} />
          <input type="color" value={subject.color} onChange={(event) => setSubjects(subjects.map((item) => item._id === subject._id ? { ...item, color: event.target.value } : item))} aria-label="Subject color" />
          <button className="icon-action" onClick={() => save(subject)} disabled={busy} aria-label="Save subject"><Check size={17} /></button>
          <button className="icon-action" onClick={() => { setEditing(''); load(); }} aria-label="Cancel edit"><X size={17} /></button>
        </> : <>
          <SubjectMark color={subject.color} />
          <Link className="subject-name" to={`/notebook/${subject._id}`}>{subject.name}</Link>
          <span className="subject-row-hint">Open notebook <span>↗</span></span>
          <button className="icon-action" onClick={() => setEditing(subject._id)} aria-label={`Edit ${subject.name}`}><Pencil size={15} /></button>
          <button className="icon-action remove-action" onClick={() => remove(subject)} aria-label={`Delete ${subject.name}`}><Trash2 size={15} /></button>
        </>}
      </div>)}
    </div> : <EmptyState title="A good semester starts here." detail="Create a subject to give each class its own continuing notebook." />}
  </>;
}