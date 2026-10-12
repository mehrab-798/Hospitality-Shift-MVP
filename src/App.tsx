import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import type { Shift, ShiftFormData, TaxSettings } from './types';
import { emptyShiftForm, defaultTaxSettings } from './types';
import { getWeekStart } from './utils/week';
import { supabase } from './lib/supabase';
import * as api from './lib/api';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddShiftPage from './pages/AddShiftPage';
import WeeklyShiftsPage from './pages/WeeklyShiftsPage';
import WeeklySummaryPage from './pages/WeeklySummaryPage';
import ConfirmationPage from './pages/ConfirmationPage';
import CalendarPage from './pages/CalendarPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [, setHasLoaded] = useState(false);
  const [shiftForm, setShiftForm] = useState<ShiftFormData>(emptyShiftForm);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(() => {
    const saved = localStorage.getItem('hospitality-shift-tax-settings');
    return saved ? JSON.parse(saved) : defaultTaxSettings;
  });
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart(new Date()));

  const token = session?.access_token ?? null;

  const loadShifts = useCallback(async (t: string) => {
    try {
      const data = await api.fetchShifts(t);
      setShifts(data);
    } catch {
      // silently fail; user can retry
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadShifts(data.session.access_token);
      else setHasLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadShifts(newSession.access_token);
      else { setShifts([]); setHasLoaded(true); }
    });
    return () => subscription.unsubscribe();
  }, [loadShifts]);

  function handleTaxSettingsChange(settings: TaxSettings) {
    setTaxSettings(settings);
    localStorage.setItem('hospitality-shift-tax-settings', JSON.stringify(settings));
  }

  async function handleAddShift(form: ShiftFormData) {
    if (!token) return;
    try {
      const created = await api.createShift(token, form);
      setShifts((prev) => [created, ...prev]);
      setShiftForm(emptyShiftForm);
    } catch { /* handled in UI */ }
  }

  async function handleDeleteShift(id: string) {
    if (!token) return;
    try {
      await api.deleteShift(token, id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch { /* handled in UI */ }
  }

  async function handleUpdateShift(id: string, form: ShiftFormData) {
    if (!token) return;
    try {
      const updated = await api.updateShift(token, id, form);
      setShifts((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch { /* handled in UI */ }
  }

  async function handleClearShifts() {
    if (!token) return;
    const confirmed = window.confirm('Are you sure you want to delete ALL shifts? This cannot be undone.');
    if (!confirmed) return;
    try {
      await Promise.all(shifts.map((s) => api.deleteShift(token, s.id)));
      setShifts([]);
      setShiftForm(emptyShiftForm);
    } catch { /* handled in UI */ }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage onLogin={() => { }} />} />
        <Route path="/register" element={<RegisterPage onRegister={() => { }} />} />
        <Route
          path="/add-shift"
          element={
            <AddShiftPage
              shiftForm={shiftForm}
              onFormChange={setShiftForm}
              onAddShift={handleAddShift}
            />
          }
        />
        <Route
          path="/weekly-shifts"
          element={
            <WeeklyShiftsPage
              shifts={shifts}
              onDeleteShift={handleDeleteShift}
              onUpdateShift={handleUpdateShift}
            />
          }
        />
        <Route
          path="/weekly-summary"
          element={<WeeklySummaryPage shifts={shifts} taxSettings={taxSettings} onTaxSettingsChange={handleTaxSettingsChange} selectedWeekStart={selectedWeekStart} onWeekChange={setSelectedWeekStart} />}
        />
        <Route
          path="/confirmation"
          element={
            <ConfirmationPage
              shifts={shifts}
              onClearShifts={handleClearShifts}
              selectedWeekStart={selectedWeekStart}
              taxSettings={taxSettings}
            />
          }
        />
        <Route
          path="/calendar"
          element={<CalendarPage shifts={shifts} onUpdateShift={handleUpdateShift} onDeleteShift={handleDeleteShift} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
