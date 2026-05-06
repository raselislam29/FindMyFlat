"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  documentId,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDoc } from "firebase/firestore";
import { Header } from "@/components/Header";
import { RentalCard, Rental } from "@/components/RentalCard";
import { CreateRentalModal } from "@/components/CreateRentalModal";
import {
  Home as HomeIcon,
  Eye,
  Heart,
  MessageCircle,
  Flag,
} from "lucide-react";

type RentalAnalytics = {
  viewsThisWeek: number;
  favoriteCount: number;
  inquiryCount: number;
};

type ListingReport = {
  id: string;
  rentalId: string;
  rentalTitle: string;
  listingOwnerId: string;
  reporterId: string;
  reporterEmail?: string | null;
  reason: string;
  details?: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt?: any;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [analyticsByRental, setAnalyticsByRental] = useState<
    Record<string, RentalAnalytics>
  >({});
  const [reports, setReports] = useState<ListingReport[]>([]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user) {
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    // Using simple query since where + orderBy requires composite index
    const q = query(
      collection(db, "rentals"),
      where("ownerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const fetchedRentals = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Rental[];

      // Client side sort to avoid composite index error
      fetchedRentals.sort(
        (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis(),
      );

      setRentals(fetchedRentals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || rentals.length === 0) {
      setAnalyticsByRental({});
      return;
    }

    let cancelled = false;

    const loadAnalytics = async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const entries = await Promise.all(
        rentals.map(async (rental) => {
          const viewsQuery = query(
            collection(db, "rentals", rental.id, "views"),
            where("viewedAt", ">=", oneWeekAgo),
          );

          const favoritesQuery = query(
            collectionGroup(db, "favorites"),
            where(documentId(), "==", rental.id),
          );

          const inquiriesQuery = query(
            collection(db, "chats"),
            where("rentalId", "==", rental.id),
          );

          const [viewsSnapshot, favoritesSnapshot, inquiriesSnapshot] =
            await Promise.all([
              getDocs(viewsQuery),
              getDocs(favoritesQuery),
              getDocs(inquiriesQuery),
            ]);

          return [
            rental.id,
            {
              viewsThisWeek: viewsSnapshot.size,
              favoriteCount: favoritesSnapshot.size,
              inquiryCount: inquiriesSnapshot.size,
            },
          ] as const;
        }),
      );

      if (cancelled) return;

      setAnalyticsByRental(Object.fromEntries(entries));
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [user, rentals]);

  useEffect(() => {
    if (!isAdmin) {
      setReports([]);
      return;
    }

    const reportsQuery = query(
      collection(db, "listingReports"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot: any) => {
      const data = snapshot.docs.map((reportDoc: any) => ({
        id: reportDoc.id,
        ...reportDoc.data(),
      })) as ListingReport[];

      setReports(data);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, "rentals", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

  const updateReportStatus = async (
    reportId: string,
    status: "resolved" | "dismissed",
  ) => {
    try {
      await updateDoc(doc(db, "listingReports", reportId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update report status", error);
      alert("Could not update report status.");
    }
  };

  const computeAndSaveOwnerMetrics = async (ownerId: string) => {
    try {
      // Fetch user
      const userRef = doc(db, "users", ownerId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? (userSnap.data() as any) : {};

      // Profile completion heuristic
      let score = 0;
      const profileFields = ["displayName", "photoURL", "phone", "bio"];
      profileFields.forEach((f) => {
        if (userData[f]) score += 20;
      });

      // Add weight for having listings
      const rentalsQuery = query(collection(db, "rentals"), where("ownerId", "==", ownerId));
      const rentalsSnap = await getDocs(rentalsQuery);
      const listingsCount = rentalsSnap.size;
      score += Math.min(20, listingsCount * 5);

      const profileCompletion = Math.min(100, Math.round(score));

      // Response rate: ratio of owner replies to inbound messages across chats for owner's listings
      let ownerReplies = 0;
      let incoming = 0;

      for (const rdoc of rentalsSnap.docs) {
        const rid = rdoc.id;
        const chatsQuery = query(collection(db, "chats"), where("rentalId", "==", rid));
        const chatsSnap = await getDocs(chatsQuery);
        for (const chatDoc of chatsSnap.docs) {
          const chatId = chatDoc.id;
          const messagesSnap = await getDocs(collection(db, "chats", chatId, "messages"));
          messagesSnap.forEach((m: any) => {
            const msg = m.data() as any;
            if (!msg || !msg.senderId) return;
            if (msg.senderId === ownerId) ownerReplies += 1;
            else incoming += 1;
          });
        }
      }

      const responseRate = incoming === 0 ? 0 : Math.min(1, ownerReplies / incoming);

      // Save metrics on user doc
      await updateDoc(userRef, {
        profileCompletion,
        responseRate,
        metricsUpdatedAt: serverTimestamp(),
      });

      return { profileCompletion, responseRate };
    } catch (e) {
      console.error("computeAndSaveOwnerMetrics failed", e);
      throw e;
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
            <p className="text-gray-500">
              You must be logged in to view your dashboard.
            </p>
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
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-500">Manage your profile and properties.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 border border-gray-100 rounded-2xl p-6 bg-white shadow-sm h-fit">
            <div className="flex flex-col items-center text-center">
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?name=${user.email || "U"}&background=random`
                }
                alt="Profile"
                className="w-24 h-24 rounded-full mb-4 shadow-sm"
              />
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {user.displayName || "User"}
              </h2>
              <p className="text-sm text-gray-500 mb-4 break-all">
                {user.email}
              </p>

              <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Active Listings</span>
                  <span className="font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                    {rentals.length}
                  </span>
                </div>
                {isAdmin && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Admin Actions</h4>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const userRef = doc(db, 'users', user.uid);
                          const userSnap = await getDoc(userRef);
                          const verified = userSnap.exists() && (userSnap.data() as any).verified;
                          await updateDoc(userRef, { verified: !verified });
                          alert(`Toggled verified -> ${!verified}`);
                        } catch (e) {
                          console.error(e);
                          alert('Failed to toggle verified flag');
                        }
                      }}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full"
                    >
                      Toggle My Verified (admin)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">My Properties</h2>
              <button
                onClick={() => {
                  setEditingRental(null);
                  setIsModalOpen(true);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-6 rounded-full transition-colors shadow-sm"
              >
                + Add Property
              </button>
            </div>

            {rentals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <HomeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No properties yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  You haven&apos;t posted any rental properties.
                </p>
                <button
                  onClick={() => {
                    setEditingRental(null);
                    setIsModalOpen(true);
                  }}
                  className="text-violet-600 font-medium hover:underline"
                >
                  Create your first listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {rentals.map((rental) => (
                  <div key={rental.id} className="space-y-3">
                    <RentalCard
                      rental={rental}
                      onDelete={handleDelete}
                      onEdit={(r) => {
                        setEditingRental(r);
                        setIsModalOpen(true);
                      }}
                    />
                    <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                      <h3 className="text-xs uppercase tracking-wider font-black text-violet-700 mb-3">
                        Listing analytics
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            <Eye className="h-3.5 w-3.5" /> Views / week
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {analyticsByRental[rental.id]?.viewsThisWeek ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            <Heart className="h-3.5 w-3.5" /> Favorited
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {analyticsByRental[rental.id]?.favoriteCount ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            <MessageCircle className="h-3.5 w-3.5" /> Inquiries
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {analyticsByRental[rental.id]?.inquiryCount ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAdmin && (
              <div className="mt-10 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="h-5 w-5 text-rose-600" />
                  <h2 className="text-xl font-display font-black text-slate-900">
                    Admin moderation queue
                  </h2>
                </div>

                {reports.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No reports to review.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">
                              {report.rentalTitle}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Reason: {report.reason}
                              {report.reporterEmail
                                ? ` · Reporter: ${report.reporterEmail}`
                                : ""}
                            </p>
                            {report.details && (
                              <p className="mt-2 text-sm text-slate-700">
                                {report.details}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                              report.status === "open"
                                ? "bg-amber-100 text-amber-700"
                                : report.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        {report.status === "open" && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateReportStatus(report.id, "resolved")
                              }
                              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateReportStatus(report.id, "dismissed")
                              }
                              className="rounded-full bg-slate-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  // Verify owner flag on user and compute metrics
                                  await updateDoc(doc(db, "users", report.listingOwnerId), {
                                    verified: true,
                                    verifiedAt: serverTimestamp(),
                                  });
                                  await computeAndSaveOwnerMetrics(report.listingOwnerId);
                                  alert("Owner verified and metrics computed.");
                                } catch (e) {
                                  console.error(e);
                                  alert("Failed to verify owner or compute metrics.");
                                }
                              }}
                              className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                            >
                              Verify Owner
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await computeAndSaveOwnerMetrics(report.listingOwnerId);
                                  alert("Metrics computed for owner.");
                                } catch (e) {
                                  console.error(e);
                                  alert("Failed to compute metrics.");
                                }
                              }}
                              className="rounded-full bg-yellow-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-yellow-700"
                            >
                              Compute Metrics
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateRentalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRental(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingRental(null);
        }}
        rentalToEdit={editingRental}
      />
    </div>
  );
}
