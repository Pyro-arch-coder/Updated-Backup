import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FaceAuth.css';
import axios from 'axios';

const FaceAuth = ({ onLoginSuccess, email }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [stream, setStream] = useState(null);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [previousFrames, setPreviousFrames] = useState([]);
    const [staticFrameCount, setStaticFrameCount] = useState(0);
    const [lastMovementTime, setLastMovementTime] = useState(Date.now());
    const [frameCount, setFrameCount] = useState(0); // New state for frame count
    // Get email from localStorage if it's not passed as a prop
    const [userEmail, setUserEmail] = useState(email || localStorage.getItem('faceAuthEmail') || '');
    const [userId, setUserId] = useState(null); // New state for user ID
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

    useEffect(() => {
        loadModels();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                setStream(null);
                setIsRunning(false);
            }
        };
    }, []);

    useEffect(() => {
        // Update userEmail state if email prop changes
        if (email) {
            setUserEmail(email);
            console.log("Email prop received in FaceAuth:", email);
            setMessage(`Welcome ${email}! Loading face detection models...`);
        } else {
            // Try to get from localStorage if not in props
            const storedEmail = localStorage.getItem('faceAuthEmail');
            if (storedEmail) {
                setUserEmail(storedEmail);
                console.log("Email found in localStorage:", storedEmail);
                setMessage(`Welcome ${storedEmail}! Loading face detection models...`);
            } else {
                console.log("No email found in prop or localStorage");
                setMessage('Loading face detection models...');
            }
        }
    }, [email]);

    const loadModels = async () => {
        try {
            setMessage('Loading face detection models...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setModelsLoaded(true);
            setMessage('Models loaded successfully! You can now start the camera.');
        } catch (error) {
            console.error('Error loading models:', error);
            setMessage('Error loading face detection models. Please check if the model files are present in the /models directory.');
            setModelsLoaded(false);
        }
    };

    const getTinyFaceDetectorOptions = () => {
        return new faceapi.TinyFaceDetectorOptions({
            inputSize: 160, // Reduced from 320 for faster processing
            scoreThreshold: 0.4
        });
    };

    const startVideo = async () => {
        if (!modelsLoaded) {
            setMessage('Please wait for models to load before starting the camera.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: 480,
                    height: 360,
                    facingMode: 'user'
                } 
            });
            videoRef.current.srcObject = stream;
            setStream(stream);
            setIsRunning(true);
            detectFaces();
        } catch (error) {
            console.error('Error accessing camera:', error);
            setMessage('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStream(null);
            setIsRunning(false);
        }
    };

    const checkForStaticImage = () => {
        if (!videoRef.current) return false;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Keep last 5 frames for comparison
        const frames = [...previousFrames, currentFrame].slice(-5);
        setPreviousFrames(frames);

        if (frames.length < 2) return false;

        // Compare current frame with previous frames
        let totalDiff = 0;
        for (let i = 1; i < frames.length; i++) {
            const diff = calculateFrameDifference(frames[i], frames[i-1]);
            totalDiff += diff;
        }

        const averageDiff = totalDiff / (frames.length - 1);
        
        // More strict threshold for movement detection
        const isStatic = averageDiff < 2.0;
        
        if (isStatic) {
            setStaticFrameCount(prev => prev + 1);
            // If static for more than 15 frames (about 0.5 seconds), likely a photo
            if (staticFrameCount > 15) {
                return true;
            }
        } else {
            setStaticFrameCount(0);
            setLastMovementTime(Date.now());
        }

        // If no significant movement for 3 seconds, consider it a static image
        if (Date.now() - lastMovementTime > 3000) {
            return true;
        }

        return false;
    };

    const calculateFrameDifference = (frame1, frame2) => {
        let diff = 0;
        const data1 = frame1.data;
        const data2 = frame2.data;
        
        // Sample pixels for performance (every 4th pixel)
        for (let i = 0; i < data1.length; i += 16) {
            // Compare RGB values
            diff += Math.abs(data1[i] - data2[i]); // R
            diff += Math.abs(data1[i + 1] - data2[i + 1]); // G
            diff += Math.abs(data1[i + 2] - data2[i + 2]); // B
        }
        
        // Normalize the difference
        return diff / (data1.length / 16);
    };

    const authenticateUser = async () => {
        if (!modelsLoaded || isAuthenticating) {
            return;
        }
        setIsAuthenticating(true);
        setMessage('Authenticating...');
        try {
            if (checkForStaticImage()) {
                setMessage('Login using cellphone pictures is not allowed. Please use the live camera directly.');
                setIsAuthenticating(false);
                return;
            }
            if (Date.now() - lastMovementTime > 3000) {
                setMessage('Please move slightly to confirm you are using a live camera.');
                setIsAuthenticating(false);
                return;
            }
            const allDetections = await faceapi.detectAllFaces(
                videoRef.current,
                getTinyFaceDetectorOptions()
            );
            if (allDetections.length === 0) {
                setMessage('No face detected. Try moving closer to the camera.');
                setIsAuthenticating(false);
                return;
            }
            if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Make sure only your face is visible.');
                setIsAuthenticating(false);
                return;
            }
            let faceWithLandmarks = await faceapi.detectSingleFace(
                videoRef.current,
                getTinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();
            if (!faceWithLandmarks) {
                setMessage('Face features not clear. Try adjusting your position or lighting.');
                setIsAuthenticating(false);
                return;
            }
            // Validate that we have a proper face descriptor
            if (!faceWithLandmarks.descriptor || faceWithLandmarks.descriptor.length === 0) {
                console.error('Invalid face descriptor', faceWithLandmarks.descriptor);
                setMessage('Error: Could not extract face data. Please try again.');
                setIsAuthenticating(false);
                return { success: false };
            }
            
            // Ensure descriptor is in the correct format (array of numbers)
            const descriptorArray = Array.from(faceWithLandmarks.descriptor).map(val => Number(val));
            
            const payload = {
                descriptor: descriptorArray
            };
            
            console.log('Sending descriptor with length:', descriptorArray.length);
            
            const response = await fetch(`${API_BASE_URL}/api/authenticate-face`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                setMessage('Failed to parse authentication response. Please try again.');
                setIsAuthenticating(false);
                return;
            }
            if (response.status === 403 && data.isPendingStatus) {
                if (data.userStatus === 'created' && data.userId) {
                    setMessage('First-time login detected. Please register your face.');
                    // Switch to face registration mode
                    setIsRegistering(true);
                    setIsAuthenticating(false);
                    // Store the user ID for registration
                    setUserId(data.userId);
                    return;
                }
                setMessage('Your application is currently being reviewed by our administrators.');
                setIsAuthenticating(false);
                return;
            }
            if (!response.ok) {
                const errorMessage = data?.error || `Authentication failed with status: ${response.status}`;
                setMessage(errorMessage);
                setIsAuthenticating(false);
                return;
            }
            if (data.success && data.user) {
                // --- PATCH: Assign role based on table name ---
                if (!data.user.role) {
                    if (data.user.table === 'admin') {
                        data.user.role = 'admin';
                    } else if (data.user.table === 'superadmin') {
                        data.user.role = 'superadmin';
                    } else {
                        data.user.role = 'user'; // Default
                    }
                }
                setMessage('Authentication successful! Redirecting...');
                if (typeof onLoginSuccess === 'function') {
                    try {
                        onLoginSuccess(data.user);
                    } catch (cbErr) {
                        setMessage('Login callback error: ' + cbErr.message);
                    }
                } else {
                    setMessage('Login success, but no callback provided.');
                }
            } else {
                setMessage((data && data.error) || 'Facial recognition unsuccessful. Your face could not be matched with our records. Please ensure proper lighting and positioning, or contact support if this issue persists.');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setMessage(`Authentication failed: We encountered a technical issue during facial verification. Please try again or use an alternative login method.`);
            setIsAuthenticating(false);
            return { success: false };
        }
    };

    const detectFaces = async () => {
        if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
            return;
        }
        
        // Only run detection every 3rd frame to reduce CPU usage
        if (frameCount < 3) {
            setFrameCount(frameCount + 1);
            requestAnimationFrame(detectFaces);
            return;
        }
        setFrameCount(0);
        
        try {
            const allDetections = await faceapi.detectAllFaces(
                videoRef.current,
                getTinyFaceDetectorOptions()
            ).withFaceLandmarks();
            // Clear canvas
            const context = canvasRef.current.getContext('2d');
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            // Draw detections
            const displaySize = { 
                width: videoRef.current.width, 
                height: videoRef.current.height 
            };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const resizedDetections = faceapi.resizeResults(allDetections, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            // Run next frame as soon as possible
            setTimeout(() => requestAnimationFrame(detectFaces), 30); // Reduced from 12ms to 30ms (33 FPS instead of 80 FPS)
            // Update message
            if (allDetections.length === 0) {
                setMessage('No face detected. Try moving closer to the camera.');
            } else if (allDetections.length > 1) {
                setMessage('Multiple faces detected. Make sure only your face is visible.');
            } else {
                setMessage('Face detected! You can now click "Authenticate" to login.');
            }
        } catch (error) {
            console.error('Error detecting faces:', error);
            setMessage('Error detecting faces. Please try again.');
        }
    };

    const registerFacePhoto = async () => {
        if (!modelsLoaded || isRegistering) {
            return;
        }

        // Check if we have a user ID (should only run on profile page, not login)
        const userId = localStorage.getItem('UserId');
        if (!userId) {
            setMessage('You must be logged in to register a face photo');
            return;
        }

        setIsRegistering(true);
        setMessage('Registering face photo...');

        try {
            // Get the current frame from video
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            const file = new File([blob], "face_recognition.jpg", { type: "image/jpeg" });

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'soloparent');
            formData.append('folder', `soloparent/users/${userId}/face_recognition`);

            // Upload to Cloudinary
            const cloudinaryResponse = await fetch(
                `https://api.cloudinary.com/v1_1/dskj7oxr7/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const cloudinaryData = await cloudinaryResponse.json();

            // Update the faceRecognitionPhoto in the database
            const updateResponse = await axios.post(
                `${API_BASE_URL}/updateUserProfile`,
                { 
                    userId: userId, 
                    faceRecognitionPhoto: cloudinaryData.secure_url
                }
            );

            if (updateResponse.data.success) {
                setMessage('Face photo registered successfully!');
            } else {
                throw new Error('Failed to register face photo');
            }
        } catch (error) {
            console.error('Error registering face photo:', error);
            setMessage('Error registering face photo. Please try again.');
        } finally {
            setIsRegistering(false);
        }
    };

    const captureFace = async () => {
        if (isRegistering) {
            registerFacePhoto();
        } else {
            authenticateUser();
        }
    };

    useEffect(() => {
        // Cleanup function for component unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                setStream(null);
                setIsRunning(false);
            }
        };
    }, [stream]); // Add stream as dependency

    return (
        <div className="face-auth-container">
            <h2>Face Authentication</h2>
            <div className="video-container">
                <video ref={videoRef} autoPlay playsInline />
                <canvas ref={canvasRef} />
            </div>
            
            {isRunning ? (
                <>
                    <button 
                        className="face action-btn"
                        onClick={captureFace}
                        disabled={isAuthenticating || isRegistering}
                    >
                        {isAuthenticating ? 'Authenticating...' : isRegistering ? 'Registering...' : 'Authenticate'}
                    </button>
                    
                    {!onLoginSuccess && localStorage.getItem('UserId') && (
                        <button 
                            className="action-btn secondary"
                            onClick={registerFacePhoto}
                            disabled={!isRunning || isRegistering}
                        >
                            {isRegistering ? 'Registering...' : 'Register New Face'}
                        </button>
                    )}
                </>
            ) : (
                <button 
                    className="face action-btn"
                    onClick={startVideo}
                >
                    Start Camera
                </button>
            )}
            
            {message && <p className="messagefc">{message}</p>}
        </div>
    );
};

export default FaceAuth; 