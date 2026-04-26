

# FindMyFlat

FindMyFlat is a rental marketplace for browsing, posting, and managing flat and property listings. It combines search, map browsing, favorites, chat, and Firebase-backed authentication so tenants and landlords can use the app in one place.

View your app in AI Studio: https://ai.studio/apps/2ca83db4-2de0-4957-a838-95bcebbfe6c9

## Overview

The app is built around a simple flow:

1. Visitors can browse rentals from the home page using search, type filters, amenity filters, list view, or map view.
2. Signed-in users can save favorites, start conversations, and open rental details.
3. Property owners can create, edit, and delete their own listings from the dashboard.

Authentication uses Firebase Google sign-in and email/password sign-in. Rental data, favorites, and dashboard listings are stored in Firestore.

## Key Features

- Browse rentals with live search and filtering.
- Switch between list and map views.
- Save favorite listings when logged in.
- Open rental details and start chat conversations.
- Create and manage your own rental posts from the dashboard.
- Support for Google and email/password login through Firebase Auth.

## Tech Stack

- Next.js
- React
- Firebase Auth
- Firestore
- Tailwind CSS
- Motion for animations
- Leaflet and Google Maps integration

## Run Locally

**Prerequisites:** Node.js and a Firebase project configured for this app.

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Make sure your Firebase project settings match the app config in [firebase-applet-config.json](firebase-applet-config.json), and add your local host to Firebase Authentication authorized domains if you plan to test Google login locally.
4. Run the app:
   `npm run dev`

## Notes

- The home page is the main discovery surface for renters.
- The dashboard is for signed-in users who want to manage their own listings.
- If Google login fails with an unauthorized-domain error, add the current host in Firebase Console under Authentication > Settings > Authorized domains.
