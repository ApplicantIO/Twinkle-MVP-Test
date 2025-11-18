import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './config';

export async function subscribeToCreator(userId: string, creatorId: string): Promise<void> {
  const subscriptionsRef = collection(db, 'subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId), where('creatorId', '==', creatorId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    await addDoc(subscriptionsRef, {
      userId,
      creatorId,
      createdAt: Timestamp.now(),
    });
    
    // Update creator subscriber count
    const creatorRef = doc(db, 'creators', creatorId);
    const creatorSnap = await getDoc(creatorRef);
    if (creatorSnap.exists()) {
      const currentCount = creatorSnap.data().subscriberCount || 0;
      await updateDoc(creatorRef, {
        subscriberCount: currentCount + 1,
      });
    }
  }
}

export async function unsubscribeFromCreator(userId: string, creatorId: string): Promise<void> {
  const subscriptionsRef = collection(db, 'subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId), where('creatorId', '==', creatorId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
    
    // Update creator subscriber count
    const creatorRef = doc(db, 'creators', creatorId);
    const creatorSnap = await getDoc(creatorRef);
    if (creatorSnap.exists()) {
      const currentCount = creatorSnap.data().subscriberCount || 0;
      await updateDoc(creatorRef, {
        subscriberCount: Math.max(0, currentCount - 1),
      });
    }
  }
}

export async function isSubscribed(userId: string, creatorId: string): Promise<boolean> {
  const subscriptionsRef = collection(db, 'subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId), where('creatorId', '==', creatorId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getUserSubscriptions(userId: string): Promise<string[]> {
  const subscriptionsRef = collection(db, 'subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().creatorId);
}

