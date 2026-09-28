export function Logo() {
  return (
    <div className="logo-container">
      <div className="logo-img-wrapper">
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt="KVS Logo"
        />
      </div>
      <div className="logo-text-wrapper">
        <span className="logo-title">KVS</span>
        <span className="logo-subtitle">Kerubi Vulnerability Scanner</span>
      </div>
    </div>
  );
}
