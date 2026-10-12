import { useNavigate } from 'react-router-dom';
import ThreeDButton from '../components/ThreeDButton';
import logo from '../assets/Logo.png';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-peach flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background blob */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FDBA74 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }}
      />

      <div className="max-w-md w-full text-center relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <img
            src={logo}
            alt="Hospitality Shift"
            className="w-32 h-32 mx-auto mb-6 rounded-2xl object-contain"
          />
          <h1 className="text-4xl font-bold text-navy mb-2">
            Hospitality <span className="text-primary">Shift</span>
          </h1>
          <p className="text-primary font-medium text-sm tracking-wide uppercase mb-4">
            Plan Your Shifts. Know Your Earnings.
          </p>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm mx-auto">
            Organise your weekly shifts and understand your expected working hours and earnings — all in one simple app.
          </p>
        </div>

        <ThreeDButton fullWidth onClick={() => navigate('/login')}>
          Get Started
        </ThreeDButton>

        <p className="mt-8 text-sm text-gray-400">
          Built for casual hospitality workers in Australia
        </p>
      </div>
    </div>
  );
}