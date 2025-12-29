import React, { useState } from "react";
import PipelineApp from "../PipelineApp"; 
import "./home.css";

const Home: React.FC = () => {
  const [showPipeline, setShowPipeline] = useState(false);

  // If user clicks "Try the Tool", show the pipeline frontend
  if (showPipeline) {
    return <PipelineApp />;
  }

  return (
    <>
      <nav>
        <div className="logo-placeholder">Logo Here</div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="auth-buttons">
          <button>Sign Up</button>
          <button>Log In</button>
        </div>
      </nav>

      <div className="homepage" id="home">
        <div className="main-heading">
          <h1>
            Introducing <br />
            <span className="biocanvas">Biocanvas</span> <br />
            <span className="private-limited">Private Limited</span>
          </h1>
        </div>

        <div className="platform-description">
          <p>
            Our platform automates quality control for genetic sequences,
            identifying errors and improving sequence accuracy before downstream
            analysis.
          </p>
        </div>

        <div className="vision-mission-container">
          <div className="vision-box">
            <h2>Vision</h2>
            <p>
              To provide an accurate precision medication analysis in the
              healthcare industry.
            </p>
          </div>

          <div className="mission-box">
            <h2>Mission</h2>
            <p>To transform the field of healthcare with precision medicine.</p>
          </div>
        </div>

        <div className="cta-section">
          <h2>Join us now!</h2>
          <button
            className="cta-button"
            onClick={() => setShowPipeline(true)}
          >
            Try the Tool
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
