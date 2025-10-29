import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { artService } from '../services/artService';

const Verify = () => {
  const [verificationMethod, setVerificationMethod] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [hash, setHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setVerificationResult(null);

    try {
      let result;

      switch (verificationMethod) {
        case 'file':
          if (!selectedFile) {
            throw new Error('Please select a file to verify');
          }
          result = await artService.verifyByFile(selectedFile);
          break;

        case 'hash':
          if (!hash.trim()) {
            throw new Error('Please enter a SHA256 hash');
          }
          result = await artService.verifyByHash(hash.trim());
          break;

        case 'transaction':
          if (!transactionId.trim()) {
            throw new Error('Please enter a Transaction ID');
          }
          result = await artService.verifyByTransactionId(transactionId.trim());
          break;

        default:
          throw new Error('Invalid verification method');
      }

      setVerificationResult(result);
      
      if (result.isVerified) {
        Swal.fire({
          icon: 'success',
          title: 'Artwork Verified!',
          html: `
            <div class="text-start">
              <p><strong>Status:</strong> ✅ Authentic</p>
              <p><strong>Message:</strong> ${result.message}</p>
              ${result.artwork ? `
                <hr>
                <p><strong>File Name:</strong> ${result.artwork.fileName}</p>
                <p><strong>Owner:</strong> ${result.artwork.user?.username || 'Unknown'}</p>
                <p><strong>Registered:</strong> ${new Date(result.artwork.createdAt).toLocaleDateString()}</p>
              ` : ''}
            </div>
          `
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: result.message || 'Artwork not found in our system'
        });
      }

    } catch (error) {
      console.error('Verification error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Verification Error',
        text: error.message || 'Failed to verify artwork'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No text available to copy',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

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
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Text copied to clipboard',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Copy Failed',
          text: 'Failed to copy text to clipboard'
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setHash('');
    setTransactionId('');
    setVerificationResult(null);
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="text-center mb-5">
            <h1><i className="bi bi-search me-3"></i>Verify Artwork</h1>
            <p className="lead">
              Check the authenticity of any artwork using different methods
            </p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              {/* Verification Method Selection */}
              <div className="mb-4">
                <label className="form-label"><strong>Verification Method</strong></label>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="verificationMethod"
                        id="methodFile"
                        value="file"
                        checked={verificationMethod === 'file'}
                        onChange={(e) => {
                          setVerificationMethod(e.target.value);
                          resetForm();
                        }}
                      />
                      <label className="form-check-label" htmlFor="methodFile">
                        <i className="bi bi-file-image me-2"></i>
                        File Upload
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="verificationMethod"
                        id="methodHash"
                        value="hash"
                        checked={verificationMethod === 'hash'}
                        onChange={(e) => {
                          setVerificationMethod(e.target.value);
                          resetForm();
                        }}
                      />
                      <label className="form-check-label" htmlFor="methodHash">
                        <i className="bi bi-hash me-2"></i>
                        SHA256 Hash
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="verificationMethod"
                        id="methodTransaction"
                        value="transaction"
                        checked={verificationMethod === 'transaction'}
                        onChange={(e) => {
                          setVerificationMethod(e.target.value);
                          resetForm();
                        }}
                      />
                      <label className="form-check-label" htmlFor="methodTransaction">
                        <i className="bi bi-receipt me-2"></i>
                        Transaction ID
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload Method */}
              {verificationMethod === 'file' && (
                <div className="mb-4">
                  <label className="form-label"><strong>Upload Artwork File</strong></label>
                  <div
                    className="upload-area"
                    onClick={() => document.getElementById('verifyFileInput').click()}
                  >
                    <input
                      type="file"
                      id="verifyFileInput"
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                    />
                    
                    {selectedFile ? (
                      <div className="text-center">
                        <i className="bi bi-check-circle text-success mb-2" style={{ fontSize: '48px' }}></i>
                        <p className="mb-0">
                          <strong>{selectedFile.name}</strong>
                        </p>
                        <small className="text-muted">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-cloud-upload display-4 text-secondary mb-3"></i>
                        <h5>Click to Select File</h5>
                        <p className="text-muted">
                          Upload the artwork file to verify its authenticity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hash Method */}
              {verificationMethod === 'hash' && (
                <div className="mb-4">
                  <label className="form-label"><strong>Enter SHA256 Hash</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter the 64-character SHA256 hash..."
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <small className="text-muted">
                    Enter the complete SHA256 hash of the artwork (64 hexadecimal characters)
                  </small>
                </div>
              )}

              {/* Transaction ID Method */}
              {verificationMethod === 'transaction' && (
                <div className="mb-4">
                  <label className="form-label"><strong>Enter Transaction ID</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter the Hedera transaction ID..."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <small className="text-muted">
                    Enter the Hedera transaction ID from when the artwork was registered
                  </small>
                </div>
              )}

              {/* Verify Button */}
              <div className="text-center">
                <button
                  onClick={handleVerify}
                  disabled={isLoading || 
                    (verificationMethod === 'file' && !selectedFile) ||
                    (verificationMethod === 'hash' && !hash.trim()) ||
                    (verificationMethod === 'transaction' && !transactionId.trim())
                  }
                  className="btn btn-primary btn-lg px-5"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Verify Artwork
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`card mt-4 ${verificationResult.isVerified ? 'border-success' : 'border-danger'}`}>
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className={`bi ${verificationResult.isVerified ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'} me-2`} style={{ fontSize: '24px' }}></i>
                  <h4 className="mb-0">
                    {verificationResult.isVerified ? 'Artwork Verified' : 'Verification Failed'}
                  </h4>
                </div>
                
                <p className="mb-3">{verificationResult.message}</p>

                {verificationResult.artwork && (
                  <div className="verification-details">
                    <h5>Artwork Details</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>File Name:</strong> {verificationResult.artwork.fileName}</p>
                        <p><strong>File Type:</strong> {verificationResult.artwork.fileType}</p>
                        <p><strong>File Size:</strong> {(verificationResult.artwork.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Owner:</strong> {verificationResult.artwork.user?.username || 'Unknown'}</p>
                        <p><strong>Registered:</strong> {new Date(verificationResult.artwork.createdAt).toLocaleDateString()}</p>
                        <p><strong>For Sale:</strong> {verificationResult.artwork.isListedForSale ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    {/* Hash and Transaction ID */}
                    <div className="mt-3">
                      <div className="mb-2">
                        <strong>SHA256 Hash:</strong>
                        <div className="hash-display mt-1" 
                             onClick={() => copyToClipboard(verificationResult.artwork.sha256Hash || verificationResult.artwork.SHA256Hash)}
                             title="Click to copy">
                          {verificationResult.artwork.sha256Hash || verificationResult.artwork.SHA256Hash || 'No hash available'}
                          <i className="bi bi-copy copy-icon ms-2 text-muted"></i>
                        </div>
                      </div>

                      {verificationResult.artwork.transactionId && verificationResult.artwork.transactionId !== 'NOT_REGISTERED' && (
                        <div>
                          <strong>Transaction ID:</strong>
                          <div className="txid-display mt-1" 
                               onClick={() => copyToClipboard(verificationResult.artwork.transactionId)}
                               title="Click to copy">
                            {verificationResult.artwork.transactionId}
                            <i className="bi bi-copy copy-icon ms-2 text-muted"></i>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Methods Info */}
          <div className="row mt-5">
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-file-image"></i>
              </div>
              <h5>File Upload</h5>
              <p className="text-muted">
                Upload the artwork file to compute its hash and verify against our records
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-hash"></i>
              </div>
              <h5>Hash Verification</h5>
              <p className="text-muted">
                Verify using the SHA256 hash directly if you already have it
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="feature-icon mx-auto mb-3">
                <i className="bi bi-receipt"></i>
              </div>
              <h5>Transaction ID</h5>
              <p className="text-muted">
                Verify using the Hedera transaction ID from the registration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;