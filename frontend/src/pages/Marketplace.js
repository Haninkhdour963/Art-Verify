import React, { useState, useEffect, useCallback } from 'react';
import { artService } from '../services/artService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';
import { Client, AccountId, PrivateKey, TransferTransaction, Hbar, AccountBalanceQuery } from '@hashgraph/sdk';

const Marketplace = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [purchasingArtwork, setPurchasingArtwork] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  // Hedera Configuration
  const HEDERA_ACCOUNT_ID = "0.0.6945291";
  const HEDERA_PRIVATE_KEY = "302e020100300506032b657004220420ba871592fc8a887a5051d092835098315a1d8aec5a557f57094e9552f0f4c217";

  const getHederaClient = () => {
    try {
      const client = Client.forTestnet();
      client.setOperator(
        AccountId.fromString(HEDERA_ACCOUNT_ID),
        PrivateKey.fromString(HEDERA_PRIVATE_KEY)
      );
      return client;
    } catch (error) {
      console.error('Error initializing Hedera client:', error);
      return null;
    }
  };

  const getRealWalletBalance = async () => {
    try {
      const client = getHederaClient();
      if (!client) {
        throw new Error('Failed to initialize Hedera client');
      }

      const balance = await new AccountBalanceQuery()
        .setAccountId(HEDERA_ACCOUNT_ID)
        .execute(client);

      const hbarBalance = balance.hbars.toBigNumber().toNumber();
      return hbarBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  };

  const processRealHbarTransfer = async (buyerAccountId, sellerAccountId, amountHbar) => {
    try {
      const client = getHederaClient();
      if (!client) {
        throw new Error('Failed to initialize Hedera client');
      }

      // Create transfer transaction
      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(HEDERA_ACCOUNT_ID), new Hbar(-amountHbar)) // From marketplace account
        .addHbarTransfer(AccountId.fromString(sellerAccountId), new Hbar(amountHbar)) // To seller
        .setTransactionMemo(`Artwork purchase: ${buyerAccountId} to ${sellerAccountId}`);

      // Execute transaction
      const txResponse = await transferTransaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return {
        success: receipt.status.toString() === 'SUCCESS',
        transactionId: txResponse.transactionId.toString(),
        error: null
      };
    } catch (error) {
      console.error('Hedera transfer error:', error);
      return {
        success: false,
        transactionId: null,
        error: error.message
      };
    }
  };

  const loadMarketplaceArtworks = useCallback(async () => {
    try {
      setLoading(true);
      const marketplaceArtworks = await artService.getMarketplaceArtworks();
      setArtworks(marketplaceArtworks);
    } catch (error) {
      console.error('Error loading marketplace artworks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load marketplace',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketplaceArtworks();
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      loadWalletBalance();
    }
  }, [loadMarketplaceArtworks]);

  const loadWalletBalance = async () => {
    try {
      const balance = await getRealWalletBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      // Fallback to API balance check
      setWalletBalance(100.0);
    }
  };

  const handlePurchaseInit = (artwork) => {
    if (!authService.isAuthenticated()) {
      Swal.fire({
        icon: 'warning',
        title: 'Authentication Required',
        text: 'Please log in to purchase artworks',
      });
      return;
    }

    const currentUser = authService.getCurrentUser();
    
    if (currentUser.role !== 'Buyer') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only buyers can purchase artworks. Please use a buyer account.',
      });
      return;
    }

    if (artwork.user?.id === currentUser?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Purchase',
        text: 'You cannot purchase your own artwork',
      });
      return;
    }

    // Check wallet balance
    if (walletBalance !== null && walletBalance < artwork.salePrice) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        html: `
          <div class="text-center">
            <p>You don't have enough HBAR to complete this purchase.</p>
            <p><strong>Required:</strong> ${artwork.salePrice} HBAR</p>
            <p><strong>Available:</strong> ${walletBalance} HBAR</p>
          </div>
        `,
        confirmButtonText: 'OK'
      });
      return;
    }

    setPurchasingArtwork(artwork);
    setShowPurchaseForm(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!purchasingArtwork) return;

    try {
      setPurchaseLoading(true);
      setShowPurchaseForm(false);
      
      Swal.fire({
        title: 'Processing HBAR Transfer',
        html: `
          <div class="text-center">
            <p>Transferring ${purchasingArtwork.salePrice} HBAR to seller...</p>
            <p><small>This may take a few moments</small></p>
          </div>
        `,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Process real HBAR transfer
      const sellerAccountId = `0.0.${1000000 + purchasingArtwork.user.id}`;
      const buyerAccountId = HEDERA_ACCOUNT_ID;
      
      const transferResult = await processRealHbarTransfer(
        buyerAccountId,
        sellerAccountId,
        purchasingArtwork.salePrice
      );

      if (!transferResult.success) {
        throw new Error(`HBAR transfer failed: ${transferResult.error}`);
      }

      // Process the purchase in our system
      const result = await artService.purchaseArtwork(purchasingArtwork.id);
      
      // Update wallet balance
      await loadWalletBalance();

      // Show success alert with download option
      const downloadResult = await Swal.fire({
        icon: 'success',
        title: 'Purchase Successful!',
        html: `
          <div class="text-center">
            <p>You are now the owner of <strong>"${purchasingArtwork.fileName}"</strong></p>
            <p class="text-success">Price: ${purchasingArtwork.salePrice} HBAR</p>
            <p class="text-muted"><small>HBAR transferred successfully on Hedera network</small></p>
            ${transferResult.transactionId ? `
              <div class="mt-3">
                <strong>Transaction ID:</strong>
                <div class="hash-display mt-1" 
                     style="cursor: pointer; background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;"
                     onclick="navigator.clipboard.writeText('${transferResult.transactionId}')">
                  ${transferResult.transactionId}
                  <i class="bi bi-copy ms-2 text-muted"></i>
                </div>
                <a href="https://hashscan.io/testnet/transaction/${transferResult.transactionId}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="btn btn-sm btn-outline-primary mt-2">
                  View on HashScan
                </a>
              </div>
            ` : ''}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Download',
        cancelButtonText: 'Great',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
      });

      if (downloadResult.isConfirmed) {
        // Trigger download
        await downloadArtwork(purchasingArtwork);
      }

      // Reload marketplace to reflect any changes (artwork remains available for other buyers)
      loadMarketplaceArtworks();
      
    } catch (error) {
      console.error('Purchase error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        html: `
          <div class="text-center">
            <p>${error.message}</p>
            <p class="text-muted"><small>The HBAR transaction could not be completed.</small></p>
          </div>
        `
      });
    } finally {
      setPurchaseLoading(false);
      setPurchasingArtwork(null);
    }
  };

  const downloadArtwork = async (artwork) => {
    try {
      Swal.fire({
        title: 'Preparing Download',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const blob = await artService.downloadArtwork(artwork.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = artwork.fileName || `artwork-${artwork.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Download Started!',
        text: 'Your artwork is being downloaded',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Download error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: error.message
      });
    }
  };

  const handlePurchaseCancel = () => {
    setShowPurchaseForm(false);
    setPurchasingArtwork(null);
  };

  const getImagePreview = (artwork) => {
    if (artwork.imageUrl) {
      return artwork.imageUrl;
    }
    
    const colors = ['#4A90E2', '#50E3C2', '#B8E986', '#BD10E0', '#9013FE'];
    const color = colors[artwork.id % colors.length] || '#4A90E2';
    
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${artwork.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2A3335;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad${artwork.id})"/>
        <circle cx="50%" cy="40%" r="15%" fill="white" fill-opacity="0.2"/>
        <rect x="30%" y="60%" width="40%" height="10%" fill="white" fill-opacity="0.2" rx="5"/>
        <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" 
              fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${artwork.fileName || 'Artwork'}
        </text>
        <text x="50%" y="95%" dominant-baseline="middle" text-anchor="middle" 
              fill="white" font-family="Arial, sans-serif" font-size="10" opacity="0.8">
          ${artwork.salePrice} HBAR
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredArtworks = artworks.filter(artwork => {
    if (!artwork.isListedForSale || !artwork.salePrice || artwork.salePrice <= 0) {
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'affordable') return artwork.salePrice <= 0.5;
    if (filter === 'premium') return artwork.salePrice > 0.5;
    return true;
  });

  if (loading) {
    return (
      <div className="container py-5 mt-5">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 mt-5">
      {showPurchaseForm && purchasingArtwork && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm HBAR Purchase</h5>
                <button type="button" className="btn-close" onClick={handlePurchaseCancel}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <img 
                    src={getImagePreview(purchasingArtwork)} 
                    alt={purchasingArtwork.fileName}
                    className="img-fluid rounded mb-3"
                    style={{maxHeight: '200px'}}
                  />
                  <h5>{purchasingArtwork.fileName}</h5>
                  <p className="text-muted">by {purchasingArtwork.user?.username || 'Unknown Artist'}</p>
                </div>
                
                <div className="purchase-details">
                  <div className="row">
                    <div className="col-6">
                      <strong>Price:</strong>
                    </div>
                    <div className="col-6 text-end">
                      <span className="h5 text-primary">{purchasingArtwork.salePrice} HBAR</span>
                    </div>
                  </div>
                  
                  {walletBalance !== null && (
                    <div className="row mt-2">
                      <div className="col-6">
                        <strong>Your Balance:</strong>
                      </div>
                      <div className="col-6 text-end">
                        <span className={walletBalance >= purchasingArtwork.salePrice ? 'text-success' : 'text-danger'}>
                          {walletBalance} HBAR
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="row mt-2">
                    <div className="col-6">
                      <strong>File Type:</strong>
                    </div>
                    <div className="col-6 text-end">
                      {purchasingArtwork.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-6">
                      <strong>File Size:</strong>
                    </div>
                    <div className="col-6 text-end">
                      {formatFileSize(purchasingArtwork.fileSize)}
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-6">
                      <strong>Verified:</strong>
                    </div>
                    <div className="col-6 text-end">
                      <span className="badge bg-success">Yes</span>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    This purchase will transfer {purchasingArtwork.salePrice} HBAR from your wallet to the seller's wallet on the Hedera network.
                    After purchase, you will be able to download the artwork immediately.
                    <strong> Note: The artwork will remain available for other buyers to purchase.</strong>
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handlePurchaseCancel}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handlePurchaseConfirm}
                  disabled={purchaseLoading || (walletBalance !== null && walletBalance < purchasingArtwork.salePrice)}
                >
                  {purchaseLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Processing HBAR Transfer...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart3 me-2"></i>
                      Confirm Purchase - {purchasingArtwork.salePrice} HBAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="text-center mb-5">
            <h1>ArtVerify Marketplace</h1>
            <p className="lead">
              Discover and purchase verified digital artwork on the Hedera blockchain
            </p>
            
            {user && walletBalance !== null && (
              <div className="alert alert-primary d-inline-block">
                <i className="bi bi-wallet2 me-2"></i>
                <strong>Wallet Balance:</strong> {walletBalance} HBAR
                <a 
                  href={`https://hashscan.io/testnet/account/${HEDERA_ACCOUNT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-light ms-2"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  View on HashScan
                </a>
              </div>
            )}
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h5 className="mb-0">{filteredArtworks.length} Artworks Available</h5>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('all')}
                    >
                      All Artworks
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === 'affordable' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('affordable')}
                    >
                      Affordable (&lt; 0.5 HBAR)
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === 'premium' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('premium')}
                    >
                      Premium
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {filteredArtworks.length === 0 ? (
              <div className="col-12 text-center py-5">
                <div className="feature-icon mx-auto mb-3">
                  <i className="bi bi-search"></i>
                </div>
                <h4>No artworks found</h4>
                <p className="text-muted">
                  {artworks.length === 0 
                    ? 'No artworks are currently listed for sale. Check back later!'
                    : 'No artworks match your current filters. Try adjusting your filters to see more results.'
                  }
                </p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={loadMarketplaceArtworks}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh Marketplace
                </button>
              </div>
            ) : (
              filteredArtworks.map(artwork => (
                <div key={artwork.id} className="col-lg-4 col-md-6 mb-4">
                  <div className="card h-100 artwork-card">
                    <div className="artwork-image-container">
                      <img 
                        src={getImagePreview(artwork)}
                        alt={artwork.fileName}
                        className="artwork-image"
                      />
                      <div className="verified-badge">
                        <i className="bi bi-check-lg me-1"></i>
                        Verified
                      </div>
                      <div className="artwork-overlay">
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={() => handlePurchaseInit(artwork)}
                          disabled={user?.id === artwork.user?.id || user?.role !== 'Buyer' || (walletBalance !== null && walletBalance < artwork.salePrice)}
                        >
                          <i className="bi bi-cart3 me-2"></i>
                          {user?.role !== 'Buyer' ? 'Buyers Only' : 
                           user?.id === artwork.user?.id ? 'Your Artwork' : 
                           walletBalance !== null && walletBalance < artwork.salePrice ? 'Insufficient HBAR' :
                           `Purchase - ${artwork.salePrice} HBAR`}
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{artwork.fileName}</h5>
                      <p className="card-text text-muted small">
                        <i className="bi bi-file me-1"></i>
                        {artwork.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'} • 
                        {formatFileSize(artwork.fileSize)}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 text-primary mb-0">
                          {artwork.salePrice} HBAR
                        </span>
                        <small className="text-muted">
                          {formatDate(artwork.createdAt)}
                        </small>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <div className="row">
                        <div className="col-12">
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {artwork.user?.username || 'Unknown Artist'}
                          </small>
                        </div>
                        <div className="col-12 mt-1">
                          <small className="text-muted">
                            <i className="bi bi-receipt me-1"></i>
                            {artwork.transactionId?.substring(0, 16)}...
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h5>Verified Authenticity</h5>
                  <p className="mb-0">All artworks are verified on the Hedera blockchain</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-currency-exchange"></i>
                  </div>
                  <h5>Real HBAR Payments</h5>
                  <p className="mb-0">Secure payments using real Hedera cryptocurrency</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <i className="bi bi-download"></i>
                  </div>
                  <h5>Instant Download</h5>
                  <p className="mb-0">Download purchased artworks immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;