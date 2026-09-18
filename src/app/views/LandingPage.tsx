import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp2 {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp3 {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-bg   { animation: fadeIn  1.2s ease forwards; }
        .anim-tag  { animation: slideUp  0.7s ease 0.3s both; }
        .anim-h1   { animation: slideUp  0.7s ease 0.55s both; }
        .anim-desc { animation: slideUp2 0.7s ease 0.75s both; }
        .anim-btn  { animation: slideUp3 0.7s ease 0.95s both; }
      `}</style>

      <div
        className="anim-bg relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* colour overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-700/50 via-blue-600/40 to-sky-500/30" />

        {/* glowing blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-400 opacity-30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-400 opacity-30 rounded-full blur-3xl pointer-events-none" />

        {/* content */}
        <div className="relative z-10 max-w-2xl w-full text-center text-white px-4">
          <span className="anim-tag inline-block text-sm font-semibold tracking-widest uppercase bg-white/10 border border-white/20 rounded-full px-4 py-1 mb-6 backdrop-blur-sm">
            Fast · Reliable · Smart
          </span>

          <h1 className="anim-h1 text-6xl sm:text-7xl font-extrabold mb-5 leading-tight drop-shadow-xl">
            Delivery
            <span className="bg-gradient-to-r from-pink-400 to-yellow-300 bg-clip-text text-transparent">
              Hub
            </span>
          </h1>

          <p className="anim-desc text-lg sm:text-xl text-white/80 mb-10 leading-relaxed">
            One platform connecting&nbsp;
            <span className="text-pink-300 font-semibold">customers</span>,&nbsp;
            <span className="text-yellow-300 font-semibold">sellers</span>, and&nbsp;
            <span className="text-cyan-300 font-semibold">delivery drivers</span>.
            Shop, sell, and ship — all in one place.
          </p>

          <div className="anim-btn flex justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="px-10 py-6 text-lg font-bold rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white border-0 shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
