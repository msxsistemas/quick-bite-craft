export const HeroBanner: React.FC = () => {
  return (
    <div className="mx-4 md:mx-6 mt-4 max-w-7xl lg:mx-auto">
      <div className="bg-gradient-to-r from-primary to-[hsl(12,80%,55%)] rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground flex items-center gap-2">
          Peça seu delivery <span className="text-3xl">🍔</span>
        </h1>
        <p className="text-primary-foreground/90 mt-2 text-sm md:text-base">
          Monte seu pedido e receba em casa rapidinho!
        </p>
      </div>
    </div>
  );
};
