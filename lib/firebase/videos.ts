import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { Video } from '@/types';

export async function getVideos(limitCount: number = 50): Promise<Video[]> {
  const videosRef = collection(db, 'videos');
  const q = query(videosRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Video[];
}

export async function getVideoById(id: string): Promise<Video | null> {
  const videoRef = doc(db, 'videos', id);
  const videoSnap = await getDoc(videoRef);
  
  if (!videoSnap.exists()) return null;
  
  const data = videoSnap.data();
  return {
    id: videoSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Video;
}

export async function getVideosByCreator(creatorId: string): Promise<Video[]> {
  const videosRef = collection(db, 'videos');
  const q = query(videosRef, where('creatorId', '==', creatorId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Video[];
}

export async function searchVideos(searchTerm: string): Promise<Video[]> {
  const videosRef = collection(db, 'videos');
  const snapshot = await getDocs(videosRef);
  
  const term = searchTerm.toLowerCase();
  const docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Video[];

  return docs.filter((video) =>
    video.title.toLowerCase().includes(term) ||
    video.description?.toLowerCase().includes(term)
  );
}

export async function createVideo(
  title: string,
  description: string,
  videoFile: File,
  thumbnailFile: File | null,
  creatorId: string,
  creatorName: string,
  creatorPhotoURL?: string
): Promise<string> {
  // Upload video
  const videoRef = ref(storage, `videos/${creatorId}/${Date.now()}_${videoFile.name}`);
  const videoSnapshot = await uploadBytes(videoRef, videoFile);
  const videoUrl = await getDownloadURL(videoSnapshot.ref);
  
  // Upload thumbnail if provided
  let thumbnailUrl: string | undefined;
  if (thumbnailFile) {
    const thumbnailRef = ref(storage, `thumbnails/${creatorId}/${Date.now()}_${thumbnailFile.name}`);
    const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnailFile);
    thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
  }
  
  // Create video document
  const videoData = {
    title,
    description,
    videoUrl,
    thumbnailUrl,
    creatorId,
    creatorName,
    creatorPhotoURL,
    views: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'videos'), videoData);
  return docRef.id;
}

export async function updateVideo(
  id: string,
  title: string,
  description: string
): Promise<void> {
  const videoRef = doc(db, 'videos', id);
  await updateDoc(videoRef, {
    title,
    description,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteVideo(id: string): Promise<void> {
  const videoRef = doc(db, 'videos', id);
  const videoSnap = await getDoc(videoRef);
  
  if (videoSnap.exists()) {
    const data = videoSnap.data();
    
    // Delete video file from storage
    if (data.videoUrl) {
      const videoStorageRef = ref(storage, data.videoUrl);
      try {
        await deleteObject(videoStorageRef);
      } catch (error) {
        console.error('Error deleting video file:', error);
      }
    }
    
    // Delete thumbnail from storage
    if (data.thumbnailUrl) {
      const thumbnailStorageRef = ref(storage, data.thumbnailUrl);
      try {
        await deleteObject(thumbnailStorageRef);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }
    
    // Delete document
    await deleteDoc(videoRef);
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  const videoRef = doc(db, 'videos', id);
  const videoSnap = await getDoc(videoRef);
  
  if (videoSnap.exists()) {
    const currentViews = videoSnap.data().views || 0;
    await updateDoc(videoRef, {
      views: currentViews + 1,
    });
  }
}

