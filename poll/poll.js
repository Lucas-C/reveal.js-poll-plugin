/*
 * Poll Plugin
 *
 * By Johannes Schildgen, 2021
 * https://github.com/jschildgen/reveal.js-poll-plugin
 * 
 */
x= null;
var Poll = (function(){

var refresh_interval = null;
var current_poll = null;
var url = document.currentScript.src.split("/").slice(0,-1).join("/");

function show_status() {
    $.get( url+"/api/?method=status", function( res ) { 
        if(!('count' in res)) { return; } // no active poll
        $(current_poll).find("> .poll-responses").html(res.count == 0 ? "" : res.count);
    });
}

function start_poll() {
    console.log('start_poll');

    $(".poll > ul > li").each(function(i) {
        this.innerHTML = '<span class="poll-percentage"></span>'
                        +'<span class="poll-answer-text">'+this.innerHTML+'</span>';
    });

    $(".poll").not(":has(>.poll-responses)").each(function(i) {
        $(this).append('<span class="poll-responses"></span>');
    });
            
    var question = $(current_poll).children("h1").text();

    var answers = [];
    $(current_poll).find("ul > li > .poll-answer-text").each(function(i) {
        answers.push(this.innerHTML);
    });

    var correct_answers = [];
    $(current_poll).find("ul > li[data-poll='correct'] > .poll-answer-text").each(function(i) {
        correct_answers.push(this.innerHTML);
    });

    data = { "question" : question, "answers": answers, "correct_answers": correct_answers };

    $.get( url+"/api/?method=start_poll&data="+encodeURIComponent(JSON.stringify(data)), function( res ) { });
    refresh_interval = window.setInterval(show_status, 1000);
}

function stop_poll() {
    console.log('stop_poll');
    if(current_poll == null) { console.log('No current poll'); return; }
    clearInterval(refresh_interval);
    $(current_poll).find("ul > li > .poll-percentage").css("width","0%");
    $.get( url+"/api/?method=stop_poll", function( res ) { 
        var total = 0;
        for(i in res.answers) {
            total += res.answers[i];
        }
        $(current_poll).find("ul > li > .poll-percentage").each(function(i) {
            percentage = (""+i in res.answers) ? 100*res.answers[i]/total : 0;
            $(this).css("width",percentage+"%");
        })

        $(current_poll).find("ul > li[data-poll='correct'] > .poll-answer-text").css("font-weight", "bold");
        $(current_poll).find("ul > li[data-poll='correct'] > .poll-answer-text").each(function(i) { $(this).html("&rightarrow; "+$(this).html()+" &leftarrow;")});
        current_poll = null;
    });
}

return {
    init: function() {    
        if(! window.location.search.match( /poll=yes/gi )) {
            // Only show poll with query param ?poll=yes
            // Note that if you insert polls as fragments,
            // invisible fragments will remain.
            return;
        }
        Reveal.on('ready', () => {
            $(".poll > ul > li").click(function(event) {
                stop_poll();
                event.stopPropagation();
            });

            $(".poll > h2").html("chezsoi.org/poll"); // Originally: $(".poll > h2").html(url);

            $(".poll").show();

            if ($(".poll").hasClass("visible")) {
                current_poll = $(".poll");
            }

            Reveal.on('fragmentshown', (event) => {
                if(!$(event.fragment).hasClass("poll")) { return; }
                current_poll = event.fragment;
                start_poll();
            } );
        });
    }
}

})();

Reveal.registerPlugin( 'poll', Poll );
