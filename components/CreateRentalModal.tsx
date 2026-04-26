'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { X, Loader2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPicker } from '@/components/DynamicMap';
import { Rental } from './RentalCard';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export function CreateRentalModal({ isOpen, onClose, onSuccess, rentalToEdit }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, rentalToEdit?: Rental | null }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [hidePhone, setHidePhone] = useState(false);
  const [status, setStatus] = useState<'available' | 'rented'>('available');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [mapPosition, setMapPosition] = useState<[number, number]>([40.7128, -74.0060]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const {
    ready,
    value,
    suggestions: { status: placeStatus, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
    },
    debounce: 300,
    initOnMount: isLoaded,
  });

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (rentalToEdit) {
      setValue(rentalToEdit.location || '', false);
      setPhotoUrls(rentalToEdit.photoUrls || []);
      setHidePhone(rentalToEdit.hidePhone || false);
      setStatus(rentalToEdit.status || 'available');
      setPropertyType(rentalToEdit.propertyType || 'Apartment');
      setAmenities(rentalToEdit.amenities || []);
      setMapPosition([rentalToEdit.lat || 40.7128, rentalToEdit.lng || -74.0060]);
    } else {
      setValue('', false);
      setPhotoUrls([]);
      setHidePhone(false);
      setStatus('available');
      setPropertyType('Apartment');
      setAmenities([]);
      setMapPosition([40.7128, -74.0060]);
    }
    clearSuggestions();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [rentalToEdit, isOpen, setValue, clearSuggestions]);

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const movePhoto = (index: number, direction: 'left' | 'right') => {
    setPhotoUrls(prev => {
      const newUrls = [...prev];
      if (direction === 'left' && index > 0) {
        [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
      } else if (direction === 'right' && index < prev.length - 1) {
        [newUrls[index + 1], newUrls[index]] = [newUrls[index], newUrls[index + 1]];
      }
      return newUrls;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setLoading(true);
    const newPhotos: string[] = [...photoUrls];
    const filesToProcess = Array.from(files).slice(0, 6 - newPhotos.length);
    
    for (const file of filesToProcess) {
       setLoading(true);
       try {
         const url = await new Promise<string>((resolve) => {
           const reader = new FileReader();
           reader.onload = (event) => {
             const img = new Image();
             img.onload = () => {
               const canvas = document.createElement('canvas');
               const MAX_WIDTH = 800;
               const scale = MAX_WIDTH / img.width;
               canvas.width = MAX_WIDTH;
               canvas.height = img.height * scale;
               const ctx = canvas.getContext('2d');
               ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
               resolve(canvas.toDataURL('image/jpeg', 0.6));
             };
             img.src = event.target?.result as string;
           };
           reader.readAsDataURL(file);
         });
         newPhotos.push(url);
       } catch (err) {
         console.error('Image processing failed:', err);
       }
    }
    setPhotoUrls(newPhotos);
    setLoading(false);
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setShowSuggestions(false);
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMapPosition([lat, lng]);
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    try {
      const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        location: value,
        bedrooms: Number(formData.get('bedrooms')),
        bathrooms: Number(formData.get('bathrooms')),
        sizeSqft: Number(formData.get('sizeSqft')),
        contactPhone: formData.get('contactPhone'),
        propertyType,
        amenities,
        hidePhone,
        photoUrls,
        status: status,
        lat: mapPosition[0],
        lng: mapPosition[1],
        updatedAt: serverTimestamp()
      };

      if (rentalToEdit) {
        await updateDoc(doc(db, 'rentals', rentalToEdit.id), data);
      } else {
        await addDoc(collection(db, 'rentals'), {
          ...data,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save rental post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl flex flex-col"
        >
          <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between p-4 px-6 z-10">
            <h2 className="text-xl font-semibold text-gray-900">{t('addPostTitle')}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('titleLabel')}</label>
                <input required name="title" defaultValue={rentalToEdit?.title} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g., Beautiful 2BHK in Manhattan" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('descriptionLabel')}</label>
                <textarea required name="description" defaultValue={rentalToEdit?.description} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Describe the property..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceLabel')}</label>
                  <input required name="price" defaultValue={rentalToEdit?.price} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locationLabel')}</label>
                  <input required name="location" value={value} onChange={(e) => { setValue(e.target.value); setShowSuggestions(true); }} onFocus={() => data.length > 0 && setShowSuggestions(true)} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g., Brooklyn, Queens..." disabled={!ready} />
                  {showSuggestions && placeStatus === "OK" && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      {data.map(({ place_id, description }, idx) => (
                        <div 
                          key={`${place_id}-${idx}`} 
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm truncate"
                          onClick={() => handleSelect(description)}
                        >
                          {description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bedroomsLabel')}</label>
                  <input required name="bedrooms" defaultValue={rentalToEdit?.bedrooms} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bathroomsLabel')}</label>
                  <input required name="bathrooms" defaultValue={rentalToEdit?.bathrooms} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sizeLabel')}</label>
                  <input required name="sizeSqft" defaultValue={rentalToEdit?.sizeSqft} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select 
                    value={propertyType} 
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Room">Room</option>
                    <option value="Sublet">Sublet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Parking', 'Pet-friendly', 'Furnished', 'AC', 'Balcony', 'Mosque', 'Grocery'].map((amenity, idx) => (
                      <button
                        type="button"
                        key={`${amenity}-${idx}`}
                        onClick={() => {
                          setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${amenities.includes(amenity) ? 'bg-violet-100 border-violet-200 text-violet-800 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactLabel')}</label>
                <div className="flex gap-4 items-center">
                  <input required name="contactPhone" defaultValue={rentalToEdit?.contactPhone} type="tel" className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="+1..." />
                  <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={hidePhone} onChange={(e) => setHidePhone(e.target.checked)} />
                    {t('hidePhoneNumber')}
                  </label>
                </div>
              </div>

              {rentalToEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('statusLabel')}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <option value="available">{t('available')}</option>
                    <option value="rented">{t('rented')}</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('uploadPhotos')}</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                {photoUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200 group">
                         <img src={url} alt="upload" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                           {idx > 0 && (
                             <button type="button" onClick={() => movePhoto(idx, 'left')} className="p-1 bg-white/80 rounded hover:bg-white text-gray-800">
                               <ChevronLeft className="w-4 h-4" />
                             </button>
                           )}
                           <button type="button" onClick={() => removePhoto(idx)} className="p-1 bg-red-500/80 rounded hover:bg-red-600 text-white">
                             <X className="w-4 h-4" />
                           </button>
                           {idx < photoUrls.length - 1 && (
                             <button type="button" onClick={() => movePhoto(idx, 'right')} className="p-1 bg-white/80 rounded hover:bg-white text-gray-800">
                               <ChevronRight className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Map Location</label>
                <MapPicker position={mapPosition} setPosition={setMapPosition} />
              </div>
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t('cancelButton')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center min-w-[120px]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submitButton')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
