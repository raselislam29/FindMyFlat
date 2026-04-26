'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { RentalCard, Rental } from '@/components/RentalCard';
import { CreateRentalModal } from '@/components/CreateRentalModal';
import { Home as HomeIcon, MapPin, Edit, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user) {
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    
    // Using simple query since where + orderBy requires composite index
    const q = query(collection(db, 'rentals'), where('ownerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRentals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rental[];
      
      // Client side sort to avoid composite index error
      fetchedRentals.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setRentals(fetchedRentals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold mb-4">Please log in</h1>
            <p className="text-gray-500">You must be logged in to view your dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-500">Manage your profile and properties.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 border border-gray-100 rounded-2xl p-6 bg-white shadow-sm h-fit">
            <div className="flex flex-col items-center text-center">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=random`} alt="Profile" className="w-24 h-24 rounded-full mb-4 shadow-sm" />
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500 mb-4 break-all">{user.email}</p>
              
              <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Active Listings</span>
                  <span className="font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">{rentals.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">My Properties</h2>
              <button
                onClick={() => { setEditingRental(null); setIsModalOpen(true); }}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-6 rounded-full transition-colors shadow-sm"
              >
                + Add Property
              </button>
            </div>
            
            {rentals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <HomeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No properties yet</h3>
                <p className="text-sm text-gray-500 mb-4">You haven&apos;t posted any rental properties.</p>
                <button
                  onClick={() => { setEditingRental(null); setIsModalOpen(true); }}
                  className="text-violet-600 font-medium hover:underline"
                >
                  Create your first listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {rentals.map((rental) => (
                  <RentalCard 
                    key={rental.id} 
                    rental={rental} 
                    onDelete={handleDelete}
                    onEdit={(r) => { setEditingRental(r); setIsModalOpen(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <CreateRentalModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingRental(null); }} 
        onSuccess={() => { setIsModalOpen(false); setEditingRental(null); }}
        rentalToEdit={editingRental}
      />
    </div>
  );
}
