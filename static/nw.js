var NightsWatch = (function ($) {

var EventBus = new Events();
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var div = React.DOM.div;
var element = React.createElement;
var img = React.DOM.img;
var span = React.DOM.span;

var NavigatorButton = React.createClass({
    render: function() {    
        return element('span', null,
                element('b', {
                    onClick: function() { this.props.onClick(this.props.name) }.bind(this), 
                    style: {'text-decoration': this.props.selected ? 'underline' : 'none'} 
                }, this._caption()),
                element('b', null, this.props.hasSeparator ? '|' : null));
    },
    _caption: function() {
        return this.props.selected && this.props.totalMovies
            ? this.props.name + ' (' + this.props.totalMovies + ')'
            : this.props.name
    }
});

var NO_FILTER = function() { return true; };
var FILTER_MOVIES = function(its, _) { try { return its.torrent.category.indexOf("Film") != -1; } catch(e) { return false; } };
var FILTER_SERIES = function(its, _) { try { return its.torrent.category.indexOf("Sorozat") != -1; } catch(e) {return false; } };
var FILTER_TEXT = function(text) {
    return function(aMovie) {
        return aMovie.details.title
            ? aMovie.details.title.toLowerCase().indexOf(text.toLowerCase()) >= 0
            : aMovie.torrent.title.toLowerCase().indexOf(text.toLowerCase()) >= 0; 
    }
};
var FILTER_EXPRESSION = function(enteredText) {
    return function(each) { 
        var movie = each.details;
        var torrent = each.torrent;
        var download = each.download;
        try {
            return eval(enteredText); 
        } catch (e) {
            throw {searchAbort: e};
        }
    }
};
var FEED_WATCH_LIST = '/feed/watched';
var FEED_ALL = '/feed/all';
var FEED_DOWNLOADING = '/torrents/downloading';
var FEED_COMPLETED = '/torrents/completed';

var LogoutButton = React.createClass({
    render: function() {
        return div({title: 'Logout'},
            element('b', {onClick: function() {EventBus.emit('logout'); } }, '\uD83D\uDD12'));
    }
});

var ReloadFeedButton = React.createClass({
    render: function() {
        return div({title: 'Reload feed'},
            element('b', {onClick: function() {EventBus.emit('reload-all'); } }, '\u21BA'));
    }
});

var NavigatorBar = React.createClass({
    render: function() {        
        return element('div', {className: 'shelf_header'},
            element(NavigatorButton, {name: 'All', totalMovies: this.props.totalMovies, selected: this.props.url == FEED_ALL && this.props.filter != FILTER_MOVIES && this.props.filter != FILTER_SERIES, hasSeparator: true, onClick: function() { this._switchFeed(FEED_ALL, NO_FILTER) }.bind(this)}),
            element(NavigatorButton, {name: 'Movies', totalMovies: this.props.totalMovies, selected: this._isFeed(FEED_ALL, FILTER_MOVIES), hasSeparator: true, onClick: function() { this._switchFeed(FEED_ALL, FILTER_MOVIES) }.bind(this)}),
            element(NavigatorButton, {name: 'Series', totalMovies: this.props.totalMovies, selected: this._isFeed(FEED_ALL, FILTER_SERIES), hasSeparator: true, onClick: function() { this._switchFeed(FEED_ALL, FILTER_SERIES) }.bind(this)}),
            element(NavigatorButton, {name: 'Watchlist', totalMovies: this.props.totalMovies, selected: this._isFeed(FEED_WATCH_LIST), hasSeparator: true, onClick: function() { this._switchFeed(FEED_WATCH_LIST, NO_FILTER) }.bind(this)}),
            element(NavigatorButton, {name: 'Downloading', totalMovies: this.props.totalMovies, selected: this._isFeed(FEED_DOWNLOADING), hasSeparator: true, onClick: function() { this._switchFeed(FEED_DOWNLOADING, NO_FILTER) }.bind(this)}),
            element(NavigatorButton, {name: 'Completed', totalMovies: this.props.totalMovies, selected: this._isFeed(FEED_COMPLETED), hasSeparator: true, onClick: function() { this._switchFeed(FEED_COMPLETED, NO_FILTER) }.bind(this)}),
            element(NavigatorButton, {name: '20', selected: this.props.pageSize == 20, hasSeparator: true, onClick: this._switchPageSize}),
            element(NavigatorButton, {name: '100', selected: this.props.pageSize == 100, hasSeparator: true, onClick: this._switchPageSize}),
            element(NavigatorButton, {name: '500', selected: this.props.pageSize == 500, hasSeparator: false, onClick: this._switchPageSize}),
            element(LogoutButton),
            element(ReloadFeedButton),
            element(SearchBar, {advancedSearch: this.props.advancedSearch, searchError: this.props.searchError}),
            element(PageBar, {totalMovies: this.props.totalMovies, pageSize: this.props.pageSize, pageNumber: this.props.pageNumber})            
        );
    },
    _isFeed: function(url, filter) {
        return (!filter || this.props.filter == filter) && this.props.url == url;
    },
    _switchFeed: function(url, filter) {
        EventBus.emit('switch-feed', url, filter);
    },
    _switchPageSize: function(aString) {
        EventBus.emit('page-size', parseInt(aString));
    }
});

var SearchBar = React.createClass({
    render: function() {        
        return span({},
            element('input', {className: 'search_bar', ref: 'input', onChange: this.onChange, size: 16, placeholder: this.props.advancedSearch ? 'movie.score > 6 && movie.genre == "Comedy"' : 'Search for movie title'}),
            element('b', {onClick: this._toggleAdvancedSearch, title: 'Toggle advanced search expression', style: {paddingLeft: '8px'}}, '\uD83D\uDD0D'));
    },
    componentDidMount: function() {        
        this.refs.input.getDOMNode().focus();        
    },
    componentDidUpdate: function() {
        this.refs.input.getDOMNode().setCustomValidity(this.props.searchError ? 'Invalid' : '');
    },
    _text: function() {        
        var text = this.refs.input.getDOMNode().value;
        return text == null || text.trim() == '' ? '' : text.trim();
    },
    onChange: function(event) {        
        EventBus.emit('search-text', this._text());
    },
    _toggleAdvancedSearch: function() {
        EventBus.emit('toggle-advanced-search');
    }    
});

var PageBar = React.createClass({
    render: function() {    
        return span({className: 'nav_btn'},
                element('b', null, (this.props.pageNumber + 1) + '/' + this._pageCount()),
                span({className: "shelf_btn", onClick: function() { EventBus.emit('prev-page') }}, '<'),
                span({className: "shelf_btn", onClick: function() { EventBus.emit('next-page') }}, '>'));
    },
    _pageCount: function() {
        var pageCount = Math.ceil(this.props.totalMovies / this.props.pageSize);
        return Math.max(1, pageCount);
    }
});

var MovieCase = React.createClass({
    getInitialState: function() {
        return {reloadProgress: 0};
    },        
    render: function() {    
        return div({className: "box", onClick: function() { EventBus.emit('movie-selected', this.props.movie, React.findDOMNode(this)) }.bind(this) },            
            img({className: "item", src: this._posterHref()}),
            span({className: "score"}, this.props.movie.details.score),
            this._renderStatus());
    },        
    _posterHref: function() {
        return this.props.movie.details.poster && this.props.movie.details.poster != 'N/A'
            ? this.props.movie.details.poster
            : '/static/img/no-image.png';
    },
    _renderStatus: function() {        
        if (this._isDownloading())               
            return element(Progress, {progress: this.props.movie.download.progress * 100, color: '#0097FB', alpha: 0.90, className: 'box_progress'});
        if (this._isReloading())
            return element(Progress, {progress: this.state.reloadProgress, color: '#7FFF00', alpha: 0.90, className: 'box_progress', showLabel: false});
        return null    
    },            
    componentDidUpdate: function() {
        if (this._isReloading())
            setTimeout(function() { this.setState({reloadProgress: this.state.reloadProgress + 1}) }.bind(this), 40);
    },            
    _isDownloading: function() {
        return this.props.movie.download.status == "downloading";
    },        
    _isReloading: function() {
        return this.props.movie.download.status == "reloading";
    }
});

var MovieDetails = React.createClass({    
    render: function() {
        var movie = this.props.movie;
        return div({className: 'details', style: {top: this.props.top} }, 
            div({className: 'details_content'},
                div({className: 'star imdb_sprites'}, 
                    element('a', {href: movie.torrent.imdbLink}, movie.details.score)),
                element('h2', null, 
                    element('a', {href: movie.torrent.guid}, movie.torrent.title)),                                               
                div({className: 'sub_details'}, 'Published at: ' + movie.torrent.pubDate),
                div({className: 'sub_details'}, 'Category: ' + movie.torrent.category + (movie.details.genre ? " / " + movie.details.genre : "" )),
                div({className: 'sub_details'}, 'Actors: ' + movie.details.actors),
                div({className: 'sub_details'},
                    'Trailer: ',
                    element('a', {href: movie.details.trailerUrl}, movie.details.trailerUrl)),
                div({className: 'sub_details', style: {paddingTop: '5px'}}, movie.details.plot),                                
                div({className: 'action_btn', onClick: function() { EventBus.emit(this._actionEvent(), movie) }.bind(this) }, this._actionTitle()),
                div({className: 'action_btn', onClick: function() { EventBus.emit('refresh-movie', movie) }.bind(this) }, 'Refresh'),
                movie.download.status == "downloading" ? this._downloadDetails(movie) : null
            ));
    },
    _actionTitle: function() {
        return this.props.movie.download.status == 'completed' ? 'Play' : 'Download'
    },
    _actionEvent: function() {
        return this.props.movie.download.status == 'completed' ? 'play-movie' : 'download-movie'
    },
    _downloadDetails: function(movie) {    
        return div({className: 'download_details'},
            'Remaining time: ', element('b', {}, movie.download.eta),
            ' Down Speed: ', element('b', {}, movie.download.dlSpeed),
            ' Up Speed: ', element('b', {}, movie.download.upSpeed),
            ' Size: ',  element('b', {}, movie.download.size));
    }
});

var Shelf = React.createClass({
    render: function() {        
        var filteredMovies = this.props.model.movies.filtered(this.props.model.filter);
        return element('div', {className: 'shelf_outer'},
            element(NavigatorBar, {
                pageSize: this.props.model.pageSize, 
                pageNumber: this.props.model.pageNumber, 
                totalMovies: filteredMovies.length, 
                filter: this.props.model.filter, 
                url: this.props.model.url,
                advancedSearch: this.props.model.advancedSearch,
                searchError: this.props.model.movies.searchError()
            }),
            div({className: 'shelf_inner'},
                div({className: 'items'},
                    this._renderMovieCases(filteredMovies))),
            this.props.model.details
                    ? element(ReactCSSTransitionGroup, {transitionName: 'slidedown', transitionAppear: true, transitionLeave: true},
                        element(MovieDetails, {movie: this.props.model.details, top: this.props.model.details.top + 252}))
                    : null,            
            element('div', {className: 'shelf_footer'}));
    },
    _renderMovieCases: function(filteredMovies) {
        var renderedMovies = [];
        for (var i = this.props.model.pageNumber * this.props.model.pageSize; i < this._countVisible(filteredMovies); i++)
            renderedMovies.push(element(MovieCase, {movie: filteredMovies[i], key: filteredMovies[i].torrent.guid}));
        while (renderedMovies.length <= 15)
            renderedMovies.push(this._placeholder());
        return renderedMovies;
    },        
    _countVisible: function(filteredMovies) {
        return Math.min(this.props.model.pageNumber * this.props.model.pageSize + this.props.model.pageSize, filteredMovies.length);
    },
    _placeholder: function() {
        return div({className: "box", style: {visibility: 'hidden'}});
    }
});

var Movies = function(anArray) {
    var movieDict = new Object();
    var guids = [];
    var searchError = false;
    var lastFilteredCount = 0;
    $.each(anArray || [], function(_, movie) {
        movieDict[movie.torrent.guid] = movie;
        guids.push(movie.torrent.guid);
    });
        
    this.at = function(guid) {
        return movieDict[guid];
    }
    this.refresh = function(anArray) {
        $.each(anArray, function(index, movie) {
            if (movieDict[movie.torrent.guid])
                movieDict[movie.torrent.guid] = movie;
        }.bind(this));
    }    
    this.filtered = function(aFilter) {
        searchError = false;
        var result = [];
        try {
            $.each(guids, function(_, guid) {
                if (aFilter(this.at(guid)))
                    result.push(this.at(guid));
            }.bind(this));
        } catch (e) {
            if (e.searchAbort) {
                searchError = true;                
                return result;
            }
            throw e;
        }            
        lastFilteredCount = result.length;       
        return result;
    }
    this.count = function() {
        return guids.length;
    }
    this.lastFilteredCount = function() { // XXX
        return lastFilteredCount;
    }
    this.searchError = function() { // XXX
        return searchError;
    }
}

var Feed = function(changeHandler) {   
    var model = {movies: new Movies(), pageSize: 20, pageNumber: 0, details: null, filter: NO_FILTER, url: FEED_ALL, advancedSearch : false};
    
    this.loadMovies = function(func) {
        $.getJSON(model.url, function(movieFeed) {
            if (func) func(movieFeed, movieFeed.length - model.movies.count());
            model.movies = new Movies(movieFeed);
            changed();
        }.bind(this)).fail(feedFailure);               
    }
    this.refreshDownloadStatus = function() {
        function refresh(feed) {
            $.getJSON(feed, function(movieFeed) {
                model.movies.refresh(movieFeed);
                changed();
            }.bind(this)).fail(feedFailure);
        }
        refresh(FEED_DOWNLOADING);
        refresh(FEED_COMPLETED);        
        if (model.url == FEED_COMPLETED || model.url == FEED_DOWNLOADING)
            this.loadMovies();
    }    
    this.refreshMovie = function(aMovie) {
        aMovie.download.status = "reloading";
        changed();
        $.getJSON("/feed/all/reload/" + encodeURIComponent(aMovie.torrent.guid), function(reloadedMovie) {
            model.movies.refresh([reloadedMovie]);
            model.details = null;
            alertify.success("Reloaded " + reloadedMovie.torrent.title);
            changed();
        }.bind(this)).fail(feedFailure);
    }    
    this.switchFeed = function(feedUrl, filter) {
        model.url = feedUrl;
        model.details = null;
        model.pageNumber = 0;
        model.filter = filter;
        this.loadMovies();
    }
    this.pageSize = function(anInteger) {        
        model.pageSize = anInteger;
        model.pageNumber = 0;
        model.details = null;
        changed();
    }    
    this.previousPage = function() {
        if (model.pageNumber > 0) model.pageNumber--;
        model.details = null;
        changed();
    }    
    this.nextPage = function() {
        if ((model.pageNumber + 1) * model.pageSize < model.movies.lastFilteredCount()) model.pageNumber++;
        model.details = null;
        changed();
    }        
    this.downloadMovie = function(aMovie) {
        alertify.confirm("Download " + aMovie.torrent.title + "?", function (e) {
            if (e) {
                $.getJSON('/feed/all/download/' + encodeURIComponent(aMovie.torrent.guid), function(any) {
                    alertify.success("Download started " + aMovie.torrent.title);
                }.bind(this)).fail(feedFailure);
            }
        }.bind(this));
    } 
    this.playMovie = function(aMovie) {
        $.getJSON('/feed/all/play/' + encodeURIComponent(aMovie.torrent.guid), function(any) {
            alertify.success("Playing " + aMovie.torrent.title);
        }.bind(this)).fail(feedFailure);
    }
    this.search = function(text) {
        model.pageNumber = 0;    
        if (text) {
            model.filter = model.advancedSearch ? FILTER_EXPRESSION(text) : FILTER_TEXT(text);
        } else {
            model.filter = NO_FILTER;
        }
        changed();
    }
    this.toggleAdvancedSearch = function(text) {        
        model.advancedSearch = !model.advancedSearch;
        changed();
    }
    this.reloadAll = function(func) {
        $.getJSON("/feed/all/reload", function(reloadedMovie) {
            this.loadMovies(func);
        }.bind(this)).fail(feedFailure);        
    }
    function changed() {
        changeHandler(model)
    }
    function feedFailure(e) {
        alertify.error("Cannot load feed");
        changed();
    }    
    this.showDetails = function(aMovie, dom) {
        if (model.details) {
            model.details = null;
        } else {
            model.details = aMovie;
            model.details.top = $(dom).position().top;
        }
        changed();
    }
}

function start(dom) {
    function renderFeed(model) {
        React.render(React.createElement(Shelf, {model: model}), dom);
    };
    var feed = new Feed(renderFeed);
    setInterval(function () { feed.refreshDownloadStatus() }, 5000);
    setInterval(function () { feed.loadMovies(notifyAboutNewlyAdded); }, 60000 * 10);
    feed.loadMovies();                
    EventBus.on('next-page', feed.nextPage);
    EventBus.on('prev-page', feed.previousPage);
    EventBus.on('page-size', feed.pageSize);
    EventBus.on('movie-selected', feed.showDetails);
    EventBus.on('download-movie', feed.downloadMovie);
    EventBus.on('play-movie', feed.playMovie);
    EventBus.on('refresh-movie', feed.refreshMovie);
    EventBus.on('switch-feed', feed.switchFeed, feed);
    EventBus.on('search-text', feed.search, feed);
    EventBus.on('toggle-advanced-search', feed.toggleAdvancedSearch, feed);
    EventBus.on('reload-all', function() { feed.reloadAll(notifyAboutReload); });
    EventBus.on('logout', logout);    
    
}

function notifyAboutNewlyAdded(movies, addedCount) {
    if (addedCount > 0) 
        alertify.success("Added " + addedCount + " new movie(s)", 45000);
}

function notifyAboutReload(movies, addedCount) {    
    alertify.success("Reloaded feeds. Added " + addedCount + " movies(s)");
}

function logout() {
    alertify.confirm("Are you sure you want to log out?", function (e) {
        if (e) $.get("/logout", function(any) { location.reload(); });
    });
}

return {'start': start};

})(jQuery);