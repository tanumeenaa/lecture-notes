import { useEffect, useState } from 'react';
import { ArrowRight, AudioLines, BookOpen, CalendarClock, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { ErrorState, LoadingState, PageHeading, StatusLabel, SubjectMark } from '../components/Ui.jsx';

const dateLabel = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [{ data: subjectsData }, { data: currentData }] = await Promise.all([api.get('/api/subjects'), api.get('/api/timetable/current')]);
      const notebooks = await Promise.all(subjectsData.subjects.map(async (subject) => {
        const response = await api.get(`/api/subjects/${subject._id}/notebook`);
        return response.data;
      }));
      const recent = notebooks.flatMap((notebook) => notebook.lectures.map((lecture) => ({ ...lecture, subject: notebook.subject })))
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
      setData({ subjects: subjectsData.subjects, current: currentData.slot, recent, lecturesCount: notebooks.reduce((sum, item) => sum + item.lectures.length, 0) });
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => { load(); }, []);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState />;

  return <>
    <PageHeading eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()} title="Your study, in good order." description="A clear view of what you are learning and what is coming next." action={<Link className="primary-button" to={data.subjects.length ? `/lectures/new?subject=${data.subjects[0]._id}` : '/subjects'}><Plus size={16} />New lecture</Link>} />
    <section className={`current-banner ${data.current ? 'in-session' : ''}`}>
      <div className="banner-icon"><CalendarClock size={20} /></div>
      <div className="banner-copy">
        <span className="micro-label">{data.current ? 'HAPPENING RIGHT NOW' : 'YOUR TIMETABLE'}</span>
        <strong>{data.current ? data.current.subject.name : 'No class in this time slot'}</strong>
        <span>{data.current ? `${data.current.startTime} — ${data.current.endTime} · capture this lecture while it is fresh` : 'Add your weekly classes to get a timely nudge.'}</span>
      </div>
      {data.current && <Link className="banner-action" to={`/lectures/new?subject=${data.current.subject._id}`}>Start notes <ArrowRight size={16} /></Link>}
      {!data.current && <Link className="banner-action" to="/timetable">Edit timetable <ArrowRight size={16} /></Link>}
    </section>
    <div className="overview-stats">
      <div className="stat-item"><span className="stat-icon lime"><BookOpen size={17} /></span><div><strong>{data.subjects.length}</strong><span>Subjects</span></div></div>
      <div className="stat-item"><span className="stat-icon coral"><AudioLines size={17} /></span><div><strong>{data.lecturesCount}</strong><span>Lectures saved</span></div></div>
      <div className="stat-item"><span className="stat-icon blue"><FileText size={17} /></span><div><strong>{data.recent.filter((lecture) => lecture.status === 'done').length}</strong><span>Notes ready</span></div></div>
    </div>
    <div className="dashboard-grid">
      <section className="content-section">
        <div className="section-title"><div><span className="micro-label">YOUR COURSEWORK</span><h2>Recent lectures</h2></div><Link to="/notebook" className="subtle-link">All notebooks <ArrowRight size={14} /></Link></div>
        {data.recent.length ? <div className="lecture-list">
          {data.recent.map((lecture) => <Link className="lecture-row" to={`/lectures/${lecture._id}`} key={lecture._id}>
            <SubjectMark color={lecture.subject.color} small />
            <div className="lecture-row-main"><strong>{lecture.title}</strong><span>{lecture.subject.name} <i>·</i> {dateLabel(lecture.date)}</span></div>
            <StatusLabel status={lecture.status} /><ArrowRight className="row-arrow" size={15} />
          </Link>)}
        </div> : <div className="compact-empty"><span>Your first lecture will appear here.</span><Link to={data.subjects.length ? `/lectures/new?subject=${data.subjects[0]._id}` : '/subjects'}>Get started <ArrowRight size={13} /></Link></div>}
      </section>
      <section className="content-section subject-overview">
        <div className="section-title"><div><span className="micro-label">THE BIG PICTURE</span><h2>Your subjects</h2></div><Link to="/subjects" className="icon-action" aria-label="Manage subjects"><ArrowRight size={17} /></Link></div>
        {data.subjects.length ? data.subjects.slice(0, 5).map((subject) => <Link to={`/notebook/${subject._id}`} className="subject-summary" key={subject._id}><SubjectMark color={subject.color} /><span>{subject.name}</span><ArrowRight size={14} /></Link>) : <div className="compact-empty"><span>No subjects yet.</span><Link to="/subjects">Add a subject <ArrowRight size={13} /></Link></div>}
      </section>
    </div>
  </>;
}