import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Download, FileAudio2, Image, LoaderCircle, Pencil, RotateCcw, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { ErrorState, LoadingState, PageHeading, StatusLabel } from '../components/Ui.jsx';

const processingSteps = [
  ['transcribing', 'Listening for words'],
  ['reading_board', 'Reading the board'],
  ['writing_notes', 'Putting notes together'],
  ['done', 'Ready to review']
];

function timestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function Lecture() {
  const { lectureId } = useParams();
  const [lecture, setLecture] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('notes');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState({});
  const [exporting, setExporting] = useState('');

  async function load() {
    try {
      const { data } = await api.get(`/api/lectures/${lectureId}`);
      setLecture(data.lecture);
      setDraft(data.lecture.notes || '');
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  useEffect(() => { load(); }, [lectureId]);

  useEffect(() => {
    if (!lecture || ['done', 'failed'].includes(lecture.status)) return undefined;
    const interval = window.setInterval(async () => {
      try {
        const { data } = await api.get(`/api/lectures/${lectureId}/status`);
        setLecture((current) => current ? { ...current, ...data } : current);
        if (data.status === 'done' || data.status === 'failed') await load();
      } catch (requestError) { setError(errorMessage(requestError)); }
    }, 2200);
    return () => window.clearInterval(interval);
  }, [lectureId, lecture?.status]);

  useEffect(() => {
    if (!lecture) return undefined;
    let active = true;
    let objectUrls = [];
    const allFiles = [...lecture.audioFiles, ...lecture.photos];
    Promise.all(allFiles.map(async (file) => {
      try {
        const { data } = await api.get(`/api/lectures/${lecture._id}/media/${file._id}`, { responseType: 'blob' });
        return [file._id, URL.createObjectURL(data)];
      } catch { return [file._id, '']; }
    })).then((entries) => {
      if (active) {
        objectUrls = entries.map(([, url]) => url).filter(Boolean);
        setMedia(Object.fromEntries(entries.filter(([, url]) => url)));
      }
      else entries.forEach(([, url]) => url && URL.revokeObjectURL(url));
    });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [lecture?._id, lecture?.audioFiles, lecture?.photos]);

  const statusIndex = useMemo(() => processingSteps.findIndex(([status]) => status === lecture?.status), [lecture?.status]);

  async function saveNotes() {
    setSaving(true);
    try {
      const { data } = await api.patch(`/api/lectures/${lectureId}/notes`, { notes: draft });
      setLecture((current) => ({ ...current, notes: data.lecture.notes }));
      setEditing(false);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function retry() {
    try {
      const { data } = await api.post(`/api/lectures/${lectureId}/retry`);
      setLecture(data.lecture);
      setError('');
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function download(format) {
    setExporting(format);
    try {
      const { data } = await api.get(`/api/lectures/${lectureId}/export?format=${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${lecture.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-notes.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setExporting(''); }
  }

  if (error && !lecture) return <ErrorState message={error} onRetry={load} />;
  if (!lecture) return <LoadingState />;
  const date = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(lecture.date));

  return <>
    <Link className="back-link" to={`/notebook/${lecture.subject._id}`}><ArrowLeft size={14} />{lecture.subject.name} notebook</Link>
    <PageHeading eyebrow={date.toUpperCase()} title={lecture.title} description={`${lecture.subject.name} · ${lecture.audioFiles.length} audio files · ${lecture.photos.length} board photos`} action={<StatusLabel status={lecture.status} />} />
    {error && <ErrorState message={error} />}
    {!['done', 'failed'].includes(lecture.status) && <section className="processing-panel">
      <div className="processing-head"><LoaderCircle className="spin" size={18} /><div><strong>Building your lecture notes</strong><span>This page updates as each stage finishes.</span></div></div>
      <div className="processing-steps">{processingSteps.map(([status, label], index) => <div key={status} className={`processing-step ${lecture.status === status ? 'current' : index < statusIndex ? 'complete' : ''}`}><span>{index < statusIndex ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span>{label}</div>)}</div>
    </section>}
    {lecture.status === 'failed' && <section className="failed-panel"><div><strong>Processing paused</strong><p>{lecture.error || 'This lecture could not be processed.'}</p></div><button className="secondary-button" onClick={retry}><RotateCcw size={15} />Try again</button></section>}
    {lecture.status === 'done' && <div className="lecture-toolbar">
      <div className="lecture-tabs" role="tablist">{[['notes', 'Notes'], ['transcript', `Transcript · ${lecture.transcript.length}`], ['board', 'Board text'], ['photos', `Photos · ${lecture.photos.length}`]].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'selected' : ''} onClick={() => setTab(value)}>{label}</button>)}</div>
      <div className="export-actions"><button className="quiet-button" onClick={() => download('md')} disabled={!!exporting}><Download size={14} />{exporting === 'md' ? '…' : 'Markdown'}</button><button className="quiet-button" onClick={() => download('pdf')} disabled={!!exporting}><Download size={14} />{exporting === 'pdf' ? '…' : 'PDF'}</button></div>
    </div>}
    {lecture.status === 'done' && tab === 'notes' && <section className="notes-viewer">
      <div className="notes-toolbar"><span className="micro-label">GENERATED FROM YOUR MATERIAL</span>{editing ? <div><button className="quiet-button" onClick={() => { setEditing(false); setDraft(lecture.notes); }}><X size={14} />Cancel</button><button className="primary-button" onClick={saveNotes} disabled={saving}><Save size={14} />{saving ? 'Saving…' : 'Save notes'}</button></div> : <button className="quiet-button" onClick={() => setEditing(true)}><Pencil size={14} />Edit notes</button>}</div>
      {editing ? <textarea className="notes-editor" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={100000} aria-label="Edit lecture notes in Markdown" /> : <article className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.notes || 'No notes were generated.'}</ReactMarkdown></article>}
    </section>}
    {lecture.status === 'done' && tab === 'transcript' && <section className="raw-panel">
      {lecture.transcript.length ? lecture.transcript.map((segment, index) => <div className="transcript-line" key={`${segment.startSeconds}-${index}`}><time>{timestamp(segment.startSeconds)}</time><p>{segment.text}</p></div>) : <p className="raw-empty">No audio transcript was supplied for this lecture.</p>}
    </section>}
    {lecture.status === 'done' && tab === 'board' && <section className="raw-panel"><pre className="board-text">{lecture.boardText || 'No board text was supplied for this lecture.'}</pre></section>}
    {lecture.status === 'done' && tab === 'photos' && <section className="lecture-media-grid">
      {lecture.photos.length ? lecture.photos.map((photo) => <figure className="original-photo" key={photo._id}>{media[photo._id] ? <img src={media[photo._id]} alt={`Board photo from ${photo.name}`} /> : <div className="media-placeholder"><Image size={20} /></div>}<figcaption><span>{photo.name}</span><small>+{photo.offsetMinutes} min</small></figcaption></figure>) : <div className="raw-panel raw-empty">No board photos were supplied.</div>}
      {lecture.audioFiles.map((audio) => media[audio._id] && <div className="audio-preview" key={audio._id}><FileAudio2 size={17} /><div><span>{audio.name}</span><audio controls src={media[audio._id]} /></div></div>)}
    </section>}
  </>;
}