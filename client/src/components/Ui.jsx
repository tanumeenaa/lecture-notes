import { AlertCircle, ArrowUpRight, BookOpen, LoaderCircle } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading-row">
    <div className="page-heading">
      {eyebrow && <span className="eyebrow"><i />{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {action && <div className="heading-action">{action}</div>}
  </div>;
}

export function LoadingState({ label = 'Loading your study space' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="error-state"><AlertCircle size={18} /><span>{message}</span>{onRetry && <button className="text-action" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon"><BookOpen size={21} /></span><h3>{title}</h3><p>{detail}</p>{action && <div>{action}</div>}</div>;
}

export function SubjectMark({ color, small = false }) {
  return <span className={`subject-mark ${small ? 'small' : ''}`} style={{ '--subject-color': color || '#d7ee69' }} />;
}

export function TextLink({ to, children }) {
  return <a className="text-link" href={to}>{children}<ArrowUpRight size={14} /></a>;
}

export function StatusLabel({ status }) {
  const labels = { uploaded: 'Queued', transcribing: 'Transcribing', reading_board: 'Reading board', writing_notes: 'Writing notes', done: 'Ready', failed: 'Needs attention' };
  return <span className={`status-label ${status || 'uploaded'}`}><i />{labels[status] || status}</span>;
}