import { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database, auth } from './firebase';

const MediaContext = createContext();

export const MediaProvider = ({ children }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const orderRef = ref(database, `users/${auth.currentUser.uid}/mediaOrder`);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        const data = snapshot.val();
        if (data?.urls) {
          // When order changes in Firebase, reorder the mediaFiles
          setMediaFiles(prevFiles => {
            if (!prevFiles.length) return prevFiles;
            
            const orderedFiles = data.urls
              .map(url => prevFiles.find(file => file.url === url))
              .filter(Boolean);
            
            // Add any files that aren't in the order
            const remainingFiles = prevFiles.filter(
              file => !data.urls.includes(file.url)
            );
            
            return [...orderedFiles, ...remainingFiles];
          });
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <MediaContext.Provider value={{ 
      mediaFiles, 
      setMediaFiles, 
      loading, 
      setLoading 
    }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => useContext(MediaContext);