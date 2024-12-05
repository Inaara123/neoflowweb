import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { supabase } from '../supabaseClient';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  },
  form: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '10px',
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#3865ad',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  select: {
    width: '200px',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '20px',
  },
  qrContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  qrCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    textAlign: 'center',
  },
  qrImage: {
    width: '300px',
    height: '300px',
    margin: '20px auto',
  },
  link: {
    color: '#3865ad',
    textDecoration: 'underline',
  },
  helpText: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px',
  },
  downloadButton: {
    backgroundColor: 'white',
    color: '#3865ad',
    border: '1px solid #3865ad',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%',
    marginTop: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px',
  }
};

const QRCode = () => {
  const navigate = useNavigate();
  const [placeId, setPlaceId] = useState('');
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [qrSize, setQrSize] = useState('1000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlaceId();
  }, []);

  const fetchPlaceId = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('place_id')
        .eq('hospital_id', auth.currentUser.uid)
        .single();

      if (error) throw error;

      if (data?.place_id) {
        setPlaceId(data.place_id);
        setShowQRCodes(true);
      }
    } catch (error) {
      console.error('Error fetching place ID:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
  
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ place_id: placeId })
        .eq('hospital_id', auth.currentUser.uid);
  
      if (error) throw error;
  
      setShowQRCodes(true);
    } catch (error) {
      console.error('Error saving place ID:', error);
      alert('Failed to save Place ID. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const getGoogleReviewUrl = () => {
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  };

  const getNeoflowUrl = () => {
    const hospitalId = auth.currentUser?.uid;
    //return `https://neoflow.cloud/feedback/${placeId}/${hospitalId}`;
    return `https://feedback-two-pi.vercel.app/?placeId=${placeId}&hospitalId=${hospitalId}`;

  };

  const downloadQRCode = (url, name) => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}`;
    link.download = `${name}-${qrSize}px.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCodes = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes for Printing</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { 
              display: flex; 
              justify-content: space-around; 
              padding: 20px;
            }
            .qr-code {
              text-align: center;
              margin: 20px;
            }
            .qr-code img {
              width: 300px;
              height: 300px;
            }
            .qr-code h2 {
              margin: 10px 0;
              color: #333;
            }
            .qr-code p {
              color: #666;
              margin: 5px 0;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-code">
              <h2>Google Review</h2>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getGoogleReviewUrl())}" />
              <p>Scan to leave a Google review</p>
            </div>
            <div class="qr-code">
              <h2>Feedback Form</h2>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getNeoflowUrl())}" />
              <p>Scan to give us feedback</p>
            </div>
          </div>
          <button class="no-print" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px;">Print QR Codes</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>QR Code Settings</h1>
        <button style={styles.button} onClick={() => navigate('/home')}>
          Back to Settings
        </button>
      </div>

      <div style={styles.card}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label>Enter your Google Place ID</label>
            <input
              style={styles.input}
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="Enter Place ID"
              required
            />
            <p style={styles.helpText}>
              Don't know your Place ID? <a 
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.link}
              >
                Find it here
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
  <button 
    type="submit" 
    style={{
      ...styles.button,
      flex: 1,
      ...(saving ? styles.disabledButton : {})
    }}
    disabled={saving}
  >
    {saving ? 'Saving...' : 'Generate QR Codes'}
  </button>
  <button 
    type="button"
    style={{
      ...styles.button,
      flex: 1
    }}
    onClick={() => navigate('/review-dashboard')}
  >
    View Reviews
  </button>
</div>
        </form>
      </div>

      {showQRCodes && (
        <>
          <div style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <select 
              style={styles.select}
              value={qrSize}
              onChange={(e) => setQrSize(e.target.value)}
            >
              <option value="1000">1000x1000 (Large Print)</option>
              <option value="2000">2000x2000 (Extra Large)</option>
              <option value="3000">3000x3000 (Professional Print)</option>
            </select>
            <button style={styles.button} onClick={printQRCodes}>
              Print Both QR Codes
            </button>
          </div>

          <div style={styles.qrContainer}>
            <div style={styles.qrCard}>
              <h2> Google Review QR Code</h2>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getGoogleReviewUrl())}`}
                alt="Google Review QR Code"
                style={styles.qrImage}
              />
              <p style={styles.helpText}>Scans directly open Google Review page</p>
              <button style={styles.button} onClick={() => window.open(getGoogleReviewUrl(), '_blank')}>
                Test Link
              </button>
              <button 
                style={styles.downloadButton}
                onClick={() => downloadQRCode(getGoogleReviewUrl(), 'google-review')}
              >
                Download for Print
              </button>
            </div>

            <div style={styles.qrCard}>
              <h2> Feedback QR Code</h2>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getNeoflowUrl())}`}
                alt="Neoflow Feedback QR Code"
                style={styles.qrImage}
              />
              <p style={styles.helpText}>Opens Neoflow feedback form</p>
              <button style={styles.button} onClick={() => window.open(getNeoflowUrl(), '_blank')}>
                Test Link
              </button>
              <button 
                style={styles.downloadButton}
                onClick={() => downloadQRCode(getNeoflowUrl(), 'neoflow-feedback')}
              >
                Download for Print
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QRCode;