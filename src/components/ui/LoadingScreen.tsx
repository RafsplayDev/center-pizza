import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ message = "Carregando...", fullScreen = false }: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] bg-[var(--cp-flour)]" 
    : "w-full py-20 bg-transparent";

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses} animate-fade-in`}>
      <div className="relative w-32 h-32 mb-2">
        <Image 
          src="/loading_panel_pro_50fps.gif" 
          alt="Carregando" 
          fill
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      {message && (
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--cp-ink-muted)] animate-pulse m-0">
          {message}
        </p>
      )}
    </div>
  );
}
