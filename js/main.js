List = null;

require([
    '$api/models',
    '$views/list#List',
    '$views/image#Image'
], function(models, List, Image) {
    'use strict';

    List = List;
    var en_api_key = '70Z2JIDJG6ZUHDTQF';

    // Drag content into an HTML element from Spotify
    var dropBox = document.getElementById('playlist-drop');
    dropBox.addEventListener('dragstart', function(e){
        e.dataTransfer.setData('text/html', this.innerHTML);
        e.dataTransfer.effectAllowed = 'copy';
    }, false);

    dropBox.addEventListener('dragenter', function(e){
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.classList.add('over');
    }, false);

    dropBox.addEventListener('dragover', function(e){
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
    }, false);

    dropBox.addEventListener('drop', function(e){
        if (e.preventDefault) e.preventDefault();
        var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
        console.log(drop);
        this.classList.remove('over');
        var success_message = document.createElement('p');
        success_message.innerHTML = 'Playlist successfully dropped: ' + drop.uri;

        this.appendChild(success_message);
        showPlayList(models, drop.uri);
    }, false);

    // Drag content into the sidebar
    models.application.addEventListener('dropped', function(){
        console.log(models.application.dropped);
    });

    function showPlayList(models, uri)
    {
        // PLAYLIST
        var playlist_metadata_HTML = document.getElementById('playlist-metadata');
        var playlist_metadata_properties = ['collaborative', 'description', 'name', 'owner', 'tracks'] ;

        models.Playlist.fromURI(uri)
            .load(playlist_metadata_properties)
            .done(function(p){

                var listHtml = List.forPlaylist(p);
                document.body.appendChild(listHtml.node);
                listHtml.init();

                console.log(listHtml);

                playlist_metadata_HTML.innerHTML += '<h4>playlist metadata</h4>';
                playlist_metadata_HTML.innerHTML += '<p>Name: ' + p.name + '</p>';
                p.tracks.snapshot().done(function(t){
                    var tracks = t.toArray();
                    var track_names = '';

                    console.log(tracks[0]);
                    for(var i=0;i<tracks.length;i++){

                        var divId = tracks[i].uri.replace(':', '_').replace(':', '_');
                        track_names += '<li>' + tracks[i].name + '</li>';
                    }
                    // playlist_metadata_HTML.innerHTML += '<ol>' + track_names.toString() + '</ol>';
                    getTrackFromEchoNest(en_api_key, tracks);
                });
            });
    };


    function getTrackFromEchoNest(api_key, tracks) {

        var url = 'http://developer.echonest.com/api/v4/track/profile?api_key=' + api_key + '&callback=?';
        console.log(url);
        for(var i=0;i<tracks.length;i++){
            var track_id = tracks[i].uri.replace('spotify', 'spotify-WW');

            $.ajaxSetup({ traditional: true, cache: false });
            $.getJSON(url,
                {
                    id: track_id,
                    format: 'jsonp',
                    bucket: ['audio_summary']
                },
                function (data) {
                    //console.log(data);
                    if (checkResponse(data)) {
                        var spotifyId = data.response.track.foreign_id.replace('spotify-WW', 'spotify');



                        /*<tr draggable="true" data-uri="spotify:track:7dvd3b2oz7AFgXrPBIIYxR" class="sp-list-item">
                            <td class="sp-list-cell sp-list-cell-star"><span class="sp-icon-star-hitarea"><span class="sp-icon-star"></span>
                            </span><span class="sp-icon-nowplaying"></span></td>
                            <td style="width: 45.10022271714922%" class="sp-list-cell sp-list-cell-track">Dirt Off Your Shoulder/Lying From You</td><td style="width: 19.328666878778236%" class="sp-list-cell sp-list-cell-artist"><a href="spotify:artist:2tFblYtXKLTFjvH1sxfbv1" data-uri="spotify:artist:2tFblYtXKLTFjvH1sxfbv1">Jay-Z/ Linkin Park</a></td>
                            <td class="sp-list-cell sp-list-cell-time">4:05</td>
                            <td style="width: 25.77155583837098%" class="sp-list-cell sp-list-cell-album">
                            <a href="spotify:album:5NH94cATqx5fjBE794xZLy" data-uri="spotify:album:5NH94cATqx5fjBE794xZLy">Collision Course</a></td></tr>
                          */

                        var trackTr = $('tr[data-uri=\'' + spotifyId +'\']')[0];
                        var albumTd = $('tr[data-uri=\'' + spotifyId +'\'] td[class="sp-list-cell sp-list-cell-album"]')[0];
                        console.log(albumTd);

                        albumTd.innerHTML = '<div>' + data.response.track.audio_summary.tempo + '</div>';

                        var link = document.getElementById(spotifyId.replace(':', '_').replace(':', '_'));

                        link.innerHTML = data.response.track.audio_summary.tempo;

                        $('#error').text("OK");

                    } else {
                        $('#error').text("trouble getting results");
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
