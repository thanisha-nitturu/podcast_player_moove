define(['jquery'], function($) {
    $('<style>')
    .prop('type', 'text/css')
    .html(`
        .podcast-button-wrapper {
            width: 100% !important;
            text-align: center !important;
            margin-top: 8px !important;
        }

        .podcast-play-btn {
            display: inline-block !important;
            margin: 0 auto !important;
        }
    `)
    .appendTo('head');
    var PersistentPlayer = {
        audioElement: null,
        isPlaying: false,

        init: function() {
            this.audioElement = document.getElementById('audio-element');
            if (!this.audioElement) {
                return;
            }

            this.setupEventListeners();
            this.restorePlayerState();
            this.addPlayButtonsToContent();
        },

        setupEventListeners: function() {
            var self = this;

            $('#play-pause-btn').on('click', function() {
                self.togglePlayPause();
            });

            $('#close-player').on('click', function() {
                self.closePlayer();
            });

            this.audioElement.addEventListener('loadedmetadata', function() {
                self.updateTotalTime();
            });

            this.audioElement.addEventListener('timeupdate', function() {
                self.updateProgress();
                self.savePlayerState();
            });

            this.audioElement.addEventListener('ended', function() {
                self.onAudioEnded();
            });

            $('#volume').on('input', function() {
                self.audioElement.volume = parseFloat($(this).val());
            });

            $('#skip-forward').on('click', function() {
                if (self.audioElement.duration) {
                    self.audioElement.currentTime = Math.min(self.audioElement.duration, self.audioElement.currentTime + 10);
                }
            });

            $('#skip-back').on('click', function() {
                if (self.audioElement.duration) {
                    self.audioElement.currentTime = Math.max(0, self.audioElement.currentTime - 10);
                }
            });

            $('#speed').on('change', function() {
                self.audioElement.playbackRate = parseFloat($(this).val());
            });

            $('#seekbar').on('input', function() {
                var percent = parseFloat($(this).val());
                if (self.audioElement.duration) {
                    self.audioElement.currentTime = self.audioElement.duration * (percent / 100);
                }
            });
        },

        isAudioFile: function(filename) {
            var audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.mp4', '.webm'];
            if (!filename) {
                return false;
            }

            return audioExtensions.some(function(ext) {
                return filename.toLowerCase().endsWith(ext);
            });
        },

        addPlayButtonsToContent: function() {
            var self = this;
            $('li.activity.modtype_label').each(function(index) {
                var $label = $(this);
                if ($label.find('.podcast-play-btn').length > 0) {
                    return;
                }

                var $audio = $label.find('audio');
                if ($audio.length === 0) {
                    return;
                }

                var $source = $audio.find('source');
                if ($source.length === 0) {
                    return;
                }

                var audioSrc = $source.attr('src');
                $audio.hide();
                $audio.find('source').hide();
                var title = $label.find('.activity-title, .instancename').text().trim() || 'Label Audio ' + (index + 1);
                if (!audioSrc || !self.isAudioFile(audioSrc)) {
                    return;
                }

                var playButton = $('<button>')
                    .addClass('podcast-play-btn')
                    .css({
                        background: '#377BFB',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        margin: '5px 0',
                        cursor: 'pointer',
                        fontSize: '14px'
                    })
                    .html('🎧 Play Podcast')
                    .attr('data-track-title', title)
                    .attr('data-track-url', audioSrc)
                    .on('click', function() {
                        self.playTrack(title, audioSrc);
                    });

                var $container = $label.find('.activity-altcontent');
                if ($container.length === 0) {
                    $container = $label.find('.contentwithoutlink');
                }
                if ($container.length === 0) {
                    $container = $label;
                }

                $container.append(
                    $('<div>')
                        .addClass('podcast-button-wrapper')
                        .append(playButton)
                );
            });
        },

        playTrack: function(title, url) {
            $('#persistent-audio-player').show();
            $('#track-title').text(title);
            this.audioElement.src = url;
            this.audioElement.play();
            this.isPlaying = true;
            $('#play-pause-btn').html('⏸️ Pause');
            this.savePlayerState(title, url);
        },

        togglePlayPause: function() {
            if (this.isPlaying) {
                this.audioElement.pause();
                this.isPlaying = false;
                $('#play-pause-btn').html('▶️ Play');
            } else {
                this.audioElement.play();
                this.isPlaying = true;
                $('#play-pause-btn').html('⏸️ Pause');
            }
            this.savePlayerState();
        },

        closePlayer: function() {
            this.audioElement.pause();
            this.audioElement.src = '';
            $('#persistent-audio-player').hide();
            this.clearPlayerState();
        },

        updateTotalTime: function() {
            var duration = this.audioElement.duration;
            if (duration) {
                $('#total-time').text(this.formatTime(duration));
            }
        },

        updateProgress: function() {
            var current = this.audioElement.currentTime;
            var duration = this.audioElement.duration;
            $('#current-time').text(this.formatTime(current));
            if (duration > 0) {
                var percentage = (current / duration) * 100;
                $('#progress-fill').css('width', percentage + '%');
                $('#seekbar').val(percentage);
            }
        },

        onAudioEnded: function() {
            this.isPlaying = false;
            $('#play-pause-btn').html('▶️ Play');
            $('#progress-fill').css('width', '0%');
            $('#seekbar').val(0);
        },

        savePlayerState: function(title, url) {
            var state = {
                title: title || $('#track-title').text(),
                url: url || this.audioElement.src,
                currentTime: this.audioElement.currentTime,
                isPlaying: this.isPlaying,
                visible: $('#persistent-audio-player').is(':visible'),
                volume: this.audioElement.volume,
                rate: this.audioElement.playbackRate
            };
            localStorage.setItem('moodlePersistentAudio', JSON.stringify(state));
        },

        restorePlayerState: function() {
            var state = localStorage.getItem('moodlePersistentAudio');
            if (!state) {
                return;
            }

            state = JSON.parse(state);
            if (!state.url) {
                return;
            }

            var self = this;
            if (state.visible) {
                $('#persistent-audio-player').show();
            } else {
                $('#persistent-audio-player').hide();
                return;
            }

            $('#track-title').text(state.title);
            this.audioElement.src = state.url;
            this.audioElement.volume = state.volume || 1;
            this.audioElement.playbackRate = state.rate || 1;
            $('#volume').val(this.audioElement.volume);
            $('#speed').val(this.audioElement.playbackRate);

            this.audioElement.addEventListener('loadedmetadata', function onMeta() {
                self.audioElement.removeEventListener('loadedmetadata', onMeta);
                self.audioElement.currentTime = state.currentTime || 0;

                if (state.isPlaying) {
                    self.audioElement.play().then(function() {
                        self.isPlaying = true;
                        $('#play-pause-btn').html('⏸️ Pause');
                    }).catch(function() {
                        self.isPlaying = false;
                        $('#play-pause-btn').html('▶️ Play');
                    });
                } else {
                    self.isPlaying = false;
                    $('#play-pause-btn').html('▶️ Play');
                }
            }, { once: true });
        },

        clearPlayerState: function() {
            localStorage.removeItem('moodlePersistentAudio');
        },

        formatTime: function(seconds) {
            var minutes = Math.floor(seconds / 60);
            var remainingSeconds = Math.floor(seconds % 60);
            return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
        }
    };

    return PersistentPlayer;
});
