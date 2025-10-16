export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tighter">
              10x Series Matcher
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground font-light tracking-tight max-w-2xl mx-auto">
              Everything set up for you. Modern, minimal, and ready to scale.
            </p>

            {/* Decorative line */}
            <div className="mt-12 flex justify-center">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
