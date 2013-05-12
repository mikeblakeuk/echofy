"use strict";
window.onload = function() {
    var sp = getSpotifyApi();
    var models = sp.require('$api/models');

    // Handle URI arguments
    application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);

    function handleArgs() {
        var args = models.application.arguments;
        console.log(args);
    }
}