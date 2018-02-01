/*
 * BETWEENJS Tweening Engine for Javascript
 *
 * V 0.9.8
 *
 * Dependencies :
 * 	No dependencies
 *
 * Highly Inspired by Yossi (up to the name)
 * yossi(at)be-interactive.org
 *
 * authored under same license as the rest of Spark Project
 * MIT License
 *
 * by saz aka True
 * sazaam[(at)gmail.com]
 * 2011-2012
 *
 */
 "use strict";
(function(name, definition){

	if ('function' === typeof define){ // AMD
		define(definition) ;
	} else if ('undefined' !== typeof module && module.exports) { // Node.js
		module.exports = ('function' === typeof definition) ? definition() : definition ;
	} else {
		if(definition !== undefined) this[name] = ('function' === typeof definition) ? definition() : definition ;
	}

})('betweenjs', (function(){

	('undefined' === typeof Pkg && 'undefined' === typeof Pkg && (function(){
		// TYPE TO BE IMPLEMENTED HERE
        // throw new Error('Should use Type.js Dependancy') ;
	})()) ;

	return Pkg.write('org.libspark.betweenjs', function(path){
		var BetweenJSCore = {} ;
		var getNow = function(){ return ('performance' in window) && ('now' in window.performance) ? performance.now() : new Date().getTime() },
			getTimer = function(){ return getNow() - liveTime },
			concat = function(p){ return (p === undefined) ? [] : p },
			valueExists = function(o, val){ return !!o ? o[val] : undefined } ;

		var liveTime = getNow(),
			OFF_TIME = 0,
			TIME = NaN,
			SIM_EPSILON = 'EPSILON' in Number ? Number.EPSILON : .005,

			simulationTimestep = 1000 / 60,
			frameDelta = 0,
			lastFrameTimeMs = 0,
			fps = 60,
			lastFpsUpdate = 0,
			framesThisSecond = 0,
			numUpdateSteps = 0,
			minFrameDelay = 0,
			running = false,
			started = false,
			panic = false,

			cacheTimeout = {},
			units_reg = /(px|em|pc|pt|%)$/,
			relative_reg =/^\$/ ;


		(function () {
			// REQUEST / CANCEL ANIMATIONFRAME
			var lastTime = getTimer(), now, timeout, vendors = ['ms', 'moz', 'webkit', 'o'] ;

			if (!window.requestAnimationFrame)
				for (var x = 0; x < vendors.length; ++x) {
					window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
					window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
				}
			requestAnimationFrame = window.requestAnimationFrame || function (callback) {
				now = getNow() ;
				timeout = Math.max(0, simulationTimestep - (now - lastTime)) ;
				lastTime = now + timeout ;
				return setTimeout(function () {
					callback(now + timeout) ;
				}, timeout) ;
			};

			cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout ;
		})();

		// BETWEENJS CORE
		Pkg.write('core', function(path){

			var Destroyable =  Type.define({
				pkg:'utils::Destroyable',
				constructor:Destroyable = function Destroyable(){
					//
				},
				destroy:function(){

					for(var s in this){
						var p = this[s] ;
						if(p instanceof Destroyable) p.destroy() ;
						else if(typeof p == 'object'){
							if('destroy' in p && typeof p['destroy'] == 'function')
								p['destroy']() ;
						}
						delete this[s] ;
					}
				}
			}) ;

			var Traceable =  Type.define({
				pkg:'utils::Traceable',
				inherits:Destroyable,
				name:'',
				constructor:Traceable = function Traceable(){
					this.registerName() ;
				},
				registerName:function(time){
					var classname = this.constructor.slot.qualifiedclassname ;
					var cl = BetweenJS.$[classname] ;
					var n = classname +'_UID' ;
					if(!!!cl[n]){ cl[n] = 0}
					this.name = classname + '_' + cl[n] ++ ;

					return false ;
				}
			}) ;

			// CORE.LOOPS
			Pkg.write('loops', function(){


				var NOOP = function(){} ;

				var begin = NOOP,
					update = NOOP,
					draw = NOOP,
					end = NOOP ;

				var AnimationTicker = Type.define({
					pkg:'::AnimationTicker',
					domain:BetweenJSCore,
					statics:{
						ID:NaN,
						timestamp:NaN,
						loops:[],
						createAnimation:function(func){
							return new Animation(func) ;
						},
						func:function(timestamp){
							var loops = this.loops ;
							var l = loops.length ;
							for(var i = 0 ; i < l ; i++){
								var loop = loops[i] ;
								loop.func(timestamp) ;
								if(loop.die){
									this.detach(loop) ;
								}
							}
						},
						draw:function(timestamp){
							var loops = this.loops ;
							var l = loops.length ;
							for(var i = 0 ; i < l ; i++){
								var loop = loops[i] ;
								loop.draw(timestamp) ;
							}
						},
						innerFunc:function(timestamp){
							/////
							if (timestamp < lastFrameTimeMs + minFrameDelay) {
								return;
							}
							/////
							var anim = AnimationTicker ;
							TIME = timestamp ;
							var faketimestamp = timestamp - OFF_TIME ;
							anim.timestamp = faketimestamp * .001 ;
							// anim.func(faketimestamp) ;
							anim.ID = requestAnimationFrame(anim.innerFunc) ;


							/////
							frameDelta += timestamp - lastFrameTimeMs;
							lastFrameTimeMs = timestamp;

							begin(timestamp, frameDelta);

							if (timestamp > lastFpsUpdate + 1000) {
								fps = 0.25 * framesThisSecond + 0.75 * fps;
								lastFpsUpdate = timestamp;
								framesThisSecond = 0;
							}

							framesThisSecond++;
							numUpdateSteps = 0;

							while (frameDelta >= simulationTimestep) {
								// update(simulationTimestep);
								anim.func(faketimestamp) ;

								frameDelta -= simulationTimestep;
								if (++numUpdateSteps >= 240) {
									panic = true;
									break;
								}
							}

							anim.draw(frameDelta / simulationTimestep) ;

							end(fps, panic);
							panic = false;
						},
						start:function(){
							var anim = AnimationTicker ;
							anim.started = true ;
							anim.ID = requestAnimationFrame(function(now){
								OFF_TIME += isNaN(TIME) ? 0 : now - TIME ;
								anim.innerFunc(now) ;
							}) ;
						},
						stop:function(){
							var anim = AnimationTicker ;
							cancelAnimationFrame(this.ID) ;
							this.started = false ;
							delete this.ID ;
						},
						attach:function(loop){
							loop.index = this.loops.length ;
							this.loops.push(loop) ;
						},
						detach:function(loop){
							this.loops.splice(loop.index, 1) ;
						}
					}
				})

				var Animation = Type.define({
					pkg:'::Animation',
					domain:BetweenJSCore,
					index:undefined,
					func:undefined,
					dieNext:false,
					constructor:Animation = function Animation(func, draw){
						this.enable(func, draw) ;
					},
					enable:function(func, draw){
						this.func = func ;
						this.draw = draw ;
					},
					start:function(){
						AnimationTicker.attach(this) ;
						return this ;
					},
					stop:function(){
						AnimationTicker.detach(this) ;
						return this ;
					},
					destroy:function(){
						delete this.func ;
						return undefined ;
					}
				})
			}) ;

			// CORE.TICKERS
			Pkg.write('tickers', function(path){
				// TICKERLISTENER
				var TickerListener = Type.define({
					pkg:'::TickerListener',
					inherits:Traceable,
					prevListener:undefined,
					nextListener:undefined,
					constructor:TickerListener = function TickerListener(){

					},
					tick:function(time){
						return false ;
					}
				}) ;
				// ENTERFRAMETICKER
				// ENTERFRAMETICKER
				var EnterFrameTicker = Type.define({
					pkg:'::EnterFrameTicker',
					domain:BetweenJSCore,
					statics:{
						first:undefined,
						numListeners:0,
						coreListenersMax: 0,
						tickerListenerPaddings:undefined,
						time:undefined,
						initialize:function initialize(domain){

							var AnimationTicker = BetweenJSCore.AnimationTicker ;

							AnimationTicker.start() ;

							var prevListener = undefined,
								max = this.coreListenersMax = 8 ;

							this.tickerListenerPaddings = new Array(max) ;
							this.numListeners = 0 ;
							this.drawables = [] ;

							for (var i = 0; i < max; ++i) {
								var listener = new TickerListener() ;
								if (prevListener !== undefined) {
									prevListener.nextListener = listener ;
									listener.prevListener = prevListener ;
								}
								this.tickerListenerPaddings[i] = listener ;
								prevListener = listener ;
							}
						},
						addTickerListener:function(listener){
							if(!!listener.nextListener || !!listener.prevListener) {
								return ;
							}
							if (!!this.first) {
								if (!!this.first.prevListener) {
									this.first.prevListener.nextListener = listener ;
									listener.prevListener = this.first.prevListener ;
								}
								listener.nextListener = this.first ;
								this.first.prevListener = listener ;
							}
							this.first = listener ;
							++ this.numListeners ;
						},
						removeTickerListener:function(listener){
							var l = this.first ;
							while (!!l) {
								if (l == listener) {
									if (!!l.prevListener) {
										l.prevListener.nextListener = l.nextListener ;
										l.nextListener = undefined ;
									}
									else {
										this.first = l.nextListener;
									}
									if (!!l.nextListener) {
										l.nextListener.prevListener = l.prevListener ;
										l.prevListener = undefined ;
									}
									--this.numListeners ;
								}
								l = l.nextListener ;
							}
						},
						start:function(){
							var AnimationTicker = BetweenJS.$.AnimationTicker ;
							var Animation = BetweenJS.$.Animation ;
							var EFT = this ;

							EFT.time = AnimationTicker.timestamp ;
							var a = new Animation(
								function(timestamp){
									EFT.update(AnimationTicker.timestamp) ;
								},
								function(timestamp){
									EFT.draw(AnimationTicker.timestamp) ;
								}
							) ;

							this.animation = a.start() ;
							this.started = true ;
						},
						stop:function(){
							this.animation.stop() ;
							this.started = false ;
						},
						draw:function(ts){
							var drawables = this.drawables ;
							var l = drawables.length ;
							for(var i = 0 ; i < l ; i ++){
								var drawable = drawables[i] ;

								drawable.draw(ts) ;
							}
						},
						update:function(time){

							var min = 0 ;
							var EFT = this ;
							var total = EFT.coreListenersMax - 2 ;
							var t = EFT.time = time ;

							var n = total - (EFT.numListeners % total) ;
							var listener = EFT.tickerListenerPaddings[0] ;
							var l = EFT.tickerListenerPaddings[n] ;
							var ll ;
							var drawables = EFT.drawables = [] ;

							if (!!(l.nextListener = EFT.first)) {
								EFT.first.prevListener = l ;
							}

							while (!!listener.nextListener) {
								var i = 0 ;
								while (i < total) {
									listener = listener.nextListener ;
									var AbstractTween = BetweenJS.$.AbstractTween ;
									if(listener instanceof AbstractTween) drawables.push(listener) ;
									if(listener instanceof AbstractTween && !!listener.startTime) {
										t = t - listener.startTime ;
										min ++ ;
									}
									// THIS IS THE LISTENER REMOVAL CODE !!!!!!!!!!!!
									if (listener.tick(t)) {
										if (!!listener.prevListener) {
											listener.prevListener.nextListener = listener.nextListener ;
										}
										if (!!listener.nextListener) {
											listener.nextListener.prevListener = listener.prevListener ;
										}
										ll = listener.prevListener ;
										listener.nextListener = undefined ;
										listener.prevListener = undefined ;
										listener = ll ;
										--this.numListeners ;
									}
									i++ ;
								}
							}

							if(min == 0){
								this.stop() ;
							}

							if (!!(this.first = l.nextListener))
								this.first.prevListener = undefined ;

							l.nextListener = this.tickerListenerPaddings[n + 1] ;
						}
					}

				}) ;
			})

			// CORE.TWEENS
			Pkg.write('tweens', function(path){
				// FACTORY
				var TweenFactory = BetweenJSCore.TweenFactory = {
					optionDefaults:function(options){
						if(!!!options['ease']) options['ease'] = Expo.easeOut ;
						if(!!!options['time']) options['time'] = .75 ;
					},
					detectTweenTypeFromOptions:function(options){
						var method = '';

						this.optionDefaults(options) ;
						switch(true){
							case 'actions' in options :
								method = 'createAction' ;
								break ;
							case 'decorators' in options :
								method = 'createDecorator' ;
								break ;
							case 'groups' in options :
								method = 'createGroup' ;
								break ;
							break ;
							default :
								method = 'createBasic' ;
							break ;
						}
						return this[method](options) ;
					},
					create:function(options){
						return this.detectTweenTypeFromOptions(options) ;
					},
					createBasic:function(options){

						var tw = new Tween() ;

						return tw
							.setHandlers(options)
							.assignUpdater(options)
							.prepare(options) ;
					},
					createAction:function(options){
						var tw ;
						var actions = options.actions ;
						var t ;
						switch(true){
							case !!(t = actions.addChild) :
								tw = new (BetweenJS.$.AddChildAction)() ;
							break ;
							case !!(t = actions.removeFromParent) :
								tw = new (BetweenJS.$.RemoveFromParentAction)() ;
							break ;
							case !!(t = actions.func) :
								tw = new (BetweenJS.$.FunctionAction)() ;
							break ;
							case !!(t = actions.timeout) :
								tw = new (BetweenJS.$.TimeoutAction)() ;
							break ;
						}

						return tw
							.enable(t)
							.setHandlers(options)
							.prepare(options) ;
					},
					createGroup:function(options){
						var tw ;
						var groups = options.groups ;
						var t ;
						switch(true){
							case !!(t = groups.parallel) :
								tw = new (BetweenJS.$.ParallelTween)() ;
							break ;
							case !!(t = groups.serial) :
								tw = new (BetweenJS.$.SerialTween)() ;
							break ;
						}

						return tw
							.enable(t)
							.setHandlers(options)
							.prepare(options) ;
					},
					createDecorator:function(options){
						var tw ;
						var mods = options.decorators ;
						var t ;

						switch(true){
							case !!(t = mods.slice) :
								tw = new (BetweenJS.$.SlicedTween)() ;
							break ;
							case !!(t = mods.scale) :
								tw = new (BetweenJS.$.ScaledTween)() ;
							break ;
							case !!(t = mods.reverse) :
								tw = new (BetweenJS.$.ReversedTween)() ;
							break ;
							case !!(t = mods.repeat) :
								tw = new (BetweenJS.$.RepeatedTween)() ;
							break ;
							case !!(t = mods.delay) :
								tw = new (BetweenJS.$.DelayedTween)() ;
							break ;
						}

						return tw
							.enable(t)
							.setHandlers(options)
							.prepare(options) ;
					}
				}
				// TWEENS
				var AbstractTween = Type.define({
					pkg:'::AbstractTween',
					domain:BetweenJSCore,
					inherits:Traceable,
					isPlaying:false,
					stopOnComplete:true,
					position:NaN,
					lastPosition:0,
					time:NaN,
					startTime:NaN,
					updater:undefined,
					isPlaying:false,
					stopOnComplete:true,
					constructor:AbstractTween = function AbstractTween(){
						AbstractTween.base.call(this) ;
						this.isPlaying = false ;
					},
					enable:function(options){
						this.stopOnComplete = options['stopOnComplete'] || true ;
						this.position = options['initposition'] || 0 ;

						return this ;
					},
					///////////
					//// TWEEN METHODS
					///////////
					setHandlers:function(options){//		EVENTS
						this.copyHandlersFrom(options) ;
						return this ;
					},
					fire:function(type){
						type = type.replace(/^\w/, function($1){return $1.toUpperCase()}) ;
						var f = this['on'+type] ;
						var p = this['on'+type+'Params'] || [] ;
						if (!!f) f.apply(this, [].concat(p)) ;
						return this;
					},
					assignUpdater:function(options){//		SETTINGS
						var updater = BetweenJS.$.UpdaterFactory.create(options) ;
						this.setUpdater(updater) ;
						this.time = updater.time ;
						return this ;
					},
					/*

						TWEEN & UPDATER SETTINGS

					*/
					prepare:function(options){
						// HERE I KNOW TIME FROM UPDATER & BULKLOADER ALREADY
						this.setTime(this.updater.time) ;
						return this ;
					},
					setUpdater:function(updater){
						this.updater = updater ;
						return this ;
					},
					setPosition:function(position){
						if (position < 0) position = 0 ;
						if (position > this.time) position = this.time ;

						this.position = position ;
						return this ;
					},
					setStartTime:function(position){
						var EFT = BetweenJS.$.EnterFrameTicker ;
						this.startTime = EFT.time - position ;
						return this ;
					},
					setTime:function(time){
						this.time = time ;
						return this ;
					},
					/*

						TWEEN LAUNCH SETUP

					*/
					register:function(){
						var EFT = BetweenJS.$.EnterFrameTicker ;
						EFT.addTickerListener(this) ;
						if(!EFT.started) EFT.start() ;
						return this ;
					},
					unregister:function(){
						BetweenJS.$.EnterFrameTicker.removeTickerListener(this) ;
						return this ;
					},
					setup:function(){
						this.isPlaying = true ;
						var p = this.position ;
						p = isNaN(p) ? 0 : p >= this.time ? 0 : p ;

						this
							.register()
							.seek(p) ;
						return this ;
					},
					teardown:function(){
						this.isPlaying = false ;
						return this ;
					},
					/*

						TIMELINE SETTINGS

					*/
					seek:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						this.setPosition(position) ;
						this.setStartTime(position) ;

						return this ;
					},
					toggle:function(){
						return this.isPlaying ? this.stop() : this.play() ;
					},
					start:function(){
						return this.rewind().play() ;
					},
					rewind:function(position){
						return this.seek(0) ;
					},
					gotoAndPlay:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						if(!this.isPlaying)
							return this.seek(position).play() ;
						else
							this.tick(this.position) ;
						return this ;
					},
					gotoAndStop:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						return this.isPlaying ?
							this.stop().update(position) :
							this.update(position) ;
					},
					play:function(){

						if (!this.isPlaying) {
							this.setup()
								.fire('play') ;

						}
						return this ;
					},
					stop:function(){
						if (this.isPlaying) {
							this.teardown()
								.fire('stop') ;
						}
						return this ;
					},
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE
					update:function(position){
						this.lastPosition = this.position ;
						this.setPosition(position) ;
						this.internalUpdate(this.position) ;

						return this ;
					},
					draw:function(){
						this.internalDraw() ;
					},
					internalDraw:function(){
						this.updater.draw() ;
					},
					//////// END CAUTION
					//////// END CAUTION
					//////// END CAUTION
					tick:function(position){

						if (!this.isPlaying) return true ;
						this.update(position) ;
						this.fire('update') ;

						if (this.isPlaying) {

							if (this.position >= this.time) {
								if (!this.stopOnComplete) {
									this.seek(0) ;
								} else {
									this.draw() ;
									this.setPosition(this.time)
										.fire('complete')
											.stop() ;
									return true ;

								}
							}
							return false ;
						}
						return true ;
					},
					internalUpdate:function(position){
						this.updater.update(position) ;
					},
					clone:function(){
						var instance = newInstance() ;
						if (instance !== undefined) {
							instance.copyFrom(this) ;
						}
						return instance ;
					},
					newInstance:function(){
					   return new AbstractTween() ;
					},
					copyFrom:function(source){
						this.time = source.time ;
						this.ease = source.ease ;
						this.stopOnComplete = source.stopOnComplete ;
						this.willTriggerFlags = source.willTriggerFlags ;
						this.copyHandlersFrom(source);
					},
					copyHandlersFrom:function(source){

						var list = [
							'start',
							'play',
							'stop',
							'update',
							'draw',
							'complete'
						]
						var l = list.length ;

						for(var i = 0 ; i < l ; i ++){
							var el = list[i] ;
							var listener = 'on'+ (el.replace(/^(.)/, function($1){return $1.toUpperCase()})) ;
							var listenerParams = listener + 'Params' ;
							this[listener] = source[listener] ;
							this[listenerParams] = source[listenerParams] ;
						}
					},
					destroy:function(){

						if(this.isPlaying){
							this.stop() ;
						}

						AbstractTween.factory.destroy.call(this) ;
					}
				}) ;
				// SUBCLASSES
				var Tween = Type.define({
					pkg:'::Tween',
					domain:BetweenJSCore,
					inherits:AbstractTween,
					constructor:Tween = function Tween(){
						Tween.base.call(this) ;
					},
					newInstance:function(){
						return new Tween() ;
					},
					copyFrom:function(source){
						Tween.factory.copyFrom.apply(this, [source]) ;
						this.updater = source.updater.clone() ;
					}
				}) ;

				// ACTIONS
				Pkg.write('actions', function(path){
					var AbstractActionTween = Type.define({
						pkg:'::AbstractActionTween',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						statics:{
							safeTime:SIM_EPSILON * 2
						},
						constructor:AbstractActionTween = function AbstractActionTween(){
							AbstractActionTween.base.call(this) ;
						},
						enable:function(options){
							AbstractActionTween.factory.enable.apply(this, [options]) ;

							return this ;
						},
						prepare:function(){
							this.time = AbstractActionTween.safeTime ;
							return this ;
						},
						internalUpdate:function(position){
							if (this.lastPosition < this.time && position >= this.time) {
								this.action() ;
							}else if(this.lastPosition >= this.time && position < this.time){
								this.rollback() ;
							}
						},
						internalDraw:function(){},
						action:function(){},
						rollback:function(){}
					}) ;
					// SUBCLASSES
					var FunctionAction = Type.define({
						pkg:'::FunctionAction',
						domain:BetweenJSCore,
						inherits:AbstractActionTween,
						func:undefined,
						params:undefined,
						useRollback:false,
						rollbackFunc:undefined,
						rollbackParams:undefined,
						constructor:FunctionAction = function FunctionAction(){
							FunctionAction.base.call(this) ;
						},
						enable:function(options){
							FunctionAction.factory.enable.apply(this, [options]) ;

							this.func = options['closure'] ;
							this.params = options['params'] ;

							if (!!options['useRollback']) {
								if (!!options['rollbackClosure']) {
									this.rollbackFunc = options['rollbackClosure'] ;
									this.rollbackParams = options['rollbackParams'] || this.params ;
								} else {
									this.rollbackFunc = this.func ;
									this.rollbackParams = options['rollbackParams'] || this.params ;
								}
							}

							return this ;
						},
						action:function(){
							if (!!this.func) this.func.apply(this, [].concat(this.params)) ;
						},
						rollback:function(){
							if (!!this.rollbackFunc) this.rollbackFunc.apply(this, [].concat(this.rollbackParams)) ;
						}
					}) ;
					var TimeoutAction = Type.define({
						pkg:'::TimeoutAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
						duration:0,
						func:undefined,
						params:undefined,
						time:0,
						constructor:TimeoutAction = function TimeoutAction(){
							TimeoutAction.base.call(this) ;
						},
						enable:function(options){
							TimeoutAction.factory.enable.apply(this, [options]) ;
							var d = options['duration'] ;
							this.time = (!!d && d != 0 ? d : AbstractActionTween.safeTime) ;

							return this ;
						},
						prepare:function(){
							return this ;
						},
						clear:function(){
							return this.stop() ;
						}
					}) ;
					var AddChildAction = Type.define({
						pkg:'::AddChildAction',
						domain:BetweenJSCore,
						inherits:AbstractActionTween,
						target:undefined,
						parent:undefined,
						constructor:AddChildAction = function AddChildAction(){
							AddChildAction.base.call(this) ;
						},
						enable:function(options){
							AddChildAction.factory.enable.apply(this, [options]) ;

							this.target = options['target'] ;
							this.parent = options['parent'] ;

							return this ;
						},
						action:function(){
							if (!!this.target && !!this.parent && this.target.parentNode !== this.parent) {
								this.parent.appendChild(this.target) ;
							}
						},
						rollback:function(){
							if (!!this.target && !!this.parent && this.target.parentNode === this.parent) {
								this.parent.removeChild(this.target) ;
							}
						}
					}) ;
					var RemoveFromParentAction = Type.define({
						pkg:'::RemoveFromParentAction',
						domain:BetweenJSCore,
						inherits:AbstractActionTween,
						target:undefined,
						constructor:RemoveFromParentAction = function RemoveFromParentAction(){
							RemoveFromParentAction.base.call(this) ;
						},
						enable:function(options){
							RemoveFromParentAction.factory.enable.apply(this, [options]) ;

							this.target = options['target'] ;

							return this ;
						},
						action:function(){
							if (!!this.target && this.target.parentNode !== null) {
								this.parent = this.target.parentNode ;
								this.parent.removeChild(this.target) ;
							}
						},
						rollback:function(){
							if (!!this.target && !!this.parent) {
								this.parent.appendChild(this.target) ;
								this.parent = undefined ;
							}
						}
					}) ;

				}) ;
				// DECORATORS
				Pkg.write('decorators', function(path){
					var TweenDecorator = Type.define({
						pkg:'::TweenDecorator',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						baseTween:undefined,
						constructor:TweenDecorator = function TweenDecorator(){
							TweenDecorator.base.call(this) ;
						},
						enable:function(options){
							TweenDecorator.factory.enable.apply(this, [options]) ;
							this.baseTween = options['baseTween'] ;

							return this ;
						},
						prepare:function(options){
							this.time = this.baseTween.time ;

							return this ;
						},
						play:function(){
							if (!this.isPlaying) {
								this.baseTween.fire('play') ;
								TweenDecorator.factory.play.call(this) ;
							}
							return this ;
						},
						stop:function(){
							if (this.isPlaying === true) {
								TweenDecorator.factory.stop.call(this) ;
								this.baseTween.fire('stop') ;
							}
							return this ;
						},
						internalUpdate:function(time){
							this.baseTween.update(time) ;
						},
						internalDraw:function(){
							this.baseTween.draw() ;
						}
					}) ;
					// SUBCLASSES
					var SlicedTween = Type.define({
						pkg:'::SlicedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						begin:0,
						end:1,
						constructor:SlicedTween = function SlicedTween(){
							SlicedTween.base.call(this) ;
						},
						enable:function(options){
							SlicedTween.factory.enable.apply(this, [options]) ;
							this.end = options['end'] || 1 ;
							this.begin = options['begin'] || 0 ;

							return this ;
						},
						prepare:function(){
							this.time = this.end - this.begin ;
							if(this.end - this.begin == 0) this.instantUpdate = true ;

							return this ;
						},
						internalUpdate:function(time){

							if(this.instantUpdate === true){
								time = 0 ;
								this.baseTween.update(this.begin) ;
							}

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
						newInstance:function(){
							return new SlicedTween(this.baseTween.clone(), this.begin, this.end) ;
						}
					}) ;
					var ScaledTween = Type.define({
						pkg:'::ScaledTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						scale:1,
						constructor:ScaledTween = function ScaledTween(){
							ScaledTween.base.call(this) ;
						},
						enable:function(options){
							ScaledTween.factory.enable.apply(this, [options]) ;
							this.scale = options['scale'] || 1 ;

							return this ;
						},
						prepare:function(){
							this.time = this.scale * this.baseTween.time ;

							return this ;
						},
						internalUpdate:function(position){
							this.baseTween.update(position / this.scale) ;
						},
						newInstance:function(){
							return new ScaledTween(this.baseTween.clone(), this.scale) ;
						}
					}) ;
					var ReversedTween = Type.define({
						pkg:'::ReversedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						constructor:ReversedTween = function ReversedTween(){
							ReversedTween.base.call(this) ;
						},
						enable:function(options){
							ReversedTween.factory.enable.apply(this, [options]) ;

							return this ;
						},
						prepare:function(){
							this.time = this.baseTween.time ;

							return this ;
						},
						internalUpdate:function(position){
							this.baseTween.update(this.baseTween.time - position) ;
						},
						newInstance:function(){
							return new ReversedTween(this.baseTween.clone(), 0) ;
						}
					}) ;
					var RepeatedTween = Type.define({
						pkg:'::RepeatedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						repeatCount:2,
						constructor:RepeatedTween = function RepeatedTween(){
						   RepeatedTween.base.call(this) ;
						},
						enable:function(options){

							RepeatedTween.factory.enable.apply(this, [options]) ;

							this.repeatCount = options['repeatCount'] || 2 ;
							this.basetime = this.baseTween.time ;

							return this ;
						},
						prepare:function(){
							this.time = this.basetime * this.repeatCount ;

							return this ;
						},
						internalUpdate:function(position){
						   if (position >= 0) {
							   position -= position < this.time ? this.basetime * parseInt(position / this.basetime) : this.time - this.basetime ;
						   }
						   this.baseTween.update(position) ;
						},
						newInstance:function(){
							return new RepeatedTween(this.baseTween.clone(), this.repeatCount) ;
						}
					}) ;
					var DelayedTween = Type.define({
						pkg:'::DelayedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						basetime:undefined,
						delay:.5,
						postDelay:.5,
						constructor:DelayedTween = function DelayedTween(){
						   DelayedTween.base.call(this) ;
						},
						enable:function(options){
							DelayedTween.factory.enable.apply(this, [options]) ;

							this.delay = options['delay'] || 0 ;
							this.postDelay = options['postDelay'] || 0 ;

							return this ;
						},
						prepare:function(){

							this.time = this.delay + this.postDelay + this.baseTween.time ;

							return this ;
						},
						internalUpdate:function(position){
							this.baseTween.update(position - this.delay) ;
						},
						newInstance:function(){
							return new DelayedTween(this.baseTween.clone(), this.delay, this.postDelay) ;
						}
					}) ;

				}) ;
				// GROUPS
				Pkg.write('groups', function(path){
					// PARALLELTWEEN
					var ParallelTween = Type.define({
						pkg:'::ParallelTween',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						a:undefined,
						b:undefined,
						c:undefined,
						d:undefined,
						targets:undefined,
						tweens:undefined,
						constructor:ParallelTween = function ParallelTween(){
							ParallelTween.base.call(this) ;
						},
						enable:function(options){

							ParallelTween.factory.enable.apply(this, [options]) ;
							this.tweens = options['tweens'] ;

							return this ;
						},
						prepare:function(){
							var targets = this.tweens ;
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
						contains:function(tw){
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
						checkForIndex:function(tw){
							var l = this.targets.length , cond = false ;
							for (var i = 0 ; i < l ; i++) {
							  cond = this.targets[i] === tw ;
							  if(!!cond) return true ;
							} ;
							return false ;
						},
						getTweenAt:function(index){
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
						getTweenIndex:function(tw){
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
						internalUpdate:function(time){
							if (!!this.a) {
								this.a.update(time) ;
								if (!!this.b) {
									this.b.update(time) ;
									if (!!this.c) {
										this.c.update(time) ;
										if (!!this.d) {
											this.d.update(time) ;
											if (!!this.targets) {
												var targets = this.targets ;
												var l = targets.length ;
												for (var i = 0 ; i < l ; ++i){
													var t = targets[i] ;
													t.update(time) ;
												}
											}
										}
									}
								}
							}
						},
						internalDraw:function(){
							if (!!this.a) {
								this.a.draw() ;
								if (!!this.b) {
									this.b.draw() ;
									if (!!this.c) {
										this.c.draw() ;
										if (!!this.d) {
											this.d.draw() ;
											if (!!this.targets) {
												var targets = this.targets ;
												var l = targets.length ;
												for (var i = 0 ; i < l ; ++i){
													var t = targets[i] ;
													t.draw() ;
												}
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
							return new ParallelTween(targets, 0) ;
						}
					}) ;
					// SEIALTWEEN
					var SerialTween = Type.define({
						pkg:'::SerialTween',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						a:undefined,
						b:undefined,
						c:undefined,
						d:undefined,
						targets:undefined,
						tweens:undefined,
						lastPosition:0,
						constructor:SerialTween = function SerialTween(){
							SerialTween.base.call(this) ;
						},
						enable:function(options){

							SerialTween.factory.enable.apply(this, [options]) ;
							this.tweens = options['tweens'] ;

							return this ;
						},
						prepare:function(){
							var targets = this.tweens ;
							var l = targets.length ;
							var t ;
							this.time = 0 ;

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
													t = targets[i] ;
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
						contains:function(tw){
							if (tw === undefined)
								return false ;
							if (this.a === tw)
								return true ;
							if (this.b === tw)
								return true;
							if (this.c === tw)
								return true;
							if (this.d === tw)
								return true;
							if (this.targets !== undefined)
								return this.checkForIndex(tw) ;
							return false ;
						},
						checkForIndex:function(tw){
							var l = this.targets.length , cond = false ;
							for (var i = 0 ; i < l ; i++) {
							  cond = this.targets[i] === tw ;
							  if(!!cond) return true ;
							} ;
							return false ;
						},
						getTweenAt:function(index){
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
							if (!!this.targets) {
								if (index - 4 < this.targets.length) {
									return this.targets[index - 4] ;
								}
							}
							return undefined ;
						},
						getTweenIndex:function(tw){
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
							if (!!this.targets) {
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
						checkForEpsilon:function(position){
							return (position > 0 && position < SIM_EPSILON) ? 0 : position ;
						},
						internalUpdate:function(position){

							var d = 0, ld = 0, lt = this.lastPosition, l , i , t ;
							var cur ;
							if ((position - lt) >= 0) {
								if (!!this.a) {
									if (lt <= (d += this.a.time) && ld <= position) {
										this.a.update(this.checkForEpsilon(position - ld)) ;
										cur = this.a ;
									}
									ld = d ;

									if (!!this.b) {
										if (lt <= (d += this.b.time) && ld <= position) {
											this.b.update(this.checkForEpsilon(position - ld)) ;
											cur = this.b ;
										}
										ld = d ;

										if (!!this.c) {
											if (lt <= (d += this.c.time) && ld <= position) {
												this.c.update(this.checkForEpsilon(position - ld)) ;
												cur = this.c ;
											}
											ld = d ;

											if (!!this.d) {
												if (lt <= (d += this.d.time) && ld <= position) {
													this.d.update(this.checkForEpsilon(position - ld)) ;
													cur = this.d ;
												}
												ld = d ;

												if (!!this.targets) {
													l = this.targets.length ;
													for (i = 0 ; i < l ; ++i) {
														t = this.targets[i] ;
														if (lt <= (d += t.time) && ld <= position) {
															t.update(this.checkForEpsilon(position - ld)) ;
															cur = t ;
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
								if (!!this.targets) {
									for (i = this.targets.length - 1 ; i >= 0 ; --i) {
										t = this.targets[i] ;
										if (lt >= (d -= t.time) && ld >= position) {
											t.update(this.checkForEpsilon(position - d)) ;
											cur = t ;
										}
										ld = d ;
									}
								}
								if (!!this.d) {
									if (lt >= (d -= this.d.time) && ld >= position) {
										this.d.update(this.checkForEpsilon(position - d)) ;
										cur = this.d ;
									}
									ld = d ;
								}
								if (!!this.c) {
									if (lt >= (d -= this.c.time) && ld >= position) {
										this.c.update(this.checkForEpsilon(position - d)) ;
										cur = this.c ;
									}
									ld = d ;
								}
								if (!!this.b) {
									if (lt >= (d -= this.b.time) && ld >= position) {
										this.b.update(this.checkForEpsilon(position - d)) ;
										cur = this.b ;
									}
									ld = d ;
								}
								if (!!this.a) {
									if (lt >= (d -= this.a.time) && ld >= position) {
										this.a.update(this.checkForEpsilon(position - d)) ;
										cur = this.a ;
									}
									ld = d ;
								}
							}
							this.drawable = cur ;
						},
						internalDraw:function(position){
							if(!!this.drawable) this.drawable.draw(position) ;
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
							return new SerialTween(targets, 0) ;
						}
					}) ;
				}) ;

			}) ;

			// CORE.UPDATERS
			Pkg.write('updaters', function(path){
				// FACTORY
				var UpdaterFactory = BetweenJSCore.UpdaterFactory = {
					poolIndex:0,
					mapPool:[],
					listPool:[],
					REQUIRED:'__REQUIRED__',
					getActiveUpdater:function(map, updaters, options){
						var upstr = 'org.libspark.betweenjs.core.updaters::Updater' ;
						var updater = map[upstr] ;

						if (!!!updater) {

							updater = new (Pkg.definition(upstr))() ;

							if (!!updaters) updaters.push(updater) ;
							map[upstr] = updater ;
						}

						return updater ;
					},
					treatCuePoints:function(cp){
						var l = cp.length ;
						var nu = {} ;
						for(var i = 0 ; i < l ; i ++){
							var cpVec = cp[i] ;
							for(var s in cpVec){
								if(!(s in nu)){
									nu[s] = [] ;
								}
								nu[s][i] = cp[i][s] ;
							}
						}
						return nu ;
					},
					checkCustomMapper:function(updater, typename, type, name){
						var UpdaterFactory = BetweenJS.$.UpdaterFactory ;
						var CustomMappers = BetweenJS.$.PropertyMapper.CustomMappers ;
						var val = type[name] ;
						var i, l, s, j, ll, custom, pattern ;

						var customs = CustomMappers ;
						l = customs.length ;


						for(i = 0 ; i < l ; i ++){
							custom = customs[i] ;
							pattern = custom.pattern ;

							if(pattern.test(name)){
								var tt = type[name] ;
								delete type[name] ;
								s = custom.check(updater, typename, type, name, tt) ;
								name = s.name ;
								type[name] = s.value ;
								if(s.block) break ;

							}
						}
						return name ;
					},
					isofy:function(updater, props){
						var UpdaterFactory = BetweenJS.$.UpdaterFactory ;
						var to = props['to'] ;
						var fr = props['from'] ;
						var cp = props['cuepoints'] ;

						var s, r ;

						var safeWriteIn = function(s, o){
							if(!(s in o)) o[s] = UpdaterFactory.REQUIRED ;
						}

						// cuepoints no need REQUIREDSTUFF to be written bur needs to write
						if(!!cp){
							for(s in cp){
								s = UpdaterFactory.checkCustomMapper(updater, 'cuepoints', cp, s) ;
								safeWriteIn(s, to) ;
								safeWriteIn(s, fr) ;
							}
						}

						// Write back SOURCE from DEST
						for(s in to){
							s = UpdaterFactory.checkCustomMapper(updater, 'to', to, s) ;
							safeWriteIn(s, fr) ;
						}

						// Write back DEST from SOURCE
						for(s in fr){
							s = UpdaterFactory.checkCustomMapper(updater, 'fr', fr, s) ;
							safeWriteIn(s, to) ;
						}

						if(!props['from']) props['from'] = fr ;
						if(!props['to']) props['to'] = to ;

						return props ;
					},
					treat:function(map, updaters, options){
						var updater = UpdaterFactory.getActiveUpdater(map, updaters, options) ;

						updater.cache = {} ;

						var parent, child ;

						var desc = {
							'to':options['to'] || {},
							'from':options['from'] || {},
							'cuepoints':options['cuepoints']
						}

						var ease = options['ease'] ;
						var time = options['time'] ;
						var target = options['target'] ;

						desc = this.isofy(updater, desc) ;


						updater.isPhysical = ease instanceof Physical ;
						updater.target = target ;
						updater.time = time ;
						updater.ease = ease ;
						updater.userData = desc ;



						for(var type in desc){

							var o = desc[type] ;

							if(!!!o) continue ;

							var target = target,
								source = desc['from'],
								dest = desc['to'],
								cuepoints = desc['cuepoints'],
								ease = ease,
								time = time,
								value, cp,
								action ;

							switch(type){
								case 'to' :			// TO
								case 'from' :		// FROM
									action = type == 'to' ? 'setDestinationValue' : 'setSourceValue' ;

									for (var name in o) {

										value = o[name] ;

										if(value == UpdaterFactory.REQUIRED){
											updater[action](name, UpdaterFactory.REQUIRED) ;
										}else if (typeof value == "number") {
											updater[action](name, parseFloat(value)) ;
										} else{

											if (type == 'to') {
												var cps = desc['cuepoints'] ;

												if(!!cps && name in cps){
													cp = this.treatCuePoints(cps[name]) ;
													delete cps[name] ;
												}

												var childOptions = {
													'target' : updater.getIn(name),
													'to' : desc['to'][name],
													'from' : desc['from'][name],
													'cuepoints' : cp,
													'ease' : ease,
													'time' : time
												}

												child = UpdaterFactory.make(childOptions) ;
												var proxy = new UpdaterProxy(updater, child, name) ;
												updaters.push(proxy) ;
											}
										}
									}
								break ;
								default : // type is Cuepoints
									action = 'addCuePoint' ;
									for (var name in o) {
										value = cuepoints[name] ;
										if (typeof value == 'number') {
											value = [value] ;
										}
										if (value.constructor == Array) {
											cp = value ;
											var l = cp.length ;
											for (var i = 0 ; i < l ; ++i) {
												updater[action](name, cp[i]) ;
											}
										}
									}
								break ;
							}
						}

						return desc ;
					},
					make:function(options){

						var BulkUpdater = BetweenJS.$.BulkUpdater,
							map, updaters, updater, l, source, dest, cuepoints,
							r = this.registerUpdaters(map, updaters) ;

						map = r.map,
						updaters = r.updaters ;

						this.treat(map, updaters, options) ;

						l = updaters.length ;

						switch(l){
							case 0: break;
							case 1:
								updater = updaters[0] ;
								break;
							default:
								updater = new BulkUpdater(options['target'], updaters) ;
								break;
						}

						r = this.unregisterUpdaters(map, updaters) ;
						return updater ;
					},
					create:function(options){
						var updater = this.make(options) ;

						if(updater.isPhysical) updater.resolve() ;

						return updater ;
					},
					registerUpdaters:function(map,updaters){
						if (this.poolIndex > 0) {
							--this.poolIndex ;
							map = this.mapPool[this.poolIndex] ;
							updaters = this.listPool[this.poolIndex] ;
						} else {
							map = {} ;
							updaters = [] ;
						}
						return {map:map, updaters:updaters} ;
					},
					unregisterUpdaters:function(map, updaters){
						for (var p in map) delete map[p] ;
						updaters.length = 0 ;
						this.mapPool[this.poolIndex] = map ;
						this.listPool[this.poolIndex] = updaters ;
						++ this.poolIndex ;
						return ;
					}
				}

				// UPDATERS
				var Updater = Type.define({
					pkg:'::Updater',
					domain:BetweenJSCore,
					inherits:Traceable,
					target:undefined,
					source:undefined,
					destination:undefined,
					relativeMap:undefined,
					cuepoints:undefined,
					ease:undefined,
					duration:undefined,
					maxDuration:0.0,
					physicalTime:0.0,
					position:0.0,
					isResolved:false,
					units:{},
					constructor:Updater = function Updater(){
						Updater.base.call(this) ;

						this.reset() ;
					},
					reset:function(){
						this.isResolved = false ;
						this.source = {} ;
						this.destination = {} ;
						this.relativeMap = {} ;
						this.cuepoints = {} ;
						this.duration = {} ;
						this.position = 0 ;
						this.maxDuration = 0.0 ;
					},
					setFactor:function(position){

						var factor = 0.0 ;
						if(this.isPhysical){
							if(position > factor){
								factor = position / this.time ;
								factor = Math.round(factor * 10000) / 10000 ;
							}
						}else{
							if(position > factor){
								factor = position < this.time ? this.ease.calculate(position, 0.0, 1.0, this.time) : 1.0 ;
							}
						}
						if(factor > 1) factor = 1.0 ;
						this.factor = factor ;
						return this ;
					},
					setTime:function(time){
						this.time = time ;
					},
					setPosition:function(position){
						this.position = Math.round(position * 10000) / 10000 ;
					},
					resolve:function(time){
						return this.resolveValues(time) ;
					},
					update:function(position){
						if(!this.isResolved){
							this.resolve() ;
							this.isResolved = true ;
						}

						this.setPosition(position) ;
						this.setFactor(this.position) ;

						this.updateObject() ;
					},
					updateObject:function(){

						var factor = this.factor ;

						var t = this.target,
							e = this.ease,
							d = this.destination,
							s = this.source,
							cp = this.cuepoints,
							dur = this.duration,
							position = this.position,
							invert = 1.0 - factor,
							cpVec, a, b, l, ip, it, p1, p2,
							name, val ;

						for (var name in d) {

							a = s[name] ;
							b = d[name] ;

							if(!!!cp[name]){
								if(this.isPhysical){

									if (position >= dur[name]) {
										val = b ;
									} else if(position <= 0.0){
										val = a ;
									}else {
										val = e.calculate(position, a, b - a) ;
									}
								}else{
									val = a * invert + b * factor ;
								}
								// val = a * invert + b * factor ;
							}else{

								if (factor != 1.0 && !!(cpVec = this.cuepoints[name])) {
									l = cpVec.length ;
									if (l == 1) {
										val = a + factor * (2 * invert * (cpVec[0] - a) + factor * (b - a)) ;
									} else {

										if (factor < 0.0)
											ip = 0 ;
										else if (factor > 1.0)
											ip = l - 1 ;
										else
											ip = (factor * l) >> 0 ;
										it = (factor - (ip * (1 / l))) * l ;
										if (ip == 0) {
											p1 = a ;
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
										val = p1 + it * (2 * (1 - it) * (cpVec[ip] - p1) + it * (p2 - p1)) ;
									}
								} else {
									val = a * invert + b * factor ;
								}
							}

							this.store(name, val) ;
						}
					},
					store:function(name, val){
						if(!this.value){
							this.value = {} ;
						}
						this.value[name] = val ;
					},
					draw:function(){
						var v = this.value, val ;
						for(var name in v){
							val = v[name] ;
							this.setIn(name, val) ;
						}
					},
					setSourceValue:function(name, value){
						var isRelative = relative_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.source[name] = value ;
						this.relativeMap['source.' + name] = isRelative ;
					},
					setDestinationValue:function(name, value){
						var isRelative = relative_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.destination[name] = value ;
						this.relativeMap['dest.' + name] = isRelative ;
					},
					addCuePoint:function(name, value){
						var isRelative = relative_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;

						var cuepoints = this.cuepoints[name] ;
						if (cuepoints === undefined) this.cuepoints[name] = cuepoints = [] ;
						cuepoints.push(value) ;
						this.relativeMap['cuepoints.' + name + '.' + cuepoints.length] = isRelative ;
					},
					getIn:function(name){
						return this.cache[name]['getMethod'](this.target, name) ;
					},
					setIn:function(name, value){
						this.cache[name]['setMethod'](this.target, name, value) ;
					},
					superResolve:function(time){
						return this.resolveValues(time) ;
					},
					resolveValues:function(time){
						var UpdaterFactory = BetweenJS.$.UpdaterFactory ;
						var key,
							target = this.target,
							source = this.source,
							dest = this.destination,
							rMap = this.relativeMap,
							d = this.duration,
							duration,
							maxDuration = 0.0 ;

						for (key in source) {
							if (source[key] == UpdaterFactory.REQUIRED) {
								source[key] = this.getIn(key) ;
							}
							if (rMap['source.' + key]) {
								source[key] += this.getIn(key) ;
							}

						}

						for (key in dest) {

							if (dest[key] == UpdaterFactory.REQUIRED) {
								dest[key] = this.getIn(key) ;
							}
							if (rMap['dest.' + key]) {
								dest[key] += this.getIn(key) ;
							}

							if(this.isPhysical && !time){
								duration = this.ease.getDuration(source[key], source[key] < dest[key] ? dest[key] - source[key] : source[key] - dest[key]  ) ;
								d[key] = duration ;

								if (maxDuration < duration) {
									maxDuration = duration ;
								}
							}
						}

						var cuepoints = this.cuepoints, cpVec, l, i ;

						for (key in cuepoints) {

							var first = source[key] ;
							var last = dest[key] ;

							cpVec = cuepoints[key] ;
							l = cpVec.length ;
							var cur ;
							var cpduration = 0 ;
							for (i = 0 ; i < l ; ++i) {

								var prev = cur || first ;

								if (rMap['cuepoints.' + key + '.' + i]) {
									(cpVec[i] += this.getInObject(key)) ;
								}

								cur = cpVec[i] ;

								if(this.isPhysical && !time){
									cpduration += this.ease.getDuration(prev, cur > prev ? cur - prev : prev - cur) ;
									if(cpVec[i+1] === undefined){
										cpduration += this.ease.getDuration(cur, last > cur ? last - cur : cur - last) ;
									}
								}
							}
							if(this.isPhysical && !time){
								d[key] = cpduration ;
								if (maxDuration < cpduration) {
									maxDuration = cpduration ;
								}
							}
						}
						if(this.isPhysical){

							if(time) maxDuration = time ;

							this.maxDuration = maxDuration ;
							this.time = this.maxDuration ;
						}

						return this.time ;
					},
					newInstance:function(){
						return new Updater() ;
					},
					copyFrom:function(source){
						Updater.factory.copyFrom.apply(this, [source]) ;
						var obj = source ;

						this.units = source.units ;
						this.copyObject(this.source, source.source) ;
						this.copyObject(this.destination, source.destination) ;
						this.copyObject(this.relativeMap, source.relativeMap) ;
						this.copyObject(this.cuepoints, source.cuepoints) ;
					},
					destroy:function(){
						Updater.factory.destroy.call(this) ;
					}
				}) ;

				var UpdaterProxy = Type.define({
					pkg:'::UpdaterProxy',
					domain:BetweenJSCore,
					inherits:Traceable,
					parent:undefined,
					child:undefined,
					propertyName:undefined,
					time:NaN,
					constructor:UpdaterProxy = function UpdaterProxy(parent, child, propertyName){
						UpdaterProxy.base.call(this) ;

						this.parent = parent ;
						this.child = child ;
						this.propertyName = propertyName ;

						this.checkPhysical(this.child) ;
					},
					checkPhysical:function(el){
						this.isPhysical = el.isPhysical ;
						return el ;
					},
					resolve:function(time){

						var t = this.child.resolve(time) ;
						var tt = this.parent.resolve(time) ;
						var parentBigger = tt > t ;
						var ttt = parentBigger ? tt : t ;

						if(parentBigger){
							this.child.resolve(tt) ;
							this.child.isResolved = true ;
						}else if(tt != t){
							this.parent.resolve(t) ;
						}

						return this.time = ttt ;
					},
					superResolve:function(time){

						return this.resolve(time)  ;
					},
					update:function(position){
						this.child.update(position) ;
					},
					draw:function(){
						this.child.draw() ;
						this.parent.setIn(this.propertyName, this.child.target) ;
					},
					clone:function(source){
						return new UpdaterProxy(this.parent, this.child, this.propertyName) ;
					},
					destroy:function(){
						UpdaterProxy.factory.destroy.call(this) ;
					}
				}) ;
				var BulkUpdater = Type.define({
					pkg:'::BulkUpdater',
					domain:BetweenJSCore,
					inherits:Traceable,
					target:undefined,
					a:undefined,
					b:undefined,
					c:undefined,
					d:undefined,
					updaters:undefined,
					time:0,
					resolve:function(){

						var time = this.time ;

						this.bulkFunc(function(updater){
							var t = updater.resolve() ;
							if(updater.isPhysical){
								if(t > time) time = t ;
							}
						})

						this.time = time ;
						return time ;
					},
					superResolve:function(){

						var bulk = this ;
						this.bulkFunc(function(updater){
							if(updater.isPhysical){
								updater.resolve(bulk.time) ;
								// trace(updater)
								updater.superResolve(bulk.time) ;
							}
						}) ;
						return this.time ;
					},
					checkPhysical:function(el){
						this.isPhysical = this.isPhysical || el.isPhysical ;
						this.time = el.time > this.time ? el.time : this.time ;
						return el ;
					},
					constructor:BulkUpdater = function BulkUpdater(target, updaters){
						BulkUpdater.base.call(this) ;

						this.target = target ;
						this.length = updaters.length ;

						var l = updaters.length, t, tar ;

						if (l >= 1) {
							this.a = this.checkPhysical(updaters[0]) ;
							if (l >= 2) {
								this.b = this.checkPhysical(updaters[1]) ;
								if (l >= 3) {
									this.c = this.checkPhysical(updaters[2]) ;
									if (l >= 4) {
										this.d = this.checkPhysical(updaters[3]) ;
										if (l >= 5) {
											this.updaters = new Array(l - 4) ;
											for (var i = 4 ; i < l ; ++i) {
												tar = this.updaters[i - 4] = this.checkPhysical(updaters[i]) ;
											}
										}
									}
								}
							}
						}

					},
					bulkFunc:function(f){
						var els = [] ;
						var ret = [] ;
						for(var i = 0 ; i < Infinity ; i++){
							var s = this.getUpdaterAt(i) ;
							if(!!!s) break ;
							els[i] = s ;
							ret[i] = f(s, i, els) ;
						}
						return ret ;
					},
					getUpdaterAt:function(index){
						switch(index){
							case 0 :
								return this.a ;
							break ;
							case 1 :
								return this.b ;
							break ;
							case 2 :
								return this.c ;
							break ;
							case 3 :
								return this.d ;
							break ;
							default :
								return this.updaters[index - 4] ;
							break ;
						}
					},
					update:function(position){

						if(!this.isResolved){
							this.resolve() ;

							this.superResolve() ;
							this.isResolved = true ;
						}

						if (!!this.a) {
							this.a.update(position) ;

							if (!!this.b) {
								this.b.update(position) ;

								if (!!this.c) {
									this.c.update(position) ;

									if (!!this.d) {
										this.d.update(position) ;

										if (!!this.updaters) {
											var updaters = this.updaters ;
											var l = updaters.length ;
											for (var i = 0 ; i < l ; ++i) {
												updaters[i].update(position) ;
											}
										}
									}
								}
							}
						}
					},
					draw:function(){
						if (!!this.a) {
							this.a.draw() ;

							if (!!this.b) {
								this.b.draw() ;

								if (!!this.c) {
									this.c.draw() ;

									if (!!this.d) {
										this.d.draw() ;

										if (!!this.updaters) {
											var updaters = this.updaters ;
											var l = updaters.length ;
											for (var i = 0 ; i < l ; ++i) {
												updaters[i].draw() ;
											}
										}
									}
								}
							}
						}
					},
					clone:function(source){
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

						return new BulkUpdater(this.target, updaters) ;
					},
					destroy:function(){
						if (!!this.a) {
							this.a = this.a.destroy() ;
							if (!!this.b) {
								this.b = this.b.destroy() ;
								if (!!this.c) {
									this.c = this.c.destroy() ;
									if (!!this.d) {
										this.d = this.d.destroy() ;
										if (!!this.updaters) {
											var updaters = this.updaters ;
											var l = updaters.length ;
											for (var i = 0 ; i < l ; ++i) {
												updaters[i] = updaters[i].destroy() ;
											}
										}
									}
								}
							}
						}
						BulkUpdater.factory.destroy.call(this) ;
					}
				}) ;
			}) ;


			// CORE.MAPPING
			Pkg.write('mapping', function(path){
				var CustomMapper = Type.define({
					pkg:'::CustomMapper',
					statics:{
						ALL:/(.*)$/
					},
					constructor:CustomMapper = function CustomMapper(pattern, methods){
						this.pattern = pattern || CustomMapper.ALL ;

						this.parseMethod = methods['parseMethod'] ;
						this.getMethod = methods['getMethod'] ;
						this.setMethod = methods['setMethod'] ;

					},
					check:function(updater, typename, type, name, val){
						var val = type[name] || val ;
						var units ;
						var m ;

						if(val.constructor == Array){ // CUEPOINTS
							var bb = false ;
							var l = val.length ;
							for(var i = 0 ; i < l ; i ++){
								var vv = val[i] ;
								var r = this.parseMethod(updater, typename, type, name, vv) ;
								val[i] = r.value ;
								name = r.name ;

								if(r.units){
									updater.units[typename + '.' + name] = r.units ;
								}

								if(r.isRelative){
									updater.relativeMap[typename + '.' + name] = r.isRelative ;
								}

								bb = bb || r.block ;
							}

							return {
								name:name,
								value:val,
								units:units,
								block:bb
							} ;

						}else{
							var m = this.parseMethod(updater, typename, type, name, val) ;
							if(m.units){
								updater.units[typename + '.' + name] = m.units ;
							}

							if(m.isRelative){
								updater.relativeMap[typename + '.' + name] = m.isRelative ;
							}

							updater.cache[name] = this ;

							return m ;
						}
					}
				}) ;
				var PropertyMapper = Type.define({
					pkg:'::PropertyMapper',
					domain:BetweenJSCore,
					statics:{
						CustomMappers:[
							new CustomMapper(CustomMapper.ALL, {
								parseMethod:function(updater, typename, type, name, val){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[name] : val ;

									var units ;
									var un = PropertyMapper.checkForUnits(name, val) ;

									name = un.name ;
									val = un.value ;
									units = un.units ;

									var relative = PropertyMapper.replaceRelative(name) ;
									var isRelative = relative.isRelative ;
									name = relative.name ;

									name = PropertyMapper.replaceCapitalToDash(name) ;

									return {
										name:name,
										value:val,
										units:units,
										isRelative:isRelative,
										block:false
									}
								},
								getMethod:function getMethodAll(tg, n, unit){
									return BetweenJS.$.PropertyMapper.simpleGet(tg, n, unit || '') ;
								},
								setMethod:function setMethodAll(tg, n, val, unit){
									return BetweenJS.$.PropertyMapper.simpleSet(tg, n, val, unit || '') ;
								},
								drawMethod:function(tg, n, val, unit){

								}
							}),
							new CustomMapper(/((border|background)?color|background)$/i, {
								parseMethod:function(updater, typename, type, name, val){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[name] : val ;

									name = name == 'background' ? name + '-color' : name ;
									name = PropertyMapper.replaceCapitalToDash(name) ;

									val = BetweenJS.$.Color.toColorObj(val) ;

									return {
										name:name,
										value:val,
										block:true
									}
								},
								getMethod:function getMethodColor(tg, n){
									return BetweenJS.$.PropertyMapper.colorGet(tg, n) ;
								},
								setMethod:function setMethodColor(tg, n, val){
									return BetweenJS.$.PropertyMapper.colorSet(tg, n, val) ;
								},
								drawMethod:function(tg, n, val){

								}
							})
						],
						detectNameUnits:function(name){
							var nameunits_reg = /((::)(%|P(X|C|T)|EM))$/i ;
							var unit ;
							var n = name.replace(nameunits_reg, function($1, $2){
								unit = arguments[3] ;
								return '' ;
							}) ;
							return {name:n, unit:unit} ;
						},
						detectValueUnits:function(value){

							if(typeof(value) != 'string') return {unit : ''} ;

							var valueunits_reg = /(px|em|pc|pt|%)$/i ;
							var unit ;

							value = value.replace(valueunits_reg, function($1, $2){
								unit = arguments[0] ;
								return '' ;
							}) ;

							return {unit:unit, value:parseFloat(value)} ;
						},
						checkForUnits:function(name, val){
							var unit,
								value = val ;
							var nameunits = this.detectNameUnits(name) ;
							var valueunits = this.detectValueUnits(value) ;

							unit = (nameunits.unit || valueunits.unit || '').toLowerCase() ;
							name = nameunits.name || name ;
							value = valueunits.value || value ;

							return {units:unit, name:name, value:value} ;
						},
						replaceCapitalToDash:function(name){
							return name.replace(/[A-Z](?=[a-z])/g, function($1){
								return '-' + $1.toLowerCase() ;
							}) ;
						},
						replaceRelative:function(name){
							var o = {isRelative:relative_reg.test(name)} ;
							o.name = o.isRelative ? name.substr(1) : name ;
							return o ;
						},
						getStyle:function(tg, name){
							var val = '' ;
							if(window.getComputedStyle){
								var shortreg = /(border)(width|color)/gi ;
								(shortreg.test(name) && (name = name.replace(shortreg, '$1Top$2'))) ;
								val = (tg.style[name] !== '') ? tg.style[name] : window.getComputedStyle (tg, '')[name] ;

							}else if(tg.currentStyle){
								try{
									val = name == 'background-color' ? tg.currentStyle['backgroundColor'] : this.cssHackGet(tg, name) ;
								}catch(e){}
							}
							return val ;
						},
						setStyle:function(tg, name, val){
							tg['style'][name] = val ;
						},
						cssHackGet:function(el, name){
							if (el.currentStyle) {
								if (/backgroundcolor/i.test(name)) {
								  return (function (elm) { // get a rgb based color on IE
									var oRG = document.body.createTextRange() ;
									oRG.moveToElementText(elm) ;
									var iClr = oRG.queryCommandValue("BackColor") ;
									  return "rgb(" + (iClr & 0xFF) + "," + ((iClr & 0xFF00) >> 8) + "," + ((iClr & 0xFF0000) >> 16) + ")" ;
								  })(el) ;
								}
								return el.currentStyle[name] ;
							}
						},
						colorGet:function(target, pname){
							var Color = BetweenJS.$.Color ;
							return Color.toColorObj(this.getStyle(target, pname)) ;
						},
						colorSet:function(target, pname, val){
							var Color = BetweenJS.$.Color ;
							this.setStyle(target, pname, Color.toColorString(val)) ;
						},
						simpleGet:function(tg, n, unit){
							if(this.isDOM(tg))
								return this.simpleDOMGet(tg, n, unit || 'px') ;
							var str = String(tg[n]) ;
							return Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
						},
						simpleSet:function(tg, n, v, unit){
							if(this.isDOM(tg))
								return this.simpleDOMSet(tg, n, v, unit || 'px') ;
							tg[n] = unit == '' ? v : v + unit ;
						},
						simpleDOMGet:function(tg, n, unit){
							var str = this.getStyle(tg, n) ;
							return Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
						},
						simpleDOMSet:function(tg, n, v, unit){
							this.setStyle(tg, n, v + unit) ;
						},
						isDOM:function(tg){
							var ctor = tg.constructor ;
							switch(true){
								case ctor === undefined : // IE 7-
								case (/HTML[a-zA-Z]*Element/.test(ctor)) :
									return true ;
								break ;
							}
							return false ;
						}
					}

				}) ;

			}) ;
		}) ;

		// BETWEENJS MAIN CLASS
		var BetweenJS = Type.define({
			pkg:'::BetweenJS',
			domain:Type.appdomain,
			constructor:BetweenJS = function BetweenJS(){
				// throw 'Not meant to be instanciated... BetweenJS::ctor' ;
			},
			statics:{
				'$':BetweenJSCore,
				/*
					Core (static-like init), where
					main Ticker instance created & launched,
					(also set to tick forever from start, to disable, @see BetweenJS.$.EnterFrameTicker.stop())
				*/
				initialize:function initialize(domain){

					var exclude = {
						'getTimer':undefined,
						'toString':undefined,
						'core':undefined,
						'parallel':undefined,
						'parallelTweens':undefined,
						'serial':undefined,
						'serialTweens':undefined,
						'reverse':undefined,
						'repeat':undefined,
						'scale':undefined,
						'slice':undefined,
						'delay':undefined,
						'func':undefined,
						'interval':undefined,
						'clearInterval':undefined,
						'timeout':undefined,
						'clearTimeout':undefined
					}

					for(var n in BetweenJS){
						(function(ind){
							if(typeof(BetweenJS[ind]) == 'function' && !(ind in exclude)){
								var ff = BetweenJS[ind] ;

								BetweenJS[ind] = function(target){
									var tar , arr ;
									var args = [].slice.call(arguments) ;
									// CREATE SPECIAL CASE
									if(ind == 'create'){
										var tg = target['target'] ;
										if(!!tg && 'jquery' in tg) {
											var s = tg.size() ;
											if(s > 1){
												target['target'] = tg.toArray() ;
												return ff.apply(null, [].concat(args)) ;
											}else if(s == 1){
												target['target'] = tg.get(0) ;
												return ff.apply(null, [].concat(args)) ;

											}else{
												return false ;
											}
										}
									}

									if('jquery' in target) { // is jquery element

										var s = target.size() ;

										if(s > 1){
											tar = args.shift() ;
											arr = tar.map(function(i, el){
												return ff.apply(null, [el].concat(args)) ;
											}).toArray() ;

											return ff.apply(null, [arr].concat(args)) ;
										}else if(s == 1){
											tar = args.shift() ;
											return ff.apply(null, [tar[0]].concat(args)) ;

										}else{
											return false ;
										}

									}else if(('length' in target) && !isNaN(target['length'])){

										if(target.length > 1){

											tar = args.shift() ;
											var l = tar.length , arr = [] ;
											for(var i = 0 ; i < l ; i++)
												arr[arr.length] = ff.apply(null, [tar[i]].concat(args)) ;
											return BetweenJS.parallelTweens(arr) ;

										}else if(target.length == 1){

											var tar = args.shift() ;
											return ff.apply(null, [tar[0]].concat(args)) ;

										}else{
											return false ;
										}
									}else{
										return ff.apply(null, args) ;
									}
									return true ;
								}
							}
						})(n) ;
					}
				},
				/*
					create

					Creates a regular tween object. (Parameters Object Shorthand)
					Takes in the Options object, specifying all requirements and extras for the tween.
					"target", ("to", "from", one of those two at least), "time" are required, the rest are optional.

					@param options Object

					@return TweenLike Object
				*/
				create:function create(options){
					return BetweenJS.$.TweenFactory.create(options) ;
				},
				/*
					apply

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param time Float (default : 1.0)
					@param applyTime Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				apply:function apply(target, to, from, time, ease, applyTime){
					return this.create({
						target: target,
						to: to,
						from: from,
						time: time,
						ease: ease
					}).update(applyTime) ;
				},
				/*
					tween

					Creates a regular tween object.
					Takes in a target object, any object. Values in target such as numerals or other objects with numerals, will be able to tween.
					Passing in a 'to' and a 'from' object will set source and destination values for the tween.
					time is the duration of the tween.
					set an ease for the tween in the set of provided easings, or custom one @see CustomFunctionEasing

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				tween:function tween(target, to, from, time, ease){
					return this.create({
						target: target,
						to: to,
						from: from,
						time: time,
						ease: ease
					}) ;
				},
				/*
					to

					@param target Object/HtmlDomElement
					@param to Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				to:function to(target, to, time, ease){
					return this.create({
						target: target,
						to: to,
						time: time,
						ease: ease
					}) ;
				},
				/*
					from

					@param target Object/HtmlDomElement
					@param from Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				from:function from(target, from, time, ease){
					return this.create({
						target: target,
						from: from,
						time: time,
						ease: ease
					}) ;
				},
				/*
					apply

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param time Float (default : 1.0)
					@param applyTime Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				apply:function apply(target, to, from, time, ease, applyTime){
					return this.create({
						target: target,
						to: to,
						from: from,
						time: time,
						ease: ease
					}).update(applyTime) ;
				},
				/*
					bezier

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param cuepoints Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				bezier:function bezier(target, to, from, cuepoints, time, ease){
					return this.create({
						target: target,
						to: to,
						from: from,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/*
					bezierTo

					@param target Object/HtmlDomElement
					@param to Object
					@param cuepoints Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				bezierTo:function bezierTo(target, to, cuepoints, time, ease){
					return this.create({
						target: target,
						to: to,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/*
					bezierFrom

					@param target Object/HtmlDomElement
					@param from Object
					@param cuepoints Object
					@param time Float (default : 1.0)
					@param ease Ease (default : Linear.easeNone)

					@return TweenLike Object
				*/
				bezierFrom:function bezierFrom(target, from, cuepoints, time, ease){
					return this.create({
						target: target,
						from: from,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/*
					physical

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param ease Ease (default : Physical.exponential())

					@return TweenLike Object
				*/
				physical:function physical(target, to, from, ease){
					return this.create({
						target: target,
						to: to,
						from: from,
						ease: ease
					}) ;
				},
				/*
					physicalTo

					@param target Object/HtmlDomElement
					@param to Object
					@param ease Ease (default : Physical.exponential())

					@return TweenLike Object
				*/
				physicalTo:function physicalTo(target, to, ease){
					return this.create({
						target: target,
						to: to,
						ease: ease
					}) ;
				},
				/*
					physicalFrom

					@param target Object/HtmlDomElement
					@param from Object
					@param ease Ease (default : Physical.exponential())

					@return TweenLike Object
				*/
				physicalFrom:function physicalFrom(target, from, ease){
					return this.create({
						target: target,
						from: from,
						ease: ease
					}) ;
				},
				/*
					physicalApply

					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param applyTime Float (default : 1.0)
					@param ease Ease (default : Physical.exponential())

					@return TweenLike Object
				*/
				physicalApply:function physicalApply(target, to, from, ease, applyTime){
					return this.create({
						target: target,
						to: to,
						from: from,
						ease: ease
					}).update(applyTime) ;
				},
				/*
					parallel

					@param [tween TweenLike, ...]

					@return TweenLike Object
				*/
				parallel:function parallel(tween){
					return BetweenJS.parallelTweens([].slice.call(arguments)) ;
				},
				/*
					parallelTweens

					@param tweens Array[TweenLike]

					@return TweenLike Object
				*/
				parallelTweens:function parallelTweens(tweens){
					var options = {
						groups:{
							parallel:{
								tweens:tweens
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createGroup(options) ;
				},
				/*
					serial

					@param [tween TweenLike, ...]

					@return TweenLike Object
				*/
				serial:function serial(tween){
					return BetweenJS.serialTweens([].slice.call(arguments)) ;
				},
				/*
					serialTweens

					@param tweens Array[TweenLike]

					@return TweenLike Object
				*/
				serialTweens:function serialTweens(tweens){
					var options = {
						groups:{
							serial:{
								tweens:tweens
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createGroup(options) ;
				},
				/*
					reverse

					@param tween TweenLike
					@param reversePosition Float (default : 0.0)

					@return TweenLike TweenDecorator Object
				*/
				reverse:function reverse(tween, reversePosition){
					var position = !!reversePosition ? tween.time - tween.position : 0.0 ;

					if(tween instanceof BetweenJS.$.ReversedTween && !!tween.baseTween){
						return tween.baseTween ;
					}

					var options = {
						decorators:{
							reverse:{
								baseTween:tween,
								position:position
							}
						}
					} ;

					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/*
					repeat

					@param tween TweenLike
					@param repeatCount Integer (default : 2)

					@return TweenLike TweenDecorator Object
				*/
				repeat:function repeat(tween, repeatCount){
					var options = {
						decorators:{
							repeat:{
								baseTween:tween,
								repeatCount:repeatCount
							}
						}
					} ;

					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/*
					repeat

					@param tween TweenLike
					@param scale Float (percent, default : 1)

					@return TweenLike TweenDecorator Object
				*/
				scale:function scale(tween, scale){

					var options = {
						decorators:{
							scale:{
								baseTween:tween,
								scale:scale
							}
						}
					} ;

					return BetweenJS.$.TweenFactory.createDecorator(options) ;

				},
				/*
					slice

					@param tween TweenLike
					@param begin Float (default : 0)
					@param end Float (default : 1)
					@param isPercent Boolean (default : false)

					@return TweenLike TweenDecorator Object
				*/
				slice:function slice(tween, begin, end, isPercent){
					if(!!!isPercent) isPercent = false ;
					if(!!!begin) begin = 0 ;
					if(!!!end) end = isPercent ? 1 : tween.time ;

					if(isPercent){
						begin = tween.time * begin ;
						end = tween.time * end ;
					}

					var options = {
						decorators:{
							slice:{
								baseTween : tween,
								begin : begin,
								end : end,
								isPercent : isPercent
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/*
					delay

					@param tween TweenLike
					@param delay Float (default : 0)
					@param postDelay Float (default : 0)

					@return TweenLike TweenDecorator Object
				*/
				delay:function delay(tween, delay, postDelay){
					var options = {
						decorators:{
							delay:{
								baseTween:tween,
								delay:delay || 0,
								postDelay:postDelay || 0
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/*
					addChild

					@param target HtmlDomElement
					@param parent HtmlDomElement

					@return TweenLike AbstactActionTween Object
				*/
				addChild:function addChild(target, parent){

					var options = {
						actions:{
							addChild:{
								target:target,
								parent:parent
							}
						}
					}

					return BetweenJS.$.TweenFactory.createAction(options) ;
				},
				/*
					removeFromParent

					@param target HtmlDomElement
					@param parent HtmlDomElement

					@return TweenLike AbstactActionTween Object
				*/
				removeFromParent:function removeFromParent(target){

					var options = {
						actions:{
							removeFromParent:{
								target:target
							}
						}
					}

					return BetweenJS.$.TweenFactory.createAction(options) ;
				},
				/*
					func

					@param func Function
					@param params Array
					@param useRollback Boolean
					@param rollbackFunc Function
					@param rollbackParams Array

					@return TweenLike AbstactActionTween Object
				*/
				func:function func(closure, params, useRollback, rollbackClosure, rollbackParams){

					var options = {
						actions:{
							func:{
								func:closure,
								params:params,
								useRollBack:useRollBack,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams
							}
						}
					}

					return BetweenJS.$.TweenFactory.createAction(options) ;
				},
				/*
					timeout

					@param duration Float
					@param func Function
					@param params Array

					@return TweenLike AbstactActionTween Object
				*/
				timeout:function(duration, closure, params, useRollback, rollbackClosure, rollbackParams, force){
					var uid = getTimer() ;

					var options = {
						actions:{
							timeout:{
								duration:duration,
								func:closure,
								params:params,
								useRollBack:useRollBack,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams,
								force:force
							}
						}
					}

					var tw = BetweenJS.$.TweenFactory.createAction(options) ;
					tw.uid = uid ;
					return (cacheTimeout[uid] = tw) ;
				},
				clearTimeout:function(uid){
					var cc = isNaN(uid)? uid : cacheTimeout[uid] ;
					uid = cc.uid ;
					delete cacheTimeout[uid] ;
					return cc.stop() ;
				}
			}
		}) ;

		// EASE
		Pkg.write('ease', function(path){
			/* EASINGS */
			/* Thanks to Robert Penner & Yossi */
			var Ease = Type.define({
				pkg:'::Ease',
				constructor:Ease = function Ease(calc){
					this.calculate = calc || function calculate(t, b, c, d){
						return c * t / d + b ;
					}
				}
			})
			// LINEAR
			var Linear = Type.define({
				pkg:'::Linear',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(),
					easeOut:new Ease(),
					easeInOut:new Ease(),
					easeOutIn:new Ease()
				}
			})
			// CIRC
			var Circ = Type.define({
				pkg:'::Circ',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						return c * Math.sqrt(1 - (t = t / d - 1) * t) + b ;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b ;
						else return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						if (t < d / 2) return (c / 2) * Math.sqrt(1 - (t = (t * 2) / d - 1) * t) + b ;
						else return -(c / 2) * (Math.sqrt(1 - (t = (t * 2 - d) / d) * t) - 1) + (b + c / 2) ;
					})
				}
			})
			// CUBIC
			var Cubic = Type.define({
				pkg:'::Cubic',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return c * (t /= d) * t * t + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						return c * ((t = t / d - 1) * t * t + 1) + b;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						return ((t /= d / 2) < 1) ? c / 2 * t * t * t + b : c / 2 * ((t -= 2) * t * t + 2) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						return t < d / 2 ? c / 2 * ((t = t * 2 / d - 1) * t * t + 1) + b : c / 2 * (t = (t * 2 - d) / d) * t * t + b + c / 2 ;
					})
				}
			})
			// EXPO
			var Expo = Type.define({
				pkg:'::Expo',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b ;
					}),
					easeOut: new Ease(function(t, b, c, d){
						return t == d ? b + c : c * (-Math.pow(2, -10 * t / d)+1) + b;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						if (t == 0) return b ;
						if (t == d) return b + c ;
						if ((t /= d / 2.0) < 1.0) return c / 2 * Math.pow(2, 10 * (t - 1)) + b ;
						return c / 2 * (-Math.pow(2, -10 * --t)+2) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						if (t < d / 2.0) return t * 2.0 == d ? b + c / 2.0 : c / 2.0 * (-Math.pow(2, -10 * t * 2.0 / d)+1) + b ;
						else return (t * 2.0 - d) == 0 ? b + c / 2.0 : c / 2.0 * Math.pow(2, 10 * ((t * 2 - d) / d - 1)) + b + c / 2.0 ;
					})
				}
			})
			// QUAD
			var Quad = Type.define({
				pkg:'::Quad',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return c * (t /= d) * t + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						return -c * (t /= d) * (t - 2) + b ;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						if ((t /= d / 2) < 1) return c / 2 * t * t + b ;
						else return -c / 2 * ((--t) * (t - 2) - 1) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						if (t < d / 2) return -(c / 2) * (t = (t * 2 / d)) * (t - 2) + b ;
						else return (c / 2) * (t = (t * 2 - d) / d) * t + (b + c / 2) ;
					})
				}
			})
			// QUART
			var Quart = Type.define({
				pkg:'::Quart',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return c * (t /= d) * t * t * t + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						return -c * ((t = t / d - 1) * t * t * t - 1) + b ;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b ;
						else return -c / 2 * ((t -= 2) * t * t * t - 2) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						if (t < d / 2) return -(c / 2) * ((t = (t * 2) / d - 1) * t * t * t - 1) + b ;
						else return (c / 2) * (t = (t * 2 - d) / d) * t * t * t + (b + c / 2) ;
					})
				}
			})
			// QUINT
			var Quint = Type.define({
				pkg:'::Quint',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						return c * (t /= d) * t * t * t * t + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						return c * ((t = t / d - 1) * t * t * t * t + 1) + b ;
					}),
					easeInOut:new Ease(function(t, b, c, d){
						if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b ;
						else return c / 2 * ((t -= 2) * t * t * t * t + 2) + b ;
					}),
					easeOutIn:new Ease(function(t, b, c, d){
						if (t < d / 2) return (c / 2) * ((t = (t * 2) / d - 1) * t * t * t * t + 1) + b ;
						else return (c / 2) * (t = (t * 2 - d) / d) * t * t * t * t + (b + c / 2) ;
					})
				}
			})
			// SINE
			var Sine = Type.define({
				pkg:'::Sine',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function calculate(t, b, c, d){
						return -c * Math.cos(t / d * (Math.PI / 2)) + c + b ;
					}),
					easeOut:new Ease(function calculate(t, b, c, d){
						return c * Math.sin(t / d * (Math.PI / 2)) + b ;
					}),
					easeInOut:new Ease(function calculate(t, b, c, d){
						return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b ;
					}),
					easeOutIn:new Ease(function calculate(t, b, c, d){
						if (t < d / 2) return (c / 2) * Math.sin((t * 2) / d * (Math.PI / 2)) + b ;
						else return -(c / 2) * Math.cos((t * 2 - d) / d * (Math.PI / 2)) + (c / 2) + (b + c / 2) ;
					})
				}
			})
			// BOUNCE
			var Bounce = Type.define({
				pkg:'::Bounce',
				domain:Type.appdomain,
				statics:{
					easeIn:new Ease(function(t, b, c, d){
						if ((t = (d - t) / d) < (1 / 2.75)) return c - (c * (7.5625 * t * t)) + b ;
						if (t < (2 / 2.75)) return c - (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75)) + b ;
						if (t < (2.5 / 2.75)) return c - (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375)) + b ;
						else return c - (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375)) + b ;
					}),
					easeOut:new Ease(function(t, b, c, d){
						if ((t /= d) < (1 / 2.75)) return c * (7.5625 * t * t) + b ;
						if (t < (2 / 2.75)) return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b ;
						if (t < (2.5 / 2.75)) return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b ;
						else return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b ;
					}),
					easeInOut:new Ease(function(t, b, c, d){
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
					}),
					easeOutIn:new Ease(function(t, b, c, d){
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
					})
				}
			})
			// ELASTIC
			var ElasticEaseIn = function(a, p){
				return new Ease(function(t, b, c, d){
					a = a || 0 , p = p || 0 ;
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
				})
			}
			var ElasticEaseOut = function(a, p){
				a = a || 0 , p = p || 0 ;
				return new Ease(function(t, b, c, d){
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
				})
			}
			var ElasticEaseInOut = function(a, p){
				a = a || 0 , p = p || 0 ;
				return new Ease(function(t, b, c, d){
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
				})
			}
			var ElasticEaseOutIn = function(a, p){
				a = a || 0 , p = p || 0 ;
				return new Ease(function(t, b, c, d){
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
				})
			}
			var Elastic = Type.define({
				pkg:'::Elastic',
				domain:Type.appdomain,
				statics:{
					easeIn:new ElasticEaseIn(),
					easeOut:new ElasticEaseOut(),
					easeInOut:new ElasticEaseInOut(),
					easeOutIn:new ElasticEaseOutIn(),
					easeInWith:function(a, p){return new ElasticEaseIn(a || 0, p || 0)},
					easeOutWith:function(a, p){return new ElasticEaseOut(a || 0, p || 0)},
					easeInOutWith:function(a, p){return new ElasticEaseInOut(a || 0, p || 0)},
					easeOutInWith:function(a, p){return new ElasticEaseOutIn(a || 0, p || 0)}
				}
			})
			// BACK
			var BackEaseIn = function(s){
				s = s || 1.70158 ;
				return new Ease(function(t, b, c, d){
					return c * (t /= d) * t * ((s + 1) * t - s) + b;
				})
			}
			var BackEaseOut = function(s){
				s = s || 1.70158 ;
				return new Ease(function(t, b, c, d){
					return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b ;
				})
			}
			var BackEaseInOut = function(s){
				s = s || 1.70158 ;
				return new Ease(function(t, b, c, d){
					if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s * 1.525) + 1) * t - s * 1.525)) + b ;
					else return c / 2 * ((t -= 2) * t * (((s * 1.525) + 1) * t + s * 1.525) + 2) + b ;
				})
			}
			var BackEaseOutIn = function(s){
				s = s || 1.70158 ;
				return new Ease(function(t, b, c, d){
					if (t < d / 2) return (c / 2) * ((t = (t * 2) / d - 1) * t * ((s + 1) * t + s) + 1) + b ;
					else return (c / 2) * (t = (t * 2 - d) / d) * t * ((s + 1) * t - s) + (b + c / 2) ;
				})
			}
			var Back = Type.define({
				pkg:'::Back',
				domain:Type.appdomain,
				statics:{
					easeIn:new BackEaseIn(),
					easeOut:new BackEaseOut(),
					easeInOut:new BackEaseInOut(),
					easeOutIn:new BackEaseOutIn(),
					easeInWith:function(s){return new BackEaseIn(s || 1.70158)},
					easeOutWith:function(s){return new BackEaseOut(s || 1.70158)},
					easeInOutWith:function(s){return new BackEaseInOut(s || 1.70158)},
					easeOutInWith:function(s){return new BackEaseOutIn(s || 1.70158)}
				}
			})
			// CUSTOM
			var Custom = Type.define({
				pkg:'::Custom',
				domain:Type.appdomain,
				statics:{
					func:function func(f){
						return new Ease(f) ;
					}
				}
			}) ;
			// PHYSICAL
			var Physical = Type.define({
				pkg:'physical::Physical',
				domain:Type.appdomain,
				inherits:Ease,
				statics:{
					defaultFrameRate:60.0,
					uniform:function(velocity, frameRate){
						return new PhysicalUniform(velocity || 10.0, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					},
					accelerate:function(acceleration, initialVelocity, frameRate){
						return new PhysicalAccelerate(initialVelocity || 0.0, acceleration || 1.0, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					},
					exponential:function(factor, threshold, frameRate){
						return new PhysicalExponential(factor || 0.2, threshold || 0.0001, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					}
				}
			}) ;
			var PhysicalAccelerate = Type.define({
				pkg:'physical',
				inherits:Physical,
				iv:undefined,
				a:undefined,
				fps:undefined,
				constructor:PhysicalAccelerate = function PhysicalAccelerate(iv, a, fps){
					this.iv = iv ;
					this.a = a ;
					this.fps = fps ;
				},
				getDuration:function(b, c){
					var iv = c < 0 ? - this.iv : this.iv ;
					var a = c < 0 ? - this.a : this.a ;

					return ((-iv + Math.sqrt(iv * iv - 4 * (a / 2.0) * -c)) / (2 * (a / 2.0))) * (1.0 / this.fps);
				},
				calculate:function(t, b, c){
					var f = c < 0 ? -1 : 1 ;
					var n = t / (1.0 / this.fps) ;
					return b + (f * this.iv) * n + ((f * this.a) * n) * n / 2.0 ;
				}
			}) ;
			var PhysicalExponential = Type.define({
				pkg:'physical',
				inherits:Physical,
				f:undefined,
				th:undefined,
				fps:undefined,
				constructor:PhysicalExponential = function PhysicalExponential(f, th, fps){
					this.f = f ;
					this.th = th ;
					this.fps = fps ;
				},
				getDuration:function(b, c){
					return (Math.log(this.th / c) / Math.log(1 - this.f) + 1) * (1.0 / this.fps) ;
				},
				calculate:function(t, b, c){
					return -c * Math.pow(1 - this.f, (t / (1.0 / this.fps)) - 1) + (b + c) ;
				}
			}) ;
			var PhysicalUniform = Type.define({
				pkg:'physical',
				inherits:Physical,
				v:undefined,
				fps:undefined,
				constructor:PhysicalUniform = function PhysicalUniform(v, fps){
					this.v = v ;
					this.fps = fps ;
				},
				getDuration:function(b, c){
					return (c / (c < 0 ? -this.v : this.v)) * (1.0 / this.fps) ;
				},
				calculate:function(t, b, c){
					return b + (c < 0 ? -this.v : this.v) * (t / (1.0 / this.fps)) ;
				}
			});

		}) ;

		// CSS
		Pkg.write('css', function(path){
			//COLORS
			var Color = Type.define({
				pkg:'::Color',
				domain:BetweenJSCore,
				statics:{
					getRGBAObject:function(r, g, b, a){
						return {r:r, g:g, b:b, a:a} ;
					},
					getHSBAObject:function(h, s, b, a){
						return {h:h, s:s, b:b, a:a} ;
					},
					getHSLAObject:function(h, s, l, a){
						return {h:h, s:s, l:l, a:a} ;
					},
					getHSVAObject:function(h, s, v, a){
						return {h:h, s:s, v:v, a:a} ;
					},
					getRGBAString:function(r, g, b, a){
						return this.getMODEString('rgb', r, g, b, a) ;
					},
					getHSBAString:function(h, s, b, a){
						return this.getMODEString('hsb', h, s, b, a) ;
					},
					getHSLAString:function(h, s, l, a){
						return this.getMODEString('hsl', h, s, l, a) ;
					},
					getHSVAString:function(h, s, v, a){
						return this.getMODEString('hsv', h, s, v, a) ;
					},
					getMODEString:function(mode, r, g, b, a){
						return a === undefined ?
								mode +'('+r+','+g+','+b+')'
							:	mode +'a('+r+','+g+','+b+','+a+')' ;
					},
					HEXto:function(hex, MODE){
						var n, res ;
						hex = hex.replace(/^(0x|#)/, '') ;
						if(hex.length == 3)
							hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) ;
						n = parseInt('0x' + hex) ;

						var o = this.UINTto(n) ;

						switch(MODE){
							case 'hsv':
								o = this.RGBto(o.r, o.g, o.b, o.a, 'hsv') ;
								res = this.getHSVAObject(o.h, o.s, o.v, o.a) ;
							break ;
							default:
								res = this.getRGBAObject(o.r, o.g, o.b, o.a) ;
							break;
						}

						return res ;
					},
					UINTto:function(val, MODE){
						var v, r, g, b, a, s ;
						v = val ;
						var res ;
						if(val > 0xFFFFFF){
							if(MODE == 'hsv'){
								res = this.RGBto(
									(v & 0xFF000000) >>> 24,
									(v & 0xFF0000) >> 16,
									(v & 0xFF00) >> 8,
									(v & 100) * .01 , 'hsv') ;
							}else{
								res = this.getRGBAObject(
									(v & 0xFF000000) >>> 24,
									(v & 0xFF0000) >> 16,
									(v & 0xFF00) >> 8,
									(v & 100) * .01 ) ;
							}
						}else{
							if(MODE == 'hsv'){
								res = this.RGBto(
									(v & 0xFF0000) >> 16,
									(v & 0xFF00) >> 8,
									(v & 0xFF),
									1 , 'hsv') ;
							}else{
								res = this.getRGBAObject(
									(v & 0xFF0000) >> 16,
									(v & 0xFF00) >> 8,
									(v & 0xFF),
									1) ;
							}
						}

						return res ;
					},
					RGBto:function(r, g, b, a, MODE){
						// HSV
						var m = {} ;
						if(MODE == 'hsv'){
							if( r != g || r != b ){
								if ( g > b ) {
									if ( r > g ) { //r>g>b
										m.h = 60 * (g - b) / (r - b) ;
										m.s = (r - b) / r * 100 ;
										m.v = r / 255 * 100 ;
									}else if( r < b ){ //g>b>r
										m.v = g / 255 * 100 ;
										m.s = (g - r) / g * 100 ;
										m.h = 60 * (b - r) / (g - r) + 120 ;
									}else { //g=>r=>b
										m.v = g / 255 * 100 ;
										m.s = (g - b) / g * 100 ;
										m.h = 60 * (b - r) / (g - b) + 120 ;
									}
								}else{
									if ( r > b ) { // r>b=>g
										m.v = r / 255 * 100 ;
										m.s = (r - g) / r * 100 ;
										m.h = 60 * (g - b) / (r - g) ;
										if ( m.h < 0 ) m.h += 360 ;
									}else if ( r < g ){ //b=>g>r
										m.v = b / 255 * 100 ;
										m.s = (b - r) / b * 100 ;
										m.h = 60 * (r - g) / (b - r) + 240 ;
									}else { //b=>r=>g
										m.v = b / 255 * 100 ;
										m.s = (b - g) / b  * 100 ;
										m.h = 60 * (r - g) / (b - g) + 240 ;
									}
								}
							}else {
								m.h = m.s = 0 ;
								m.v = r / 255 * 100 ;
							}
							m.h = Math.round(m.h) ;
							m.s = Math.round(m.s) ;
							m.v = Math.round(m.v) ;
							m.a = a || 1 ;
						}else if(MODE == 'rgb'){
							m = this.getRGBAObject(r, g, b, a) ;
						}

						return m ;
					},
					HSVto:function(h, s, v, a, MODE){

						var m = {} ;
						if(MODE == 'rgb'){
							h = h,
							s = (s) * .01 ,
							v = (v) * .01 ;
							if ( s > 0 ) {
								if(h > 360) h = h % 360 ;
								else if(h < -360) h = h % -360 ;
								h = ((h < 0) ? h % 360 + 360 : h % 360 ) / 60 ;
								if ( h < 1 ) {
									m.r = 255 * v ;
									m.g = 255 * v * ( 1 - s * (1 - h) ) ;
									m.b = 255 * v * ( 1 - s ) ;
								}else if ( h < 2 ) {
									m.r = 255 * v * ( 1 - s * (h - 1) ) ;
									m.g = 255 * v ;
									m.b = 255 * v * ( 1 - s ) ;
								}else if ( h < 3 ) {
									m.r = 255 * v * ( 1 - s ) ;
									m.g = 255 * v ;
									m.b = 255 * v * ( 1 - s * (3 - h) ) ;
								}else if ( h < 4 ) {
									m.r = 255 * v * ( 1 - s ) ;
									m.g = 255 * v * ( 1 - s * (h - 3) ) ;
									m.b = 255 * v ;
								}else if ( h < 5 ) {
									m.r = 255 * v * ( 1 - s * (5 - h) ) ;
									m.g = 255 * v * ( 1 - s ) ;
									m.b = 255 * v ;
								}else{
									m.r = 255 * v ;
									m.g = 255 * v * ( 1 - s ) ;
									m.b = 255 * v * ( 1 - s * (h - 5) ) ;
								}
							}else {
								m.r = m.g = m.b = 255 * v ;
							}
							m.r = Math.round(m.r) ;
							m.a = a || 1 ;

						}else if(MODE == 'hsv'){
							m = this.getHSVAObject(h, s, v, a) ;
						}

						return m ;
					},
					toColorString:function(val, mode){
						var res ;
						var MODE = mode || 'rgb' ;

						var isString = function(){
							return typeof val == 'string' ;
						}
						switch(true){
							case !isString() && 'r' in val || 'h' in val :
								var r = val['r'],
									g = val['g'],
									b = val['b'],
									h = val['h'],
									s = val['s'],
									v = val['v'],
									l = val['l'],
									a = val['a'] || 1.0 ;

								if('h' in val && 's' in val){
									if('b' in val){ // HSB
										val = this.getHSBAString(h, s, b, a) ;
									}else if('v' in val){ // HSV
										val = this.getHSVAString(h, s, v, a) ;
									}else{ // HSL
										val = this.getHSLAString(h, s, l, a) ;
									}
								}else if('r' in val){
									val = this.getRGBAString(r, g, b, a) ;
								}
							// IMPORTANT !!!!!!!!!! NO BREAK HERE
							// break ;
							default :
								var o = this.toColorObj(val) ;
								switch(MODE){
									case 'hsv':
										o = this.RGBto(o.r, o.g, o.b, o.a, 'hsv') ;
										res = this.getHSVAString(o.h, o.s, o.v, o.a) ;
									break ;
									default:
										res = this.getRGBAString(o.r, o.g, o.b, o.a) ;
									break;
								}
							break ;
						}

						return res ;
					},
					toColorObj:function(val, mode){

						var res ;
						var MODE = mode || 'rgb' ;

						var isString = function(){
							return typeof val == 'string' ;
						}
						switch(true){
							case isString() && /^[a-z]+$/i.test(val) && val in BetweenJS.$.Color.css :
								val = BetweenJS.$.Color.css[val] ;
								switch(MODE){
									case 'hsv':
										res = this.HEXto(val, 'hsv') ;
									break;
									default:
										res = this.HEXto(val) ;
									break;
								}
							break ;
							case isString() && /^(0x|#)/.test(val) :
								val = val.replace(/^(0x|#)/, '') ;

								switch(MODE){
									case 'hsv':
										res = this.HEXto(val, 'hsv') ;
									break;
									default:
										res = this.HEXto(val) ;
									break;
								}
							break ;
							case isString() && /rgba?/i.test(val) :

								var str = val.replace(/(rgba?\(|\)| )/gi, '') ;
								var p = str.split(',') ;
								res = this.getRGBAObject(
									(p[0] & 0xFF),
									(p[1] & 0xFF),
									(p[2] & 0xFF),
									parseFloat(p[3] || 1.0 )
								) ;
							break ;
							case isString() &&/hsva?/i.test(val) :
								var str = val.replace(/(hsva?\(|\)| )/gi, '') ;
								var p = str.split(',') ;

								if(MODE == 'hsv'){
									res = this.getHSVAObject(
										(p[0] & 0xFF),
										(p[1] & 0xFF),
										(p[2] & 0xFF),
										parseFloat(p[3] || 1.0 )
									) ;
									break ;
								}
								res = this.HSVto(
									(p[0] & 0xFF),
									(p[1] & 0xFF),
									(p[2] & 0xFF),
									parseFloat(p[3] || 1.0),
								MODE) ;
							break ;
							case !isNaN(parseInt(val)) :

								switch(MODE){
									case 'hsv':
										res = this.UINTto(val) ;
										res = this.RGBto(res.r, res.g, res.b, res.a, 'hsv') ;
									break ;
									default :
										res = this.UINTto(val) ;
									break ;
								}

							break ;
							case !isString() && 'r' in val || 'h' in val :

								var r = val['r'],
									g = val['g'],
									b = val['b'],
									h = val['h'],
									s = val['s'],
									v = val['v'],
									l = val['l'],
									a = val['a'] || 1.0 ;

								if('h' in val && 's' in val){
									if('b' in val){ // HSB
										val = this.getHSBAObject(h, s, b, a) ;
									}else if('v' in val){ // HSV
										val = this.getHSVAObject(h, s, v, a) ;
									}else{ // HSL
										val = this.getHSLAObject(h, s, l, a) ;
									}
								}else if('r' in val){
									val = this.getRGBAObject(r, g, b, a) ;
								}
								res = val ;
							break ;
						}

						return res ;
					},
					css:{
						"aliceblue" : "#F0F8FF",
						"antiquewhite" : "#FAEBD7",
						"aqua" : "#00FFFF",
						"aquamarine" : "#7FFFD4",
						"azure" : "#F0FFFF",
						"beige" : "#F5F5DC",
						"bisque" : "#FFE4C4",
						"black" : "#000000",
						"blanchedalmond" : "#FFEBCD",
						"blue" : "#0000FF",
						"blueviolet" : "#8A2BE2",
						"brown" : "#A52A2A",
						"burlywood" : "#DEB887",
						"cadetblue" : "#5F9EA0",
						"chartreuse" : "#7FFF00",
						"chocolate" : "#D2691E",
						"coral" : "#FF7F50",
						"cornflowerblue" : "#6495ED",
						"cornsilk" : "#FFF8DC",
						"crimson" : "#DC143C",
						"cyan" : "#00FFFF",
						"darkblue" : "#00008B",
						"darkcyan" : "#008B8B",
						"darkgoldenrod" : "#B8860B",
						"darkgray" : "#A9A9A9",
						"darkgreen" : "#006400",
						"darkkhaki" : "#BDB76B",
						"darkmagenta" : "#8B008B",
						"darkolivegreen" : "#556B2F",
						"darkorange" : "#FF8C00",
						"darkorchid" : "#9932CC",
						"darkred" : "#8B0000",
						"darksalmon" : "#E9967A",
						"darkseagreen" : "#8FBC8F",
						"darkslateblue" : "#483D8B",
						"darkslategray" : "#2F4F4F",
						"darkturquoise" : "#00CED1",
						"darkviolet" : "#9400D3",
						"deeppink" : "#FF1493",
						"deepskyblue" : "#00BFFF",
						"dimgray" : "#696969",
						"dodgerblue" : "#1E90FF",
						"firebrick" : "#B22222",
						"floralwhite" : "#FFFAF0",
						"forestgreen" : "#228B22",
						"fuchsia" : "#FF00FF",
						"gainsboro" : "#DCDCDC",
						"ghostwhite" : "#F8F8FF",
						"gold" : "#FFD700",
						"goldenrod" : "#DAA520",
						"gray" : "#808080",
						"green" : "#008000",
						"greenyellow" : "#ADFF2F",
						"honeydew" : "#F0FFF0",
						"hotpink" : "#FF69B4",
						"indianred" : "#CD5C5C",
						"indigo" : "#4B0082",
						"ivory" : "#FFFFF0",
						"khaki" : "#F0E68C",
						"lavender" : "#E6E6FA",
						"lavenderblush" : "#FFF0F5",
						"lawngreen" : "#7CFC00",
						"lemonchiffon" : "#FFFACD",
						"lightblue" : "#ADD8E6",
						"lightcoral" : "#F08080",
						"lightcyan" : "#E0FFFF",
						"lightgoldenrodyellow" : "#FAFAD2",
						"lightgray" : "#D3D3D3",
						"lightgreen" : "#90EE90",
						"lightpink" : "#FFB6C1",
						"lightsalmon" : "#FFA07A",
						"lightseagreen" : "#20B2AA",
						"lightskyblue" : "#87CEFA",
						"lightslategray" : "#778899",
						"lightsteelblue" : "#B0C4DE",
						"lightyellow" : "#FFFFE0",
						"lime" : "#00FF00",
						"limegreen" : "#32CD32",
						"linen" : "#FAF0E6",
						"magenta" : "#FF00FF",
						"maroon" : "#800000",
						"mediumaquamarine" : "#66CDAA",
						"mediumblue" : "#0000CD",
						"mediumorchid" : "#BA55D3",
						"mediumpurple" : "#9370DB",
						"mediumseagreen" : "#3CB371",
						"mediumslateblue" : "#7B68EE",
						"mediumspringgreen" : "#00FA9A",
						"mediumturquoise" : "#48D1CC",
						"mediumvioletred" : "#C71585",
						"midnightblue" : "#191970",
						"mintcream" : "#F5FFFA",
						"mistyrose" : "#FFE4E1",
						"moccasin" : "#FFE4B5",
						"navajowhite" : "#FFDEAD",
						"navy" : "#000080",
						"oldlace" : "#FDF5E6",
						"olive" : "#808000",
						"olivedrab" : "#6B8E23",
						"orange" : "#FFA500",
						"orangered" : "#FF4500",
						"orchid" : "#DA70D6",
						"palegoldenrod" : "#EEE8AA",
						"palegreen" : "#98FB98",
						"paleturquoise" : "#AFEEEE",
						"palevioletred" : "#DB7093",
						"papayawhip" : "#FFEFD5",
						"peachpuff" : "#FFDAB9",
						"peru" : "#CD853F",
						"pink" : "#FFC0CB",
						"plum" : "#DDA0DD",
						"powderblue" : "#B0E0E6",
						"purple" : "#800080",
						"rebeccapurple" : "#663399",
						"red" : "#FF0000",
						"rosybrown" : "#BC8F8F",
						"royalblue" : "#4169E1",
						"saddlebrown" : "#8B4513",
						"salmon" : "#FA8072",
						"sandybrown" : "#F4A460",
						"seagreen" : "#2E8B57",
						"seashell" : "#FFF5EE",
						"sienna" : "#A0522D",
						"silver" : "#C0C0C0",
						"skyblue" : "#87CEEB",
						"slateblue" : "#6A5ACD",
						"slategray" : "#708090",
						"snow" : "#FFFAFA",
						"springgreen" : "#00FF7F",
						"steelblue" : "#4682B4",
						"tan" : "#D2B48C",
						"teal" : "#008080",
						"thistle" : "#D8BFD8",
						"tomato" : "#FF6347",
						"turquoise" : "#40E0D0",
						"violet" : "#EE82EE",
						"wheat" : "#F5DEB3",
						"white" : "#FFFFFF",
						"whitesmoke" : "#F5F5F5",
						"yellow" : "#FFFF00",
						"yellowgreen" : "#9ACD32"
					}
				}
			}) ;

		}) ;

	})})()
) ;