export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-indigo-500/20">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"
          style={{
            width: '60%',
            animation: 'loading-bar 1.2s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes loading-bar {
          0%   { width: 0%;   margin-left: 0% }
          50%  { width: 70%;  margin-left: 15% }
          100% { width: 0%;   margin-left: 100% }
        }
      `}</style>
    </div>
  )
}
