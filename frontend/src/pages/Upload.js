import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { artService } from '../services/artService';
import { authService } from '../services/authService';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useBlockchain, setUseBlockchain] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (!currentUser || currentUser.role !== 'Seller') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only sellers can upload artworks. Please create a seller account.',
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [navigate]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Text copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Copy failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Failed to copy to clipboard'
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPEG, PNG, GIF, WebP)'
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select a file smaller than 10MB'
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please select a file to upload'
      });
      return;
    }

    if (!authService.isAuthenticated()) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to upload artworks'
      });
      navigate('/login');
      return;
    }

    if (user?.role !== 'Seller') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only sellers can upload artworks. Please create a seller account.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('useBlockchain', useBlockchain.toString());

      console.log('📤 Uploading file:', selectedFile.name);
      console.log('🔗 Use blockchain:', useBlockchain);

      const result = await artService.uploadArtwork(formData);
      
      console.log('✅ Upload successful:', result);

      // Ensure we have the hash
      const sha256Hash = result.sha256Hash || result.SHA256Hash;
      if (!sha256Hash) {
        throw new Error('SHA256 hash not received from server');
      }

      // Show success message with transaction details
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        html: `
          <div class="text-start">
            <p><strong>File:</strong> ${result.fileName}</p>
            <p><strong>SHA256 Hash:</strong></p>
            <div class="hash-display mt-1" 
                 style="cursor: pointer; background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;"
                 onclick="window.copyHashToClipboard('${sha256Hash}')">
              ${sha256Hash}
              <i class="bi bi-copy ms-2 text-muted"></i>
            </div>
            ${result.transactionId && result.transactionId !== 'NOT_REGISTERED' ? 
              `<p class="mt-3"><strong>Transaction ID:</strong></p>
              <div class="hash-display mt-1" 
                   style="cursor: pointer; background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;"
                   onclick="window.copyTxIdToClipboard('${result.transactionId}')">
                ${result.transactionId}
                <i class="bi bi-copy ms-2 text-muted"></i>
              </div>` : 
              '<p class="mt-3"><strong>Blockchain:</strong> Not registered</p>'
            }
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'View in Dashboard',
        cancelButtonText: 'Upload Another',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        didOpen: () => {
          // Add global functions for copy functionality
          window.copyHashToClipboard = (hash) => copyToClipboard(hash);
          window.copyTxIdToClipboard = (txId) => copyToClipboard(txId);
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/dashboard');
        } else {
          // Reset form for another upload
          setSelectedFile(null);
          setPreviewUrl(null);
          const fileInput = document.getElementById('fileInput');
          if (fileInput) fileInput.value = '';
        }
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Failed to upload artwork. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropAreaClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-light');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-light');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-light');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  if (!user || user.role !== 'Seller') {
    return (
      <div className="container py-5 mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <i className="bi bi-exclamation-triangle text-warning display-1"></i>
                <h3>Access Denied</h3>
                <p>Only sellers can upload artworks. Please create a seller account.</p>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="text-center mb-5">
            <h1><i className="bi bi-cloud-upload me-3"></i>Upload Artwork</h1>
            <p className="lead">
              Register your artwork on the blockchain for permanent verification
            </p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              {/* File Upload Area */}
              <div
                className="upload-area"
                onClick={handleDropAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileInput"
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                />
                
                {previewUrl ? (
                  <div className="text-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="img-fluid mb-3 rounded"
                      style={{ maxHeight: '200px' }}
                    />
                    <p className="mb-2">
                      <strong>{selectedFile?.name}</strong>
                    </p>
                    <p className="text-muted">
                      Size: {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Change File
                    </button>
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-cloud-upload display-4 text-secondary mb-3"></i>
                    <h5>Select or Drop Your Artwork</h5>
                    <p className="text-muted">
                      Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)
                    </p>
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-folder2-open me-2"></i>
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              {/* Blockchain Option */}
              <div className="form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useBlockchain"
                  checked={useBlockchain}
                  onChange={(e) => setUseBlockchain(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="useBlockchain">
                  <strong>Register on Hedera Blockchain</strong>
                  <small className="text-muted d-block">
                    Creates a permanent, tamper-proof record of your artwork on the blockchain
                  </small>
                </label>
              </div>

              {/* Upload Button */}
              <div className="text-center mt-4">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isLoading}
                  className="btn btn-primary btn-lg px-5"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload me-2"></i>
                      Upload Artwork
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="row mt-5">
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-fingerprint"></i>
              </div>
              <h5>Digital Fingerprint</h5>
              <p className="text-muted">
                Unique SHA256 hash generated for your artwork
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-link-45deg"></i>
              </div>
              <h5>Blockchain Proof</h5>
              <p className="text-muted">
                Permanent record on Hedera Hashgraph
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-shield-check"></i>
              </div>
              <h5>Tamper-Proof</h5>
              <p className="text-muted">
                Immutable verification for authenticity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;