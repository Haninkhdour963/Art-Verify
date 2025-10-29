import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate('/upload');
  };

  const handleDocumentationClick = () => {
    // Open documentation in new tab or navigate to documentation page
    window.open('/', '_blank');
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1>About ArtVerify</h1>
            <p className="lead">
              Empowering digital artists with blockchain-based ownership verification
            </p>
          </div>

          {/* Mission Section */}
          <div className="card shadow mb-5">
            <div className="card-body p-5">
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <h2>Our Mission</h2>
                  <p className="mb-4">
                    ArtVerify is dedicated to solving the growing problem of digital art theft 
                    and unauthorized use of creative works. We believe every artist deserves 
                    reliable tools to prove and protect their digital creations.
                  </p>
                  <p>
                    By leveraging the power of Hedera Hashgraph's blockchain technology, 
                    we provide artists with immutable, timestamped proof of ownership that 
                    cannot be forged or modified.
                  </p>
                </div>
                <div className="col-lg-6 text-center">
                  <div className="bg-light rounded shadow d-flex align-items-center justify-content-center" 
                       style={{height: '300px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                    <div className="text-white text-center p-4">
                      <i className="bi bi-shield-check display-1 mb-3"></i>
                      <h4>Secure Digital Art</h4>
                      <p className="mb-0">Blockchain-powered protection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="row mb-5">
            <div className="col-12 text-center mb-4">
              <h2>How ArtVerify Works</h2>
              <p className="lead">Protect your artwork in four simple steps</p>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card h-100 border-0 text-center">
                <div className="card-body">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-cloud-upload"></i>
                  </div>
                  <h5>1. Upload Artwork</h5>
                  <p className="text-muted">
                    Artists upload their digital artwork to our platform in supported formats.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card h-100 border-0 text-center">
                <div className="card-body">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-hash"></i>
                  </div>
                  <h5>2. Generate Hash</h5>
                  <p className="text-muted">
                    We create a unique SHA256 hash that serves as the artwork's digital fingerprint.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card h-100 border-0 text-center">
                <div className="card-body">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-link-45deg"></i>
                  </div>
                  <h5>3. Record on Blockchain</h5>
                  <p className="text-muted">
                    The hash is permanently recorded on the Hedera blockchain with a timestamp.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="card h-100 border-0 text-center">
                <div className="card-body">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h5>4. Get Proof</h5>
                  <p className="text-muted">
                    Receive immutable proof of ownership with transaction ID and timestamp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="card shadow mb-5">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Technology Stack</h2>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <h5>
                    <i className="bi bi-window me-2 text-primary"></i>
                    Frontend
                  </h5>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-check text-success me-2"></i>React.js</li>
                    <li><i className="bi bi-check text-success me-2"></i>Bootstrap 5</li>
                    <li><i className="bi bi-check text-success me-2"></i>Hedera JavaScript SDK</li>
                  </ul>
                </div>
                <div className="col-md-6 mb-4">
                  <h5>
                    <i className="bi bi-server me-2 text-primary"></i>
                    Backend
                  </h5>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-check text-success me-2"></i>ASP.NET Core</li>
                    <li><i className="bi bi-check text-success me-2"></i>Entity Framework</li>
                    <li><i className="bi bi-check text-success me-2"></i>SQL Server</li>
                  </ul>
                </div>
                <div className="col-md-6 mb-4">
                  <h5>
                    <i className="bi bi-link-45deg me-2 text-primary"></i>
                    Blockchain
                  </h5>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-check text-success me-2"></i>Hedera Hashgraph</li>
                    <li><i className="bi bi-check text-success me-2"></i>Hedera File Service</li>
                    <li><i className="bi bi-check text-success me-2"></i>Hedera Consensus Service</li>
                  </ul>
                </div>
                <div className="col-md-6 mb-4">
                  <h5>
                    <i className="bi bi-shield me-2 text-primary"></i>
                    Security
                  </h5>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-check text-success me-2"></i>SHA256 Hashing</li>
                    <li><i className="bi bi-check text-success me-2"></i>Digital Signatures</li>
                    <li><i className="bi bi-check text-success me-2"></i>Immutable Records</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center mb-5">
            <h2>Built for the Hedera Hackathon</h2>
            <p className="lead">
              ArtVerify was created as part of the Hedera Web3.0 Hackathon to demonstrate 
              the practical applications of blockchain technology in protecting digital creativity.
            </p>
            <div className="row mt-4">
              <div className="col-md-6 offset-md-3">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <i className="bi bi-trophy display-4 text-warning mb-3"></i>
                    <h5>Hedera Web3.0 Hackathon 2024</h5>
                    <p className="mb-0">
                      Award-winning solution for digital art protection and verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="card bg-primary text-white">
            <div className="card-body text-center p-5">
              <h3>Ready to protect your digital artwork?</h3>
              <p className="mb-4">
                Join the growing community of artists who trust ArtVerify for their 
                digital ownership needs.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button 
                  className="btn btn-light btn-lg"
                  onClick={handleUploadClick}
                >
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload Your First Artwork
                </button>
                <button 
                  className="btn btn-outline-light btn-lg"
                  onClick={handleDocumentationClick}
                >
                  <i className="bi bi-book me-2"></i>
                  Read Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;