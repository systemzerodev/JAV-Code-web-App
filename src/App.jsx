import React from 'react'

function App() {
  // Data sementara (dummy) sebelum kita hubungkan ke Supabase
  const dummyMovie = {
    code: "JPN-077",
    english_title: "A Silent Voice",
    japanese_title: "聲の形 (Koe no Katachi)",
    artist_name: "Saori Hayami, Kensho Ono",
    cover_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop", 
    release_date: "2016-09-17",
    rating: 9.1,
    description: "A former bully, Shoya Ishida, tries to make amends with Shoko Nishimiya, a deaf girl he tormented in elementary school. A deeply moving drama exploring themes of redemption and friendship."
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 flex items-center justify-center font-sans">
      
      {/* Container Utama (Card) */}
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 border border-gray-100">
        
        {/* SISI KIRI: Cover Film */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <img 
            src={dummyMovie.cover_url} 
            alt={dummyMovie.english_title} 
            className="w-full h-auto object-cover rounded-xl shadow-md aspect-[2/3]"
          />
        </div>

        {/* SISI KANAN: Informasi Detail */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          <div>
            {/* Code */}
            <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-md font-mono font-bold tracking-wide mb-3">
              CODE: {dummyMovie.code}
            </span>

            {/* Judul Inggris */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {dummyMovie.english_title}
            </h1>

            {/* Judul Jepang */}
            <h2 className="text-lg md:text-xl text-gray-500 font-medium mt-1 mb-5">
              {dummyMovie.japanese_title}
            </h2>

            {/* Nama Artis */}
            <div className="mb-5 text-sm md:text-base">
              <span className="font-semibold text-gray-800">Starring: </span>
              <span className="text-gray-600">{dummyMovie.artist_name}</span>
            </div>

            {/* Tanggal Rilis & Rating */}
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-600 mb-6 pb-5 border-b border-gray-100">
              <span className="flex items-center gap-1.5">
                📅 {dummyMovie.release_date}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                ⭐ {dummyMovie.rating} <span className="font-normal text-amber-500 text-xs">/ 10</span>
              </span>
            </div>

            {/* Deskripsi */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                {dummyMovie.description}
              </p>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  )
}

export default App