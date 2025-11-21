import React, { useState, useRef } from 'react';

// 🚨 REPLACE THIS WITH YOUR GOOGLE SCRIPT URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz-KeGqD_BhkdkYnD9XEmykEInsP9GPwN1lFqhltBg7F_G3gKq0Mc0GoMDzSD6PWXkO/exec';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    facultyName: '',
    fullName: '',
    rollNo: '',
    password: '',
    class: '',
    section: ''
  });
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoData, setPhotoData] = useState(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera Error: " + err.message);
      setIsCameraOpen(false);
    }
  };

  const takePhoto = () => {
    const width = 300; const height = 300; 
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    setPhotoData(canvas.toDataURL('image/jpeg', 0.7));
    
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  const retakePhoto = () => { setPhotoData(null); startCamera(); };

  // --- STEP 1: REQUEST OTP ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!formData.facultyName) return alert("Enter Faculty Name");
    if (!photoData) return alert("Capture Photo First");

    setStatus('sending_otp');
    setMessage('Sending OTP to Admin...');

    const params = new URLSearchParams();
    params.append('action', 'send_otp');
    params.append('rollNo', formData.rollNo);
    params.append('fullName', formData.fullName);
    params.append('class', formData.class);
    params.append('section', formData.section);
    params.append('facultyName', formData.facultyName);
    
    try {
      const res = await fetch(WEB_APP_URL + '?' + params.toString(), { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setStep(2); setStatus('idle'); setMessage('');
      } else {
        setStatus('error'); setMessage(data.message);
      }
    } catch (err) {
      setStatus('error'); setMessage('Network Error');
    }
  };

  // --- STEP 2: VERIFY & REGISTER ---
  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setStatus('verifying');
    
    // ✅ FIX: Use URLSearchParams instead of FormData
    const params = new URLSearchParams();
    params.append('action', 'register');
    params.append('otp', otp);
    params.append('rollNo', formData.rollNo);
    params.append('password', formData.password);
    params.append('fullName', formData.fullName);
    params.append('class', formData.class);
    params.append('section', formData.section);
    params.append('facultyName', formData.facultyName);
    // Note: We are not sending photoBase64 to the backend to keep it fast.

    try {
      const res = await fetch(WEB_APP_URL, { 
        method: 'POST', 
        body: params // This sends as 'application/x-www-form-urlencoded' which GAS reads perfectly
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setStatus('success');
      } else {
        setStatus('error'); setMessage(data.message);
      }
    } catch (err) {
      setStatus('error'); setMessage('Failed: ' + err.toString());
    }
  };

  if (status === 'success') {
    return (
      <div className="ultimate-bg">
        <div className="glass-panel" style={{textAlign: 'center'}}>
          <h1 style={{fontSize: '3rem'}}>✅</h1>
          <h2 className="school-line-1">Success!</h2>
          <p>Student Registered Successfully.</p>
          <button onClick={() => window.location.reload()} className="neon-button">Next Student</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ultimate-bg">
      <div className="glass-panel animate-card-entry">
        <div className="id-header">
             <h1 className="school-line-1">Contest Registration</h1>
             <h2 className="school-line-2">Faculty Portal</h2>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="input-container" style={{borderLeft: '4px solid #4f46e5'}}>
                <div className="field-wrapper">
                  <label>Registered By (Faculty Name)</label>
                  <input required name="facultyName" onChange={handleChange} placeholder="e.g. Mr. Sharma" />
                </div>
            </div>

            <div className="input-container">
                <div className="field-wrapper">
                  <label>Student Full Name</label>
                  <input required name="fullName" onChange={handleChange} placeholder="John Doe" />
                </div>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <div className="input-container">
                <div className="field-wrapper">
                  <label>Roll No</label>
                  <input required name="rollNo" onChange={handleChange} placeholder="1201" />
                </div>
              </div>
              <div className="input-container">
                <div className="field-wrapper">
                  <label>Password</label>
                  <input required name="password" onChange={handleChange} placeholder="Secret" />
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
               <div className="input-container">
                <div className="field-wrapper">
                  <label>Class</label>
                  <input required name="class" onChange={handleChange} placeholder="10" />
                </div>
              </div>
              <div className="input-container">
                <div className="field-wrapper">
                  <label>Section</label>
                  <input required name="section" onChange={handleChange} placeholder="A" />
                </div>
              </div>
            </div>

            {/* Camera */}
            <div style={{margin: '20px 0', textAlign: 'center'}}>
              {!isCameraOpen && !photoData && (
                 <button type="button" onClick={startCamera} style={{background:'#333', color:'#fff', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', border:'none'}}>
                    📷 Open Camera
                 </button>
              )}
              {isCameraOpen && (
                <div>
                  <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'12px'}} />
                  <button type="button" onClick={takePhoto} className="neon-button" style={{width:'auto', padding:'8px 20px', marginTop:'10px'}}>Capture</button>
                </div>
              )}
              {photoData && (
                <div>
                  <img src={photoData} alt="Captured" style={{width:'150px', borderRadius:'12px', border:'3px solid #22c55e'}} />
                  <br/>
                  <button type="button" onClick={retakePhoto} style={{color:'#ef4444', background:'none', border:'none', marginTop:'5px', cursor:'pointer', fontWeight:'bold'}}>Retake Photo</button>
                </div>
              )}
              <canvas ref={canvasRef} style={{display: 'none'}} />
            </div>

            {message && <div className="error-toast">{message}</div>}
            
            <button type="submit" className="neon-button" disabled={status === 'sending_otp'}>
              {status === 'sending_otp' ? 'Processing...' : 'Verify & Register >'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalRegister}>
             <div style={{textAlign:'center', marginBottom:'20px'}}>
               <h3>Admin Verification</h3>
               <p style={{fontSize:'0.9rem', color:'#64748b'}}>OTP sent to Admins.</p>
             </div>

             <div className="input-container" style={{borderColor: '#4f46e5'}}>
                <div className="field-wrapper" style={{alignItems:'center'}}>
                  <label>ENTER OTP</label>
                  <input required type="number" value={otp} onChange={(e) => setOtp(e.target.value)} style={{textAlign:'center', fontSize:'1.5rem', letterSpacing:'5px'}} />
                </div>
             </div>

             {message && <div className="error-toast">{message}</div>}

             <button type="submit" className="neon-button" disabled={status === 'verifying'}>
                {status === 'verifying' ? 'Registering...' : 'Confirm Registration'}
             </button>
             <button type="button" onClick={() => setStep(1)} style={{width:'100%', marginTop:'15px', background:'none', border:'none', color:'#64748b', cursor:'pointer'}}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistrationForm;