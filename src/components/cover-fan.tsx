import coaCover from "@/assets/coa-issue-1-cover.png";
import baVariant from "@/assets/ba-issue-1-variant.png";

const baCoverM = "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png";

export function CoverFan() {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[560px]">
      {/* back-left */}
      <Cover src={baCoverM} alt="Battlefield Atlantis variant cover" className="left-[6%] top-[8%] w-[44%] -rotate-[10deg] hover:-rotate-[8deg]" z={10} />
      {/* back-right */}
      <Cover src={baVariant} alt="Battlefield Atlantis Issue 1" className="right-[2%] top-0 w-[46%] rotate-[8deg] hover:rotate-[6deg]" z={20} />
      {/* front-center */}
      <Cover src={coaCover} alt="Children of Aquarius Issue 1" className="left-[26%] top-[22%] w-[52%] rotate-[2deg] hover:rotate-0" z={30} />
    </div>
  );
}

function Cover({ src, alt, className, z }: { src: string; alt: string; className: string; z: number }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-xl transition-transform duration-500 ease-out ${className}`}
      style={{
        zIndex: z,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,255,0.18), 0 0 40px rgba(160,64,255,0.18)",
      }}
    >
      <img src={src} alt={alt} className="block h-full w-full object-cover" loading="eager" />
    </div>
  );
}
