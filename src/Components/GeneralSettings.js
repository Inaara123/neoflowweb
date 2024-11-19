import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useMedia } from '../MediaContext';
import { ref, update, get, set } from 'firebase/database';
import { database, auth } from '../firebase';

const GeneralSettings = () => {
  const [patientsPerPage, setPatientsPerPage] = useState(10);
  const [screenTime, setScreenTime] = useState(15);
  const [clinicName, setClinicName] = useState('');
  const [bannerColor, setBannerColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontColorPicker, setShowFontColorPicker] = useState(false);
  const { mediaFiles, setMediaFiles, loading, setLoading } = useMedia();
  const fileInputRef = useRef(null);
  const [photoCount, setPhotoCount] = useState(0);

  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Helvetica',
    'Tahoma',
    'Trebuchet MS',
    'Impact'
  ];

  const defaultColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#808080', '#800000'
  ];

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
    colorInput: {
      width: '100px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
    },
    colorPreview: {
      width: '36px',
      height: '36px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      cursor: 'pointer',
    },
    colorPickerContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    defaultColors: {
      display: 'flex',
      gap: '5px',
      flexWrap: 'wrap',
      maxWidth: '200px',
      marginTop: '5px',
    },
    colorSwatch: {
      width: '25px',
      height: '25px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #ccc',
    },
    fontSelect: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      width: '200px',
    },
    settingGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '15px',
    },
    settingLabel: {
      fontSize: '12px',
      color: '#666',
      fontStyle: 'italic',
    },
    previewContainer: {
      marginTop: '10px',
      padding: '15px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    colorSettingsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      marginTop: '10px',
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
        const defaultMetadata = {
          patient_number: 10,
          screen_time: 15,
          clinic_name: "",
          banner_color: "#ffffff",
          font_color: "#000000",
          font_family: "Arial"
        };
        
        await set(metadataRef, defaultMetadata);
        setPatientsPerPage(defaultMetadata.patient_number);
        setScreenTime(defaultMetadata.screen_time);
        setClinicName(defaultMetadata.clinic_name);
        setBannerColor(defaultMetadata.banner_color);
        setFontColor(defaultMetadata.font_color);
        setFontFamily(defaultMetadata.font_family);
      } else {
        const metadata = snapshot.val();
        setPatientsPerPage(metadata.patient_number);
        setScreenTime(metadata.screen_time);
        setClinicName(metadata.clinic_name);
        setBannerColor(metadata.banner_color || '#ffffff');
        setFontColor(metadata.font_color || '#000000');
        setFontFamily(metadata.font_family || 'Arial');
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
        .list(`${auth.currentUser.uid}`);
  
      if (error) throw error;
  
      const urls = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media_bucket')
            .getPublicUrl(`${auth.currentUser.uid}/${file.name}`);
          
          return {
            url: publicUrl,
            type: 'image',
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
          .map(url => urls.find(f => f.url === url))
          .filter(Boolean);
        
        const remainingFiles = urls.filter(
          file => !currentOrder.includes(file.url)
        );
        
        setMediaFiles([...orderedFiles, ...remainingFiles]);
      } else {
        setMediaFiles(urls);
      }
  
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
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

  const handleClinicSettingsUpdate = async () => {
    try {
      const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
      await update(metadataRef, {
        clinic_name: clinicName,
        banner_color: bannerColor,
        font_color: fontColor,
        font_family: fontFamily
      });
      console.log('Successfully updated clinic settings');
    } catch (error) {
      console.error('Error updating clinic settings:', error);
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
        const filePath = `${auth.currentUser.uid}/${fileName}`;
  
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
        .list(`${auth.currentUser.uid}`);
  
      const newUrls = await Promise.all(
        newMediaFiles.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media_bucket')
            .getPublicUrl(`${auth.currentUser.uid}/${file.name}`);
          
          return {
            url: publicUrl,
            type: 'image',
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
      
      const { error } = await supabase.storage
        .from('media_bucket')
        .remove([`${auth.currentUser.uid}/${fileName}`]);
  
      if (error) throw error;
  
      await fetchMedia();
      
      const remainingMediaFiles = mediaFiles.filter(file => file.name !== fileName);
      const urls = remainingMediaFiles.map(file => file.url);
      
      await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
        urls: urls
      });
    } catch (error) {
      console.error('Error deleting media:', error);
    } finally {
      setLoading(false);
    }
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
        <div style={styles.settingGroup}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name of the clinic:</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Enter your clinic name"
              style={styles.textInput}
            />
          </div>

          <div style={styles.colorSettingsContainer}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Banner Color:</label>
              <div style={styles.colorPickerContainer}>
                <input
                  type="text"
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                  style={styles.colorInput}
                  placeholder="#FFFFFF or RGB"
                />
                <input
                  type="color"
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                  style={{ marginLeft: '10px' }}
                />
              </div>
              <span style={styles.settingLabel}>(This will be the color of your banner in TV)</span>
            </div>

            <div style={styles.defaultColors}>
              {defaultColors.map((color) => (
                <div
                  key={color}
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: color
                  }}
                  onClick={() => setBannerColor(color)}
                />
              ))}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Font Color:</label>
              <div style={styles.colorPickerContainer}>
                <input
                  type="text"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={styles.colorInput}
                  placeholder="#000000 or RGB"
                />
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={{ marginLeft: '10px' }}
                />
              </div>
              <span style={styles.settingLabel}>(This will be the font color displayed on your TV)</span>
            </div>

            <div style={styles.defaultColors}>
              {defaultColors.map((color) => (
                <div
                  key={color}
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: color
                  }}
                  onClick={() => setFontColor(color)}
                />
              ))}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Font Style:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={styles.fontSelect}
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div style={styles.previewContainer}>
              <div style={styles.settingLabel}>Preview:</div>
              <div style={{
                backgroundColor: bannerColor,
                padding: '10px',
                borderRadius: '4px',
                marginTop: '5px',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  color: fontColor,
                  fontFamily: fontFamily,
                  fontSize: '18px'
                }}>
                  {clinicName || 'Your Clinic Name'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              style={styles.updateButton} 
              onClick={handleClinicSettingsUpdate}
            >
              Update All Settings
            </button>
          </div>
        </div>
      </div>
      <div style={styles.section}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button 
          style={styles.mediaButton}
          onClick={() => fileInputRef.current.click()}
        >
          Add Photos {photoCount}/15
        </button>

        <div style={styles.mediaGrid}>
          {mediaFiles.map((file, index) => (
            <div key={index} style={styles.mediaItemContainer}>
              <img
                src={file.url}
                alt={`Uploaded media ${index + 1}`}
                style={styles.mediaItem}
              />
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


// import React, { useState, useRef, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { useMedia } from '../MediaContext';
// import { ref, update, get, set } from 'firebase/database';
// import { database, auth } from '../firebase';

// const GeneralSettings = () => {
//   const [patientsPerPage, setPatientsPerPage] = useState(10);
//   const [screenTime, setScreenTime] = useState(15);
//   const [clinicName, setClinicName] = useState('');
//   const { mediaFiles, setMediaFiles, loading, setLoading } = useMedia();
//   const fileInputRef = useRef(null);
//   const [photoCount, setPhotoCount] = useState(0);

//   const styles = {
//     container: {
//       padding: '20px',
//       maxWidth: '800px',
//       margin: '0 auto',
//     },
//     section: {
//       marginBottom: '30px',
//       backgroundColor: '#f5f5f5',
//       padding: '20px',
//       borderRadius: '8px',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//     },
//     inputGroup: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '10px',
//       marginBottom: '10px',
//     },
//     label: {
//       fontWeight: 'bold',
//       minWidth: '200px',
//     },
//     numberInput: {
//       width: '80px',
//       padding: '8px',
//       borderRadius: '4px',
//       border: '1px solid #ccc',
//       textAlign: 'center',
//     },
//     textInput: {
//       width: '300px',
//       padding: '8px',
//       borderRadius: '4px',
//       border: '1px solid #ccc',
//     },
//     updateButton: {
//       backgroundColor: '#3865ad',
//       color: 'white',
//       border: 'none',
//       padding: '8px 16px',
//       borderRadius: '4px',
//       cursor: 'pointer',
//       fontWeight: 'bold',
//     },
//     mediaButton: {
//       backgroundColor: '#3865ad',
//       color: 'white',
//       border: 'none',
//       padding: '12px 24px',
//       borderRadius: '4px',
//       cursor: 'pointer',
//       fontWeight: 'bold',
//       marginBottom: '20px',
//     },
//     mediaGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
//       gap: '20px',
//       marginTop: '20px',
//     },
//     mediaItem: {
//       width: '100%',
//       height: '200px',
//       objectFit: 'cover',
//       borderRadius: '8px',
//     },
//     deleteButton: {
//       position: 'absolute',
//       top: '5px',
//       right: '5px',
//       backgroundColor: 'rgba(255, 0, 0, 0.7)',
//       color: 'white',
//       border: 'none',
//       borderRadius: '50%',
//       width: '25px',
//       height: '25px',
//       cursor: 'pointer',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       fontSize: '14px',
//     },
//     mediaItemContainer: {
//       position: 'relative',
//     },
//     unit: {
//       color: '#666',
//       marginLeft: '5px',
//     },
//   };

//   useEffect(() => {
//     fetchMedia();
//     fetchMetadata();
//   }, []);

//   const fetchMetadata = async () => {
//     try {
//       const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
//       const snapshot = await get(metadataRef);
      
//       if (!snapshot.exists()) {
//         const defaultMetadata = {
//           patient_number: 10,
//           screen_time: 15,
//           clinic_name: ""
//         };
        
//         await set(metadataRef, defaultMetadata);
//         setPatientsPerPage(defaultMetadata.patient_number);
//         setScreenTime(defaultMetadata.screen_time);
//         setClinicName(defaultMetadata.clinic_name);
//       } else {
//         const metadata = snapshot.val();
//         setPatientsPerPage(metadata.patient_number);
//         setScreenTime(metadata.screen_time);
//         setClinicName(metadata.clinic_name);
//       }
//     } catch (error) {
//       console.error('Error fetching metadata:', error);
//     }
//   };

//   const fetchMedia = async () => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase.storage
//         .from('media_bucket')
//         .list(`${auth.currentUser.uid}`);
  
//       if (error) throw error;
  
//       const urls = await Promise.all(
//         data.map(async (file) => {
//           const { data: { publicUrl } } = supabase.storage
//             .from('media_bucket')
//             .getPublicUrl(`${auth.currentUser.uid}/${file.name}`);
          
//           return {
//             url: publicUrl,
//             type: 'image',
//             name: file.name
//           };
//         })
//       );
  
//       const orderRef = ref(database, `users/${auth.currentUser.uid}/mediaOrder`);
//       const orderSnapshot = await get(orderRef);
//       const currentOrder = orderSnapshot.val()?.urls || [];
//       setPhotoCount(currentOrder.length);
  
//       if (currentOrder.length > 0) {
//         const orderedFiles = currentOrder
//           .map(url => urls.find(f => f.url === url))
//           .filter(Boolean);
        
//         const remainingFiles = urls.filter(
//           file => !currentOrder.includes(file.url)
//         );
        
//         setMediaFiles([...orderedFiles, ...remainingFiles]);
//       } else {
//         setMediaFiles(urls);
//       }
  
//     } catch (error) {
//       console.error('Error fetching media:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePatientsUpdate = async () => {
//     try {
//       const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
//       await update(metadataRef, {
//         patient_number: patientsPerPage
//       });
//       console.log('Successfully updated patients per page');
//     } catch (error) {
//       console.error('Error updating patients per page:', error);
//     }
//   };

//   const handleScreenTimeUpdate = async () => {
//     try {
//       const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
//       await update(metadataRef, {
//         screen_time: screenTime
//       });
//       console.log('Successfully updated screen time');
//     } catch (error) {
//       console.error('Error updating screen time:', error);
//     }
//   };

//   const handleClinicNameUpdate = async () => {
//     try {
//       const metadataRef = ref(database, `users/${auth.currentUser.uid}/metaData`);
//       await update(metadataRef, {
//         clinic_name: clinicName
//       });
//       console.log('Successfully updated clinic name');
//     } catch (error) {
//       console.error('Error updating clinic name:', error);
//     }
//   };

//   const handlePhotoUpload = async (event) => {
//     try {
//       const files = Array.from(event.target.files);
      
//       if (photoCount + files.length > 15) {
//         alert('You can only upload a maximum of 15 photos');
//         return;
//       }

//       for (const file of files) {
//         if (!file.type.startsWith('image/')) {
//           alert('Please upload only image files');
//           return;
//         }

//         if (file.size > 1024 * 1024) {
//           alert('Each file must be less than 1MB');
//           return;
//         }
//       }

//       setLoading(true);
  
//       for (const file of files) {
//         const fileExt = file.name.split('.').pop();
//         const fileName = `${Math.random()}.${fileExt}`;
//         const filePath = `${auth.currentUser.uid}/${fileName}`;
  
//         const { error: uploadError } = await supabase.storage
//           .from('media_bucket')
//           .upload(filePath, file, {
//             cacheControl: '3600',
//             upsert: false,
//             contentType: file.type
//           });
  
//         if (uploadError) throw uploadError;
//       }
  
//       const { data: newMediaFiles } = await supabase.storage
//         .from('media_bucket')
//         .list(`${auth.currentUser.uid}`);
  
//       const newUrls = await Promise.all(
//         newMediaFiles.map(async (file) => {
//           const { data: { publicUrl } } = supabase.storage
//             .from('media_bucket')
//             .getPublicUrl(`${auth.currentUser.uid}/${file.name}`);
          
//           return {
//             url: publicUrl,
//             type: 'image',
//             name: file.name
//           };
//         })
//       );
  
//       setMediaFiles(newUrls);
      
//       await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
//         urls: newUrls.map(file => file.url)
//       });
  
//     } catch (error) {
//       console.error('Error uploading photos:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteMedia = async (fileName) => {
//     try {
//       setLoading(true);
      
//       const { error } = await supabase.storage
//         .from('media_bucket')
//         .remove([`${auth.currentUser.uid}/${fileName}`]);
  
//       if (error) throw error;
  
//       await fetchMedia();
      
//       const remainingMediaFiles = mediaFiles.filter(file => file.name !== fileName);
//       const urls = remainingMediaFiles.map(file => file.url);
      
//       await update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
//         urls: urls
//       });
//     } catch (error) {
//       console.error('Error deleting media:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.section}>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>Number of patients per page:</label>
//           <input
//             type="number"
//             min="1"
//             value={patientsPerPage}
//             onChange={(e) => setPatientsPerPage(Math.max(1, parseInt(e.target.value) || 0))}
//             style={styles.numberInput}
//           />
//           <button style={styles.updateButton} onClick={handlePatientsUpdate}>
//             Update
//           </button>
//         </div>
//       </div>

//       <div style={styles.section}>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>Time for each screen:</label>
//           <input
//             type="number"
//             min="1"
//             value={screenTime}
//             onChange={(e) => setScreenTime(Math.max(1, parseInt(e.target.value) || 0))}
//             style={styles.numberInput}
//           />
//           <span style={styles.unit}>seconds</span>
//           <button style={styles.updateButton} onClick={handleScreenTimeUpdate}>
//             Update
//           </button>
//         </div>
//       </div>

//       <div style={styles.section}>
//         <div style={styles.inputGroup}>
//           <label style={styles.label}>Name of the clinic:</label>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
//             <input
//               type="text"
//               value={clinicName}
//               onChange={(e) => setClinicName(e.target.value)}
//               placeholder="Enter your clinic name"
//               style={styles.textInput}
//             />
//             <span style={{ 
//               fontSize: '12px', 
//               color: '#666',
//               fontStyle: 'italic'
//             }}>
//               This name will be displayed on the TV screen in your waiting room
//             </span>
//           </div>
//           <button style={styles.updateButton} onClick={handleClinicNameUpdate}>
//             Update
//           </button>
//         </div>
//       </div>

//       <div style={styles.section}>
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handlePhotoUpload}
//           multiple
//           accept="image/*"
//           style={{ display: 'none' }}
//         />
//         <button 
//           style={styles.mediaButton}
//           onClick={() => fileInputRef.current.click()}
//         >
//           Add Photos {photoCount}/15
//         </button>

//         <div style={styles.mediaGrid}>
//           {mediaFiles.map((file, index) => (
//             <div key={index} style={styles.mediaItemContainer}>
//               <img
//                 src={file.url}
//                 alt={`Uploaded media ${index + 1}`}
//                 style={styles.mediaItem}
//               />
//               <button
//                 style={styles.deleteButton}
//                 onClick={() => handleDeleteMedia(file.name)}
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GeneralSettings;