jQuery(document).ready(function($) {

    /*setInterval(function(){
        //Test the progress bar animations

    }, 1000);*/

    $(".clickable-row").click(function() {
        window.location = $(this).data("href");
    });
    $(".clickable-cell").click(function () {
        window.location = $(this).data("href");
    })

    $('#ram-slider').slider({
        formatter: function(value) {
            return value + ' GB';
        }
    });

    $('#login-button').on('click',function () {
        const ipcRenderer = require('electron').ipcRenderer;
        ipcRenderer.send('login',{username: $('#username').val(), password: $('#password').val(),savedRam: $('#ram-slider').slider('getValue'), savedMaxPermSize: $('#permSize').val()});
    });

    $('#play-button').on('click',function () {
        const ipcRenderer = require('electron').ipcRenderer;
        ipcRenderer.send('play',{savedRam: $('#ram-slider').slider('getValue'), savedMaxPermSize: $('#permSize').val(),selectedPacket: selectedPacket});
    });

    $('.packet-rigth').hover(function () {
        $(this).addClass('packet-hover');
        $(this).parent().find('.packet-left').addClass('packet-hover');
    },function () {
        $(this).removeClass('packet-hover');
        $(this).parent().find('.packet-left').removeClass('packet-hover');
    });

    $('.packet-left').hover(function () {
        $(this).addClass('packet-hover');
        console.log($(this).parent().find('.packet-rigth').addClass('packet-hover'));
        $(this).parent().find('.packet-right').addClass('packet-hover');
    },function () {
        $(this).removeClass('packet-hover');
        $(this).parent().find('.packet-rigth').removeClass('packet-hover');
    });

    $('.packet-left, .packet-rigth').click(function () {
        selectedPacket = $(this).parent().attr('id').substr(7);
        $(this).parent().children().each(function () {
            console.log($(this).className);
            if($(this).hasClass('packet-right')) {
                alert('yes');
                $(this).addClass('packet-selected-rigth');
            }else{
                $(this).addClass('packet-selected-left');
            }
        });
    });
});