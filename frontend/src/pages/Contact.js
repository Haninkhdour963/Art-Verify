import React, { useState } from 'react';
import Swal from 'sweetalert2';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Web3Forms integration
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: '6bfe605b-e063-4ffd-b810-495c22b01308',
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          from_name: 'ArtVerify Contact Form',
          replyto: formData.email
        })
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Message Sent Successfully!',
          text: 'Thank you for contacting us. We\'ll get back to you soon.',
          confirmButtonText: 'OK'
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send Message',
        text: error.message || 'Please try again later or contact us directly at hello@artverify.com',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1>Contact Us</h1>
            <p className="lead">
              Get in touch with the ArtVerify team
            </p>
          </div>

          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4">Send us a message</h5>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="name" className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">Email Address *</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">Subject *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this regarding?"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="message" className="form-label">Message *</label>
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        rows="6"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Tell us how we can help you..."
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="card border-0 bg-light h-100">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4">Get in Touch</h5>
                  
                  <div className="mb-4">
                    <h6>
                      <i className="bi bi-envelope text-primary me-2"></i>
                      Email
                    </h6>
                    <p className="mb-0">haninkhdour@gmail.com</p>
                    <p className="mb-0">mayarfqutishat@gmail.com</p>
                    <small className="text-muted">We'll respond within 24 hours</small>
                  </div>
                  
                  <div className="mb-4">
                    <h6>
                      <i className="bi bi-chat-dots text-primary me-2"></i>
                      Live Chat
                    </h6>
                    <p className="mb-0">Available 9AM-6PM EST</p>
                    <small className="text-muted">Click the chat icon in the corner</small>
                  </div>
                  
                  <div className="mb-4">
                    <h6>
                      <i className="bi bi-book text-primary me-2"></i>
                      Documentation
                    </h6>
                    <p className="mb-0">Comprehensive guides</p>
                    <small className="text-muted">Check our knowledge base</small>
                  </div>
                  
                  <div className="mb-4">
                    <h6>
                      <i className="bi bi-people text-primary me-2"></i>
                      Community
                    </h6>
                    <p className="mb-0">Join us</p>
                    <small className="text-muted">+962779348106</small>
                   <p></p>
                   <small className="text-muted">+962796389217</small>
                  </div>
                  
                  <hr />
                  
                  <div>
                    <h6>Follow Us</h6>
                    <div className="d-flex gap-3 mt-3">
                  
                      <a href="https://github.com/Haninkhdour963" className="text-primary">
                        <i className="bi bi-github"></i>
                      </a>
                      <a href="https://www.linkedin.com/in/haneen-khdour/" className="text-primary">
                        <i className="bi bi-linkedin"></i>
                      </a>
                          <a href="https://github.com/Mayarqutishat" className="text-primary">
                        <i className="bi bi-github"></i>
                      </a>
                      <a href="http://www.linkedin.com/in/mayar-qutishat-1477a0326" className="text-primary">
                        <i className="bi bi-linkedin"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="row mt-5">
            <div className="col-12">
              <h2 className="text-center mb-4">Frequently Asked Questions</h2>
              
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      How does ArtVerify protect my artwork?
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      ArtVerify creates a unique SHA256 hash of your artwork and records it on the 
                      Hedera blockchain. This provides immutable, timestamped proof that you owned 
                      the artwork at a specific point in time.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      What file formats are supported?
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      We support all major image formats (JPEG, PNG, GIF, SVG) and PDF files. 
                      The maximum file size is 50MB.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      Is there a cost to use ArtVerify?
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Basic artwork registration is free. We cover the minimal Hedera transaction 
                      fees for you. Premium features like advanced verification and marketplace 
                      listings may have associated costs.
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                      How do I verify someone else's artwork?
                    </button>
                  </h2>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      You can verify any artwork using our verification tool. Simply upload the file, 
                      enter the SHA256 hash, or provide the transaction ID to check its registration 
                      status on the blockchain.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;