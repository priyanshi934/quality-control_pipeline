import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PipelineApp from "../PipelineApp";
import { UserNav } from "../components/UserNav";
import { useAuth } from "../contexts/AuthContext";
import "./home.css";

const Home: React.FC = () => {
  const [showPipeline, setShowPipeline] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

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
  }

  return (
    <>
      {isAuthenticated && <UserNav />}
      <nav>
        <div className="logo-placeholder">Logo Here</div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#contact">Contact</a>
        </div>
        {!isAuthenticated && !isLoading && (
          <div className="auth-buttons">
            <button onClick={() => navigate("/login")}>Log In</button>
            <button onClick={() => navigate("/login")}>Sign Up</button>
          </div>
        )}
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
            onClick={handleTryTool}
            style={{ cursor: "pointer" }}
          >
            {isLoading ? "Loading..." : isAuthenticated ? "🚀 Try the Tool" : "🔐 Get Started"}
          </button>
          {isAuthenticated && (
            <p style={{ marginTop: "20px", fontSize: "16px", color: "#ccc" }}>
              ✓ You're logged in! Click the button above to access the pipeline.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
