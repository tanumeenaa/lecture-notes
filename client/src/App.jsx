import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then((page) => ({ default: page.Dashboard })));
const Subjects = lazy(() => import('./pages/Subjects.jsx').then((page) => ({ default: page.Subjects })));
const Timetable = lazy(() => import('./pages/Timetable.jsx').then((page) => ({ default: page.Timetable })));
const NotebookIndex = lazy(() => import('./pages/Notebook.jsx').then((page) => ({ default: page.NotebookIndex })));
const Notebook = lazy(() => import('./pages/Notebook.jsx').then((page) => ({ default: page.Notebook })));
const NewLecture = lazy(() => import('./pages/NewLecture.jsx').then((page) => ({ default: page.NewLecture })));
const Lecture = lazy(() => import('./pages/Lecture.jsx').then((page) => ({ default: page.Lecture })));
const Search = lazy(() => import('./pages/Search.jsx').then((page) => ({ default: page.Search })));

export default function App() {
  return <Suspense fallback={<div className="app-loading"><span className="loader" /></div>}><Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/signup" element={<AuthPage mode="signup" />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="notebook" element={<NotebookIndex />} />
        <Route path="notebook/:subjectId" element={<Notebook />} />
        <Route path="lectures/new" element={<NewLecture />} />
        <Route path="lectures/:lectureId" element={<Lecture />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></Suspense>;
}