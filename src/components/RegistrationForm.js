import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2'; // 📦 Import SweetAlert2
import { motion, AnimatePresence } from 'framer-motion'; // 📦 Import Framer Motion
import { FaCamera, FaRedo, FaCheckCircle, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa'; // 📦 Import Icons

// 🚨 YOUR GOOGLE SCRIPT URL
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
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      Swal.fire('Camera Error', 'Could not access camera. Permission denied?', 'error');
      setIsCameraOpen(false);
    }
  };

  const takePhoto = () => {
    const width = 400; const height = 400; 
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if(video && canvas) {
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
        
        // Stop Camera
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
    }
  };

  const retakePhoto = () => { setPhotoData(null); startCamera(); };

  // --- STEP 1: REQUEST OTP ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.facultyName || !formData.fullName || !formData.rollNo) {
        return Swal.fire('Missing Info', 'Please fill all student details.', 'warning');
    }
    if (!photoData) {
        return Swal.fire('Photo Required', 'Please capture the student photo.', 'warning');
    }

    setIsLoading(true);

    const params = new URLSearchParams();
    params.append('action', 'send_otp');
    // Spread object into params
    Object.keys(formData).forEach(key => params.append(key, formData[key]));
    
    try {
      const res = await fetch(`${WEB_APP_URL}?${params.toString()}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.status === 'success') {
        setStep(2);
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
        });
        Toast.fire({ icon: 'success',Tpitle: 'OTP sent to Admin!' });
      } else {
        Swal.fire('Error', data.message || 'Could not send OTP', 'error');
      }
    } catch (err) {
      Swal.fire('Network Error', 'Check your connection.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  // --- STEP 2: VERIFY & REGISTER ---
  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const params = new URLSearchParams();
    params.append('action', 'register');
    params.append('otp', otp);
    Object.keys(formData).forEach(key => params.append(key, formData[key]));

    try {
      const res = await fetch(WEB_APP_URL, { 
        method: 'POST', 
        body: params 
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        // 🎉 SUCCESS - SWEET ALERT 2
        Swal.fire({
            title: 'Registration Successful!',
            text: `${formData.fullName} has been registered.`,
            icon: 'success',
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Add Next Student'
        }).then(() => {
            // Reset Form
            setStep(1);
            setOtp('');
            setPhotoData(null);
            setFormData({ ...formData, fullName: '', rollNo: '', password: '' }); // Keep faculty name, class, section
        });
      } else {
        Swal.fire('Verification Failed', data.message, 'error');
      }
    } catch (err) {
        Swal.fire('Error', 'Something went wrong.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="ultimate-bg">
      <div className="glass-panel">
        <div className="header-content text-center">
             <h2>Faculty Portal</h2>
             <h1>Contest Registration</h1>
        </div>

        <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form 
            key="step1"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleRequestOTP}
          >
            
            {/* Faculty & Student Info */}
            <div className="input-group">
                <label><FaChalkboardTeacher/> Registered By</label>
                <input className="styled-input" required name="facultyName" value={formData.facultyName} onChange={handleChange} placeholder="Faculty Name" />
            </div>

            <div className="input-group">
                <label><FaUserGraduate/> Student Name</label>
                <input className="styled-input" required name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Student Full Name" />
            </div>

            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'15px'}}>
              <div className="input-group">
                <label>Roll No</label>
                <input className="styled-input" required name="rollNo" value={formData.rollNo} onChange={handleChange} placeholder="1234" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="styled-input" required name="password" value={formData.password} onChange={handleChange} placeholder="****" />
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'15px'}}>
               <div className="input-group">
                <label>Class</label>
                <input className="styled-input" required name="class" value={formData.class} onChange={handleChange} placeholder="10" />
              </div>
              <div className="input-group">
                <label>Section</label>
                <input className="styled-input" required name="section" value={formData.section} onChange={handleChange} placeholder="A" />
              </div>
            </div>

            {/* Camera Section */}
            <div style={{margin: '20px 0', textAlign: 'center'}}>
              {!isCameraOpen && !photoData && (
                 <button type="button" className="btn-secondary" onClick={startCamera}>
                    <FaCamera /> Open Camera
                 </button>
              )}
              
              {isCameraOpen && (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline className="camera-view" />
                  <div className="camera-overlay"></div>
                  <button type="button" onClick={takePhoto} className="btn-primary" style={{position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', width: 'auto', borderRadius: '50px'}}>
                    Capture
                  </button>
                </div>
              )}

              {photoData && (
                <div className="photo-preview">
                  <img src={photoData} alt="Captured" style={{width:'120px', borderRadius:'12px', border:'3px solid #4f46e5'}} />
                  <div className="check-badge"><FaCheckCircle /></div>
                  <button type="button" onClick={retakePhoto} style={{display:'block', margin:'10px auto', background:'none', border:'none', color:'#e11d48', cursor:'pointer', fontWeight:'600', fontSize:'0.8rem'}}>
                    <FaRedo/> Retake
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} style={{display: 'none'}} />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Verify & Register'}
            </button>
          </motion.form>
        ) : (
          <motion.form 
            key="step2"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleFinalRegister}
          >
             <div style={{textAlign:'center', marginBottom:'30px'}}>
               <h3 style={{color: '#1e293b'}}>Admin Verification</h3>
               <p style={{fontSize:'0.9rem', color:'#64748b'}}>An OTP has been sent to the administrator.</p>
             </div>

             <div className="input-group">
                <label style={{textAlign:'center'}}>ENTER 4-DIGIT OTP</label>
                <input 
                    className="styled-input otp-input" 
                    required 
                    type="number" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="0000"
                    autoFocus
                />
             </div>

             <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Confirm Registration'}
             </button>
             
             <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                Back to Details
             </button>
          </motion.form>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default RegistrationForm;