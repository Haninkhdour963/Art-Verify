import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1>Secure Your Digital Artwork on Hedera Blockchain</h1>
              <p className="lead">
                ArtVerify provides immutable proof of ownership for digital artists, 
                designers, and creators. Protect your work from theft with blockchain technology.
              </p>
              <div className="mt-4">
                <Link to="/upload" className="btn btn-primary me-3">
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload Your Art
                </Link>
                <Link to="/verify" className="btn btn-outline-light">
                  <i className="bi bi-search me-2"></i>
                  Verify Artwork
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image-container">
                <img 
                  src="/api/placeholder/600/400" 
                  alt="ArtVerify Platform"
                  className="img-fluid rounded shadow"
                  onError={(e) => {
                    // Fallback to SVG if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="placeholder-image bg-light rounded shadow d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <i className="bi bi-palette2 text-primary mb-3" style={{fontSize: '4rem'}}></i>
                    <h5 className="text-muted">ArtVerify Platform</h5>
                    <p className="text-muted mb-0">Secure Digital Art Protection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2>How ArtVerify Works</h2>
              <p className="lead">Protect your artwork in four simple steps</p>
            </div>
          </div>
          
          <div className="step-process">
            <div className="step active">
              <div className="step-number">1</div>
              <h5>Upload Artwork</h5>
              <p>Upload your digital artwork file</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h5>Generate Hash</h5>
              <p>Create unique SHA256 hash</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h5>Record on Hedera</h5>
              <p>Store hash on blockchain</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h5>Get Proof</h5>
              <p>Receive transaction ID</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-12">
              <h2>Why Choose ArtVerify?</h2>
              <p className="lead">Powerful features for digital creators</p>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-4">
              <div className="card h-100 border-0">
                <div className="card-body text-center p-4">
                  <div className="feature-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h5>Immutable Proof</h5>
                  <p>
                    Your artwork's hash is permanently recorded on the Hedera blockchain, 
                    providing tamper-proof evidence of ownership.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0">
                <div className="card-body text-center p-4">
                  <div className="feature-icon">
                    <i className="bi bi-lightning"></i>
                  </div>
                  <h5>Fast & Low Cost</h5>
                  <p>
                    Hedera's consensus algorithm ensures fast transactions with minimal fees, 
                    making it affordable for all artists.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0">
                <div className="card-body text-center p-4">
                  <div className="feature-icon">
                    <i className="bi bi-search"></i>
                  </div>
                  <h5>Easy Verification</h5>
                  <p>
                    Anyone can verify the ownership of artwork by checking the hash against 
                    the Hedera network using our simple tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h3>Ready to protect your digital artwork?</h3>
              <p className="mb-0">
                Join thousands of artists who have secured their creations with ArtVerify.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/upload" className="btn btn-primary btn-lg">
                <i className="bi bi-cloud-upload me-2"></i>
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;