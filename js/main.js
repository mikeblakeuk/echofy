List = null;
inverse = false;

require([
    '$api/models',
    '$views/list#List'
], function (models, List) {
    'use strict';

    List = List;
    var en_api_key = '70Z2JIDJG6ZUHDTQF';

    // Drag content into an HTML element from Spotify
    var dropBox = document.getElementById('drop-box');
    dropBox.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/html', this.innerHTML);
        e.dataTransfer.effectAllowed = 'copy';
    }, false);

    dropBox.addEventListener('dragenter', function (e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.classList.add('over');
    }, false);

    dropBox.addEventListener('dragover', function (e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
    }, false);

    dropBox.addEventListener('drop', function (e) {
        if (e.preventDefault) e.preventDefault();
        var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
        console.log(drop);
        this.classList.remove('over');
        showPlayList(models, drop.uri);
    }, false);

    // Drag content into the sidebar
    models.application.addEventListener('dropped', function () {
        console.log(models.application.dropped);
    });

    function showPlayList(models, uri) {
        // PLAYLIST
        var playlist_metadata_HTML = document.getElementById('playlist-metadata');
        var playlist_metadata_properties = ['collaborative', 'description', 'name', 'owner', 'tracks'];

        models.Playlist.fromURI(uri)
            .load(playlist_metadata_properties)
            .done(function (p) {

                $('drop-box').innerText = p.name;

                var oldPlayList = $('#playlist-div')[0];
                oldPlayList.innerHTML = '';
                var listHtml = List.forPlaylist(p);
                oldPlayList.appendChild(listHtml.node);
                listHtml.init();

                addSorting(listHtml);

                p.tracks.snapshot().done(function (t) {
                    var tracks = t.toArray();
                    getTrackFromEchoNest(en_api_key, tracks);
                });
            });
    };

    function addSorting(table) {

        $('#sort').click(function () {

            console.log($('table'));
            $('table').find('td').filter(function () {

                return $(this).index() === 4;

            }).sortElements(function(a, b){

                    a = $(a).text();
                    b = $(b).text();

                    return (
                        isNaN(a) || isNaN(b) ?
                            a > b : +a > +b
                        ) ?
                        inverse ? -1 : 1 :
                        inverse ? 1 : -1;

                }, function(){
                    return this.parentNode;
                });

            inverse = !inverse;

        });
    }

    function getTrackFromEchoNest(api_key, tracks) {
        $.ajaxSetup({ traditional: true, cache: false });

        var url = 'http://developer.echonest.com/api/v4/track/profile?api_key=' + api_key + '&callback=?';

        for (var i = 0; i < tracks.length; i++) {
            var echoId = tracks[i].uri.replace('spotify', 'spotify-WW');

            $.getJSON(url,
                {
                    id: echoId,
                    format: 'jsonp',
                    bucket: ['audio_summary']
                },
                function (data) {
                    if (checkResponse(data)) {
                        var spotifyId = data.response.track.foreign_id.replace('spotify-WW', 'spotify');
                        //var trackTr = $('tr[data-uri=\'' + spotifyId + '\']')[0];
                        var albumTd = $('tr[data-uri=\'' + spotifyId + '\'] td[class="sp-list-cell sp-list-cell-album"]')[0];

                        if (data.response.track.audio_summary.tempo == null) {
                            tempo = 0;
                        }
                        else {
                            var tempo = data.response.track.audio_summary.tempo;
                        }

                        albumTd.innerHTML = '<div>' + Math.round(tempo) + '</div>';
                    }
                }
            );
        }
    }

    function checkResponse(data) {
        if (data.response) {
            if (data.response.status.code != 0) {
                $('#error').text("Whoops... Unexpected error from server. " + data.response.status.message);
                console.log(JSON.stringify(data.response));
            } else {
                return true;
            }
        } else {
            error("Unexpected response from server");
        }
        return false;
    }
});
