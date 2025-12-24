const PlaceholderPage = ({ title }) => {
  return (
    <div className="p-6 bg-card rounded-card border border-border shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <h2 className="text-4xl font-bold text-primary opacity-50">🚧</h2>
      </div>
      <h1 className="text-2xl font-bold text-text-main mb-2">{title} Page</h1>
      <p className="text-text-sub max-w-md">
        This module is currently under development. <br />
        You can replace this with your actual <code>{title}.jsx</code> component
        later.
      </p>
    </div>
  );
};

export default PlaceholderPage;
