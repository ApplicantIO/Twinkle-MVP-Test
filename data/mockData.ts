import { Playlist, Video } from '@/types';

// Mock video IDs for playlists (these would typically come from actual video data)
const mockVideoIds = {
  vatan: ['video-vatan-1', 'video-vatan-2', 'video-vatan-3'],
  qiymat: ['video-qiymat-1', 'video-qiymat-2', 'video-qiymat-3'],
  kulrang: ['video-kulrang-1', 'video-kulrang-2'],
  alhimik: ['video-alhimik-1', 'video-alhimik-2', 'video-alhimik-3'],
  htmlCss: ['video-html-1', 'video-html-2', 'video-css-1', 'video-css-2'],
  react: ['video-react-1', 'video-react-2', 'video-react-3', 'video-react-4'],
};

export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-konsta-tarix',
    title: 'Konsta Tarix',
    description: 'Ushbu playlist Twinkle platformasining maxsus algoritmlari va creatorlar hamjamiyati tomonidan saralab olingan eksklyuziv kontentlar jamlanmasidir. Har bir video tomoshabinga nafaqat estetik zavq beradi, balki chuqur bilim va tajriba ulashish maqsadida yaratilgan. Bizning Rasmiy Instagram sahifamizda ushbu loyihaning yaratilish jarayoni haqida batafsil ma\'lumot olishingiz mumkin.\n\nTo\'plam o\'z ichiga olgan mavzular bugungi kunning eng dolzarb masalalarini qamrab oladi. Agar sizda kontent yuzasidan savollar tug\'ilsa, bizning Yordam Markazi bo\'limiga murojaat qilishingizni so\'raymiz. Har bir tomoshabin fikri biz uchun juda muhim, shuning uchun videolarni ko\'rish jarayonida o\'z fikrlaringizni qoldirishni unutmang.\n\nUshbu super-albomning texnik imkoniyatlari va 4K formatdagi tasvir sifati sizga haqiqiy kino tajribasini taqdim etadi. Bizning Hamkorlik Dasturi doirasida siz ham o\'z kontentingizni shunday sifatda taqdim etishingiz mumkin. Twinkle — bu shunchaki video platforma emas, balki sifatli kontent yaratuvchilar va bilimga chanqoq insonlar uchun yaratilgan katta bir ekotizimdir.\n\nTo\'plam muntazam ravishda yangilanib boradi. Eng so\'nggi yangiliklarni o\'tkazib yubormaslik uchun Telegram Kanalimizga a\'zo bo\'ling. Har bir yangi qo\'shilgan video alohida tekshiruvdan o\'tkaziladi va faqatgina eng yuqori sifatli materiallar sizga taqdim etiladi.',
    creatorName: 'Konsta',
    creatorId: 'konsta-creator',
    creatorAvatar: 'https://ui-avatars.com/api/?name=Konsta&background=7C5FD9&color=fff&size=128',
    type: 'Musical Playlist',
    price: '50,000 UZS',
    isSubscription: false,
    lastUpdated: new Date('2024-01-15').toISOString(),
    videoCount: 9,
    sections: [
      {
        id: 'section-vatan',
        title: 'Vatan',
        videoIds: ['video-vatan', 'video-ozbekiston', 'video-jamoat'],
      },
      {
        id: 'section-qiymat',
        title: 'Qiymat',
        videoIds: ['video-qiymat', 'video-odamlar', 'video-sabr'],
      },
      {
        id: 'section-alhimik',
        title: 'Alhimik',
        videoIds: ['video-alhimik', 'video-tush', 'video-bir-kun'],
      },
    ],
    allVideoIds: [
      'video-vatan',
      'video-ozbekiston',
      'video-jamoat',
      'video-qiymat',
      'video-odamlar',
      'video-sabr',
      'video-alhimik',
      'video-tush',
      'video-bir-kun',
    ],
    thumbnail: undefined,
    firstVideoThumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
  },
  {
    id: 'playlist-frontend-dev',
    title: 'Frontend Development',
    description: 'Ushbu playlist Twinkle platformasining maxsus algoritmlari va creatorlar hamjamiyati tomonidan saralab olingan eksklyuziv kontentlar jamlanmasidir. Har bir video tomoshabinga nafaqat estetik zavq beradi, balki chuqur bilim va tajriba ulashish maqsadida yaratilgan. Bizning Rasmiy Instagram sahifamizda ushbu loyihaning yaratilish jarayoni haqida batafsil ma\'lumot olishingiz mumkin.\n\nTo\'plam o\'z ichiga olgan mavzular bugungi kunning eng dolzarb masalalarini qamrab oladi. Agar sizda kontent yuzasidan savollar tug\'ilsa, bizning Yordam Markazi bo\'limiga murojaat qilishingizni so\'raymiz. Har bir tomoshabin fikri biz uchun juda muhim, shuning uchun videolarni ko\'rish jarayonida o\'z fikrlaringizni qoldirishni unutmang.\n\nUshbu super-albomning texnik imkoniyatlari va 4K formatdagi tasvir sifati sizga haqiqiy kino tajribasini taqdim etadi. Bizning Hamkorlik Dasturi doirasida siz ham o\'z kontentingizni shunday sifatda taqdim etishingiz mumkin. Twinkle — bu shunchaki video platforma emas, balki sifatli kontent yaratuvchilar va bilimga chanqoq insonlar uchun yaratilgan katta bir ekotizimdir.\n\nTo\'plam muntazam ravishda yangilanib boradi. Eng so\'nggi yangiliklarni o\'tkazib yubormaslik uchun Telegram Kanalimizga a\'zo bo\'ling. Har bir yangi qo\'shilgan video alohida tekshiruvdan o\'tkaziladi va faqatgina eng yuqori sifatli materiallar sizga taqdim etiladi.',
    creatorName: 'Tech Academy',
    type: 'Course',
    price: undefined,
    isSubscription: false,
    lastUpdated: new Date('2024-01-20').toISOString(),
    videoCount: 9,
    sections: [
      {
        id: 'section-html-css',
        title: 'HTML/CSS',
        videoIds: [
          'youtube-C4qJeIjNd2U',
          'youtube-O96OfsXdygU',
          'youtube-jX3Sz7OGE24',
          'youtube-KusNJWidU4E',
        ],
      },
      {
        id: 'section-react',
        title: 'React',
        videoIds: [
          'youtube-oqZGEwKW1SA',
          'youtube-MTQDIQ3XsjA',
          'youtube-jHxPEAzaay4',
          'youtube-EzvbW5QiYaA',
          'youtube-f6LcqfWPRKc',
        ],
      },
    ],
    allVideoIds: [
      'youtube-C4qJeIjNd2U',
      'youtube-O96OfsXdygU',
      'youtube-jX3Sz7OGE24',
      'youtube-KusNJWidU4E',
      'youtube-oqZGEwKW1SA',
      'youtube-MTQDIQ3XsjA',
      'youtube-jHxPEAzaay4',
      'youtube-EzvbW5QiYaA',
      'youtube-f6LcqfWPRKc',
    ],
    thumbnail: undefined,
    firstVideoThumbnail: 'https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
  },
];

// Helper function to get playlist by ID
export function getPlaylistById(id: string): Playlist | undefined {
  return mockPlaylists.find(playlist => playlist.id === id);
}

// Helper function to get all playlists
export function getAllPlaylists(): Playlist[] {
  return mockPlaylists;
}

