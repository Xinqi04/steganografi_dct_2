// src/App.jsx

import { useState, useRef } from 'react';

// URL API Backend Anda
const API_BASE = "https://rizaaf-steno-dct.hf.space";

function App() {
    // State untuk mengelola mode saat ini (encode/decode)
    const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
    
    // State untuk file
    const [selectedFile, setSelectedFile] = useState(null);
    const [stegoFile, setStegoFile] = useState(null);
    
    // State untuk input dan output
    const [message, setMessage] = useState('');
    const [extractedMessage, setExtractedMessage] = useState('');
    
    // State untuk pratinjau gambar
    const [originalImagePreview, setOriginalImagePreview] = useState('');
    const [stegoImagePreview, setStegoImagePreview] = useState('');

    // State untuk UI (loading, notifikasi, dll.)
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [showEncodePreview, setShowEncodePreview] = useState(false);
    const [showDecodeResult, setShowDecodeResult] = useState(false);

    // Refs untuk input file (untuk trigger klik programatik)
    const imageInputRef = useRef(null);
    const stegoInputRef = useRef(null);

    // Fungsi untuk menampilkan notifikasi
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    // Fungsi untuk mengganti mode
    const switchMode = (newMode) => {
        setMode(newMode);
        // Reset state saat ganti mode
        setAlert({ show: false, type: '', message: '' });
        setSelectedFile(null);
        setStegoFile(null);
        setShowEncodePreview(false);
        setShowDecodeResult(false);
    };
    
    // Handler untuk pemilihan file
    const handleFileSelect = (file, type) => {
        if (!file) return;
        if (type === 'image') {
            setSelectedFile(file);
            setOriginalImagePreview(URL.createObjectURL(file));
            showAlert('success', `File "${file.name}" berhasil dipilih.`);
        } else {
            setStegoFile(file);
            showAlert('success', `File stego "${file.name}" berhasil dipilih.`);
        }
    };
    
    // Handler untuk drag and drop
    const handleDrop = (e, type) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFileSelect(file, type);
    };

    // Fungsi untuk menyembunyikan pesan (Encode)
    const handleEncode = async () => {
        if (!selectedFile) return showAlert('warning', 'Pilih gambar terlebih dahulu.');
        if (!message.trim()) return showAlert('warning', 'Masukkan pesan rahasia.');

        setIsLoading(true);
        setShowEncodePreview(false);
        const form = new FormData();
        form.append('file', selectedFile);
        form.append('message', message);

        try {
            const res = await fetch(`${API_BASE}/encode`, { method: 'POST', body: form });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Error: ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setStegoImagePreview(url);
            setShowEncodePreview(true);
            showAlert('success', '✅ Pesan berhasil disisipkan ke gambar!');
        } catch (err) {
            showAlert('error', `Terjadi kesalahan: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Fungsi untuk mengekstrak pesan (Decode)
    const handleDecode = async () => {
        if (!stegoFile) return showAlert('warning', 'Pilih gambar stego terlebih dahulu.');

        setIsLoading(true);
        setShowDecodeResult(false);
        const form = new FormData();
        form.append('file', stegoFile);

        try {
            const res = await fetch(`${API_BASE}/decode`, { method: 'POST', body: form });
            const data = await res.json();

            if (res.ok && data.message) {
                setExtractedMessage(data.message);
                setShowDecodeResult(true);
                showAlert('success', '✅ Pesan berhasil diekstrak!');
            } else {
                throw new Error(data.error || 'Tidak ada pesan yang ditemukan.');
            }
        } catch (err) {
            showAlert('error', `⚠️ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-lock"></i> Steganografi DCT</h1>
                <p>Sembunyikan pesan rahasia dalam gambar dengan algoritma DCT</p>
            </div>

            <div className="mode-selector">
                <div className="mode-toggle">
                    <button 
                        className={`mode-btn ${mode === 'encode' ? 'active' : ''}`} 
                        onClick={() => switchMode('encode')}
                    >
                        <i className="fas fa-plus-circle"></i> Sembunyikan Pesan
                    </button>
                    <button 
                        className={`mode-btn ${mode === 'decode' ? 'active' : ''}`} 
                        onClick={() => switchMode('decode')}
                    >
                        <i className="fas fa-search"></i> Ekstrak Pesan
                    </button>
                </div>
            </div>

            <div className="main-content">
                {/* Alert/Notification Area */}
                {alert.show && (
                    <div id="alertContainer">
                        <div className={`alert alert-${alert.type}`}>
                            <i className={`fas fa-${{success: 'check-circle', warning: 'exclamation-triangle', error: 'times-circle'}[alert.type]}`}></i>
                            <span>{alert.message}</span>
                        </div>
                    </div>
                )}
                
                {/* Encode Section */}
                <div id="encode-section" className={mode !== 'encode' ? 'hidden' : ''}>
                    <div 
                        className="upload-area" 
                        onClick={() => imageInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                        onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                        onDrop={(e) => handleDrop(e, 'image')}
                    >
                        <div className="upload-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                        <div className="upload-text">Klik untuk memilih gambar</div>
                        <div className="upload-subtext">atau drag & drop file di sini</div>
                        <input 
                            type="file" 
                            id="imageInput" 
                            className="file-input" 
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={(e) => handleFileSelect(e.target.files[0], 'image')}
                        />
                    </div>

                    <textarea 
                        id="messageInput" 
                        className="message-input" 
                        placeholder="Masukkan pesan rahasia..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>

                    <button id="encodeBtn" className="action-btn" onClick={handleEncode} disabled={isLoading}>
                        {isLoading ? <div className="loading"></div> : <i className="fas fa-shield-alt"></i>}
                        {isLoading ? 'Menyembunyikan...' : 'Sembunyikan Pesan'}
                    </button>

                    {showEncodePreview && (
                        <div id="encodePreview" className="preview-area">
                            <div className="preview-card">
                                <h3><i className="fas fa-image"></i> Gambar Asli</h3>
                                <img id="originalImage" className="preview-image" src={originalImagePreview} alt="Original" />
                            </div>
                            <div className="preview-card">
                                <h3><i className="fas fa-lock"></i> Gambar Stego</h3>
                                <img id="stegoImage" className="preview-image" src={stegoImagePreview} alt="Stego" />
                                <a id="downloadBtn" className="download-btn" href={stegoImagePreview} download="stego_image.png">
                                    <i className="fas fa-download"></i> Download PNG
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decode Section */}
                <div id="decode-section" className={mode !== 'decode' ? 'hidden' : ''}>
                    <div 
                        className="upload-area" 
                        onClick={() => stegoInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                        onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                        onDrop={(e) => handleDrop(e, 'stego')}
                    >
                        <div className="upload-icon"><i className="fas fa-file-image"></i></div>
                        <div className="upload-text">Pilih gambar stego (format PNG)</div>
                        <div className="upload-subtext">Pastikan menggunakan file hasil encode</div>
                        <input 
                            type="file" 
                            id="stegoInput" 
                            className="file-input" 
                            accept=".png"
                            ref={stegoInputRef}
                            onChange={(e) => handleFileSelect(e.target.files[0], 'stego')}
                        />
                    </div>

                    <button id="decodeBtn" className="action-btn" onClick={handleDecode} disabled={isLoading}>
                        {isLoading ? <div className="loading"></div> : <i className="fas fa-unlock-alt"></i>}
                        {isLoading ? 'Mengekstrak...' : 'Ekstrak Pesan'}
                    </button>

                    {showDecodeResult && (
                        <div id="decodeResult" className="result-area">
                            <h3><i className="fas fa-envelope-open"></i> Pesan Tersembunyi:</h3>
                            <div id="extractedMessage" className="result-message">{extractedMessage}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;