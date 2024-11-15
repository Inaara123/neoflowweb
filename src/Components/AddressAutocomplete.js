import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDNOsFoHO3VwBDJdu68ziFGTgvpbOB2yak';

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // Remove any existing Google Maps scripts to prevent conflicts
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

const AddressAutocomplete = ({ value, onChange, hospitalLocation, onLocationSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMapsScript();
        
        // Wait a bit to ensure all Google Maps objects are properly initialized
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
            setMapsLoaded(true);
            setIsLoading(false);
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setIsLoading(false);
      }
    };

    initializeGoogleMaps();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const calculateDistance = async (selectedLat, selectedLng, hospitalLat, hospitalLng) => {
    console.log("the hospital lat is :",hospitalLat)
    console.log("the hospital longitude is : ",hospitalLng)
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded');
      return { distance: 0, duration: 0 };
    }

    try {
      const service = new window.google.maps.DistanceMatrixService();
      
      const response = await new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [{ lat: hospitalLat, lng: hospitalLng }],
          destinations: [{ lat: selectedLat, lng: selectedLng }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC
        }, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            reject(new Error('Failed to calculate distance'));
          }
        });
      });

      const element = response.rows[0].elements[0];
      const distanceValue = element.distance.value; // in meters
      const durationValue = element.duration.value; // in seconds

      // Format the values
      const distanceInKm = (distanceValue / 1000).toFixed(2);
      const hours = Math.floor(durationValue / 3600);
      const minutes = Math.floor((durationValue % 3600) / 60);
      const formattedDuration = hours > 0 
        ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`
        : `${minutes} min`;
        console.log("the distance travelled is : ",distanceInKm)
        console.log("the time duration is : ",formattedDuration)

      return {
        distance: distanceValue,
        duration: durationValue,
        formattedDistance: `${distanceInKm} km`,
        formattedDuration: formattedDuration
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      return { 
        distance: 0, 
        duration: 0,
        formattedDistance: '0 km',
        formattedDuration: '0 min'
      };
    }
  };

  const fetchSuggestions = async (input) => {
    if (!input || !mapsLoaded || !autocompleteService.current) return;

    try {
      const [longitude, latitude] = hospitalLocation?.coordinates || [0, 0];
      
      const request = {
        input,
        sessionToken: sessionToken.current,
        location: new window.google.maps.LatLng(latitude, longitude),
        radius: 20000,
        //types: ['geocode', 'establishment', '(regions)', '(cities)'],
        componentRestrictions: { country: 'IN' }
      };

      const response = await new Promise((resolve) => {
        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const sortedPredictions = [...predictions].sort((a, b) => {
                const aLength = a.description.length;
                const bLength = b.description.length;
                return aLength - bLength;
              });
            resolve(sortedPredictions);
          } else {
            resolve([]);
          }
        });
      });

      setSuggestions(response);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
      setShowSuggestions(true);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      if (!placesService.current) return;

      const placeResult = await new Promise((resolve, reject) => {
        placesService.current.getDetails(
          {
            placeId: suggestion.place_id,
            fields: ['formatted_address', 'geometry']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(place);
            } else {
              reject(new Error('Failed to fetch place details'));
            }
          }
        );
      });

      const address = placeResult.formatted_address;
      const selectedLat = placeResult.geometry.location.lat();
      const selectedLng = placeResult.geometry.location.lng();
      
      setInputValue(address);
      onChange(address);
      setSuggestions([]);
      setShowSuggestions(false);

      if (hospitalLocation?.coordinates) {
        const [hospitalLng, hospitalLat] = hospitalLocation.coordinates;
        const distanceData = await calculateDistance(
          selectedLat,
          selectedLng,
          hospitalLat,
          hospitalLng
        );

        onLocationSelect({
          address,
          latitude: selectedLat,
          longitude: selectedLng,
          distanceInKm: parseFloat(distanceData.distance / 1000),
          formattedDistance: distanceData.formattedDistance,
          formattedDuration: distanceData.formattedDuration
        });
      }
    } catch (error) {
      console.error('Error handling suggestion click:', error);
    }
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
    minWidth: '100%'
  };

  const inputStyle = {
    width: '100%',
    minWidth: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px'
  };

  const suggestionsContainerStyle = {
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    minWidth: '100%',
    marginTop: '4px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    maxHeight: '240px',
    overflowY: 'auto'
  };

  const suggestionItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <input
          type="text"
          style={{ ...inputStyle, backgroundColor: '#f3f4f6' }}
          placeholder="Loading..."
          disabled
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setShowSuggestions(true)}
          style={inputStyle}
          placeholder="Enter address"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div style={suggestionsContainerStyle}>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              style={suggestionItemStyle}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f7fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {suggestion.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;