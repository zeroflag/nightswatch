Progress = React.createClass({  
    getDefaultProps: function() {
        return {progress: 0, size: 90, color: '#ffec03', alpha: 1, showLabel: true};
    },
    getInitialState: function() {
        return { progress: this.props.progress };
    },
    componentWillReceiveProps: function(props) {
        this._setScale();
        this._setupCanvas();
        this._drawTimer();
        return this.setState({progress: props.progress});
    },
    componentDidMount: function() {
        this._setScale();
        this._setupCanvas();
        this._drawTimer();
    },
    componentDidUpdate: function() {
        this._setScale();
        this._clearTimer();
        this._drawTimer();
    },
    _setScale: function() {
        _radius = this.props.size / 2;
    },
    _setupCanvas: function() {
        _canvas = this.getDOMNode();
        _context = _canvas.getContext('2d');
        _context.textAlign = 'center';
        _context.textBaseline = 'middle';
        return _context.font = "bold " + (_radius / 2.5) + "px Arial";
    },
    progress: function(anInteger) {
        this.setState({progress: anInteger});
    },
    _clearTimer: function() {
        _context.clearRect(0, 0, _canvas.width, _canvas.height);
    },
    _normalizedProgress: function() {
        return this.state.progress % 100
    },
    _drawTimer: function() {
        var decimals, percent, ref;
        percent = (2/100) * this._normalizedProgress() + 1.5;
        _context.globalAlpha = this.props.alpha;        
        _context.fillStyle = this.props.color;                
        if (this.props.showLabel)
            _context.fillText(this._normalizedProgress().toFixed(1) + '%', _radius, _radius);
        _context.beginPath();
        _context.arc(_radius, _radius, _radius, Math.PI * 1.5, Math.PI * percent, false);
        _context.arc(_radius, _radius, _radius / 1.6, Math.PI * percent, Math.PI * 1.5, true);
        return _context.fill();
    },
    render: function() {
        return React.createElement("canvas", {
            "className": "box_progress",
            "width": this.props.size,
            "height": this.props.size
        });
    }
});