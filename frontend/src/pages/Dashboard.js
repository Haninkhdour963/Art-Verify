import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authService } from '../services/authService';
import { artService } from '../services/artService';
import { Client, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [purchasedArtworks, setPurchasedArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [walletBalance, setWalletBalance] = useState(null);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    listedArtworks: 0
  });

  const navigate = useNavigate();

  // Hedera Client Configuration
  const hederaAccountId = "0.0.6945291";
  const hederaPrivateKey = "302e020100300506032b657004220420ba871592fc8a887a5051d092835098315a1d8aec5a557f57094e9552f0f4c217";
  
  // Initialize Hedera Client
  const getHederaClient = () => {
    try {
      const client = Client.forTestnet();
      client.setOperator(
        AccountId.fromString(hederaAccountId),
        PrivateKey.fromString(hederaPrivateKey)
      );
      return client;
    } catch (error) {
      console.error('Error initializing Hedera client:', error);
      return null;
    }
  };

  // Get real wallet balance from Hedera
  const getRealWalletBalance = async () => {
    try {
      const client = getHederaClient();
      if (!client) {
        throw new Error('Failed to initialize Hedera client');
      }

      const balance = await new AccountBalanceQuery()
        .setAccountId(hederaAccountId)
        .execute(client);

      const hbarBalance = balance.hbars.toBigNumber().toNumber();
      return hbarBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  };

const loadUserData = useCallback(async () => {
  try {
    setIsLoading(true);
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    // Load wallet balance for both buyers and sellers
    try {
      const balance = await getRealWalletBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      // Fallback to simulated balance
      setWalletBalance(100.0);
    }

    if (currentUser.role === 'Seller') {
      const [userArtworks, stats] = await Promise.all([
        artService.getUserArtworks(),
        artService.getSellerStats()
      ]);
      
      setArtworks(userArtworks);
      setSalesStats(stats);
      console.log('Seller stats loaded:', stats);
    } else {
      const purchased = await artService.getPurchasedArtworks();
      setPurchasedArtworks(purchased);
      
      // Calculate total spent for buyers
      const totalSpent = purchased.reduce((sum, artwork) => sum + (artwork.salePrice || 0), 0);
      setSalesStats({
        totalSales: purchased.length,
        totalRevenue: totalSpent,
        listedArtworks: 0
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Failed to Load Data',
      text: error.message,
      confirmButtonText: 'Try Again'
    }).then(() => {
      loadUserData();
    });
  } finally {
    setIsLoading(false);
  }
}, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogout = () => {
    artService.clearCache();
    authService.logout();
    navigate('/');
  };

  const handleUploadClick = () => {
    if (user?.role !== 'Seller') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only sellers can upload artworks. Please create a seller account.'
      });
      return;
    }
    navigate('/upload');
  };

  const handleVerifyClick = () => {
    navigate('/verify');
  };

  const handleMarketplaceClick = () => {
    navigate('/marketplace');
  };

  const handleViewWallet = () => {
    window.open(`https://hashscan.io/testnet/account/${hederaAccountId}`, '_blank');
  };

  const listForSale = async (artworkId) => {
    setLoadingStates(prev => ({ ...prev, [artworkId]: true }));
    
    try {
      const { value: price } = await Swal.fire({
        title: 'List for Sale',
        input: 'number',
        inputLabel: 'Price in HBAR',
        inputPlaceholder: 'Enter price (e.g., 0.5)',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value || isNaN(value) || parseFloat(value) <= 0) {
            return 'Please enter a valid price';
          }
        }
      });

      if (price) {
        await artService.listForSale(artworkId, parseFloat(price));
        Swal.fire('Success!', 'Artwork listed for sale', 'success');
        loadUserData();
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [artworkId]: false }));
    }
  };

  const removeFromSale = async (artworkId) => {
    setLoadingStates(prev => ({ ...prev, [artworkId]: true }));
    
    try {
      const result = await Swal.fire({
        title: 'Remove from Sale?',
        text: 'This artwork will no longer be available in marketplace',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, remove it!'
      });

      if (result.isConfirmed) {
        await artService.listForSale(artworkId, 0);
        Swal.fire('Removed!', 'Artwork removed from marketplace', 'success');
        loadUserData();
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, [artworkId]: false }));
    }
  };

  const downloadArtwork = async (artwork) => {
    setLoadingStates(prev => ({ ...prev, [`download_${artwork.id}`]: true }));
    
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
    } finally {
      setLoadingStates(prev => ({ ...prev, [`download_${artwork.id}`]: false }));
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
      Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Failed to copy text to clipboard'
      });
    }
  };

  const getImagePreview = (artwork) => {
    if (artwork.imageUrl) {
      return artwork.imageUrl;
    }
    
    const colors = ['#4A90E2', '#50E3C2', '#B8E986', '#BD10E0', '#9013FE'];
    const color = colors[artwork.id % colors.length] || '#4A90E2';
    
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${artwork.fileName || 'Artwork'}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 mt-5">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSeller = user?.role === 'Seller';
  const displayArtworks = isSeller ? artworks : purchasedArtworks;
  const forSaleCount = artworks.filter(a => a.isListedForSale && a.salePrice > 0).length;

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Dashboard</h1>
              <p className="lead">
                Welcome back, {user?.username}! 
                <span className="badge bg-primary ms-2">{user?.role}</span>
              </p>
            </div>
            <div>
              <button
                onClick={loadUserData}
                className="btn btn-outline-secondary me-2"
                disabled={isLoading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
          </div>

          {/* Wallet Balance */}
          {walletBalance !== null && (
            <div className="card bg-primary text-white mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="card-title mb-1">
                      <i className="bi bi-wallet2 me-2"></i>
                      Hedera Wallet Balance
                    </h5>
                    <p className="mb-0">Connected to Testnet</p>
                  </div>
                  <div className="col-md-4 text-end">
                    <h3 className="mb-1">{walletBalance.toFixed(2)} HBAR</h3>
                    <button 
                      className="btn btn-light btn-sm"
                      onClick={handleViewWallet}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      View on HashScan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="row mb-5">
            {isSeller ? (
              <>
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-cloud-upload"></i>
                      </div>
                      <h5>Upload Artwork</h5>
                      <p className="text-muted">Register new artwork</p>
                      <button
                        onClick={handleUploadClick}
                        className="btn btn-primary btn-sm"
                      >
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Now
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-shop"></i>
                      </div>
                      <h5>Marketplace</h5>
                      <p className="text-muted">View marketplace</p>
                      <button
                        onClick={handleMarketplaceClick}
                        className="btn btn-outline-success btn-sm"
                      >
                        <i className="bi bi-shop me-2"></i>
                        Visit Market
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-graph-up"></i>
                      </div>
                      <h5>Statistics</h5>
                      <p className="text-muted mb-1">
                        Total: <strong>{artworks.length}</strong>
                      </p>
                      <p className="text-muted mb-0">
                        For Sale: <strong>{forSaleCount}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-cash-coin"></i>
                      </div>
                      <h5>Sales</h5>
                      <p className="text-muted mb-1">
                        Total Sales: <strong>{salesStats.totalSales}</strong>
                      </p>
                      <p className="text-muted mb-0">
                        Revenue: <strong>{salesStats.totalRevenue.toFixed(2)} HBAR</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-shop"></i>
                      </div>
                      <h5>Marketplace</h5>
                      <p className="text-muted">Browse artworks</p>
                      <button
                        onClick={handleMarketplaceClick}
                        className="btn btn-primary btn-sm"
                      >
                        <i className="bi bi-shop me-2"></i>
                        Browse Artworks
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-download"></i>
                      </div>
                      <h5>My Collection</h5>
                      <p className="text-muted mb-1">
                        Purchased: <strong>{purchasedArtworks.length}</strong>
                      </p>
                      <p className="text-muted mb-0">
                        Downloads Available
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-search"></i>
                      </div>
                      <h5>Verify Artwork</h5>
                      <p className="text-muted">Check authenticity</p>
                      <button
                        onClick={handleVerifyClick}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-search me-2"></i>
                        Verify Now
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="feature-icon mx-auto mb-3">
                        <i className="bi bi-cash-stack"></i>
                      </div>
                      <h5>Purchase History</h5>
                      <p className="text-muted mb-1">
                        Total Spent: <strong>{salesStats.totalRevenue.toFixed(2)} HBAR</strong>
                      </p>
                      <p className="text-muted mb-0">
                        Artworks: <strong>{salesStats.totalSales}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Artworks Section */}
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                  {isSeller ? 'My Artworks' : 'My Collection'}
                </h2>
                <div>
                  <span className="badge bg-primary me-2">{displayArtworks.length} items</span>
                  {isSeller && (
                    <span className="badge bg-success">
                      {forSaleCount} for sale
                    </span>
                  )}
                </div>
              </div>

              {displayArtworks.length === 0 ? (
                <div className="text-center py-5">
                  <div className="feature-icon mx-auto mb-4">
                    <i className="bi bi-image"></i>
                  </div>
                  <h4>
                    {isSeller ? 'No Artworks Yet' : 'No Purchased Artworks'}
                  </h4>
                  <p className="text-muted mb-4">
                    {isSeller 
                      ? 'Start by uploading your first artwork to the blockchain'
                      : 'Browse the marketplace to purchase your first artwork'
                    }
                  </p>
                  <button
                    onClick={isSeller ? handleUploadClick : handleMarketplaceClick}
                    className="btn btn-primary btn-lg"
                  >
                    <i className={`bi ${isSeller ? 'bi-cloud-upload' : 'bi-shop'} me-2`}></i>
                    {isSeller ? 'Upload Your First Artwork' : 'Browse Marketplace'}
                  </button>
                </div>
              ) : (
                <div className="row">
                  {displayArtworks.map((artwork) => (
                    <div key={artwork.id} className="col-lg-4 col-md-6 mb-4">
                      <div className="card artwork-card h-100">
                        <div className="artwork-image-container">
                          <img
                            src={getImagePreview(artwork)}
                            alt={artwork.fileName}
                            className="artwork-image"
                          />
                          {isSeller && artwork.isListedForSale && artwork.salePrice > 0 && (
                            <div className="for-sale-badge">
                              <i className="bi bi-tag me-1"></i>
                              FOR SALE: {artwork.salePrice} HBAR
                            </div>
                          )}
                          {!isSeller && (
                            <div className="purchased-badge">
                              <i className="bi bi-check-lg me-1"></i>
                              PURCHASED
                            </div>
                          )}
                          {artwork.transactionId && artwork.transactionId !== 'NOT_REGISTERED' && (
                            <div className="verified-badge">
                              <i className="bi bi-check-lg me-1"></i>
                              VERIFIED
                            </div>
                          )}
                        </div>
                        
                        <div className="card-body">
                          <h6 className="card-title text-truncate" title={artwork.fileName}>
                            <i className="bi bi-file-image me-2 text-primary"></i>
                            {artwork.fileName}
                          </h6>
                          
                          <div className="artwork-details">
                            <div className="detail-row">
                              <span className="detail-label">Size:</span>
                              <span className="detail-value">
                                {formatFileSize(artwork.fileSize)}
                              </span>
                            </div>
                            
                            <div className="detail-row">
                              <span className="detail-label">
                                {isSeller ? 'Uploaded:' : 'Purchased:'}
                              </span>
                              <span className="detail-value">
                                {formatDate(artwork.createdAt)}
                              </span>
                            </div>

                            {/* Transaction ID Display for Both Users */}
                            {artwork.transactionId && artwork.transactionId !== 'NOT_REGISTERED' && (
                              <div className="detail-row">
                                <span className="detail-label">Transaction ID:</span>
                                <div className="detail-value">
                                  <div className="hash-display" 
                                       onClick={() => copyToClipboard(artwork.transactionId)}
                                       title="Click to copy">
                                    {artwork.transactionId.substring(0, 20)}...
                                    <i className="bi bi-copy copy-icon ms-2 text-muted"></i>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isSeller && artwork.sha256Hash && (
                              <div className="detail-row">
                                <span className="detail-label">SHA256 Hash:</span>
                                <div className="detail-value">
                                  <div className="hash-display" 
                                       onClick={() => copyToClipboard(artwork.sha256Hash)}
                                       title="Click to copy">
                                    {artwork.sha256Hash.substring(0, 20)}...
                                    <i className="bi bi-copy copy-icon ms-2 text-muted"></i>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="d-grid gap-2">
                              <button
                                onClick={() => downloadArtwork(artwork)}
                                className="btn btn-outline-primary btn-sm"
                                disabled={loadingStates[`download_${artwork.id}`]}
                              >
                                {loadingStates[`download_${artwork.id}`] ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-download me-2"></i>
                                    Download Image
                                  </>
                                )}
                              </button>
                              
                              {isSeller && (!artwork.isListedForSale || artwork.salePrice === 0) ? (
                                <button
                                  onClick={() => listForSale(artwork.id)}
                                  className="btn btn-outline-success btn-sm"
                                  disabled={loadingStates[artwork.id]}
                                >
                                  {loadingStates[artwork.id] ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-tag me-2"></i>
                                      List for Sale
                                    </>
                                  )}
                                </button>
                              ) : isSeller && (
                                <div className="text-center">
                                  <span className="badge bg-success me-2">
                                    Listed for {artwork.salePrice} HBAR
                                  </span>
                                  <div className="mt-2">
                                    <button
                                      onClick={() => listForSale(artwork.id)}
                                      className="btn btn-outline-warning btn-sm me-2"
                                      disabled={loadingStates[artwork.id]}
                                    >
                                      <i className="bi bi-pencil me-1"></i>
                                      Edit Price
                                    </button>
                                    <button
                                      onClick={() => removeFromSale(artwork.id)}
                                      className="btn btn-outline-danger btn-sm"
                                      disabled={loadingStates[artwork.id]}
                                    >
                                      <i className="bi bi-x-circle me-1"></i>
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;