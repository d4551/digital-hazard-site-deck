/**
 * Video Handler for dh_advert.mp4
 * Handles video loading, playback, and error handling
 */

(function() {
    'use strict';

    function initVideoHandler() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initVideoHandler);
            return;
        }
        
        const video = document.getElementById('dhAdvertVideo');
        const overlay = document.getElementById('videoPlayOverlay');
        
        if (!video) {
            // Silently return - video might not be on every page
            return;
        }

        // Mute/Unmute toggle button
        const muteToggle = document.getElementById('videoMuteToggle');
        const muteIcon = document.getElementById('videoMuteIcon');
        
        if (muteToggle && muteIcon) {
            // Start unmuted - user controls audio via controls
            video.muted = false;
            updateMuteIcon();
            
            muteToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                video.muted = !video.muted;
                updateMuteIcon();
            });
            
            function updateMuteIcon() {
                if (video.muted) {
                    muteIcon.className = 'fas fa-volume-mute';
                    muteToggle.setAttribute('aria-label', 'Unmute video');
                    muteToggle.setAttribute('title', 'Unmute video');
                } else {
                    muteIcon.className = 'fas fa-volume-up';
                    muteToggle.setAttribute('aria-label', 'Mute video');
                    muteToggle.setAttribute('title', 'Mute video');
                }
            }
            
            // Update icon when video muted state changes (e.g., via native controls)
            video.addEventListener('volumechange', updateMuteIcon);
        }
        
        // Error handling
        video.addEventListener('error', function(e) {
            console.error('Video loading error:', e);
            const error = video.error;
            if (error) {
                let errorMsg = 'Video failed to load';
                switch(error.code) {
                    case error.MEDIA_ERR_ABORTED:
                        errorMsg = 'Video loading aborted';
                        break;
                    case error.MEDIA_ERR_NETWORK:
                        errorMsg = 'Network error loading video';
                        break;
                    case error.MEDIA_ERR_DECODE:
                        errorMsg = 'Video decode error';
                        break;
                    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMsg = 'Video format not supported';
                        break;
                }
                
                // Show fallback
                video.style.display = 'none';
                const fallback = video.querySelector('div');
                if (fallback) {
                    fallback.style.display = 'flex';
                }
                console.error('Video error:', errorMsg);
            }
        });

        // Load video metadata
        video.addEventListener('loadedmetadata', function() {
            console.log('Video metadata loaded:', {
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight
            });
            
            // Show video is ready
            if (overlay) {
                overlay.style.opacity = '1';
            }
        });

        // Handle play button click (only when video is paused)
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.stopPropagation();
                playVideo(video, overlay);
            });
        }

        // Handle video click to play/pause (when not using native controls)
        // Note: Native controls handle play/pause, so this is optional
        video.addEventListener('click', function(e) {
            // Don't interfere if click is on controls
            if (e.target.tagName === 'VIDEO') {
                if (video.paused) {
                    playVideo(video, overlay);
                } else {
                    video.pause();
                }
            }
        });

        // Auto-hide overlay when video starts playing
        video.addEventListener('play', function() {
            // Ensure video is unmuted when user starts playback
            if (video.muted) {
                video.muted = false;
                if (muteIcon) {
                    muteIcon.className = 'fas fa-volume-up';
                }
                if (muteToggle) {
                    muteToggle.setAttribute('aria-label', 'Mute video');
                    muteToggle.setAttribute('title', 'Mute video');
                }
            }
            
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
            }
        });

        // Show overlay when video pauses (but not when at start)
        video.addEventListener('pause', function() {
            if (overlay && video.currentTime > 0 && video.ended === false) {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
            }
        });
        
        // Hide overlay when video ends
        video.addEventListener('ended', function() {
            if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
            }
        });

        // Handle video end
        video.addEventListener('ended', function() {
            video.currentTime = 0;
            if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
            }
        });

        // Preload video on hover
        if (overlay) {
            overlay.addEventListener('mouseenter', function() {
                if (video.readyState < 2) {
                    video.load();
                }
            });
        }

        // Try to load video
        video.load();
    }

    function playVideo(video, overlay) {
        if (!video) return;

        // Ensure video is unmuted when user presses play
        video.muted = false;
        
        // Update mute icon if it exists
        const muteIcon = document.getElementById('videoMuteIcon');
        if (muteIcon) {
            muteIcon.className = 'fas fa-volume-up';
        }
        const muteToggle = document.getElementById('videoMuteToggle');
        if (muteToggle) {
            muteToggle.setAttribute('aria-label', 'Mute video');
            muteToggle.setAttribute('title', 'Mute video');
        }

        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Video playing - ensure unmuted
                    video.muted = false;
                    if (overlay) {
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                    }
                })
                .catch(error => {
                    console.error('Video play failed:', error);
                    // Fallback: show message
                    if (overlay) {
                        const badge = overlay.querySelector('.badge');
                        if (badge) {
                            badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Playback not available</span>';
                        }
                    }
                });
        }
    }

    // Initialize when DOM is ready (handled inside function to prevent duplicate calls)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoHandler);
    } else {
        // Small delay to ensure DOM is fully parsed
        setTimeout(initVideoHandler, 0);
    }

    // Export for manual initialization if needed
    window.DHVideoHandler = {
        init: initVideoHandler,
        playVideo: playVideo
    };
})();

