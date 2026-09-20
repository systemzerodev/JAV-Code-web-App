import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [currentView, setCurrentView] = useState('catalog');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Pagination & Load More
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 8; // Jumlah film yang dimuat per halaman

  // State untuk Sesi Login Admin
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State untuk Pencarian
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Form (Tambah & Edit)
  const [formData, setFormData] = useState({
    id: '', code: '', release_date: '', english_title: '', japanese_title: '',
    artist_name: '', rating: '', description: '', cover_url: '', gallery_urls: []
  });
  
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fungsi Mengambil Data dengan Pagination
  const fetchMovies = async (pageNumber = 0, isLoadMore = false) => {
    setIsLoading(true);
    const from = pageNumber * LIMIT;
    const to = from + LIMIT - 1;

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("Error fetching movies:", error);
    } else {
      if (data.length < LIMIT) {
        setHasMore(false); // Tandai jika sudah tidak ada data lagi di bawah
      }

      if (isLoadMore) {
        setMovies((prev) => [...prev, ...data]); // Gabungkan data lama dengan data baru
      } else {
        setMovies(data);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMovies(0, false);
  }, []);

  // Fungsi untuk memuat halaman berikutnya
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage, true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      alert("Gagal Login: " + error.message);
    } else {
      setLoginEmail('');
      setLoginPassword('');
      setCurrentView('admin');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('catalog');
    alert("Anda telah keluar dari Admin Panel.");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenEdit = (movie) => {
    if (!session) {
      setCurrentView('login');
      return;
    }
    setFormData({
      id: movie.id,
      code: movie.code || '',
      release_date: movie.release_date || '',
      english_title: movie.english_title || '',
      japanese_title: movie.japanese_title || '',
      artist_name: movie.artist_name || '',
      rating: movie.rating || '',
      description: movie.description || '',
      cover_url: movie.cover_url || '',
      gallery_urls: movie.gallery_urls || []
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setIsEditing(true);
    setCurrentView('admin');
  };

  const handleDeleteMovie = async (movie) => {
    if (!session) {
      alert("Silakan login terlebih dahulu sebagai admin.");
      setCurrentView('login');
      return;
    }

    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus film "${movie.english_title}"?`);
    if (!confirmDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id);

      if (deleteError) throw deleteError;

      alert("Film berhasil dihapus dari database.");
      setSelectedMovie(null);
      setCurrentView('catalog');
      setPage(0);
      setHasMore(true);
      fetchMovies(0, false);
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert("Terjadi kesalahan saat menghapus: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      alert("Sesi habis. Silakan login kembali.");
      setCurrentView('login');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCoverUrl = formData.cover_url;
      let finalGalleryUrls = formData.gallery_urls || [];

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `cover_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('movie-covers')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('movie-covers')
          .getPublicUrl(fileName);

        finalCoverUrl = publicUrlData.publicUrl;
      }

      if (galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery_${Date.now()}_${i}.${fileExt}`;

          const { error: galUploadError } = await supabase.storage
            .from('movie-covers')
            .upload(fileName, file);

          if (galUploadError) throw galUploadError;

          const { data: galPublicUrlData } = supabase.storage
            .from('movie-covers')
            .getPublicUrl(fileName);

          finalGalleryUrls.push(galPublicUrlData.publicUrl);
        }
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            code: formData.code,
            release_date: formData.release_date,
            english_title: formData.english_title,
            japanese_title: formData.japanese_title,
            artist_name: formData.artist_name,
            rating: parseFloat(formData.rating),
            description: formData.description,
            cover_url: finalCoverUrl,
            gallery_urls: finalGalleryUrls
          })
          .eq('id', formData.id);

        if (updateError) throw updateError;
        alert("Sukses! Data film berhasil diperbarui.");
      } else {
        if (!coverFile) {
          alert("Harap unggah gambar poster utama!");
          setIsSubmitting(false);
          return;
        }

        const { error: insertError } = await supabase
          .from('movies')
          .insert([{
            code: formData.code,
            release_date: formData.release_date,
            english_title: formData.english_title,
            japanese_title: formData.japanese_title,
            artist_name: formData.artist_name,
            rating: parseFloat(formData.rating),
            description: formData.description,
            cover_url: finalCoverUrl,
            gallery_urls: finalGalleryUrls
          }]);

        if (insertError) throw insertError;
        alert("Sukses! Film baru berhasil ditambahkan.");
      }

      setFormData({ id: '', code: '', release_date: '', english_title: '', japanese_title: '', artist_name: '', rating: '', description: '', cover_url: '', gallery_urls: [] });
      setCoverFile(null);
      setGalleryFiles([]);
      setIsEditing(false);
      setPage(0);
      setHasMore(true);
      fetchMovies(0, false);
      setCurrentView('catalog');

    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDetail = (movie) => {
    setSelectedMovie(movie);
    setCurrentView('detail');
  };

  const filteredMovies = movies.filter((movie) => {
    const query = searchQuery.toLowerCase();
    return (
      (movie.english_title && movie.english_title.toLowerCase().includes(query)) ||
      (movie.japanese_title && movie.japanese_title.toLowerCase().includes(query)) ||
      (movie.code && movie.code.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-4 flex justify-between items-center">
          <div onClick={() => setCurrentView('catalog')} className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">JAV CODE WEBAPP BY GEMMINI AI</span>
          </div>
          <div className="flex gap-2 md:gap-4 items-center">
            <button onClick={() => setCurrentView('catalog')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === 'catalog' || currentView === 'detail' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              Katalog
            </button>
            
            {session ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { 
                    setIsEditing(false); 
                    setFormData({ id: '', code: '', release_date: '', english_title: '', japanese_title: '', artist_name: '', rating: '', description: '', cover_url: '', gallery_urls: [] }); 
                    setCurrentView('admin'); 
                  }} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${currentView === 'admin' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                >
                  ⚙️ Admin Panel
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentView('login')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${currentView === 'login' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
              >
                🔐 Login Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-10 max-w-6xl mx-auto">
        
        {/* HALAMAN LOGIN */}
        {currentView === 'login' && (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mt-10 animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-4xl">🔐</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">Admin Login</h2>
              <p className="text-xs text-gray-500 mt-1">Masukkan akun admin untuk mengelola database film.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                  placeholder="admin@email.com" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" 
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md text-sm"
                >
                  {isLoggingIn ? 'Memproses...' : 'Masuk ke Panel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAMPILAN KATALOG DENGAN LOAD MORE */}
        {currentView === 'catalog' && (
          <div>
            <div className="mb-8">
              <div className="relative max-w-md mx-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  🔍
                </span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan judul atau kode film..." 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {isLoading && movies.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-semibold animate-pulse">Memuat data dari database...</div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                {movies.length === 0 ? "Belum ada film di katalog. Silakan login dan tambah melalui Admin Panel." : "Film yang Anda cari tidak ditemukan."}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredMovies.map((movie) => (
                    <div key={movie.id} onClick={() => goToDetail(movie)} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col">
                      <div className="relative overflow-hidden aspect-[2/3] bg-gray-200">
                        <img src={movie.cover_url} alt={movie.english_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold backdrop-blur-sm">⭐ {movie.rating}</div>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">{movie.english_title}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{movie.japanese_title}</p>
                        </div>
                        <div className="mt-3 text-xs font-mono text-indigo-600 bg-indigo-50 inline-block w-fit px-2 py-1 rounded">{movie.code}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tombol Load More */}
                {!searchQuery && hasMore && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-300 py-3 px-8 rounded-xl shadow-sm transition-colors text-sm"
                    >
                      {isLoading ? 'Memuat...' : 'Muat Lebih Banyak 🔽'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAMPILAN DETAIL FILM */}
        {currentView === 'detail' && selectedMovie && (
          <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCurrentView('catalog')} className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                ← Kembali ke Katalog
              </button>
              
              {session && (
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(selectedMovie)} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-1.5">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDeleteMovie(selectedMovie)} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-1.5">
                    🗑️ Hapus
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 border border-gray-100 mb-8">
              <div className="w-full md:w-1/3 flex-shrink-0">
                <img src={selectedMovie.cover_url} alt={selectedMovie.english_title} className="w-full h-auto object-cover rounded-xl shadow-md aspect-[2/3]"/>
              </div>
              <div className="w-full md:w-2/3 flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-md font-mono font-bold tracking-wide mb-3">CODE: {selectedMovie.code}</span>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{selectedMovie.english_title}</h1>
                  <h2 className="text-lg md:text-xl text-gray-500 font-medium mt-1 mb-5">{selectedMovie.japanese_title}</h2>
                  <div className="mb-5 text-sm md:text-base"><span className="font-semibold text-gray-800">Starring: </span><span className="text-gray-600">{selectedMovie.artist_name}</span></div>
                  <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-600 mb-6 pb-5 border-b border-gray-100">
                    <span>📅 {selectedMovie.release_date}</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">⭐ {selectedMovie.rating}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">{selectedMovie.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedMovie.gallery_urls && selectedMovie.gallery_urls.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📸 Galeri Foto Tambahan</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedMovie.gallery_urls.map((url, index) => (
                    <div key={index} className="overflow-hidden rounded-xl aspect-[16/9] bg-gray-100 shadow-sm border border-gray-200 group">
                      <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAMPILAN ADMIN PANEL */}
        {currentView === 'admin' && session && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              {isEditing ? '✏️ Edit Data Film' : '➕ Tambah Film Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Film</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} required placeholder="MOV-004" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Rilis</label>
                  <input type="date" name="release_date" value={formData.release_date} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul (Inggris)</label>
                  <input type="text" name="english_title" value={formData.english_title} onChange={handleInputChange} required placeholder="English Title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul (Jepang)</label>
                  <input type="text" name="japanese_title" value={formData.japanese_title} onChange={handleInputChange} placeholder="Japanese Title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemeran</label>
                  <input type="text" name="artist_name" value={formData.artist_name} onChange={handleInputChange} required placeholder="Nama pemeran..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-10)</label>
                  <input type="number" name="rating" value={formData.rating} onChange={handleInputChange} required step="0.1" max="10" placeholder="9.5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditing ? 'Ganti Poster Utama (Opsional)' : 'Unggah Poster Utama'}
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  required={!isEditing}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-300 rounded-lg focus:outline-none bg-white cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unggah Galeri Foto Tambahan (Bisa pilih banyak sekaligus)
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(e.target.files)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-300 rounded-lg focus:outline-none bg-white cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Sinopsis</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" placeholder="Tulis sinopsis film..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                {isEditing ? (
                  <button type="button" onClick={() => handleDeleteMovie(formData)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm">
                    🗑️ Hapus Film Ini
                  </button>
                ) : <div></div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setCurrentView('catalog')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isSubmitting} className={`font-bold py-2.5 px-6 rounded-lg transition-colors shadow-md ${isSubmitting ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                    {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Perbarui Film' : 'Simpan Film')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;