var Background = (function($) {
    var backgrounds = [           
        {'background': 'url(/static/background/2.jpg)', 'background-position': '850px 0px'},        
        {'background': 'url(/static/background/4.jpg)', 'background-position': '0px 0px'},
    ];
    function random() {
        var dom = $('#nightswatch');
        var index = Math.floor(Math.random() * backgrounds.length);
        dom.css('background', backgrounds[index]['background']);
        dom.css('background-position', backgrounds[index]['background-position']);
        dom.css('background-repeat', 'repeat-x');        
    }
    return {'random': random}
})(jQuery);