import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useMedia } from '../MediaContext';
import { ref, update, get, set } from 'firebase/database';
import { database, auth } from '../firebase';

const GeneralSettings = () => {
  const [patientsPerPage, setPatientsPerPage] = useState(10);
  const [screenTime, setScreenTime] = useState(15);
  const [clinicName, setClinicName] = useState('');
  const { mediaFiles, setMediaFiles, loading, setLoading } = useMedia();
  const fileInputRef = useRef(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    section: {
      marginBottom: '30px',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    label: {
      fontWeight: 'bold',
      minWidth: '200px',
    },
    numberInput: {
      width: '80px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      textAlign: 'center',
    },
    textInput: {
      width: '300px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
    },
    updateButton: {
      backgroundColor: '#3865ad',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    mediaButton: {
      backgroundColor: '#3865ad',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    mediaGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      marginTop: '20px',
    },
    mediaItem: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '8px',
    },
    deleteButton: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      backgroundColor: 'rgba(255, 0, 0, 0.7)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '25px',
      height: '25px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
    },
    mediaItemContainer: {
      position: 'relative',
    },
    unit: {
      color: '#666',
      marginLeft: '5px',
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    videoInputContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      alignItems: 'center',
    },
    videoInput: {
      flex: 1,
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #3865ad',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '10px',
    },
  };

  useEffect(() => {
    fetchMedia();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
      const snapshot = await get(metadataRef);
      
      if (!snapshot.exists()) {
        // If metadata doesn't exist, create it with default values
        const defaultMetadata = {
          patient_number: 10,
          screen_time: 15,
          clinic_name: ""
        };
        
        await set(metadataRef, defaultMetadata);
        setPatientsPerPage(defaultMetadata.patient_number);
        setScreenTime(defaultMetadata.screen_time);
        setClinicName(defaultMetadata.clinic_name);
      } else {
        // If metadata exists, set the state with existing values
        const metadata = snapshot.val();
        setPatientsPerPage(metadata.patient_number);
        setScreenTime(metadata.screen_time);
        setClinicName(metadata.clinic_name);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('media_bucket')
        .list(`${auth.currentUser.uid}`); // Changed from 'public' to user's UID
  
      if (error) throw error;
  
      const urls = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media_bucket')
            .getPublicUrl(`${auth.currentUser.uid}/${file.name}`); // Changed path to include UID
          
          return {
            url: publicUrl,
            type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'image',
            name: file.name
          };
        })
      );
  
      const orderRef = ref(database, `users/${auth.currentUser.uid}/mediaOrder`);
      const orderSnapshot = await get(orderRef);
      const currentOrder = orderSnapshot.val()?.urls || [];
      setPhotoCount(currentOrder.length);
  
      if (currentOrder.length > 0) {
        const orderedFiles = currentOrder
          .map(url => {
            const file = urls.find(f => f.url === url);
            if (file) return file;
            if (url.includes('youtube.com/embed/')) {
              const videoId = url.split('/').pop();
              return {
                url,
                type: 'video',
                name: `youtube-${videoId}`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              };
            }
            return null;
          })
          .filter(Boolean);
        
        const remainingFiles = urls.filter(
          file => !currentOrder.includes(file.url)
        );
        
        setMediaFiles([...orderedFiles, ...remainingFiles]);
      } else {
        setMediaFiles([]);
      }
  
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleVideoSubmit = async () => {
    try {
      const videoId = getYouTubeVideoId(videoUrl);
      
      if (!videoId) {
        alert('Please enter a valid YouTube URL');
        return;
      }

      setIsVideoLoading(true);

      const newVideoFile = {
        url: `https://www.youtube.com/embed/${videoId}`,
        type: 'video',
        name: `youtube-${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };

      const updatedMediaFiles = [...mediaFiles, newVideoFile];
      setMediaFiles(updatedMediaFiles);

      await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
        urls: updatedMediaFiles.map(file => file.url)
      });

      setVideoUrl('');
      setShowVideoInput(false);

    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error adding video. Please try again.');
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handlePatientsUpdate = async () => {
    try {
      const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
      await update(metadataRef, {
        patient_number: patientsPerPage
      });
      console.log('Successfully updated patients per page');
    } catch (error) {
      console.error('Error updating patients per page:', error);
    }
  };

  const handleScreenTimeUpdate = async () => {
    try {
      const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
      await update(metadataRef, {
        screen_time: screenTime
      });
      console.log('Successfully updated screen time');
    } catch (error) {
      console.error('Error updating screen time:', error);
    }
  };

  const handleClinicNameUpdate = async () => {
    try {
      const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
      await update(metadataRef, {
        clinic_name: clinicName
      });
      console.log('Successfully updated clinic name');
    } catch (error) {
      console.error('Error updating clinic name:', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    try {
      const files = Array.from(event.target.files);
      
      if (photoCount + files.length > 15) {
        alert('You can only upload a maximum of 15 photos');
        return;
      }

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert('Please upload only image files');
          return;
        }

        if (file.size > 1024 * 1024) {
          alert('Each file must be less than 1MB');
          return;
        }
      }

      setLoading(true);
  
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${auth.currentUser.uid}/${fileName}`; // Changed from 'public' to include UID
  
        const { error: uploadError } = await supabase.storage
          .from('media_bucket')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });
  
        if (uploadError) throw uploadError;
      }
  
      const { data: newMediaFiles } = await supabase.storage
        .from('media_bucket')
        .list(`${auth.currentUser.uid}`); // Changed from 'public' to user's UID
  
      const newUrls = await Promise.all(
        newMediaFiles.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media_bucket')
            .getPublicUrl(`${auth.currentUser.uid}/${file.name}`); // Changed path to include UID
          
          return {
            url: publicUrl,
            type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'image',
            name: file.name
          };
        })
      );
  
      setMediaFiles(newUrls);
      
      await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
        urls: newUrls.map(file => file.url)
      });
  
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteMedia = async (fileName) => {
    try {
      setLoading(true);
      
      if (fileName.startsWith('youtube-')) {
        const updatedMediaFiles = mediaFiles.filter(file => file.name !== fileName);
        setMediaFiles(updatedMediaFiles);
        
        await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
          urls: updatedMediaFiles.map(file => file.url)
        });
      } else {
        const { error } = await supabase.storage
          .from('media_bucket')
          .remove([`${auth.currentUser.uid}/${fileName}`]); // Changed from 'public' to include UID
    
        if (error) throw error;
    
        await fetchMedia();
        
        const remainingMediaFiles = mediaFiles.filter(file => file.name !== fileName);
        const urls = remainingMediaFiles.map(file => file.url);
        
        await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
          urls: urls
        });
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteMedia = async (fileName) => {
  //   try {
  //     setLoading(true);
      
  //     if (fileName.startsWith('youtube-')) {
  //       const updatedMediaFiles = mediaFiles.filter(file => file.name !== fileName);
  //       setMediaFiles(updatedMediaFiles);
        
  //       await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
  //         urls: updatedMediaFiles.map(file => file.url)
  //       });
  //     } else {
  //       const { error } = await supabase.storage
  //         .from('media_bucket')
  //         .remove([`public/${fileName}`]);
    
  //       if (error) throw error;
    
  //       await fetchMedia();
        
  //       const remainingMediaFiles = mediaFiles.filter(file => file.name !== fileName);
  //       const urls = remainingMediaFiles.map(file => file.url);
        
  //       await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
  //         urls: urls
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error deleting media:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddVideoUrl = () => {
    setShowVideoInput(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Number of patients per page:</label>
          <input
            type="number"
            min="1"
            value={patientsPerPage}
            onChange={(e) => setPatientsPerPage(Math.max(1, parseInt(e.target.value) || 0))}
            style={styles.numberInput}
          />
          <button style={styles.updateButton} onClick={handlePatientsUpdate}>
            Update
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Time for each screen:</label>
          <input
            type="number"
            min="1"
            value={screenTime}
            onChange={(e) => setScreenTime(Math.max(1, parseInt(e.target.value) || 0))}
            style={styles.numberInput}
          />
          <span style={styles.unit}>seconds</span>
          <button style={styles.updateButton} onClick={handleScreenTimeUpdate}>
            Update
          </button>
        </div>
      </div>
      <div style={styles.section}>
  <div style={styles.inputGroup}>
    <label style={styles.label}>Name of the clinic:</label>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
      <input
        type="text"
        value={clinicName}
        onChange={(e) => setClinicName(e.target.value)}
        placeholder="Enter your clinic name"
        style={styles.textInput}
      />
      <span style={{ 
        fontSize: '12px', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        This name will be displayed on the TV screen in your waiting room
      </span>
    </div>
    <button style={styles.updateButton} onClick={handleClinicNameUpdate}>
      Update
    </button>
  </div>
</div>

      {/* <div style={styles.section}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Name of the clinic:</label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="This will be displayed on your TV"
            style={styles.textInput}
          />
          <button style={styles.updateButton} onClick={handleClinicNameUpdate}>
            Update
          </button>
        </div>
      </div> */}

      <div style={styles.section}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />
        <div style={styles.buttonContainer}>
          <button 
            style={styles.mediaButton}
            onClick={() => fileInputRef.current.click()}
          >
            Add Photos {photoCount}/15
          </button>
          {/* <button 
            style={styles.mediaButton}
            onClick={handleAddVideoUrl}
          >
            Add Video URL
          </button> */}
        </div>

        {showVideoInput && (
          <div style={styles.videoInputContainer}>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Add only YouTube link/URL"
              style={styles.videoInput}
            />
            {isVideoLoading && <div style={styles.loadingSpinner} />}
            <button 
              style={styles.updateButton}
              onClick={handleVideoSubmit}
              disabled={isVideoLoading}
            >
              Submit
            </button>
          </div>
        )}

        <div style={styles.mediaGrid}>
        {mediaFiles.map((file, index) => (
  <div key={index} style={styles.mediaItemContainer}>
    {file.type === 'video' ? (
      file.url.includes('youtube.com') ? (
        <iframe
          src={file.url}
          style={{
            ...styles.mediaItem,
            border: 'none'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`YouTube video ${index + 1}`}
        />
      ) : (
        <video style={styles.mediaItem} controls>
          <source src={file.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )
    ) : (
      <img
        src={file.url}
        alt={`Uploaded media ${index + 1}`}
        style={styles.mediaItem}
      />
    )}
    <button
      style={styles.deleteButton}
      onClick={() => handleDeleteMedia(file.name)}
    >
      ×
    </button>
  </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
