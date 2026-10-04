import { useState } from 'react';
import { ArrowRight, Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusLabel, SubjectMark } from '../components/Ui.jsx';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError('Enter at least two characters to search.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.get('/api/subjects/search', { params: { q: query.trim() } });
      setResults(data.results);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeading eyebrow="FIND A THREAD" title="Search your notes" description="Look across lecture titles, generated notes, and timestamped transcripts." />
    <form className="search-form" onSubmit={submit}>
      <SearchIcon size={18} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a concept, formula, or phrase…" aria-label="Search all notes and transcripts" />
      <button className="primary-button" disabled={busy}>{busy ? 'Searching…' : 'Search'}<ArrowRight size={15} /></button>
    </form>
    {error && <ErrorState message={error} />}
    {busy && <LoadingState label="Searching your notebooks" />}
    {!busy && results && <>
      <div className="search-result-summary"><span className="micro-label">SEARCH RESULTS</span><strong>{results.length} {results.length === 1 ? 'lecture' : 'lectures'}</strong></div>
      {results.length ? <div className="search-results">{results.map((lecture) => {
        const transcript = lecture.transcript.map((segment) => segment.text).join(' ');
        const excerpt = lecture.notes || transcript;
        return <Link className="search-result" to={`/lectures/${lecture._id}`} key={lecture._id}>
          <SubjectMark color={lecture.subject?.color} small />
          <div className="search-result-main"><span className="micro-label">{lecture.subject?.name || 'Subject'} · {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(lecture.date))}</span><strong>{lecture.title}</strong><p>{excerpt.slice(0, 250) || 'No text has been generated yet.'}</p></div>
          <StatusLabel status={lecture.status} /><ArrowRight size={15} />
        </Link>;
      })}</div> : <EmptyState title="Nothing matched this search." detail="Try a shorter phrase or a different term from your notes." />}
    </>}
  </>;
}