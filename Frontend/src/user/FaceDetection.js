import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './FaceDetection.css';

const FaceDetection = ({ onPhotoCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [stream, setStream] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelError, setModelError] = useState(null);

    useEffect(() => {
        loadModels();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const loadModels = async () => {
        try {
            setModelError(null);
            console.log('Starting to load models...');
            
            // Load models from the public directory
            const MODEL_URL = '/models';
            
            // Load each model with error handling
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                console.log('Tiny face detector loaded');
            } catch (error) {
                console.error('Error loading tiny face detector:', error);
                throw new Error('Failed to load face detection model. Please ensure all model files are present in the /public/models directory.');
            }

            try {
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                console.log('Face landmark model loaded');
            } catch (error) {
                console.error('Error loading face landmark model:', error);
                throw new Error('Failed to load face landmark model. Please ensure all model files are present in the /public/models directory.');
            }

            try {
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                console.log('Face recognition model loaded');
            } catch (error) {
                console.error('Error loading face recognition model:', error);
                throw new Error('Failed to load face recognition model. Please ensure all model files are present in the /public/models directory.');
            }

            console.log('All models loaded successfully');
            setModelsLoaded(true);
        } catch (error) {
            console.error('Error loading models:', error);
            setModelError(`Failed to load face detection models: ${error.message}`);
        }
    };

    const startCamera = async () => {
        if (!modelsLoaded) {
            setModelError('Please wait for models to load before starting the camera.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            setStream(stream);
            setIsRunning(true);
            detectFaces();
        } catch (error) {
            console.error('Error accessing camera:', error);
            setModelError('Failed to access camera. Please ensure you have granted camera permissions.');
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

    const takePhoto = () => {
        if (!isRunning) {
            setModelError('Please start the camera first.');
            return;
        }

        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');

        // Draw the current video frame
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Call the callback with the photo data
        if (onPhotoCapture) {
            onPhotoCapture(photoData);
        }
    };
    
    const skipPhoto = () => {
        // Call the callback with null to indicate skipping
        if (onPhotoCapture) {
            onPhotoCapture(null);
        }
    };

    const detectFaces = async () => {
        if (!isRunning) return;

        try {
            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
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
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

            // Continue detection loop
            requestAnimationFrame(detectFaces);
        } catch (error) {
            console.error('Error detecting faces:', error);
        }
    };

    return (
        <div className="face-detection-container">
            <h2>Take a Photo</h2>
            {modelError && (
                <div className="error-message">
                    {modelError}
                </div>
            )}
            <div className="video-container">
                <video
                    ref={videoRef}
                    width="720"
                    height="560"
                    autoPlay
                    muted
                />
                <canvas ref={canvasRef} />
            </div>
            <div className="controls">
                <button 
                    className="start-btn"
                    onClick={startCamera} 
                    disabled={isRunning || !modelsLoaded}
                >
                    Start Camera
                </button>
                <button 
                    className="capture-btn"
                    onClick={takePhoto} 
                    disabled={!isRunning}
                >
                    Take Photo
                </button>
                <button 
                    className="stop-btn"
                    onClick={stopCamera} 
                    disabled={!isRunning}
                >
                    Stop Camera
                </button>
            </div>
        </div>
    );
};

export default FaceDetection; 