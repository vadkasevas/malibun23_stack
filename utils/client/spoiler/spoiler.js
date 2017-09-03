Template.malibunSpoiler.onRendered(function(){
    $(this.view.lastNode()).children(".spoiler-text").hide();
    $(this.view.lastNode()).children(".spoiler").click(function(){
        $(this).toggleClass("folded").toggleClass("unfolded").next().slideToggle();
    });
});

