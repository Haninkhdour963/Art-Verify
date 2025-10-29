import React, { useState } from 'react';
import Swal from 'sweetalert2';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter your email address to subscribe',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Web3Forms integration for newsletter subscription
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '6bfe605b-e063-4ffd-b810-495c22b01308',
          email: email,
          subject: 'Newsletter Subscription - ArtVerify',
          message: `New newsletter subscription from: ${email}`,
          from_name: 'ArtVerify Newsletter',
          replyto: email
        })
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Subscribed Successfully!',
          text: 'Thank you for subscribing to our newsletter. You will receive updates on new features and artwork.',
          confirmButtonText: 'OK'
        });

        // Reset form
        setEmail('');
      } else {
        throw new Error(result.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Subscription Failed',
        text: error.message || 'Please try again later',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h3 className="mb-3">
              <i className="bi bi-palette2 me-2"></i>
              ArtVerify
            </h3>
            <p className="mb-4">
              Securing digital artwork ownership on the Hedera blockchain. 
              Empowering artists with immutable proof of authorship.
            </p>
            <div className="social-links">

              <a href="https://github.com/Mayarqutishat"><i className="bi bi-github"></i></a>
              
              <a href="http://www.linkedin.com/in/mayar-qutishat-1477a0326"><i className="bi bi-linkedin"></i></a>

              <a href="https://github.com/Haninkhdour963"><i className="bi bi-github"></i></a>
              
              <a href="https://www.linkedin.com/in/haneen-khdour/"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>
          
          <div className="col-md-2 mb-4 mb-md-0">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/"><i className="bi bi-house me-2"></i>Home</a></li>
              <li className="mb-2"><a href="/upload"><i className="bi bi-cloud-upload me-2"></i>Upload Art</a></li>
              <li className="mb-2"><a href="/verify"><i className="bi bi-search me-2"></i>Verify</a></li>
              <li className="mb-2"><a href="/marketplace"><i className="bi bi-shop me-2"></i>Marketplace</a></li>
            </ul>
          </div>
          
          <div className="col-md-2 mb-4 mb-md-0">
            <h5 className="mb-3">Resources</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/about"><i className="bi bi-info-circle me-2"></i>About</a></li>
              <li className="mb-2"><a href="/contact"><i className="bi bi-envelope me-2"></i>Contact</a></li>
              <li className="mb-2"><a href="#"><i className="bi bi-question-circle me-2"></i>FAQ</a></li>
              <li className="mb-2"><a href="#"><i className="bi bi-book me-2"></i>Documentation</a></li>
            </ul>
          </div>
          
          <div className="col-md-4">
            <h5 className="mb-3">Newsletter</h5>
            <p className="mb-3">Subscribe to get updates on new features and artwork.</p>
            <form onSubmit={handleSubscribe}>
              <div className="input-group">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <hr className="my-4" />
        
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} ArtVerify. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <a href="#" className="me-3">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;