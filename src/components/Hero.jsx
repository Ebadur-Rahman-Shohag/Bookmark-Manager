import { BookmarkIcon } from './icons.jsx';

const Hero = () => (
  <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-glow" aria-hidden="true"></div>
    <div className="hero-glow hero-glow-2" aria-hidden="true"></div>
    <div className="container">
      <div className="hero-content">
        <div className="hero-badge">
          <BookmarkIcon size={14} />
          Bookmark Manager
        </div>
        <h1 id="hero-heading" className="hero-title">
          Organize your
          <br />
          <span className="hero-title-accent">digital world</span>
        </h1>
        <p className="hero-subtitle">Save, search, and manage all your important links in one beautiful place.</p>
      </div>
    </div>
  </section>
);

export default Hero;
