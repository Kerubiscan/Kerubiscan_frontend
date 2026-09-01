export function Logo() {
  return (
    <div className="logo-container">
      <div className="logo-img-wrapper">
        <img 
          src={`${import.meta.env.BASE_URL}logo.svg`} 
          alt="Kerubiscan Logo" 
        />
      </div>
      <div className="logo-text-wrapper">
        <span className="logo-title">KERUBISCAN</span>
        <span className="logo-subtitle">Vulnerability Scanner</span>
      </div>
    </div>
  );
}
