import { useEffect, useRef, useState } from 'react';
import { AudioLines, ImagePlus, Mic, Plus, Trash2, Upload, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, SubjectMark } from '../components/Ui.jsx';

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function PhotoPreview({ file }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img src={source} alt="Selected board preview" />;
}

export function NewLecture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(null);
  const [continuity, setContinuity] = useState(null);
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') || '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDate());
  const [audioFiles, setAudioFiles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [offsets, setOffsets] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    api.get('/api/subjects').then(({ data }) => {
      setSubjects(data.subjects);
      if (!subjectId && data.subjects[0]) setSubjectId(data.subjects[0]._id);
    }).catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    api.get(`/api/subjects/${subjectId}/continuity`).then(({ data }) => setContinuity(data.lastTimeCovered)).catch(() => setContinuity(null));
  }, [subjectId]);

  useEffect(() => {
    if (!recording) return undefined;
    const interval = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [recording]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function addPhotos(files) {
    const selected = Array.from(files || []);
    setPhotos((current) => [...current, ...selected]);
    setOffsets((current) => [...current, ...selected.map(() => '0')]);
  }

  function removeAudio(index) {
    setAudioFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function removePhoto(index) {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setOffsets((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function startRecording() {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Live recording is not supported in this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const extension = type.includes('mp4') ? 'm4a' : 'webm';
        const recordingFile = new File([new Blob(chunks, { type })], `lecture-recording.${extension}`, { type });
        setAudioFiles((current) => [...current, recordingFile]);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start(500);
      setRecordingSeconds(0);
      setRecording(true);
    } catch (recordError) {
      setError(recordError.message || 'Microphone access was not available.');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData();
    form.append('subject', subjectId);
    form.append('title', title);
    form.append('date', date);
    audioFiles.forEach((file) => form.append('audio', file, file.name));
    photos.forEach((file) => form.append('photos', file, file.name));
    form.append('photoOffsets', JSON.stringify(offsets.map(Number)));
    try {
      const { data } = await api.post('/api/lectures', form);
      navigate(`/lectures/${data.lecture._id}`, { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (!subjects && !error) return <LoadingState />;
  if (subjects && subjects.length === 0) return <EmptyState title="Add a subject before starting a lecture." detail="Every recording and set of notes belongs to one of your subjects." action={<Link className="primary-button" to="/subjects">Create a subject</Link>} />;
  const selectedSubject = subjects?.find((subject) => subject._id === subjectId);
  const clock = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

  return <>
    <PageHeading eyebrow="CAPTURE A CLASS" title="New lecture" description="Add a recording, board photos, or both. They will become one set of notes." />
    {error && <ErrorState message={error} />}
    {continuity && <section className="continuity-banner new-lecture-continuity"><span className="micro-label">LAST TIME WE COVERED</span><strong>{continuity.title}</strong><p>{continuity.summary}</p></section>}
    <form className="lecture-form" onSubmit={submit}>
      <div className="lecture-metadata">
        <label className="field-label">Subject<select className="select-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>{subjects?.map((subject) => <option value={subject._id} key={subject._id}>{subject.name}</option>)}</select></label>
        <label className="field-label">Lecture title<input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="e.g. Memory and attention" required /></label>
        <label className="field-label">Date<input className="text-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      </div>
      <section className="capture-section">
        <div className="capture-heading"><div><span className="micro-label">01 / AUDIO</span><h2>What was said</h2></div><AudioLines size={19} /></div>
        <div className="record-strip">
          <div className={`record-indicator ${recording ? 'live' : ''}`} />
          <div className="record-copy"><strong>{recording ? 'Recording in progress' : 'Record this lecture live'}</strong><span>{recording ? `Keep this tab open · ${clock}` : 'Use your microphone, or attach an audio file below.'}</span></div>
          {recording ? <button className="danger-button" type="button" onClick={stopRecording}><span className="record-stop" />Stop recording</button> : <button className="secondary-button" type="button" onClick={startRecording}><Mic size={15} />Start recording</button>}
        </div>
        <label className="file-drop audio-drop"><input type="file" accept="audio/*" multiple onChange={(event) => setAudioFiles((current) => [...current, ...Array.from(event.target.files || [])])} /><span className="drop-icon"><Upload size={18} /></span><span><strong>Choose audio files</strong><small>MP3, WAV, M4A, WebM, OGG · up to 200 MB each</small></span><Plus size={17} /></label>
        {audioFiles.length > 0 && <div className="selected-file-list">{audioFiles.map((file, index) => <div className="selected-file" key={`${file.name}-${index}`}><AudioLines size={15} /><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small><button type="button" className="icon-action" onClick={() => removeAudio(index)} aria-label={`Remove ${file.name}`}><X size={15} /></button></div>)}</div>}
      </section>
      <section className="capture-section">
        <div className="capture-heading"><div><span className="micro-label">02 / BOARD</span><h2>What was written</h2></div><ImagePlus size={19} /></div>
        <label className="file-drop photo-drop"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addPhotos(event.target.files)} /><span className="drop-icon"><ImagePlus size={18} /></span><span><strong>Choose board photos</strong><small>JPEG, PNG, WebP · up to 8 photos, 200 MB each</small></span><Plus size={17} /></label>
        {photos.length > 0 && <div className="photo-offset-list">{photos.map((photo, index) => <div className="photo-offset-row" key={`${photo.name}-${index}`}>
          <PhotoPreview file={photo} />
          <div className="photo-file-name"><strong>{photo.name}</strong><small>{(photo.size / 1024 / 1024).toFixed(1)} MB</small></div>
          <label className="offset-field">Minute offset<input className="text-input" type="number" min="0" max="1440" step="1" value={offsets[index]} onChange={(event) => setOffsets(offsets.map((offset, itemIndex) => itemIndex === index ? event.target.value : offset))} /></label>
          <button type="button" className="icon-action remove-action" onClick={() => removePhoto(index)} aria-label={`Remove ${photo.name}`}><Trash2 size={15} /></button>
        </div>)}</div>}
      </section>
      <div className="upload-footer"><span><SubjectMark color={selectedSubject?.color} small />{selectedSubject?.name} notebook</span><button className="primary-button" disabled={busy || recording || (!audioFiles.length && !photos.length)}><Upload size={16} />{busy ? 'Uploading…' : 'Upload & make notes'}</button></div>
    </form>
  </>;
}