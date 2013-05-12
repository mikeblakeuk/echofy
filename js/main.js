require([
    '$api/models',
    '$views/image#Image'
], function(models, Image) {
    'use strict';

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

                /*var table = sp.require("sp://TODO table");
                var list = new table.Table(p, function(track) {

                        var track = new views.Track(track, views.Track.FIELD.SHARE| views.Track.FIELD.STAR| views.Track.FIELD.NAME | views.Track.FIELD.ARTIST | views.Track.FIELD.ALBUM | views.Track.FIELD.DURATION);

                });*/

                playlist_metadata_HTML.innerHTML += '<h4>playlist metadata</h4>';
                playlist_metadata_HTML.innerHTML += '<p>Name: ' + p.name.decodeForHtml() + '</p>';
                p.tracks.snapshot().done(function(t){
                    var tracks = t.toArray();
                    var track_names = '';

                    console.log(tracks[0]);
                    for(var i=0;i<tracks.length;i++){

                        var divId = tracks[i].uri.replace(':', '_').replace(':', '_');
                        track_names += '<li>' + tracks[i].name ;
                        track_names += '<div id="'+ divId + '">echo</div>';

                        track_names += '</li>'
                    }
                    playlist_metadata_HTML.innerHTML += '<ol>' + track_names.toString() + '</ol>';
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
                    console.log(data);
                    if (checkResponse(data)) {
                        var spotifyId = data.response.track.foreign_id.replace('spotify-WW', 'spotify');
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
