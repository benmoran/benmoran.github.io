/**
 * Softplus (Gibbs partition function) using Paper.js
 * <http://paperjs.org> adapted from from mark.reid.name bregman.js
 *
 * AUTHOR:  Ben Moran <benmoran@benmoran.net>
 * CREATED: 2015-12-27
 */

// Function to compute f-divergence for and the graph view bounds
var f = function(x) { return x * 2.0; }
//var f = function(x) { return Math.sin(4*x); }
var softplus = function(x, C) { return Math.log1p(Math.exp(C*x))/C; }
var graphView = new Rectangle(-2, -2, 4, 4);

// Constants controlling the visual appearance of the app
var CONST = {
    'sliderHeight': 28, //30.5
    'sliderLeft': 20, // 10
    'sliderRight': 220, // 210
    'points': 100
};

// Single global variable to be read by mouse event handlers
//var markers;

var sliderKnob;
var sliderHit = false;
var axes;
var path2;

initialize();

//--------------------------------------------------------------------------------
// Initialisation

// Initialise everything
function initialize() {
    axes = initAxes(graphView);
    initGraph(f, axes);
}

function onMouseDrag(event) {
    if (sliderHit === true) {
        if (event.point.x > CONST.sliderLeft && event.point.x < CONST.sliderRight) {
            sliderKnob.position.x = event.point.x;
        }
        else if (event.point.x < CONST.sliderLeft + 1) {
            sliderKnob.position.x = CONST.sliderLeft;
        }
        else if (event.point.x > CONST.sliderRight - 1) {
            sliderKnob.position.x = CONST.sliderRight;
        }
	plotSoftplus(f, axes);
    }

}

function getPercent() {
    return ( sliderKnob.position.x - CONST.sliderLeft) / (CONST.sliderRight - CONST.sliderLeft);
}

function onMouseUp(event) {
    sliderHit = false;
}

// Plot the given function and set of the graph to screen transformation
function initGraph(f, axes) {
    var gView = axes.data.view;

    // Build the graph of f in the given gView coordinates
    var path1 = new Path();
    path1.strokeWidth = 2;
    path1.strokeColor = 'black';
    path1.segments = [];
    for (var i = 1; i < CONST.points; i++) {
        var x = (i / CONST.points) * gView.width + gView.left;
	if(f(x) < Infinity) {
	    var point = axes.data.screenCoords([x, f(x)]);
    	    path1.add(point);
	}
    }
    path1.simplify();
    path1.data = axes.data;
    path1.name='path1';

    path2 = new Path();
    path2.name='path2';
    path2.strokeWidth = 2;
    path2.strokeColor = 'red';
    path2.segments = [];

    var C = getPercent() * 10 + 1;
    for (var i = 1; i < CONST.points; i++) {
        var x = (i / CONST.points) * gView.width + gView.left;
	if(f(x) < Infinity) {
	    var point = axes.data.screenCoords([x, softplus(f(x),C)]);
    	    path2.add(point);
	}
    }
    path2.simplify();
    path2.data = axes.data;
}

function plotSoftplus(f, axes) {
    var gView = axes.data.view;
    var C = getPercent() * 10 + 1;
    for (var i = 0; i < CONST.points; i++) {
        var x = (i / CONST.points) * gView.width + gView.left;
	if (i>=path2.segments.length) {
	    path2.add(axes.data.screenCoords([x, softplus(f(x),C)]));
	} else {
	    path2.segments[i].point = axes.data.screenCoords([x, softplus(f(x),C)]);
	}
	//if(f(x) < Infinity) {
	path2.segments[i].point.y = axes.data.screenCoords([x, softplus(f(x),C)]).y;
    //}
    }
    path2.simplify();
}

// Builds a view of the x and y axes based on the given graph coordinates
// The returned object has functions `screenCoords` and `graphCoords` for
// transforming between graph and screen coordinate systems
function initAxes(gView) {
    // Standard affine transformation between rectangular coordinate systems
    // This one takes a graph coordinate and returns the corrsponding screen
    // coordinate.
    var g2s = new Matrix(
	view.bounds.right/gView.width, 0,
	0, -view.bounds.bottom/gView.height,
	    -gView.left * view.bounds.right/gView.width,
	gView.top * view.bounds.bottom/gView.height + view.bounds.bottom
    );

    // Calculate extremes of view in screen coordinates
    var origin = g2s.transform([0,0]);
    var xMin = g2s.transform([graphView.left,0]);
    var xMax = g2s.transform([graphView.right,0]);
    var yMin = g2s.transform([0,graphView.bottom]);
    var yMax = g2s.transform([0,graphView.top]);

    // Build axes
    var xAxis = new Path.Line(xMin, xMax);
    xAxis.name='xAxis';
    var yAxis = new Path.Line(yMin, yMax);
    yAxis.name='yAxis';

    var sliderLine = new Path(new Point(CONST.sliderLeft, CONST.sliderHeight), new Point(CONST.sliderRight, CONST.sliderHeight));
    sliderLine.strokeColor = '#FFF';
    sliderLine.name='sliderLine';
    sliderKnob = new Path.Circle(new Point(CONST.sliderRight, CONST.sliderHeight), 5);
    sliderKnob.fillColor = '#FFF';
    sliderKnob.onMouseDown = function(event) { sliderHit = true; }
    sliderKnob.name='sliderKnob';

    var axes = new Group(xAxis, yAxis, sliderLine, sliderKnob);
    axes.name='axes';
    axes.strokeWidth = 1;
    axes.strokeColor = 'grey';
    axes.data = {
	'origin': origin, 'xAxis': xAxis, 'yAxis': yAxis,
	'view': gView,
	'screenCoords': function(p) { return g2s.transform(p); },
	'graphCoords': function(p) { return g2s.inverseTransform(p); }
    };
    return axes;
}
