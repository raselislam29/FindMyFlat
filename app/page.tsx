'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { RentalCard, Rental } from '@/components/RentalCard';
import { CreateRentalModal } from '@/components/CreateRentalModal';
import { LoginModal } from '@/components/LoginModal';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Heart, List, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RentalDetailsModal } from '@/components/RentalDetailsModal';
import { ChatWidget } from '@/components/ChatWidget';
import { RentalsMap } from '@/components/DynamicMap';

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [startChatData, setStartChatData] = useState<{ rentalId: string; rentalTitle: string; ownerId: string } | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user) {
      setFavorites(new Set());
      setFilterMode('all');
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const q = query(collection(db, 'users', user.uid, 'favorites'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = new Set(snapshot.docs.map(d => d.id));
      setFavorites(favs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleOpenChats = () => setIsChatOpen(true);
    const handleOpenLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'login' | 'signup' }>;
      if (customEvent.detail?.mode) {
        setLoginMode(customEvent.detail.mode);
      } else {
        setLoginMode('login');
      }
      setIsLoginModalOpen(true);
    };
    
    window.addEventListener('open-chats', handleOpenChats);
    window.addEventListener('open-login', handleOpenLogin as EventListener);
    
    return () => {
      window.removeEventListener('open-chats', handleOpenChats);
      window.removeEventListener('open-login', handleOpenLogin as EventListener);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'rentals'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRentals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rental[];
      setRentals(fetchedRentals);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rentals:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'rentals', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert('Failed to delete.');
      }
    }
  };

  const handleToggleFavorite = async (rental: Rental) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    const isFav = favorites.has(rental.id);
    try {
      if (isFav) {
        await deleteDoc(doc(db, 'users', user.uid, 'favorites', rental.id));
      } else {
        await setDoc(doc(db, 'users', user.uid, 'favorites', rental.id), {
          addedAt: serverTimestamp()
        });
      }
    } catch (e: any) {
      console.error('Failed to toggle fav', e);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const searchMatch = rental.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rental.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;
    
    if (filterType !== 'All' && rental.propertyType !== filterType) return false;
    
    if (filterAmenities.length > 0) {
      if (!rental.amenities) return false;
      const hasAll = filterAmenities.every(a => rental.amenities?.includes(a));
      if (!hasAll) return false;
    }

    if (filterMode === 'favorites') {
      return favorites.has(rental.id);
    }
    
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <Header onPostClick={() => setIsModalOpen(true)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Hero / Search Section */}
        <div className="mb-14 text-center max-w-3xl mx-auto pt-6 pb-6">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-extrabold mb-5 leading-tight tracking-tight text-zinc-900"
          >
            {t('homeTitle')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-500 mb-10 font-normal max-w-xl mx-auto"
          >
            {t('homeSubtitle')}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative shadow-xl max-w-2xl mx-auto group rounded-full bg-white ring-1 ring-slate-100"
          >
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-pink-500 transition-colors">
              <Search className="h-6 w-6 text-slate-300 group-focus-within:text-pink-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-16 pr-6 py-5 bg-transparent border-0 rounded-full leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 text-lg transition-all"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>
          
          {/* Advanced Filters */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-5 py-2.5 border border-pink-100 rounded-full bg-pink-50/50 shadow-sm outline-none text-sm font-bold text-pink-700 hover:bg-pink-50 transition-all focus:ring-2 focus:ring-pink-400 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Room">Room</option>
              <option value="Sublet">Sublet</option>
            </select>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Parking', 'Pet-friendly', 'Furnished', 'AC', 'Balcony', 'Mosque', 'Grocery'].map((amenity, idx) => (
                 <button
                   key={`${amenity}-${idx}`}
                   onClick={() => setFilterAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])}
                   className={`px-4 py-2 text-sm rounded-full border transition-all shadow-sm font-bold ${filterAmenities.includes(amenity) ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border-transparent text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600'}`}
                 >
                   {amenity}
                 </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-indigo-100 pb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-extrabold text-slate-800">{t('allRentals')}</h2>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full items-center justify-center flex shadow-sm">
              {filteredRentals.length}
            </span>
          </div>
          
          <div className="flex gap-3 items-center flex-wrap">
            {user && (
              <div className="flex items-center bg-white border border-slate-200 p-1 rounded-full shadow-sm">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${filterMode === 'all' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode('favorites')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${filterMode === 'favorites' ? 'bg-pink-50 text-pink-600 shadow-sm' : 'text-slate-500 hover:text-pink-600 hover:bg-slate-50'}`}
                >
                  <Heart className={`h-4 w-4 ${filterMode === 'favorites' ? 'fill-pink-500 text-pink-500' : ''}`} />
                  Favorites
                </button>
              </div>
            )}
            
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-full shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-purple-600 hover:bg-slate-50'}`}
              >
                <List className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'}`}
              >
                <Map className="h-4 w-4" />
                Map
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredRentals.length > 0 ? (
          viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRentals.map((rental) => (
                <RentalCard 
                  key={rental.id} 
                  rental={rental} 
                  onDelete={handleDelete}
                  onEdit={(r) => { setEditingRental(r); setIsModalOpen(true); }}
                  onClick={(r) => setSelectedRental(r)}
                  onMessageOwner={(r) => {
                    if (!user) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    setStartChatData({ rentalId: r.id, rentalTitle: r.title, ownerId: r.ownerId });
                    setIsChatOpen(true);
                  }}
                  isFavorite={favorites.has(rental.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <RentalsMap rentals={filteredRentals} onMarkerClick={(r) => setSelectedRental(r)} />
            </div>
          )
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noRentalsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or check back later.
            </p>
          </div>
        )}

      </main>

      <CreateRentalModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingRental(null); }} 
        onSuccess={() => { setIsModalOpen(false); setEditingRental(null); }}
        rentalToEdit={editingRental}
      />
      <RentalDetailsModal 
        isOpen={!!selectedRental} 
        rental={selectedRental} 
        onClose={() => setSelectedRental(null)} 
        onEdit={(r) => { setEditingRental(r); setIsModalOpen(true); }}
        onDelete={handleDelete}
        onMessageOwner={(r) => {
          if (!user) {
            setIsLoginModalOpen(true);
            return;
          }
          setStartChatData({ rentalId: r.id, rentalTitle: r.title, ownerId: r.ownerId });
          setIsChatOpen(true);
          setSelectedRental(null);
        }}
        isFavorite={selectedRental ? favorites.has(selectedRental.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => { setIsChatOpen(false); setStartChatData(null); }}
        startChatWithRental={startChatData}
      />
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={loginMode}
      />
    </div>
  );
}
