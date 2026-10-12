import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { supabase } from '../lib/supabase';

export default function Header() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <img src={logo} alt="Hospitality Shift" className="h-10 w-10 rounded-lg object-contain" />
          <div>
            <h1 className="text-lg font-bold text-navy leading-tight">
              Hospitality <span className="text-primary">Shift</span>
            </h1>
            <p className="text-xs text-gray-400 leading-tight hidden sm:block">
              Plan Your Shifts. Know Your Earnings.
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/add-shift"
            className="text-sm text-gray-500 hover:text-primary transition-colors no-underline"
          >
            Add Shift
          </Link>
          <Link
            to="/weekly-shifts"
            className="text-sm text-gray-500 hover:text-primary transition-colors no-underline"
          >
            My Shifts
          </Link>
          <Link
            to="/calendar"
            className="text-sm text-gray-500 hover:text-primary transition-colors no-underline"
          >
            Calendar
          </Link>
          <Link
            to="/weekly-summary"
            className="text-sm text-gray-500 hover:text-primary transition-colors no-underline"
          >
            Summary
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </nav>
      </div>
    </header>
  );
}