import React, { useState } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import PipelineApp from "../PipelineApp";
import { UserNav } from "../components/UserNav";
import { useAuth } from "../contexts/AuthContext";
=======
import PipelineApp from "../PipelineApp";
>>>>>>> ba5ce59 (Homepage redesign, contact section, animations, logo resize)
import "./home.css";
import logo from "../assets/logo.png";

const Home: React.FC = () => {
  const [showPipeline, setShowPipeline] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

<<<<<<< HEAD
  const handleTryTool = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login");
    } else {
      // Show pipeline if authenticated
      setShowPipeline(true);
    }
  };

  // If user clicks "Try the Tool" and is authenticated, show the pipeline frontend
  if (showPipeline && isAuthenticated) {
    return <PipelineApp />;
=======
  /* PIPELINE VIEW */
  if (showPipeline) {
    return (
      <div>
        <button className="back-button" onClick={() => setShowPipeline(false)}>
          ← Back
        </button>
        <PipelineApp />
      </div>
    );
>>>>>>> ba5ce59 (Homepage redesign, contact section, animations, logo resize)
  }

  return (
    <>
<<<<<<< HEAD
      {isAuthenticated && <UserNav />}
      <nav>
        <div className="logo-placeholder">Logo Here</div>
=======
      <nav className="navbar">
        <div className="logo-container">
          <img src={logo} className="logo" alt="Biocanvas Logo" />
          <span className="brand-name">Biocanvas</span>
        </div>

>>>>>>> ba5ce59 (Homepage redesign, contact section, animations, logo resize)
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#contact">Contact</a>
        </div>
<<<<<<< HEAD
        {!isAuthenticated && !isLoading && (
          <div className="auth-buttons">
            <button onClick={() => navigate("/login")}>Log In</button>
            <button onClick={() => navigate("/login")}>Sign Up</button>
          </div>
        )}
=======

        <div className="auth-buttons">
          <button className="secondary-btn">Sign Up</button>
          <button className="primary-btn">Log In</button>
        </div>
>>>>>>> ba5ce59 (Homepage redesign, contact section, animations, logo resize)
      </nav>

      <div className="homepage" id="home">

        {/* HERO */}
        <section className="hero">
          <h1>
            Precision Quality Control <br />
            for Genetic Sequences
          </h1>
          <p>
            Automating error detection and improving sequence accuracy
            before downstream analysis — faster, smarter, reliable.
          </p>

          <button
            className="cta-button"
            onClick={handleTryTool}
            style={{ cursor: "pointer" }}
          >
            {isLoading ? "Loading..." : isAuthenticated ? "🚀 Try the Tool" : "🔐 Get Started"}
          </button>
<<<<<<< HEAD
          {isAuthenticated && (
            <p style={{ marginTop: "20px", fontSize: "16px", color: "#ccc" }}>
              ✓ You're logged in! Click the button above to access the pipeline.
            </p>
          )}
=======
        </section>

        {/* MARQUEE */}
        <div className="marquee">
          <div className="marquee-content">
            Biocanvas • Precision Genomics • Sequence Quality Automation • Healthcare AI • Bioinformatics Pipeline •
          </div>
>>>>>>> ba5ce59 (Homepage redesign, contact section, animations, logo resize)
        </div>

        {/* BANNER 1 */}
        <section className="banner">
          <h2>Are you a researcher struggling with sequence quality issues?</h2>
          <p>
            Stop wasting hours manually validating genetic sequences.
            Biocanvas streamlines your workflow and ensures reliable results.
          </p>
        </section>

        {/* BANNER 2 */}
        <section className="banner white">
          <h2>Built for Precision Medicine & Healthcare Innovation</h2>
          <p>
            Designed to support researchers, clinicians, and biotech teams
            in delivering accurate genomic insights with confidence.
          </p>
        </section>

        {/* VISION & MISSION */}
        <section className="vision-mission">
          <div className="card">
            <h3>Our Vision</h3>
            <p>
              To revolutionize healthcare by enabling accurate, scalable
              precision medicine analysis.
            </p>
          </div>

          <div className="card">
            <h3>Our Mission</h3>
            <p>
              To transform genomic workflows through automation,
              reliability, and innovation.
            </p>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="contact-section" id="contact">
          <h2>BioCanvas Private Limited</h2>

          <div className="contact-box">
            <h3>Company Email</h3>
            <p>biocanvasprivatelimited@gmail.com</p>
          </div>

          <div className="contact-box">
            <h3>Founders</h3>
            <p>Priyanshi — priyanshi.grover04@gmail.com</p>
            <p>Alisha — alishachadha2309@gmail.com</p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
