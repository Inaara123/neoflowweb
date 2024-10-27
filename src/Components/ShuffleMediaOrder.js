import React, { useState, useRef, useEffect, useCallback } from 'react';
import DraggableList from 'react-draggable-list';
import { ref, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { useMedia } from '../MediaContext';

const ShuffleMediaOrder = () => {
  const { mediaFiles, setMediaFiles } = useMedia();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const getContainer = useCallback(() => containerRef.current, []);

  useEffect(() => {
    if (mediaFiles) {
      setLoading(false);
    }
  }, [mediaFiles]);

  const TemplateItem = ({ item, itemSelected, dragHandleProps }) => {
    const [isItemHovered, setIsItemHovered] = useState(false);
  
    const getYouTubeVideoId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
  
    const getThumbnailUrl = (url) => {
      const videoId = getYouTubeVideoId(url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    };
  
    const styles = {
      item: {
        userSelect: 'none',
        padding: '16px',
        margin: '0 0 8px 0',
        minHeight: '200px',
        width: '400px',
        marginLeft: '-100px',
        backgroundColor: itemSelected ? '#3A5A72' : '#3865ad',
        color: 'white',
        cursor: 'move',
        transition: 'all 0.3s ease',
        borderRadius: '15px',
        transform: isItemHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isItemHovered ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
        zIndex: isItemHovered ? 1 : 'auto',
      },
      mediaContainer: {
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        borderRadius: '8px',
      },
      media: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }
    };
  
    return (
      <div
        style={styles.item}
        {...dragHandleProps}
        onMouseEnter={() => setIsItemHovered(true)}
        onMouseLeave={() => setIsItemHovered(false)}
      >
        <div style={styles.mediaContainer}>
          {item.type === 'video' && item.url.includes('youtube.com') ? (
            <img
              src={getThumbnailUrl(item.url)}
              alt={`YouTube thumbnail for ${item.name || 'video'}`}
              style={styles.media}
            />
          ) : item.type === 'video' ? (
            <video style={styles.media} controls>
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={item.url}
              alt={`Media ${item.id}`}
              style={styles.media}
            />
          )}
        </div>
      </div>
    );
  };

  const handleMoveEnd = (newList) => {
    const updatedList = [...newList];
    
    // Update Firebase first
    const orderedUrls = updatedList.map(item => item.url);
    update(ref(database, `users/${auth.currentUser.uid}/mediaOrder`), {
      urls: orderedUrls
    }).then(() => {
      // Only update the context after Firebase update is successful
      setMediaFiles(updatedList);
    }).catch((error) => {
      console.error('Error updating media order:', error);
    });
  };

  const styles = {
    container: {
      maxWidth: '300px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    list: {
      listStyleType: 'none',
      padding: 0,
      position: 'relative', // Add this
    },
    emptyMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      color: '#666',
      marginTop: '20px',
    },
  };

  if (loading) {
    return <div style={styles.emptyMessage}>Loading...</div>;
  }

  if (!mediaFiles || mediaFiles.length === 0) {
    return <div style={styles.emptyMessage}>No media files uploaded</div>;
  }

  const processedList = mediaFiles.map((file, index) => ({
    ...file,
    id: index.toString()
  }));

  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.list}>
        <DraggableList
          itemKey="id"
          template={TemplateItem}
          list={processedList}
          onMoveEnd={handleMoveEnd}
          container={getContainer}
          commonProps={{}}
          padding={10}
        />
      </div>
    </div>
  );
};

export default ShuffleMediaOrder;