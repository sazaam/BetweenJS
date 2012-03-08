
// JS TWEENING ENGINE
var ___d = new Date().getTime() ;
function getTimer(){
   return new Date().getTime() - ___d ;
} ;

/*  EASINGS */
// CUSTOM
var CustomFunctionEasing = function(f){
	if(typeof(f) !== 'function') throw('function parameter is not a function...(customEasing)', f ) ;
	return {calculate:function(t, b, c, d)
	{
		return f(t, b, c, d) ;
	}} ;
}
var Custom = {
	func:function(f)
	{
		return new CustomFunctionEasing(f) ;
	}
} ;

// EASENONE
var EaseNone = function(){
	return {calculate:function(t, b, c, d)
	{
		return c * t / d + b ;
	}} ;
}

// LINEAR
var Linear = {__linear:new EaseNone()} ;
Linear.easeNone = Linear.__linear ;
Linear.easeIn = Linear.__linear ;
Linear.easeOut = Linear.__linear ;
Linear.easeInOut = Linear.__linear ;
Linear.easeOutIn = Linear.__linear ;

// BACK
var BackEaseIn = function(s){
	s = s || 1.70158 ;
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	}} ;
}
var BackEaseOut = function(s){
	s = s || 1.70158 ;
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	}} ;
}
var BackEaseInOut = function(s){
	s = s || 1.70158 ;
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s * 1.525) + 1) * t - s * 1.525)) + b ;
		else return c / 2 * ((t -= 2) * t * (((s * 1.525) + 1) * t + s * 1.525) + 2) + b ;
	}} ;
}
var BackEaseOutIn = function(s){
	s = s || 1.70158 ;
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return (c / 2) * ((t = (t * 2) / d - 1) * t * ((s + 1) * t + s) + 1) + b ;
		else return (c / 2) * (t = (t * 2 - d) / d) * t * ((s + 1) * t - s) + (b + c / 2) ;
	}} ;
}
var Back = {
	easeIn:new BackEaseIn(),
	easeOut:new BackEaseOut(),
	easeInOut:new BackEaseInOut(),
	easeOutIn:new BackEaseOutIn()
} ;
Back.easeInWith = function(s){return new BackEaseIn(s || 1.70158)} ;
Back.easeOutWith = function(s){return new BackEaseOut(s || 1.70158)} ;
Back.easeInOutWith = function(s){return new BackEaseInOut(s || 1.70158)} ;
Back.easeOutInWith = function(s){return new BackEaseOutIn(s || 1.70158)} ;

// BOUNCE
var BounceEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		if ((t = (d - t) / d) < (1 / 2.75)) return c - (c * (7.5625 * t * t)) + b ;
		if (t < (2 / 2.75)) return c - (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75)) + b ;
		if (t < (2.5 / 2.75)) return c - (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375)) + b ;
		else return c - (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375)) + b ;
	}} ;
}
var BounceEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d) < (1 / 2.75)) return c * (7.5625 * t * t) + b ;
		if (t < (2 / 2.75)) return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b ;
		if (t < (2.5 / 2.75)) return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b ;
		else return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b ;
	}} ;
}
var BounceEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) {
			if ((t = (d - t * 2) / d) < (1 / 2.75)) return (c - (c * (7.5625 * t * t))) * 0.5 + b ;
			if (t < (2 / 2.75)) return (c - (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75))) * 0.5 + b ;
			if (t < (2.5 / 2.75)) return (c - (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375))) * 0.5 + b ;
			else return (c - (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375))) * 0.5 + b ;
		} else {
			if ((t = (t * 2 - d) / d) < (1 / 2.75)) return (c * (7.5625 * t * t)) * 0.5 + c * 0.5 + b ;
			if (t < (2 / 2.75)) return (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75)) * 0.5 + c * 0.5 + b ;
			if (t < (2.5 / 2.75)) return (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375)) * 0.5 + c * 0.5 + b ;
			else return (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375)) * 0.5 + c * 0.5 + b ;
		}
	}} ;
}
var BounceEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) {
			if ((t = (t * 2) / d) < (1 / 2.75)) return (c / 2) * (7.5625 * t * t) + b ;
			if (t < (2 / 2.75)) return (c / 2) * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b ;
			if (t < (2.5 / 2.75)) return (c / 2) * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b ;
			else return (c / 2) * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b ;
		} else {
			if ((t = (d - (t * 2 - d)) / d) < (1 / 2.75)) return (c / 2) - ((c / 2) * (7.5625 * t * t)) + (b + c / 2) ;
			if (t < (2 / 2.75)) return (c / 2) - ((c / 2) * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75)) + (b + c / 2) ;
			if (t < (2.5 / 2.75)) return (c / 2) - ((c / 2) * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375)) + (b + c / 2) ;
			else return (c / 2) - ((c / 2) * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375)) + (b + c / 2) ;
		}
	}} ;
}
var Bounce = {
	easeIn:new BounceEaseIn(),
	easeOut:new BounceEaseOut(),
	easeInOut:new BounceEaseInOut(),
	easeOutIn:new BounceEaseOutIn()
} ;

// CIRCULAR & CIRC
var CircularEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b ;
	}} ;
}
var CircularEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return c * Math.sqrt(1 - (t = t / d - 1) * t) + b ;
	}} ;
}
var CircularEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b ;
		else return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b ;
	}} ;
}
var CircularEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return (c / 2) * Math.sqrt(1 - (t = (t * 2) / d - 1) * t) + b ;
		else return -(c / 2) * (Math.sqrt(1 - (t = (t * 2 - d) / d) * t) - 1) + (b + c / 2) ;
	}} ;
}
var Circular = {
	easeIn:new CircularEaseIn(),
	easeOut:new CircularEaseOut(),
	easeInOut:new CircularEaseInOut(),
	easeOutIn:new CircularEaseOutIn()
} ;
var Circ = Circular ;

// CUBIC
var CubicEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t * t + b ;
	}} ;
}
var CubicEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return c * ((t = t / d - 1) * t * t + 1) + b;
	}} ;
}
var CubicEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return ((t /= d / 2) < 1) ? c / 2 * t * t * t + b : c / 2 * ((t -= 2) * t * t + 2) + b ;
	}} ;
}
var CubicEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		return t < d / 2 ? c / 2 * ((t = t * 2 / d - 1) * t * t + 1) + b : c / 2 * (t = (t * 2 - d) / d) * t * t + b + c / 2 ;
	}} ;
}
var Cubic = {
	easeIn:new CubicEaseIn(),
	easeOut:new CubicEaseOut(),
	easeInOut:new CubicEaseInOut(),
	easeOutIn:new CubicEaseOutIn()
} ;

// ELASTIC
var ElasticEaseIn = function(a, p){
	a = a || 0 , p = p || 0 ;
	return {calculate:function(t, b, c, d)
	{
		if (t == 0) return b ;
		if ((t /= d) == 1) return b + c ;
		if (!p) p = d * 0.3 ;
		
		var s ;// Number
		if (!a || a < Math.abs(c)) {
			a = c ;
			s = p / 4 ;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a) ;
		}
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b ;
	}} ;
}
var ElasticEaseOut = function(a, p){
	a = a || 0 , p = p || 0 ;
	return {calculate:function(t, b, c, d)
	{
		if (t == 0) return b ;
		if ((t /= d) == 1) return b + c ;
		if (!p) p = d * 0.3 ;
		
		var s ;
		if (!a || a < Math.abs(c)) {
			a = c ;
			s = p / 4 ;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a) ;
		}
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b ;
	}} ;
}
var ElasticEaseInOut = function(a, p){
	a = a || 0 , p = p || 0 ;
	return {calculate:function(t, b, c, d)
	{
		if (t == 0) return b ;
		if ((t /= d / 2) == 2) return b + c ;
		if (!p) p = d * (0.3 * 1.5) ;
		
		var s ;
		if (!a || a < Math.abs(c)) {
			a = c;
			s = p / 4;
		} else {
			s = p / (2 * Math.PI) * Math.asin(c / a);
		}
		if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b ;
		else return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b ;
	}} ;
}
var ElasticEaseOutIn = function(a, p){
	a = a || 0 , p = p || 0 ;
	return {calculate:function(t, b, c, d)
	{
		var s ;
		c /= 2 ;
		
		if (t < d / 2) {
			if ((t *= 2) == 0) return b ;
			if ((t /= d) == 1) return b + c ;
			if (!p) p = d * 0.3 ;
			if (!a || a < Math.abs(c)) {
				a = c ;
				s = p / 4 ;
			} else {
				s = p / (2 * Math.PI) * Math.asin(c / a) ;
			}
			return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b ;
		} else {
			if ((t = t * 2 - d) == 0) return (b + c) ;
			if ((t /= d) == 1) return (b + c) + c ;
			if (!p) p = d * 0.3 ;
			if (!a || a < Math.abs(c)) {
				a = c ;
				s = p / 4 ;
			} else {
				s = p / (2 * Math.PI) * Math.asin(c / a) ;
			}
			return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + (b + c) ;
		}
	}} ;
}
var Elastic = {
	easeIn:new ElasticEaseIn(),
	easeOut:new ElasticEaseOut(),
	easeInOut:new ElasticEaseInOut(),
	easeOutIn:new ElasticEaseOutIn()
} ;
Elastic.easeInWith = function(a, p){return new ElasticEaseIn(a || 0, p || 0)} ;
Elastic.easeOutWith = function(a, p){return new ElasticEaseOut(a || 0, p || 0)} ;
Elastic.easeInOutWith = function(a, p){return new ElasticEaseInOut(a || 0, p || 0)} ;
Elastic.easeOutInWith = function(a, p){return new ElasticEaseOutIn(a || 0, p || 0)} ;

// EXPONENTIAL & EXPO
var ExponentialEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b ;
	}} ;
}
var ExponentialEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return t == d ? b + c : c * (1 - Math.pow(2, -10 * t / d)) + b;
	}} ;
}
var ExponentialEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t == 0) return b ;
		if (t == d) return b + c ;
		if ((t /= d / 2.0) < 1.0) return c / 2 * Math.pow(2, 10 * (t - 1)) + b ;
		else return c / 2 * (2 - Math.pow(2, -10 * --t)) + b ;
	}} ;
}
var ExponentialEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2.0) return t * 2.0 == d ? b + c / 2.0 : c / 2.0 * (1 - Math.pow(2, -10 * t * 2.0 / d)) + b ;
		else return (t * 2.0 - d) == 0 ? b + c / 2.0 : c / 2.0 * Math.pow(2, 10 * ((t * 2 - d) / d - 1)) + b + c / 2.0 ;
	}} ;
}
var Exponential = {
	easeIn:new ExponentialEaseIn(),
	easeOut:new ExponentialEaseOut(),
	easeInOut:new ExponentialEaseInOut(),
	easeOutIn:new ExponentialEaseOutIn()
} ;
var Expo = Exponential ;

// QUADRATIC & QUAD
var QuadraticEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t + b ;
	}} ;
}
var QuadraticEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return -c * (t /= d) * (t - 2) + b ;
	}} ;
}
var QuadraticEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d / 2) < 1) return c / 2 * t * t + b ;
		else return -c / 2 * ((--t) * (t - 2) - 1) + b ;
	}} ;
}
var QuadraticEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return -(c / 2) * (t = (t * 2 / d)) * (t - 2) + b ;
		else return (c / 2) * (t = (t * 2 - d) / d) * t + (b + c / 2) ;
	}} ;
}
var Quadratic = {
	easeIn:new QuadraticEaseIn(),
	easeOut:new QuadraticEaseOut(),
	easeInOut:new QuadraticEaseInOut(),
	easeOutIn:new QuadraticEaseOutIn()
} ;
var Quad = Quadratic ;

// QUARTIC & QUART
var QuarticEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t * t * t + b ;
	}} ;
}
var QuarticEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return -c * ((t = t / d - 1) * t * t * t - 1) + b ;
	}} ;
}
var QuarticEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b ;
		else return -c / 2 * ((t -= 2) * t * t * t - 2) + b ;
	}} ;
}
var QuarticEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return -(c / 2) * ((t = (t * 2) / d - 1) * t * t * t - 1) + b ;
		else return (c / 2) * (t = (t * 2 - d) / d) * t * t * t + (b + c / 2) ;
	}} ;
}
var Quartic = {
	easeIn:new QuarticEaseIn(),
	easeOut:new QuarticEaseOut(),
	easeInOut:new QuarticEaseInOut(),
	easeOutIn:new QuarticEaseOutIn()
} ;
var Quart = Quartic ;

// QUINTIC & QUINT
var QuinticEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return c * (t /= d) * t * t * t * t + b ;
	}} ;
}
var QuinticEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b ;
	}} ;
}
var QuinticEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b ;
		else return c / 2 * ((t -= 2) * t * t * t * t + 2) + b ;
	}} ;
}
var QuinticEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return (c / 2) * ((t = (t * 2) / d - 1) * t * t * t * t + 1) + b ;
		else return (c / 2) * (t = (t * 2 - d) / d) * t * t * t * t + (b + c / 2) ;
	}} ;
}
var Quintic = {
	easeIn:new QuinticEaseIn(),
	easeOut:new QuinticEaseOut(),
	easeInOut:new QuinticEaseInOut(),
	easeOutIn:new QuinticEaseOutIn()
} ;
var Quint = Quintic ;

// SINE
var SineEaseIn = function(s){
	return {calculate:function(t, b, c, d)
	{
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b ;
	}} ;
}
var SineEaseOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return c * Math.sin(t / d * (Math.PI / 2)) + b ;
	}} ;
}
var SineEaseInOut = function(){
	return {calculate:function(t, b, c, d)
	{
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b ;
	}} ;
}
var SineEaseOutIn = function(){
	return {calculate:function(t, b, c, d)
	{
		if (t < d / 2) return (c / 2) * Math.sin((t * 2) / d * (Math.PI / 2)) + b ;
		else return -(c / 2) * Math.cos((t * 2 - d) / d * (Math.PI / 2)) + (c / 2) + (b + c / 2) ;
	}} ;
}
var Sine = {
	easeIn:new SineEaseIn(),
	easeOut:new SineEaseOut(),
	easeInOut:new SineEaseInOut(),
	easeOutIn:new SineEaseOutIn()
} ;


/* BETWEENJS */
var BetweenJS = NS('BetweenJS', NS('org.libspark.betweenJS::BetweenJS', Class.$extend({
    __classvars__:{version:'0.0.1',
        toString:function()
        {
            return '[class BetweenJS]' ;
        },
        core:function(){
        	var cored = this.cored ;
        	
        	if(cored === true) return ;
        	//trace('core initializing BetweenJS') ;
        	
        	BetweenJS.ticker = new EnterFrameTicker() ;
        	BetweenJS.intervalDelay = 0 ;
			BetweenJS.ticker.start() ;
			
			//this.updaterClassRegistry = new ClassRegistry();
			//this.updaterFactory = new UpdaterFactory(_updaterClassRegistry);
			//
			
			this.updaterFactory = new UpdaterFactory() ;
			/*
			_updaterClassRegistry = new ClassRegistry();
			_updaterFactory = new UpdaterFactory(_updaterClassRegistry);
			
			ObjectUpdater.register(_updaterClassRegistry);
			DisplayObjectUpdater.register(_updaterClassRegistry);
			MovieClipUpdater.register(_updaterClassRegistry);
			PointUpdater.register(_updaterClassRegistry);
			*/
			this.cored = true ;
        },
        
        ticker:undefined,//:ITicker,
		updaterClassRegistry:undefined,//:ClassRegistry;
		updaterFactory:undefined,//:UpdaterFactory;
		
		tween:function(target/*:Object*/, to/*:Object*/, from/*:Object = null*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			
			var tween = new ObjectTween(BetweenJS.ticker) ;//:ObjectTween 
			tween.updater = BetweenJS.updaterFactory.create(target, to, from) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		to:function(target/*:Object*/, to/*:Object*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.create(target, to, undefined) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		from:function(target/*:Object*/, from/*:Object*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.create(target, undefined, from) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		apply:function(target/*:Object*/, to/*:Object*/, from/*:Object = null*/, time/*:Number = 1.0*/, applyTime/*:Number = 1.0*/, easing/*:IEasing = null*/)//:void
		{
			
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.create(target, to, from) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			tween.update(applyTime || 1.0) ;
			return tween ;
		},
		bezier:function(target/*:Object*/, to/*:Object*/, from/*:Object = null*/, controlPoint/*:Object = null*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createBezier(target, to, from, controlPoint) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		bezierTo:function(target/*:Object*/, to/*:Object*/, controlPoint/*:Object = null*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createBezier(target, to, undefined, controlPoint) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		bezierFrom:function(target/*:Object*/, from/*:Object*/, controlPoint/*:Object = null*/, time/*:Number = 1.0*/, easing/*:IEasing = null*/)//:IObjectTween
		{
			
			var tween = new ObjectTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createBezier(target, undefined, from, controlPoint) ;
			tween.time = time || 1.0 ;
			tween.easing = easing || Linear.easeNone ;
			return tween ;
		},
		physical:function(target/*:Object*/, to/*:Object*/, from/*:Object = null*/, easing/*:IPhysicalEasing = null*/)//:IObjectTween
		{
			var tween = new PhysicalTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, from, easing || Physical.exponential()) ;
			return tween ;
		},
		physicalTo:function(target/*:Object*/, to/*:Object*/, easing/*:IPhysicalEasing = null*/)//:IObjectTween
		{
			var tween = new PhysicalTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, undefined, easing || Physical.exponential()) ;
			return tween ;
		},
		physicalFrom:function(target/*:Object*/, from/*:Object*/, easing/*:IPhysicalEasing = null*/)//:IObjectTween
		{
			
			var tween = new PhysicalTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createPhysical(target, undefined, from, easing || Physical.exponential()) ;
			return tween ;
		},
		physicalApply:function(target/*:Object*/, to/*:Object*/, from/*:Object = null*/, applyTime/*:Number = 1.0*/, easing/*:IPhysicalEasing = null*/)//:void
		{
			
			var tween = new PhysicalTween(BetweenJS.ticker) ;
			tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, from, easing || Physical.exponential()) ;
			tween.update(applyTime || 1.0) ;
			return tween ;
		},
		parallel:function(tweens)//:ITweenGroup
		{
			return BetweenJS.parallelTweens([].slice.call(arguments)) ;
		},
		parallelTweens:function(tweens)//:ITweenGroup
		{
			return new ParallelTween(tweens, BetweenJS.ticker, 0) ;
		},
		serial:function(tweens/*:Array*/)//:ITweenGroup
		{
			return BetweenJS.serialTweens([].slice.call(arguments)) ;
		},
		serialTweens:function(tweens/*:Array*/)//:ITweenGroup
		{
			return new SerialTween(tweens, BetweenJS.ticker, 0) ;
		},
		reverse:function(tween/*:ITween*/, reversePosition/*:Boolean = true*/)//:ITween
		{
			if(reversePosition === undefined) reversePosition = false ;
			var pos = reversePosition ? tween.time - tween.position : 0.0 ;
			if (tween instanceof ReversedTween) {
				return new TweenDecorator(tween.baseTween, pos) ;
			}
			if (tween.constructor == TweenDecorator) {
				tween = tween.baseTween ;
			}
			return new ReversedTween(tween, pos) ;
		},
		repeat:function(tween/*:ITween*/, repeatCount/*:uint*/)//:ITween
		{
			return new RepeatedTween(tween, repeatCount) ;
		},
		scale:function(tween/*:ITween*/, scale/*:Number*/)//:ITween
		{
			return new ScaledTween(tween, scale) ;
		},
		slice:function(tween/*:ITween*/, begin/*:Number*/, end/*:Number*/, isPercent/*:Boolean = false*/)//:ITween
		{
		    if(isPercent === undefined) isPercent = false ;
			if (isPercent) {
				begin = tween.time * begin ;
				end = tween.time * end ;
			}
			if (begin > end) {
				return new ReversedTween(new SlicedTween(tween, end, begin), 0) ;
			}
			return new SlicedTween(tween, begin, end) ;
		},
		delay:function(tween/*:ITween*/, delay/*:Number*/, postDelay/*:Number = 0.0*/)//:ITween
		{
			return new DelayedTween(tween, delay || 0, postDelay || 0) ;
		},
		addChild:function(target/*:DisplayObject*/, parent/*:DisplayObjectContainer*/)//:ITween
		{
			//return new AddChildAction(_ticker, target, parent);
		},
		removeFromParent:function(target/*:DisplayObject*/)//:ITween
		{
			//return new RemoveFromParentAction(_ticker, target);
		},
		func:function(func/*:Function*/, params/*:Array = null*/, useRollback/*:Boolean = false*/, rollbackFunc/*:Function = null*/, rollbackParams/*:Array = null*/)//:ITween
		{
			//return new FunctionAction(_ticker, func, params, useRollback, rollbackFunc, rollbackParams);
		}
    },
    __init__:function()
    {
       
       
       
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));




// CORE.UPDATERS
var UpdaterFactory = NS('UpdaterFactory', NS('org.libspark.betweenJS.core.updaters::UpdaterFactory', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        instance:undefined,
        getInstance:function(){
            return NS('UpdaterFactory').instance || new NS('UpdaterFactory') ;
        },
        toString:function()
        {
            return '[class UpdaterFactory]' ;
        }
    },
    registry:undefined,
    poolIndex:0,
    mapPool:[],
    listPool:[],
    __init__:function(registry)
    {
       NS('UpdaterFactory').instance = this ;
       
       //this.registry = registry ;
       
       return this ;
    },
    create:function(target, dest, source)
    {
        var map/*:Dictionary*/, updaters/*:Array*/, name/*:String*/, value/*:Object*/, isRelative/*:Boolean*/, parent/*:IUpdater*/, child/*:IUpdater*/, updater/*:IUpdater*/;
        var units ;
        if (this.poolIndex > 0) {
            --this.poolIndex ;
            map = this.mapPool[this.poolIndex] /*as Dictionary*/;
            updaters = this.listPool[this.poolIndex] /*as Array*/;
        }
        else {
            map = {} ;
            updaters = [] ;
        }
        
        if (source !== undefined) {
            for (name in source) {
                if (typeof(value = source[name]) == "number") {
                    if ((isRelative = /^\$/.test(name))) {
                        name = name.substr(1) ;
                    }
                    
                    this.getUpdaterFor(target, name, map, updaters).setSourceValue(name, parseInt(value), isRelative) ;
                }
                else {
                    parent = this.getUpdaterFor(target, name, map, updaters) ;
                    child = this.create(parent.getObject(name), dest !== undefined ? dest[name] : undefined, value) ;
                    updaters.push(new UpdaterLadder(parent, child, name));
                }
            }
        }
        
        if (dest !== undefined) {
            for (name in dest) {
                if (typeof(value = dest[name]) == "number") {
                    if ((isRelative = /^\$/.test(name))) {
                        name = name.substr(1) ;
                    }
                    
                    this.getUpdaterFor(target, name, map, updaters).setDestinationValue(name, parseInt(value), isRelative) ;
                } else {
                    if (!(source !== undefined && name in source)) {
                        parent = this.getUpdaterFor(target, name, map, updaters) ;
                        child = this.create(parent.getObject(name), value, source !== undefined ? source[name] : undefined) ;
                        updaters.push(new UpdaterLadder(parent, child, name)) ;
                    }
                }
            }
        }
        var l = updaters.length ;
        
        if (l == 1) {
            updater = updaters[0] ;
        }else if (l > 1) {
            updater = new CompositeUpdater(target, updaters) ;
        }
        
        for (var p in map) {
            delete map[p] ;
        }
        
        updaters.length = 0 ;
        
        this.mapPool[this.poolIndex] = map ;
        this.listPool[this.poolIndex] = updaters ;
        ++this.poolIndex ;
        
        return updater ;
    },
    createBezier:function(target, dest, source, controlPoint)
    {
        var map = {}, updaters = [], bezierUpdater = new BezierUpdater(), 
        name, value, isRelative, cp, l, i, child, updater;
        
        bezierUpdater.target = target ;
        
        updaters.push(bezierUpdater) ;
        
        if (source !== undefined) {
            for (name in source) {
                if (typeof(value = source[name]) == 'number') {
                    if ((isRelative = /^\$/.test(name))) {
                        name = name.substr(1) ;
                    }
                    bezierUpdater.setSourceValue(name, parseFloat(value), isRelative) ;
                } else {
                    if (map[name] !== true) {
                        child = this.createBezier(bezierUpdater.getObject(name), dest !== undefined ? dest[name] : undefined, value, controlPoint !== undefined ? controlPoint[name] : undefined) ;
                        updaters.push(new UpdaterLadder(bezierUpdater, child, name)) ;
                        map[name] = true ;
                    }
                }
            }
        }
        if (dest !== undefined) {
            for (name in dest) {
                if (typeof(value = dest[name]) == 'number') {
                    if ((isRelative = /^\$/.test(name))) {
                        name = name.substr(1) ;
                    }
                    bezierUpdater.setDestinationValue(name, parseFloat(value), isRelative) ;
                } else {
                    if (map[name] !== true) {
                        child = this.createBezier(bezierUpdater.getObject(name), undefined, source !== undefined ? source[name] : undefined, controlPoint !== undefined ? controlPoint[name] : undefined) ;
                        updaters.push(new UpdaterLadder(bezierUpdater, child, name)) ;
                        map[name] = true ;
                    }
                }
            }
        }
        if (controlPoint !== undefined) {
            for (name in controlPoint) {
                if (typeof(value = controlPoint[name]) == 'number') {
                    value = [value] ;
                }
                if (value.constructor == Array) {
                    if ((isRelative = /^\$/.test(name))) {
                        name = name.substr(1) ;
                    }
                    cp = value ;
                    l = cp.length ;
                    for (i = 0 ; i < l ; ++i) {
                        bezierUpdater.addControlPoint(name, cp[i], isRelative) ;
                    }
                } else {
                    if (map[name] !== true) {
                        child = this.createBezier(bezierUpdater.getObject(name), dest !== undefined ? dest[name] : undefined, source !== undefined ? source[name] : undefined, value) ;
                        updaters.push(new UpdaterLadder(bezierUpdater, child, name)) ;
                        map[name] = true ;
                    }
                }
            }
        }
        
        if (updaters.length == 1) {
            updater = updaters[0] ;
        } else if (updaters.length > 1) {
            updater = new CompositeUpdater(target, updaters) ;
        }
        
        return updater ;
    },
    getClassByTargetClassAndPropertyName:function(ctor){
        
        var type ;
        switch(true){
            
            case /HTML[a-zA-Z]+Element/.test(ctor) :
            case ctor === undefined : // IE 7-
                type = DOMElementUpdater.ns ;
            break ;
            
            case ctor === Class :
            case ctor === Date :
            case ctor === Number :
            case ctor === String :
            case ctor === Function :
            case ctor === Object :
            default:
                type = ObjectUpdater.ns ;
            break ;
            
        }
        return type ;
    },
    getUpdaterFor:function(target, propertyName, map, list)// AbstractUpdater
    {
        var updaterClass = this.getClassByTargetClassAndPropertyName(target.constructor) ;
        var units ;
        trace(propertyName)
        if ((/::PX$/i.test(propertyName))) {
            propertyName = propertyName.substring(-2) ;
            units = 'px' ;
        }
        if ((/::PC$/i.test(propertyName))) {
            propertyName = propertyName.substring(-2) ;
            units = 'pc' ;
        }
        if ((/::EM$/i.test(propertyName))) {
            propertyName = propertyName.substring(-2) ;
            units = 'em' ;
        }
        if ((/::%$/.test(propertyName))) {
            propertyName = propertyName.substring(-1) ;
            units = '%' ;
        }
        if (updaterClass !== undefined) {
            var updater = map[updaterClass] ;
            if (updater === undefined) {
                updater = new NS(updaterClass)(units) ;
                updater.target = target ;
                map[updaterClass] = updater ;
                if (list !== undefined) {
                    list.push(updater) ;
                }
            }
            return updater ;
        }
        return undefined ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var AbstractUpdater = NS('AbstractUpdater', NS('org.libspark.betweenJS.core.updaters::AbstractUpdater', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class AbstractUpdater]' ;
        }
    },
    isResolved:false,
    target:undefined,
    __init__:function()
    { 
       this.isResolved = false ;
       
       return this ;
    },
    setSourceValue:function(propertyName, value, isRelative)
    {
        
    },
    setDestinationValue:function(propertyName, value, isRelative)
    {
        
    },
    getObject:function(propertyName){
        
    },
    setObject:function(propertyName, value){
        
    },
    update:function(factor){
        if (this.isResolved === false) {
            this.resolveValues() ;
            this.isResolved = true ;
        }
        this.updateObject(factor) ;
    },
    resolveValues:function(){
        
    },
    updateObject:function(){
        
    },
    clone:function(){
        var instance = this.newInstance();
        if (instance !== undefined) {
            instance.copyFrom(this) ;
        }
        return instance ;
    },
    newInstance:function(){
        return undefined ;
    },
    copyFrom:function(){
        // Do NOT copy _isResolved property.
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var ObjectUpdater = NS('ObjectUpdater', NS('org.libspark.betweenJS.core.updaters::ObjectUpdater', AbstractUpdater.$extend({
    __classvars__:{
        version:'0.0.1',
        register:function(registry){
            //registry.registerClassWithTargetClassAndPropertyName(ObjectUpdater, Object, '*');
        },
        toString:function()
        {
            return '[class ObjectUpdater]' ;
        }
    },
    target:undefined,
    source:undefined,
    destination:undefined,
    relativeMap:undefined,
    __init__:function()
    {
    	 this.source = {} ;
    	 this.destination = {} ;
    	 this.relativeMap = {} ;
    	 
       return this ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        if(isRelative === undefined) isRelative = false ;
        this.source[propertyName] = value ;
        this.relativeMap['source.' + propertyName] = isRelative ;
    },
    setDestinationValue:function(propertyName, value, isRelative){
        if(isRelative === undefined) isRelative = false ;
        this.destination[propertyName] = value ;
        this.relativeMap['dest.' + propertyName] = isRelative ;
    },
    getObject:function(propertyName){
        return this.target[propertyName] ;
    },
    setObject:function(propertyName, value){
        this.target[propertyName] = value ;
    },
    resolveValues:function(){
        var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap ;
        
        for (key in source) {
            if (dest[key] === undefined) {
                dest[key] = target[key] ;
            }
            if (!!rMap['source.' + key]) {
                source[key] += target[key] ;
            }
        }
        for (key in dest) {
            if (source[key] === undefined) {
                source[key] = target[key] ;
            }
            if (!!rMap['dest.' + key]) {
                dest[key] += target[key] ;
            }
        }
    },
    updateObject:function(factor)
    {
        var invert = 1.0 - factor ;
        var t = this.target ;
        var d = this.destination ;
        var s = this.source ;
        var str ;

        for (str in d) {
            t[str] = s[str] * invert + d[str] * factor ;
        }
    },
    newInstance:function()
    {
        return new ObjectUpdater() ;
    },
    copyFrom:function(source)
    {
        this.$super(source) ;
        var obj = source ;
        
        this.target = obj.target ;
        this.copyObject(this.source, obj.source) ;
        this.copyObject(this.destination, obj.destination) ;
        this.copyObject(this.relativeMap, obj.relativeMap) ;
    },
    copyObject:function(to, from)
    {
        for (var s in from) {
            to[s] = from[s] ;
        }
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var DOMElementUpdater = NS('DOMElementUpdater', NS('org.libspark.betweenJS.core.updaters::DOMElementUpdater', AbstractUpdater.$extend({
    __classvars__:{
        version:'0.0.1',
        register:function(registry){
            //registry.registerClassWithTargetClassAndPropertyName(ObjectUpdater, Object, '*');
        },
        toString:function()
        {
            return '[class DOMElementUpdater]' ;
        }
    },
    target:undefined,
    source:undefined,
    destination:undefined,
    relativeMap:undefined,
    __init__:function(units)
    {
         this.$super() ;
         this.source = {} ;
         this.destination = {} ;
         this.relativeMap = {} ;
         this.units = units || 'px' ;
         
         this.reg = new RegExp('::'+this.units + '$') ;
         
       return this ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        propertyName = propertyName.replace(this.reg, '') ;
        trace(propertyName)
        if(isRelative === undefined) isRelative = false ;
        this.source[propertyName] = value ;
        this.relativeMap['source.' + propertyName] = isRelative ;
    },
    setDestinationValue:function(propertyName, value, isRelative){
        propertyName = propertyName.replace(this.reg, '') ;
        
        if(isRelative === undefined) isRelative = false ;
        this.destination[propertyName] = value ;
        this.relativeMap['dest.' + propertyName] = isRelative ;
    },
    getObject:function(propertyName){
        propertyName = propertyName.replace(this.reg, '') ;
        
        return this.target.style[propertyName] ;
    },
    setObject:function(propertyName, value){
        propertyName = propertyName.replace(this.reg, '') ;
        this.target.style[propertyName] = value ;
    },
    resolveValues:function(){
        var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap ;
        
        for (key in source) {
            if (dest[key] === undefined) {
                dest[key] = target.style[key] ;
                trace(target.style[key])
            }
            if (!!rMap['source.' + key]) {
                source[key] += target.style[key] ;
            }
        }
        for (key in dest) {
            if (source[key] === undefined) {
                source[key] = target.style[key] ;
                trace(target.style[key])
            }
            if (!!rMap['dest.' + key]) {
                dest[key] += target.style[key] ;
            }
        }
    },
    updateObject:function(factor)
    {
        var invert = 1.0 - factor ;
        var t = this.target ;
        var d = this.destination ;
        var s = this.source ;
        var str ;

        for (str in d) {
            t.style[str] = parseFloat(s[str] * invert + d[str] * factor ) + this.units ;
        }
    },
    newInstance:function()
    {
        return new DOMElementUpdater() ;
    },
    copyFrom:function(source)
    {
        this.$super(source) ;
        var obj = source ;
        
        this.target = obj.target ;
        this.copyObject(this.source, obj.source) ;
        this.copyObject(this.destination, obj.destination) ;
        this.copyObject(this.relativeMap, obj.relativeMap) ;
    },
    copyObject:function(to, from)
    {
        for (var s in from) {
            to[s] = from[s] ;
        }
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));


var CompositeUpdater = NS('CompositeUpdater', NS('org.libspark.betweenJS.core.updaters::CompositeUpdater', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class CompositeUpdater]' ;
        }
    },
    target:undefined,
    a:undefined,
    b:undefined,
    c:undefined,
    d:undefined,
    updaters:undefined,
    __init__:function(target, updaters)
    {
        this.target = target ;
        
        var l = updaters.length ;
        if (l >= 1) {
            this.a = updaters[0] ;
            if (l >= 2) {
                this.b = updaters[1] ;
                if (l >= 3) {
                    this.c = updaters[2] ;
                    if (l >= 4) {
                        this.d = updaters[3] ;
                        if (l >= 5) {
                            this.updaters = new Array(l - 4) ;
                            for (var i = 4 ; i < l ; ++i) {
                                this.updaters[i - 4] = updaters[i] ;
                            }
                        }
                    }
                }
            }
        }
         
       return this ;
    },
    getUpdaterAt:function(index){
        switch(index){
            case '0' :
                return this.a ;
            break ;
            case '1' :
                return this.b ;
            break ;
            case '2' :
                return this.c ;
            break ;
            case '3' :
                return this.d ;
            break ;
            default :
                return this.updaters[index - 4] ;
            break ;
        }
    },
    setSourceValue:function(propertyName, value, isRelative){
        
    },
    setDestinationValue:function(propertyName, value, isRelative){
        
    },
    getObject:function(propertyName){
        return undefined ;
    },
    setObject:function(propertyName, value){
        
    },
    update:function(factor)
    {
        if (this.a !== undefined) {
            this.a.update(factor) ;
            if (this.b !== undefined) {
                this.b.update(factor) ;
                if (this.c !== undefined) {
                    this.c.update(factor) ;
                    if (this.d !== undefined) {
                        this.d.update(factor);
                        if (this.updaters !== undefined) {
                            var updaters = this.updaters ;
                            var l = updaters.length ;
                            for (var i = 0 ; i < l ; ++i) {
                                updaters[i].update(factor) ;
                            }
                        }
                    }
                }
            }
        }
    },
    clone:function(source)
    {
        var updaters = [] ;
        
        if (this.a !== undefined) {
            updaters.push(this.a.clone()) ;
            if (this.b !== undefined) {
                updaters.push(this.b.clone()) ;
                if (this.c !== undefined) {
                    updaters.push(this.c.clone()) ;
                    if (this.d !== undefined) {
                        updaters.push(this.d.clone()) ;
                        if (this.updaters !== undefined) {
                            var u = this.updaters ;
                            var l = u.length ;
                            for (var i = 0; i < l ; ++i) {
                                updaters.push(u[i].clone()) ;
                            }
                        }
                    }
                }
            }
        }
        
        return new CompositeUpdater(this.target, updaters) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var UpdaterLadder = NS('UpdaterLadder', NS('org.libspark.betweenJS.core.updaters::UpdaterLadder', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class UpdaterLadder]' ;
        }
    },
    target:undefined,
    parent:undefined,
    child:undefined,
    propertyName:undefined,
    __init__:function(parent, child, propertyName)
    {
        this.parent = parent ;
        this.child = child ;
        this.propertyName = propertyName ;
         
       return this ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        
    },
    setDestinationValue:function(propertyName, value, isRelative){
        
    },
    getObject:function(propertyName){
        return undefined ;
    },
    setObject:function(propertyName, value){
        
    },
    resolveValues:function(){
        
    },
    update:function(factor)
    {
        this.child.update(factor) ;
        this.parent.setObject(this.propertyName, this.child.target) ;
    },
    clone:function(source)
    {
        return new NS('UpdaterLadder')(this.parent, this.child, this.propertyName) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var PhysicalUpdater = NS('PhysicalUpdater', NS('org.libspark.betweenJS.core.updaters::PhysicalUpdater', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class PhysicalUpdater]' ;
        }
    },
    target:undefined,
    source:undefined,
    destination:undefined,
    relativeMap:undefined,
    easing:undefined,
    duration:undefined,
    maxDuration:0.0,
    isResolved:false,
    __init__:function()
    {
        this.source = {} ;
        this.destination = {} ;
        this.relativeMap = {} ;
        
        this.duration = {} ;
        return this ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        this.source[propertyName] = value;
        this.relativeMap['source.' + propertyName] = isRelative ;
    },
    setDestinationValue:function(propertyName, value, isRelative){
        this.destination[propertyName] = value ;
        this.relativeMap['dest.' + propertyName] = isRelative ;
    },
    getObject:function(propertyName){
        return this.target[propertyName];
    },
    setObject:function(propertyName, value){
        this.target[propertyName] = value;
    },
    resolveValues:function(){
        var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap, d = this.duration, 
        duration, maxDuration = 0.0 ;
            
            for (key in source) {
                if (dest[key] == undefined) {
                    dest[key] = target[key] ;
                }
                if (rMap['source.' + key]) {
                    source[key] += target[key] ;
                }
            }
            for (key in dest) {
                if (source[key] == undefined) {
                    source[key] = target[key] ;
                }
                if (rMap['dest.' + key]) {
                    dest[key] += target[key] ;
                }
                duration = this.easing.getDuration(source[key], dest[key] - source[key]) ;
                d[key] = duration ;
                if (maxDuration < duration) {
                    maxDuration = duration ;
                }
            }
            
            this.maxDuration = maxDuration ;
            
            this.isResolved = true ;
        
    },
    update:function(time)
    {
        if (!this.isResolved) {
            this.resolveValues() ;
        }
        
        var factor,
        t = this.target,
        e = this.easing,
        dest = this.destination,
        src = this.source,
        d = this.duration,
        s,name ;
        
        for (name in dest) {
            if (time >= d[name]) {
                t[name] = dest[name] ;
            } else {
                s = src[name] ;
                t[name] = e.calculate(time, s, dest[name] - s) ;
            }
        }
    },
    clone:function(source)
    {
        var instance = this.newInstance() ;
        if (instance !== undefined) {
            instance.copyFrom(this) ;
        }
        return instance ;
    },
    newInstance:function()
    {
        return new NS('PhysicalUpdater') ;
    },
    copyFrom:function(source)
    {
        var obj = source ;
        
        this.target = obj.target ;
        this.easing = obj.easing ;
        copyObject(this.source, obj.source) ;
        copyObject(this.destination, obj.destination) ;
        copyObject(this.relativeMap, obj.relativeMap) ;
    },
    copyObject:function(to, from)
    {
        for (var name in from) {
            to[name] = from[name] ;
        }
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var PhysicalUpdaterLadder = NS('PhysicalUpdaterLadder', NS('org.libspark.betweenJS.core.updaters::PhysicalUpdaterLadder', Class.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class PhysicalUpdaterLadder]' ;
        }
    },
    target:undefined,
    parent:undefined,
    child:undefined,
    propertyName:undefined,
    easing:undefined,
    duration:0.0,
    __init__:function(parent, child, propertyName)
    {
        this.parent = parent ;
        this.child = child ;
        this.propertyName = propertyName ;
        this.duration = this.parent.duration ;
        
        return this ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        
    },
    setDestinationValue:function(propertyName, value, isRelative){
        
    },
    getObject:function(propertyName){
        
    },
    setObject:function(propertyName, value){
        
    },
    resolveValues:function(){
        
    },
    update:function(factor)
    {
        this.child.update(factor) ;
        this.parent.setObject(this.propertyName, this.child.target) ;
    },
    clone:function(source)
    {
        return new PhysicalUpdaterLadder(this.parent, this.child, this.propertyName) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var BezierUpdater = NS('BezierUpdater', NS('org.libspark.betweenJS.core.updaters::BezierUpdater', AbstractUpdater.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class BezierUpdater]' ;
        }
    },
    target:undefined,
    source:undefined,
    destination:undefined,
    relativeMap:undefined,
    controlPoint:undefined,
    __init__:function()
    {
        this.source = {} ;
        this.destination = {} ;
        this.relativeMap = {} ;
        this.controlPoint = {} ;
        
        return this ;
    },
    addControlPoint:function(propertyName, value, isRelative){
        var controlPoint = this.controlPoint[propertyName] ;
        
        if (controlPoint === undefined) this.controlPoint[propertyName] = controlPoint = [] ;
        controlPoint.push(value) ;
        
        this.relativeMap['cp.' + propertyName + '.' + controlPoint.length] = isRelative ;
    },
    setSourceValue:function(propertyName, value, isRelative){
        this.source[propertyName] = value ;
        this.relativeMap['source.' + propertyName] = isRelative ;
    },
    setDestinationValue:function(propertyName, value, isRelative){
        this.destination[propertyName] = value ;
        this.relativeMap['dest.' + propertyName] = isRelative ;
    },
    getObject:function(propertyName){
        return this.target[propertyName] ;
    },
    setObject:function(propertyName, value){
        this.target[propertyName] = value ;
    },
    resolveValues:function(){
        var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap, 
        controlPoint = this.controlPoint, cpVec, l, i ;
        
        for (key in source) {
            if (dest[key] === undefined) {
                dest[key] = target[key] ;
            }
            if (rMap['source.' + key]) {
                source[key] += target[key] ;
            }
        }
        for (key in dest) {
            if (source[key] === undefined) {
                source[key] = target[key] ;
            }
            if (rMap['dest.' + key]) {
                dest[key] += target[key] ;
            }
        }
        for (key in controlPoint) {
            cpVec = controlPoint[key] ;
            l = cpVec.length ;
            for (i = 0 ; i < l ; ++i) {
                if (rMap['cp.' + key + '.' + i]) {
                    cpVec[i] += target[key] ;
                }
            }
        }
    },
    updateObject:function(factor)
    {
        var invert = 1.0 - factor,
        t = this.target,
        d = this.destination,
        s = this.source,
        cp = this.controlPoint,
        cpVec, b, l, ip, it, p1, p2, name ;
        
        for (name in d) {
            
            b = s[name] ;
            
            if (factor != 1.0 && (cpVec = this.controlPoint[name]) !== undefined) {
                if ((l = cpVec.length) == 1) {
                    t[name] = b + factor * (2 * invert * (cpVec[0] - b) + factor * (d[name] - b)) ;
                } else {
                    ip = (factor * l) >> 0 ;
                    it = (factor - (ip * (1 / l))) * l ;
                    if (ip == 0) {
                        p1 = b ;
                        p2 = (cpVec[0] + cpVec[1]) >> 1 ;
                    }
                    else if (ip == (l - 1)) {
                        p1 = (cpVec[ip - 1] + cpVec[ip]) >> 1 ;
                        p2 = d[name] ;
                    }
                    else {
                        p1 = (cpVec[ip - 1] + cpVec[ip]) >> 1 ;
                        p2 = (cpVec[ip] + cpVec[ip + 1]) >> 1 ;
                    }
                    t[name] = p1 + it * (2 * (1 - it) * (cpVec[ip] - p1) + it * (p2 - p1)) ;
                }
            } else {
                t[name] = b * invert + d[name] * factor ;
            }
        }
    },
    clone:function(source)
    {
        var instance = this.newInstance() ;
        if (instance !== undefined) {
            instance.copyFrom(this) ;
        }
        return instance ;
    },
    newInstance:function()
    {
        return new BezierUpdater() ;
    },
    copyFrom:function(source)
    {
        this.$super(source) ;
        var obj = source ;
        
        this.target = obj.target ;
        copyObject(this.source, obj.source) ;
        copyObject(this.destination, obj.destination) ;
        copyObject(this.controlPoint, obj.controlPoint) ;
        copyObject(this.relativeMap, obj.relativeMap) ;
    },
    copyObject:function(to, from)
    {
        for (var name in from) {
            to[name] = from[name] ;
        }
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));
// CORE.TICKER
var TickerListener = NS('TickerListener', NS('org.libspark.betweenJS.core.ticker::TickerListener', EventDispatcher.$extend({
    __classvars__:{version:'0.0.1',
        toString:function()
        {
            return '[class TickerListener]' ;
        }
    },
    prevListener:undefined,
    nextListener:undefined,
    __init__:function()
    {
        
        this.$super(new EventDispatcher()) ;
        
        return this ;
    },
    tick:function(time)
    {
        return false ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
}))) ;

// TICKERS
var EnterFrameTicker = NS('EnterFrameTicker', NS('org.libspark.betweenJS.tickers::EnterFrameTicker', Class.$extend({
    __classvars__:{version:'0.0.1',
        toString:function()
        {
            return '[class EnterFrameTicker]' ;
        }
    },
    first:undefined,
    numListeners:0,
    tickerListenerPaddings:undefined,
    time:undefined,
    __init__:function()
    {
        this.numListeners = 0 ;
		this.tickerListenerPaddings = new Array(10) ;
		var prevListener = undefined ;
		
		for (var i = 0 ; i < 10 ; ++i ) {
			
			var listener = new TickerListener() ; 
			if (prevListener !== undefined) {
				prevListener.nextListener = listener ;
				listener.prevListener = prevListener ;
			}
			prevListener = listener ;
			this.tickerListenerPaddings[i] = listener ;
		}
		
		return this ;
    },
    addTickerListener:function(listener)
	{
		if(listener.nextListener !== undefined || listener.prevListener !== undefined) {
			return ;
		}
		
		if (this.first !== undefined) {
			if (this.first.prevListener !== undefined) {
				this.first.prevListener.nextListener = listener ;
				listener.prevListener = this.first.prevListener ;
			}
			listener.nextListener = this.first ;
			this.first.prevListener = listener ;
		}
		
		this.first = listener ;
		
		++this.numListeners ;
	},
	removeTickerListener:function(listener)
	{
		var l = this.first ;
		
		while (l !== undefined) {
			
			if (l == listener) {
				if (l.prevListener !== undefined) {
					l.prevListener.nextListener = l.nextListener ;
					l.nextListener = undefined ;
				}
				else {
					this.first = l.nextListener;
				}
				if (l.nextListener !== undefined) {
					l.nextListener.prevListener = l.prevListener ;
					l.prevListener = undefined ;
				}
				--this.numListeners ;
			}
			
			l = l.nextListener ;
		}
	},
	start:function()
	{
		this.time = getTimer() * .001 ;
		var eft = this ;
		this.interval = setInterval(function(){eft.update()}, 20) ;
	},
	stop:function()
	{
		clearInterval(this.interval) ;
	},
	update:function(e)
	{
		
		var t = this.time = getTimer() * .001 ;
		var n = 8 - (this.numListeners % 8) ;
		var listener = this.tickerListenerPaddings[0] ; 
		var l = this.tickerListenerPaddings[n] ;
		var ll ;
		
		if ((l.nextListener = this.first) !== undefined) {
			this.first.prevListener = l ;
		}
		
		while (listener.nextListener !== undefined) {
		    
		    
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
            if ((listener = listener.nextListener).tick(t)) {
                if (listener.prevListener !== undefined) {
                    listener.prevListener.nextListener = listener.nextListener ;
                }
                if (listener.nextListener !== undefined) {
                    listener.nextListener.prevListener = listener.prevListener ;
                }
                ll = listener.prevListener ;
                listener.nextListener = undefined ;
                listener.prevListener = undefined ;
                listener = ll ;
                --this.numListeners ;
            }
		}
		if ((this.first = l.nextListener) !== undefined) {
			this.first.prevListener = undefined ;
		}
		l.nextListener = this.tickerListenerPaddings[n + 1] ;
	},
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));




// CORE.TWEENS
var AbstractTween = NS('AbstractTween', NS('org.libspark.betweenJS.core.tweens::AbstractTween', TickerListener.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class AbstractTween]' ;
        }
    },
    __init__:function(ticker, position)
    {
       this.isPlaying = false ;
       this.time = .5 ;
       this.stopOnComplete = true ;
       this.willTriggerFlags = 0 ;
       
       this.$super(new EventDispatcher()) ;
       
       this.ticker = ticker ;
       this.position = position || 0 ;
       
       return this ;
    },
    ticker:undefined,
    time:.5,
    position:0,
    isPlaying:false,
    stopOnComplete:true,
    willTriggerFlags:0,
    onPlay:undefined,
    onPlayParams:undefined,
    onStop:undefined,
    onStopParams:undefined,
    onUpdate:undefined,
    onUpdateParams:undefined,
    onComplete:undefined,
    onCompleteParams:undefined,
    
    play:function()
    {
        if (!this.isPlaying) {
            if (this.position >= this.time) {
                this.position = 0 ;
            }
            var t = this.ticker.time ;
            
            this.startTime = t - this.position ;
            this.isPlaying = true ;
            
            this.ticker.addTickerListener(this) ;
            
            if ((this.willTriggerFlags & 0x01) != 0) {
               this.dispatch(new TweenEvent(TweenEvent.PLAY, undefined, this)) ;
            }
            
            if (this.onPlay !== undefined) {
               this.onPlay.apply(null, this.onPlayParams) ;
            }
            this.tick(t) ;
        }
        
        return this ;
    },
    firePlay:function()
    {
        if ((this.willTriggerFlags & 0x01) != 0) {
            this.dispatch(new TweenEvent(TweenEvent.PLAY, undefined, this)) ;
        }
        if (this.onPlay !== undefined) {
           this.onPlay.apply(null, this.onPlayParams) ;
        }
    },
    stop:function()
    {
        if (this.isPlaying) {
            this.ticker.removeTickerListener(this) ;
            this.isPlaying = false ;
            if ((this.willTriggerFlags & 0x02) != 0) {
                this.dispatch(new TweenEvent(TweenEvent.STOP, undefined, this)) ;
            }
            if (this.onStop !== undefined) {
                this.onStop.apply(null, this.onStopParams) ;
            }
        }
        return this ;
    },
    fireStop:function()
    {
        if ((this.willTriggerFlags & 0x02) != 0) {
            this.dispatch(new TweenEvent(TweenEvent.STOP, undefined, this)) ;
        }
        if (this.onStop !== undefined) {
            this.onStop.apply(null, this.onStopParams) ;
        }
    },
    togglePause:function()
    {
        if (this.isPlaying) {
            this.stop() ;
        }
        else {
            this.play() ;
        }
    },
    gotoAndPlay:function(position)
    {
        if (position < 0) {
            position = 0 ;
        }
        if (position > this.time) {
            position = this.time ;
        }
        this.position = position ;
        this.play();
    },
    gotoAndStop:function(position)
    {
        if (position < 0) {
            position = 0 ;
        }
        if (position > this.time) {
            position = this.time ;
        }
        this.position = position ;
        this.internalUpdate(position) ;
        if ((this.willTriggerFlags & 0x04) != 0) {
            this.dispatch(new TweenEvent(TweenEvent.UPDATE, undefined, this)) ;
        }
        if (this.onUpdate !== undefined) {
            this.onUpdate.apply(null, this.onUpdateParams) ;
        }
        this.stop() ;
    },
    update:function(time) /////  called with 'BetweenJS.apply'-type of methods
    {
        var isComplete = false ;
        
        if ((this.position < this.time && this.time <= time) || (0 < this.position && time <= 0)) {
            isComplete = true ;
        }
        
        this.position = time ;
        this.internalUpdate(time) ;
        
        if ((this.willTriggerFlags & 0x04) != 0) {
            this.dispatch(new TweenEvent(TweenEvent.UPDATE, undefined, this)) ;
        }
        if (this.onUpdate !== undefined) {
            this.onUpdate.apply(null, this.onUpdateParams) ;
        }
        
        if (isComplete) {
            if ((this.willTriggerFlags & 0x08) != 0) {
                this.dispatch(new TweenEvent(TweenEvent.COMPLETE, undefined, this)) ;
            }
            if (this.onComplete !== undefined) {
                this.onComplete.apply(null, this.onCompleteParams) ;
            }
        }
    },
    tick:function(time)
    {
        if (this.isPlaying === false) {
            return true ;
        }
        
        var t = time - this.startTime ;
        
        this.position = t ;
        this.internalUpdate(t) ;
        
        
        if ((this.willTriggerFlags & 0x04) != 0) {
            this.dispatch(new TweenEvent(TweenEvent.UPDATE, undefined, this)) ;
        }
        
        if (this.onUpdate !== undefined) {
            this.onUpdate.apply(null, this.onUpdateParams) ;
        }
        
        if (this.isPlaying === true) {
        		
            if (t >= this.time) {
                this.position = this.time ;
                if (this.stopOnComplete === true) {
                    this.isPlaying = false ;
                    if ((this.willTriggerFlags & 0x08) != 0) {
                        this.dispatch(new TweenEvent(TweenEvent.COMPLETE, undefined, this)) ;
                    }
                    if (this.onComplete !== undefined) {
                        this.onComplete.apply(null, this.onCompleteParams) ;
                    }
                    return true ;
                }else {
                    if ((this.willTriggerFlags & 0x08) != 0) {
                        this.dispatch(new TweenEvent(TweenEvent.COMPLETE, undefined, this)) ;
                    }
                    if (this.onComplete !== undefined) {
                        this.onComplete.apply(null, this.onCompleteParams) ;
                    }
                    this.position = t - this.time ;
                    this.startTime = time - this.position ;
                    this.tick(time) ;
                }
            }
            return false;
        }
        return true;
    },
    internalUpdate:function(time)
    {
    	
    },
    clone:function(){
        var instance = newInstance() ;
        if (instance !== undefined) {
            instance.copyFrom(this) ;
        }
        return instance ;
    },
    newInstance:function()/*:AbstractTween*/
    {
       return undefined;
    },
    copyFrom:function(source)
    {
        this.ticker = source.ticker ;
        this.time = source.time ;
        this.stopOnComplete = source.stopOnComplete ;
        this.copyHandlersFrom(source);
        /*
        if (source.dispatcher !== undefined) {
            this.dispatcher = new EventDispatcher(this);
            this.dispatcher.copyFrom(source.dispatcher);
        }*/
        this.willTriggerFlags = source.willTriggerFlags ;
    },
    copyHandlersFrom:function()
    {
        this.onPlay = source.onPlay ;
        this.onPlayParams = source.onPlayParams ;
        this.onStop = source.onStop ;
        this.onStopParams = source.onStopParams ;
        this.onUpdate = source.onUpdate ;
        this.onUpdateParams = source.onUpdateParams ;
        this.onComplete = source.onComplete ;
        this.onCompleteParams = source.onCompleteParams ; 
    },
    addEL:function(type, listener)
    {
        trace('>>>>>>>>>>>>>>>>>'+type)
    	this.$super(type, listener) ;
        this.updateWillTriggerFlags() ;
        
        return this ;
    },
    removeEL:function(type, listener)
    {
    	this.$super(type, listener) ;
        this.updateWillTriggerFlags() ;
        
        return this ;
    },
    dispatch:function(e)
    {
		if (this.target !== undefined) {
			return this.target.dispatch(e);
		}
		return false ;
    },
    updateWillTriggerFlags:function()
    {
        if (this.willTrigger(TweenEvent.PLAY)) {
            this.willTriggerFlags |= 0x01 ;
        }
        else {
            this.willTriggerFlags &= ~0x01 ;
        }
        if (this.willTrigger(TweenEvent.STOP)) {
            this.willTriggerFlags |= 0x02 ;
        }
        else {
            this.willTriggerFlags &= ~0x02 ;
        }
        if (this.willTrigger(TweenEvent.UPDATE)) {
            this.willTriggerFlags |= 0x04 ;
        }
        else {
            this.willTriggerFlags &= ~0x04 ;
        }
        if (this.willTrigger(TweenEvent.COMPLETE)) {
            this.willTriggerFlags |= 0x08 ;
        }
        else {
            this.willTriggerFlags &= ~0x08 ;
        }
	 },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

// TWEENS
var ObjectTween = NS('ObjectTween', NS('org.libspark.betweenJS.tweens::ObjectTween', AbstractTween.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class ObjectTween]' ;
        }
    },
    easing:undefined,
    updater:undefined,
    target:undefined,
    __init__:function(ticker)
    {
       this.$super(ticker, 0) ;
       return this ;
    },
    internalUpdate:function(time)
    {
       var factor = 0.0 ;
       
       if (time > 0.0) {
           if (time < this.time) {
               factor = this.easing.calculate(time, 0.0, 1.0, this.time) ;
           } else {
               factor = 1.0 ;
           }
       }
       this.updater.update(factor) ;
    },
    newInstance:function()
    {
        return new ObjectTween(this.ticker); 
    },
    copyFrom:function(source)
    {
        this.$super.copyFrom(source);
        
        this.easing = source.easing ;
        this.updater = source.updater.clone() ;
        
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

// DECORATORS
var TweenDecorator = NS('TweenDecorator', NS('org.libspark.betweenJS.tweens::TweenDecorator', AbstractTween.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class TweenDecorator]' ;
        }
    },
    baseTween:undefined,
    __init__:function(baseTween, position)
    {
       this.$super(baseTween.ticker, position) ;
       
       this.baseTween = baseTween ;
       this.time = baseTween.time ;
       
       return this ;
    },
    play:function()
    {
        if (this.isPlaying === false) {
            this.baseTween.firePlay() ;
            this.$super() ;
        }
    },
    firePlay:function()
    {
        this.$super() ;
        this.baseTween.firePlay() ;
    },
    stop:function()
    {
        if (this.isPlaying === true) {
            this.$super() ;
            this.baseTween.fireStop() ;
        }
    },
    fireStop:function()
    {
        this.$super() ;
        this.baseTween.fireStop() ;
    },
    internalUpdate:function(time)
    {
       this.baseTween.update(time) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var SlicedTween = NS('SlicedTween', NS('org.libspark.betweenJS.tweens.decorators::SlicedTween', TweenDecorator.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class SlicedTween]' ;
        }
    },
    begin:0,
    end:1,
    __init__:function(baseTween, begin, end)
    {
       this.$super(baseTween, 0) ;
       
       this.end = end || 1 ;
       this.begin = begin || 0 ;
       this.time = this.end - this.begin ;
       
       return this ;
    },
    internalUpdate:function(time)
    {
        if (time > 0) {
            if (time < this.time) {
                this.baseTween.update(time + this.begin) ;
            } else {
                this.baseTween.update(this.end) ;
            }
        } else {
            this.baseTween.update(this.begin) ;
        }
    },
    newInstance:function()
    {
        return new SlicedTween(this.baseTween.clone(), this.begin, this.end) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));


var ScaledTween = NS('ScaledTween', NS('org.libspark.betweenJS.tweens.decorators::ScaledTween', TweenDecorator.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class ScaledTween]' ;
        }
    },
    scale:1,
    __init__:function(baseTween, scale)
    {
       this.$super(baseTween, 0) ;
       
       this.scale = scale || 1 ;
       this.time = this.scale * baseTween.time ;
       
       return this ;
    },
    internalUpdate:function(time)
    {
       this.baseTween.update(time / this.scale) ;
    },
    newInstance:function()
    {
        return new ScaledTween(this.baseTween.clone(), this.scale) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var ReversedTween = NS('ReversedTween', NS('org.libspark.betweenJS.tweens.decorators::ReversedTween', TweenDecorator.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class ReversedTween]' ;
        }
    },
    __init__:function(baseTween, position)
    {
       this.$super(baseTween, position) ;
       this.time = baseTween.time ;
       
       return this ;
    },
    internalUpdate:function(time)
    {
       this.baseTween.update(this.time - time) ;
    },
    newInstance:function()
    {
        return new ReversedTween(this.baseTween.clone(), 0) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var RepeatedTween = NS('RepeatedTween', NS('org.libspark.betweenJS.tweens.decorators::RepeatedTween', TweenDecorator.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class RepeatedTween]' ;
        }
    },
    basetime:undefined,
    repeatCount:2,
    __init__:function(baseTween, repeatCount)
    {
       this.$super(baseTween, 0) ;
       this.repeatCount = repeatCount || 2 ;
       this.basetime = baseTween.time ;
       
       this.time = this.repeatCount * this.basetime ;
       return this ;
    },
    internalUpdate:function(time)
    {
       if (time >= 0) {
           time -= time < this.time ? this.basetime * parseInt(time / this.basetime) : this.time - this.basetime ;
       }
       this.baseTween.update(time) ;
    },
    newInstance:function()
    {
        return new RepeatedTween(this.baseTween.clone(), this.repeatCount) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

var DelayedTween = NS('DelayedTween', NS('org.libspark.betweenJS.tweens.decorators::DelayedTween', TweenDecorator.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class DelayedTween]' ;
        }
    },
    basetime:undefined,
    preDelay:.5,
    postDelay:.5,
    __init__:function(baseTween, preDelay, postDelay)
    {
       this.$super(baseTween, 0) ;
       this.preDelay = preDelay || .5 ;
       this.postDelay = postDelay || .5 ;
       this.time = this.preDelay + baseTween.time + this.postDelay ;
       
       return this ;
    },
    internalUpdate:function(time)
    {
       if (time >= 0) {
           time -= time < this.time ? this.basetime * parseInt(time / this.basetime) : this.time - this.basetime ;
       }
       this.baseTween.update(time) ;
    },
    newInstance:function()
    {
        return new DelayedTween(this.baseTween.clone(), this.preDelay, this.postDelay) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));

// GROUPS
var ParallelTween = NS('ParallelTween', NS('org.libspark.betweenJS.tweens::ParallelTween', AbstractTween.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class ParallelTween]' ;
        }
    },
    a:undefined,
    b:undefined,
    c:undefined,
    d:undefined,
    targets:undefined,
    __init__:function(targets, ticker, position)
    {
       //this.$super(baseTween.ticker, position) ;
       this.$super(ticker, position) ;
            
        var l = targets.length ;
        
        this.time = 0 ;
        
        if (l > 0) {
            this.a = targets[0] ;
            this.time = this.a.time > this.time ? this.a.time : this.time ;
            if (l > 1) {
                this.b = targets[1] ;
                this.time = this.b.time > this.time ? this.b.time : this.time ;
                if (l > 2) {
                    this.c = targets[2] ;
                    this.time = this.c.time > this.time ? this.c.time : this.time ;
                    if (l > 3) {
                        this.d = targets[3] ;
                        this.time = this.d.time > this.time ? this.d.time : this.time ;
                        if (l > 4) {
                            this.targets = new Array(l - 4) ;
                            for (var i = 4 ; i < l ; ++i) {
                                var t = targets[i] ;
                                this.targets[i - 4] = t ;
                                this.time = t.time > this.time ? t.time : this.time ;
                            }
                        }
                    }
                }
            }
        }
       return this ;
    },
    contains:function(tw)
    {
        if (tw === undefined) return false ;
        
        if (this.a === tw) 
            return true ;
        
        if (this.b === tw) {
            return true;
        }
        if (this.c === tw) {
            return true;
        }
        if (this.d === tw) {
            return true;
        }
        if (this.targets !== undefined) {
            return this.checkForIndex(tw) ;
        }
        return false ;
    },
    checkForIndex:function(tw)
    {
        var l = this.targets.length , cond = false ;
        for (var i = 0 ; i < l ; i++) {
          cond = this.targets[i] === tw ;
          if(!!cond) return true ;
        } ;
        return false ;
    },
    getTweenAt:function(index)
    {
        if (index < 0) {
            return undefined ;
        }
        if (index == 0) {
            return this.a ;
        }
        if (index == 1) {
            return this.b ;
        }
        if (index == 2) {
            return this.c ;
        }
        if (index == 3) {
            return this.d ;
        }
        if (this.targets !== undefined) {
            if (index - 4 < this.targets.length) {
                return this.targets[index - 4] ;
            }
        }
        return undefined ;
    },
    getTweenIndex:function(tw)
    {
        if (tw === undefined) {
            return -1 ;
        }
        if (this.a === tw) {
            return 0 ;
        }
        if (this.b === tw) {
            return 1 ;
        }
        if (this.c === tw) {
            return 2 ;
        }
        if (this.d === tw) {
            return 3 ;
        }
        if (this.targets != null) {
            var i = this.getIndex(tw) ;
            if (i != -1) {
                return i + 4;
            }
        }
        return -1 ;
    },
    getIndex:function(tw){
        var l = this.targets.length , ind = -1 ;
        for(var i = 0 ; i < l ; i++)
            if(this.targets[i] === tw) return i ;
        return ind ;
    },
    internalUpdate:function(time)
    {
       if (this.a !== undefined) {
            this.a.update(time) ;
            if (this.b !== undefined) {
                this.b.update(time) ;
                if (this.c !== undefined) {
                    this.c.update(time) ;
                    if (this.d !== undefined) {
                        this.d.update(time) ;
                        if (this.targets !== undefined) {
                            var targets = this.targets ;
                            var l = targets.length ;
                            for (var i = 0 ; i < l ; ++i)
                                targets[i].update(time) ;
                            
                        }
                    }
                }
            }
        }
    },
    newInstance:function(){
        var targets = [] ;
        if (this.a !== undefined) {
            targets.push(this.a.clone()) ;
        }
        if (this.b !== undefined) {
            targets.push(this.b.clone()) ;
        }
        if (this.c !== undefined) {
            targets.push(this.c.clone()) ;
        }
        if (this.d !== undefined) {
            targets.push(this.d.clone()) ;
        }
        if (this.targets !== undefined) {
            var t = this.targets ;
            var l = t.length;
            for (var i = 0 ; i < l ; ++i) {
                targets.push(t[i].clone()) ;
            }
        }
        return new ParallelTween(targets, this.ticker, 0) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));
var SerialTween = NS('SerialTween', NS('org.libspark.betweenJS.tweens::SerialTween', AbstractTween.$extend({
    __classvars__:{
        version:'0.0.1',
        toString:function()
        {
            return '[class SerialTween]' ;
        }
    },
    a:undefined,
    b:undefined,
    c:undefined,
    d:undefined,
    targets:undefined,
    lastTime:0,
    __init__:function(targets, ticker, position)
    {
       //this.$super(baseTween.ticker, position) ;
       this.$super(ticker, position) ;
            
        var l = targets.length ;
        
        this.time = 0 ;
        this.lastTime = 0 ;
        
        if (l > 0) {
            this.a = targets[0] ;
            this.time += this.a.time ;
            if (l > 1) {
                this.b = targets[1] ;
                this.time += this.b.time ;
                if (l > 2) {
                    this.c = targets[2] ;
                    this.time += this.c.time ;
                    if (l > 3) {
                        this.d = targets[3] ;
                        this.time += this.d.time ;
                        if (l > 4) {
                            this.targets = new Array(l - 4) ;
                            for (var i = 4 ; i < l ; ++i) {
                                var t = targets[i] ;
                                this.targets[i - 4] = t ;
                                this.time += t.time ;
                            }
                        }
                    }
                }
            }
        }
       return this ;
    },
    contains:function(tw)
    {
        if (tw === undefined) return false ;
        
        if (this.a === tw) 
            return true ;
        
        if (this.b === tw) {
            return true;
        }
        if (this.c === tw) {
            return true;
        }
        if (this.d === tw) {
            return true;
        }
        if (this.targets !== undefined) {
            return this.checkForIndex(tw) ;
        }
        return false ;
    },
    checkForIndex:function(tw)
    {
        var l = this.targets.length , cond = false ;
        for (var i = 0 ; i < l ; i++) {
          cond = this.targets[i] === tw ;
          if(!!cond) return true ;
        } ;
        return false ;
    },
    getTweenAt:function(index)
    {
        if (index < 0) {
            return undefined ;
        }
        if (index == 0) {
            return this.a ;
        }
        if (index == 1) {
            return this.b ;
        }
        if (index == 2) {
            return this.c ;
        }
        if (index == 3) {
            return this.d ;
        }
        if (this.targets !== undefined) {
            if (index - 4 < this.targets.length) {
                return this.targets[index - 4] ;
            }
        }
        return undefined ;
    },
    getTweenIndex:function(tw)
    {
        if (tw === undefined) {
            return -1 ;
        }
        if (this.a === tw) {
            return 0 ;
        }
        if (this.b === tw) {
            return 1 ;
        }
        if (this.c === tw) {
            return 2 ;
        }
        if (this.d === tw) {
            return 3 ;
        }
        if (this.targets != null) {
            var i = this.getIndex(tw) ;
            if (i != -1) {
                return i + 4;
            }
        }
        return -1 ;
    },
    getIndex:function(tw){
        var l = this.targets.length , ind = -1 ;
        for(var i = 0 ; i < l ; i++)
            if(this.targets[i] === tw) return i ;
        return ind ;
    },
    internalUpdate:function(time)
    {
        var d = 0, ld = 0, lt = this.lastTime, l , i , t ;
        
        if ((time - lt) >= 0) {
            if (this.a  !== undefined) {
                if (lt <= (d += this.a.time) && ld <= time) {
                    this.a.update(time - ld) ;
                }
                ld = d ;
                if (this.b !== undefined) {
                    if (lt <= (d += this.b.time) && ld <= time) {
                        this.b.update(time - ld) ;
                    }
                    ld = d ;
                    if (this.c !== undefined) {
                        if (lt <= (d += this.c.time) && ld <= time) {
                            this.c.update(time - ld) ;
                        }
                        ld = d ;
                        if (this.d !== undefined) {
                            if (lt <= (d += this.d.time) && ld <= time) {
                                this.d.update(time - ld) ;
                            }
                            ld = d ;
                            if (this.targets !== undefined) {
                                l = this.targets.length ;
                                for (i = 0 ; i < l ; ++i) {
                                    t = this.targets[i];
                                    if (lt <= (d += t.time) && ld <= time) {
                                        t.update(time - ld) ;
                                    }
                                    ld = d ;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            d = this.time ;
            ld = d ;
            if (this.targets !== undefined) {
                for (i = this.targets.length - 1 ; i >= 0 ; --i) {
                    t = this.targets[i] ;
                    if (lt >= (d -= t.time) && ld >= time) {
                        t.update(time - d) ;
                    }
                    ld = d ;
                }
            }
            if (this.d !== undefined) {
                if (lt >= (d -= this.d.time) && ld >= time) {
                    this.d.update(time - d) ;
                }
                ld = d ;
            }
            if (this.c !== undefined) {
                if (lt >= (d -= this.c.time) && ld >= time) {
                    this.c.update(time - d) ;
                }
                ld = d ;
            }
            if (this.b !== undefined) {
                if (lt >= (d -= this.b.time) && ld >= time) {
                    this.b.update(time - d) ;
                }
                ld = d ;
            }
            if (this.a !== undefined) {
                if (lt >= (d -= this.a.time) && ld >= time) {
                    this.a.update(time - d) ;
                }
                ld = d ;
            }
        }
        this.lastTime = time ;
    },
    newInstance:function(){
        var targets = [] ;
        if (this.a !== undefined) {
            targets.push(this.a.clone()) ;
        }
        if (this.b !== undefined) {
            targets.push(this.b.clone()) ;
        }
        if (this.c !== undefined) {
            targets.push(this.c.clone()) ;
        }
        if (this.d !== undefined) {
            targets.push(this.d.clone()) ;
        }
        if (this.targets !== undefined) {
            var t = this.targets ;
            var l = t.length ;
            for (var i = 0 ; i < l ; ++i) {
                targets.push(t[i].clone()) ;
            }
        }
        return new SerialTween(targets, this.ticker, 0) ;
    },
    toString:function()
    {
        return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
    }
})));
// EVENTS
var TweenEvent = NS('TweenEvent', NS('org.libspark.betweenJS.events::TweenEvent', Event.$extend({
   __classvars__:{
      version:'0.0.1',
      PLAY:'play',
      STOP:'stop',
      UPDATE:'update',
      COMPLETE:'complete',
      toString:function()
      {
         return '[class TweenEvent]' ;
      }
   },
   __init__:function(type, data, tween)
   {
      this.$super(type, data) ;
      this.tween = tween ;
      return this ;
   },
   toString:function()
   {
      return '[ object ' + this.$class.ns + ' v.'+this.$class.version +']';
   }
}))) ;



BetweenJS.core() ;
