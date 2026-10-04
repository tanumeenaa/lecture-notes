import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Hash } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusLabel, SubjectMark } from '../components/Ui.jsx';

export function NotebookIndex() {
  const [subjects, setSubjects] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/api/subjects').then(({ data }) => setSubjects(data.subjects)).catch((requestError) => setError(errorMessage(requestError)));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!subjects) return <LoadingState />;
  return <>
    <PageHeading eyebrow="A CONTINUING RECORD" title="Your notebooks" description="Each subject carries its ideas forward from one lecture to the next." />
    {subjects.length ? <div className="notebook-index-list">{subjects.map((subject) => <Link key={subject._id} to={`/notebook/${subject._id}`} className="notebook-index-row">
      <SubjectMark color={subject.color} />
      <div><span className="micro-label">SUBJECT NOTEBOOK</span><strong>{subject.name}</strong></div>
      <BookOpen size={18} /><ArrowRight size={17} />
    </Link>)}</div> : <EmptyState title="Your notebooks begin with a subject." detail="Create your first subject and keep every class in context." action={<Link className="primary-button" to="/subjects">Add a subject</Link>} />}
  </>;
}

export function Notebook() {
  const { subjectId } = useParams();
  const [notebook, setNotebook] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get(`/api/subjects/${subjectId}/notebook`).then(({ data }) => setNotebook(data)).catch((requestError) => setError(errorMessage(requestError)));
  }, [subjectId]);
  if (error) return <ErrorState message={error} />;
  if (!notebook) return <LoadingState />;
  return <>
    <PageHeading eyebrow="SUBJECT NOTEBOOK" title={notebook.subject.name} description={`${notebook.lectures.length} lectures · ideas gathered over time`} action={<Link className="primary-button" to={`/lectures/new?subject=${subjectId}`}><BookOpen size={15} />Add lecture</Link>} />
    {notebook.lastTimeCovered && <section className="continuity-banner"><span className="micro-label">LAST TIME WE COVERED</span><strong>{notebook.lastTimeCovered.title}</strong><p>{notebook.lastTimeCovered.summary}</p></section>}
    <div className="notebook-columns">
      <section className="notebook-lectures">
        <div className="section-title"><div><span className="micro-label">THE NOTEBOOK</span><h2>Lecture history</h2></div></div>
        {notebook.lectures.length ? notebook.lectures.map((lecture) => <Link className="notebook-lecture" key={lecture._id} to={`/lectures/${lecture._id}`}>
          <span className="timeline-point" />
          <div><span className="micro-label">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(lecture.date))}</span><strong>{lecture.title}</strong><p>{lecture.notes?.replace(/^#{1,6}\s+/gm, '').slice(0, 145) || 'Notes will appear here when processing is complete.'}</p></div>
          <StatusLabel status={lecture.status} /><ArrowRight size={15} />
        </Link>) : <EmptyState title="No lectures in this notebook." detail="Add a recording or board photo to start collecting class notes." action={<Link className="primary-button" to={`/lectures/new?subject=${subjectId}`}>Add a lecture</Link>} />}
      </section>
      <aside className="topic-index">
        <div className="section-title"><div><span className="micro-label">ACROSS LECTURES</span><h2><Hash size={16} />Topic index</h2></div></div>
        {notebook.topics.length ? notebook.topics.map((topic) => <div className="topic-row" key={topic.name}><strong>{topic.name}</strong><span>{topic.lectures.length}×</span></div>) : <p className="topic-empty">Headings from completed notes will collect here.</p>}
      </aside>
    </div>
  </>;
}