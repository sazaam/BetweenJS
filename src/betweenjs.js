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
		
		var NOOP 			= function(){} ;
		var ZERO 			= 0.0 ;
		var ZERO_ONE		= 0.1 ;
		var ONE 			= 1.0 ;
		var TWO 			= 2.0 ;
		var TEN 			= 10.0 ;
		var XXL				= 1e10 ;
		var MAX				= 19 ;
		var BREAK			= 'BREAK' ;
		var CONTINUE		= 'CONTINUE' ;
		// Externally-Pusblishable settings
		var BetweenJSCore = {
			settings:{
				begin:NOOP,
				update:NOOP,
				draw:NOOP,
				end:NOOP
			}
		} ;

			// Animation Ticker Core
		var getNow 			= function(){ return ('performance' in window) && ('now' in window.performance) ? performance.now() : new Date().getTime() },
			getTimer 		= function(){ return getNow() - __LIVE_TIME__ },
			// other utils
			concat 			= function(p){ return (p === undefined) ? [] : p },
			valueExists 	= function(o, val){ return !!o ? o[val] : undefined },
			checkForEpsilon = function(p){return (p > ZERO && p < __EPSILON__) ? ZERO : p },
			isJQ			= function(tg){ return 'jQuery' in tg || 'selector' in tg },
			isDOM 			= function(tg, c){ return ((c = tg.constructor) === undefined || (DOM_reg.test(c)) || 'appendChild' in tg) },
			isNOTDOM		= function(tg){ return !(isDOM(tg || isJQ(tg))) } ;
		
		
			// Animation & TIcker Control
			var __LIVE_TIME__ 			= getNow(),
			__SLICE__				= [].slice,
			__TIME__				= NaN,
			__OFF_TIME__ 			= ZERO,
			__EPSILON__ 			= 'EPSILON' in Number ? Number.EPSILON : ZERO_ONE,
			__FPS__ 				= 60 ;
		
		var __SIM_TIMESTEP__ 		= 1000 / __FPS__,
			__FRAME_DELTA__ 		= ZERO,
			__LAST_FRAME_TIME_MS__ 	= ZERO,
			__LAST_FPS_UPDATE__ 	= ZERO,
			__FRAMES_THIS_SECOND__ 	= ZERO,
			__NUM_UPDATES_STEP__ 	= ZERO,
			__UPDATE_PANIC_LIMIT__ 	= 240,
			__MIN_FRAME_DELAY__ 	= ZERO,
			__EFT_START_TIME__	 	= ZERO,
			__SAFE_TIME__ 			= __EPSILON__ / 2,
			__SAFE_HACK__	 		= .0001,
			__XXL__ 				= XXL ;
		
		var BASE_TIME 				= .75 ;
		var REG_TIME = NaN ;
		
		var running 				= false,
			started 				= false,
			panic 					= false,
			// specials
			CACHE_TIMEOUT 			= {},
			CACHE_INTERVAL 			= {},
			CACHE_ANIM_FRAME		= {},
			CACHE_LOAD				= {},
			// regexp
			DOM_reg 				= /HTML[a-zA-Z]*Element/,
			UNIT_reg 				= /(px|em|pc|pt|%)$/,
			REL_reg 				=/^\$/ ;
		
		// REQUEST / CANCEL ANIMATIONFRAME
		(function () {
			var lastTime = getTimer(), now, timeout, vendors = ['ms', 'moz', 'webkit', 'o'] ;

			if (!window.requestAnimationFrame)
				for (var x = 0; x < vendors.length; ++x) {
					window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
					window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'] ;
				}
			requestAnimationFrame = window.requestAnimationFrame || function (callback) {
				now = getNow() ;
				timeout = Math.max(ZERO, __SIM_TIMESTEP__ - (now - lastTime)) ;
				lastTime = now + timeout ;
				return setTimeout(function () {
					callback(now + timeout) ;
				}, timeout) ;
			};

			cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout ;
		})();

		// BETWEENJS CORE
		Pkg.write('core', function(path){
			
			
			/*	Destroyable - Class

				inherit this class and the 'destroy' method becomes available
				The 'destroy' method loops in the setted properties and erases their associated values,
				erasing as well their named entry.

			*/
			var Destroyable =  Type.define({
				pkg:'utils::Destroyable',
				constructor:Destroyable = function Destroyable(){
					//
				},
				destroy:function(){

					for(var s in this){
						var p = this[s] ;
						if(p instanceof Destroyable) p.destroy() ;
						if(typeof p == 'object'){
							if('destroy' in p && typeof p['destroy'] == 'function')
								p['destroy']() ;
						}
						this[s] = undefined ;
						delete this[s] ;
					}
				}
			}) ;
			
			/*	Traceable - Class

				inherit this class to have a cleaner traced output on the global 'trace' method call.
				
			*/
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
			
			/*	Poly - Class

				inherit this class for bulk treatments,
				the light way. According to how many items we want to loop through, 
				it will not necessarily create an array.
				a, b, c, and d are name-stored elements, if more items, then another 'elements' array will be created on top.
				
			*/
			var Poly = Type.define({
				pkg:'::Poly',
				domain:BetweenJSCore,
				inherits:Traceable,
				a:undefined,
				b:undefined,
				c:undefined,
				d:undefined,
				elements:undefined,
				length:0,
				bulkFunc:function(f, reversed){
					var els = [] ;
					var ret = [] ;
					
					if(reversed !== true){
						for(var i = 0 ; i < Infinity ; i++){
							var s = this.getElementAt(i) ;
							if(!!!s) break ;
							els[i] = s ;
							ret[i] = f(s, i, els) ;
							if(ret[i] === BREAK) break ;
							if(ret[i] === CONTINUE) continue ;
						}
					}else{
						var l = this.length ;
						for(;l > 0 ; l--){
							var i = l - 1 ;
							var s = this.getElementAt(i) ;
							if(!!!s) break ;
							els[i] = s ;
							ret[i] = f(s, i, els) ;
							if(ret[i] === BREAK) break ;
							if(ret[i] === CONTINUE) continue ;
						}
					}
				},
				getElementAt:function(index){
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
							return this.elements[index - 4] ;
						break ;
					}
				},
				constructor:Poly = function Poly(elements, closure){
					Poly.base.call(this) ;
					
					this.elements = elements ;
					var l = elements.length, tar ;
					closure = closure || function(){} ;
					
					if (l >= 1) {
						this.a = elements[0] ;
						closure(this.a, l) ;
						if (l >= 2) {
							this.b = elements[1] ;
							closure(this.b, l) ;
							if (l >= 3) {
								this.c = elements[2] ;
								closure(this.c, l) ;
								if (l >= 4) {
									this.d = elements[3] ;
									closure(this.d, l) ;
									if (l >= 5) {
										this.elements = new Array(l - 4) ;
										for (var i = 4 ; i < l ; ++i) {
											tar = this.elements[i - 4] = elements[i] ;
											closure(tar, l) ;
										}
									}
								}
							}
						}
					}
					this.length = l ;
					
				}
			}) ;
			
			// CORE.LOOPS
			Pkg.write('loops', function(){
				
				/*	LOOPS PACKAGE
				
					Contains classes that concerns Animation Control.
					
					Briefly, AnimationTicker is the Main Loop, calling requestAnimationFrame(), and provides interface
					to add other sub-loops (Animation Class) to that main AnimationFrame call.
					Contains Panic handling, ensuring the framerate is constantly optimized in order to avoid unsmooth peaks.
					
					One can as well handle panic externally and thus modify the framerate on the fly, via listeners.
					
					This system has one huge requirement :
					Update and draw calls MUST be clearly separately written, i-e all calculations ('update') can happen to be summonned multiple times while one frame, 
					but only once per frame will be called the renderings ('draw').
					
					This is the safest pattern for both accuracy and smoothness of our tweens, given the unaccuracy and unconsistency of 
					elapsed time notion and approximacy of the framerate whithin the browsers.

				*/
				
				/*	AnimationTicker - CLASS
					
					
					!! Four Important Methods !!
					
					Begin -> starting frame settings (UNUSED here)
					
					Update -> triggers calculations of all attached Animations inner Updates (which will furtherly call attached tweens Updates/calculations) 
					
					Draw -> Trigger one final Draw once sub-calculations were done
					
					End -> after frame draw was called (UNUSED here)
					
					
					After creating a new Animation and setting its update method, this Main AnimationTicker will loop through the registered Animations
					and treat them consecutively.
					
					All tweens are behaving in this One Animation attached at a time, but externally from BetweenJS we can attach simultaneous animations 
					through this AnimationTicker Singleton without any additional loops needed.
					

				*/
				
				var AnimationTicker = Type.define({
					pkg:'::AnimationTicker',
					domain:BetweenJSCore,
					statics:{
						ID:NaN,
						timestamp:NaN,
						loops:[],
						actions:[],
						frames:-1,
						HALT:false,
						/**
						 * Creates a new Animation instance.
						 * @param {Function} update - Update callback
						 * @param {Function} draw - Draw callback
						 * @return {Animation} New Animation instance
						 */
						createAnimation:function(update, draw){
							return new Animation(update, draw) ;
						},
						/**
						 * Begins the animation frame cycle.
						 * @param {number} timestamp - Current timestamp
						 * @param {number} __FRAME_DELTA__ - Frame delta time
						 */
						begin:function(timestamp, __FRAME_DELTA__){
							// UNUSED
							BetweenJSCore.settings.begin(timestamp, __FRAME_DELTA__) ;
						},
						/**
						 * Updates all animation loops.
						 * @param {number} timestamp - Current timestamp
						 */
						update:function(timestamp){
							this.loopthru("update", timestamp) ;
						},
						/**
						 * Draws all animation loops.
						 * @param {number} timestamp - Current timestamp
						 */
						draw:function(timestamp){
							this.loopthru("draw", timestamp) ;
						},
						/**
						 * Iterates through all animation loops calling the named method.
						 * @param {string} funcname - Name of the method to call on each loop
						 * @param {number} timestamp - Current timestamp
						 */
						loopthru:function(funcname, timestamp){
							// UNUSED
							BetweenJSCore.settings[funcname](timestamp) ;
							
							var loops = this.loops ;
							var l = loops.length ;
							for(var i = 0 ; i < l ; i++){
								var loop = loops[i] ;
								if(!!!loop) return ;
								if(!!loop[funcname] && typeof loop[funcname] == 'function')
									loop[funcname](timestamp) ;
							}
						},
						/**
						 * Ends the animation frame cycle.
						 * @param {number} __FPS__ - Current frames per second
						 * @param {boolean} panic - Whether the update panic limit was hit
						 */
						end:function(__FPS__, panic){
							// UNUSED
							BetweenJSCore.settings.end(__FPS__, panic) ;
						},
						/**
						 * Checks and executes queued frame actions.
						 */
						checkFrameActions:function(){
							
							var l = this.actions.length ;
							
							for(;l > 0 ; l--){
								var i = l - 1 ;
								
								var action = this.actions[i] ;
								
								var closure = action.closure ;
								var params = action.params ;
								var frames = --action.frames ;
								
								if(frames <= 0){
									var s = closure.apply(closure, [].concat(params)) ;
									// remove
									if(s == CONTINUE){
										continue ;
									}else if (s == BREAK){
										break ;
									}
									this.actions.splice(i, 1) ;
									
								}
							}
							
						},
						/**
						 * Halts the entire animation system.
						 */
						haltSystem:function(){
							var anim = AnimationTicker ;
							anim.HALT = true ;
						},
						/**
						 * Restores and restarts the animation system after a halt.
						 */
						restoreSystem:function(){
							var anim = AnimationTicker ;
							anim.HALT = false ;
							anim.start() ;
						},
						/**
						 * Inner animation loop callback. Computes frame timing, updates, and draws.
						 * @param {number} timestamp - High-resolution timestamp from requestAnimationFrame
						 */
						innerFunc:function(timestamp){
							/////
							if (timestamp < __LAST_FRAME_TIME_MS__ + __MIN_FRAME_DELAY__) {
								return ;
							}
							/////
							var anim = AnimationTicker,
								begin = BetweenJSCore.settings.begin,
								update = BetweenJSCore.settings.update,
								draw = BetweenJSCore.settings.draw,
								end = BetweenJSCore.settings.end,
								faketimestamp = timestamp - __OFF_TIME__ ;
							
							anim.frames ++ ;
							
							anim.checkFrameActions() ;
							
							if(!!anim.HALT) {
								anim.stop() ;
								anim.started = true ;
								return ;
							}
							
							__TIME__= timestamp ;
							__FRAME_DELTA__ += timestamp - __LAST_FRAME_TIME_MS__ ;
							__LAST_FRAME_TIME_MS__ = timestamp ;
							
							anim.timestamp = faketimestamp * .001 ;
							anim.ID = requestAnimationFrame(anim.innerFunc) ;

							
							anim.begin(timestamp, __FRAME_DELTA__) ;
							
							if (timestamp > __LAST_FPS_UPDATE__ + 1000) {
								__FPS__ = 0.25 * __FRAMES_THIS_SECOND__ + 0.75 * __FPS__ ;
								__LAST_FPS_UPDATE__ = timestamp ;
								__FRAMES_THIS_SECOND__ = ZERO ;
							}

							__FRAMES_THIS_SECOND__++ ;
							__NUM_UPDATES_STEP__ = ZERO ;
							
							while (__FRAME_DELTA__ >= __SIM_TIMESTEP__) {
								anim.update(faketimestamp) ;

								__FRAME_DELTA__ -= __SIM_TIMESTEP__ ;
								if (++__NUM_UPDATES_STEP__ >= __UPDATE_PANIC_LIMIT__) {
									// trace("PANICKING") ;
									panic = true ;
									break ;
								}
							}
							
							// BETWEENJS TICKER
							anim.draw(__FRAME_DELTA__ / __SIM_TIMESTEP__) ;
							anim.end(__FPS__, panic) ;
							
							panic = false ;
						},
						/**
						 * Starts the animation ticker.
						 */
						start:function(){
							var anim = AnimationTicker ;
							anim.started = true ;
							
							anim.ID = requestAnimationFrame(function(now){
								__OFF_TIME__ += isNaN(__TIME__) ? ZERO : now - __TIME__;
								anim.innerFunc(now) ;
							}) ;
						},
						/**
						 * Stops the animation ticker.
						 */
						stop:function(){
							var anim = AnimationTicker ;
							cancelAnimationFrame(anim.ID) ;
							
							anim.started = false ;
							delete anim.ID ;
						},
						/**
						 * Attaches an animation loop to the ticker.
						 * @param {Object} loop - Animation loop to attach
						 */
						attach:function(loop){
							var lo = this.loops ;
							lo[lo.length] = loop ;
							if(lo.length == 1) {
								this.start() ;
							}
						},
						/**
						 * Detaches an animation loop from the ticker.
						 * @param {Object} loop - Animation loop to detach
						 */
						detach:function(loop){
							this.reorder() ;
							this.loops.splice(loop.index, 1) ;
							
							if(this.loops.length == 0) this.stop() ;
						},
						/**
						 * Reindexes all loops after a removal.
						 */
						reorder:function(){
							var l = this.loops.length ;
							for(var i = 0 ; i < l ; i++){
								this.loops[i].index = i ;
							}
						}
					}
				})

				var Animation = Type.define({
					pkg:'::Animation',
					domain:BetweenJSCore,
					inherits:Traceable,
					index:undefined,
					update:undefined,
					draw:undefined,
					die:false,
					/**
					 * Creates a new Animation instance.
					 * @param {Function} update - Update callback
					 * @param {Function} draw - Draw callback
					 */
					constructor:Animation = function Animation(update, draw){
						Animation.base.call(this) ;
						this.enable(update, draw) ;
					},
					/**
					 * Enables the animation with update and draw callbacks.
					 * @param {Function} update - Update callback
					 * @param {Function} draw - Draw callback
					 */
					enable:function(update, draw){
						this.update = update ;
						this.draw = draw ;
					},
					/**
					 * Starts the tween from the beginning (rewind then play).
					 * @return {Object} This tween instance
					 */
					start:function(){
						AnimationTicker.attach(this) ;
						return this ;
					},
					/**
					 * Stops playback of the tween.
					 * @return {Object} This tween instance
					 */
					stop:function(){
						AnimationTicker.detach(this) ;
						this.destroy() ;
						return this ;
					},
					/**
					 * Halts the animation without destroying it.
					 * @return {Object} This Animation instance
					 */
					halt:function(){
						AnimationTicker.detach(this) ;
						return this ;
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
					/**
					 * Creates a new TickerListener instance.
					 */
					constructor:TickerListener = function TickerListener(){
						
					},
					/**
					 * Tick callback called on each frame.
					 * @param {number} time - Current time value
					 * @return {boolean} Whether the listener should be removed
					 */
					tick:function(time){
						return false ;
					},
					triggerNext:function(time){},
					destroy:function(){
						
						delete this.prevListener ;
						delete this.nextListener ;
						
						TickerListener.factory.destroy.call(this) ;
					}
				}) ;
				// ENTERFRAMETICKER
				var EnterFrameTicker = Type.define({
					pkg:'::EnterFrameTicker',
					domain:BetweenJSCore,
					statics:{
						first:undefined,
						last:undefined,
						numListeners:0,
						coreListenersMax: 0,
						tickerListenerPaddings:undefined,
						time:undefined,
						/**
						 * Initializes the EnterFrameTicker with listener padding pool.
						 * @param {Object} domain - The BetweenJSCore domain
						 */
						initialize:function initialize(domain){
							var AnimationTicker = BetweenJSCore.AnimationTicker ;
							
							var prevListener = undefined,
								max = this.coreListenersMax = 10 ;

							this.tickerListenerPaddings = new Array(max) ;
							this.numListeners = 0 ;
							this.drawables = [] ;

							for (var i = 0; i < max; ++i) {
								var listener = new TickerListener() ;
								if (!!prevListener) {
									prevListener.nextListener = listener ;
									listener.prevListener = prevListener ;
								}
								prevListener = listener ;
								this.tickerListenerPaddings[i] = listener ;
							}
						},
						/**
						 * Adds a ticker listener to the linked list.
						 * @param {Object} listener - The listener to add
						 */
						addTickerListener:function(listener){

							if(!!listener.nextListener || !!listener.prevListener) {
								return ;
							}

							if(!!this.last){
								if(!!this.last.nextListener){
									this.last.nextListener.prevListener = listener ;
									listener.nextListener = this.last.nextListener ;
								}
								listener.prevListener = this.last ;
								this.last.nextListener = listener ;
							}

							this.last = listener ;

							if(!!!this.first){
								this.first = listener ;
							}
							
							++ this.numListeners ;

						},
						/**
						 * Removes a ticker listener from the linked list.
						 * @param {Object} listener - The listener to remove
						 */
						removeTickerListener:function(listener){

							var l = this.first ;

							while(!!l){
								if(l == listener){
									if(!!l.prevListener){
										l.prevListener.nextListener = l.nextListener ;
									}else{
										this.first = l.nextListener ;
									}

									if(!!l.nextListener){
										l.nextListener.prevListener = l.prevListener;
									}else{
										this.last = l.prevListener ;
									}

									l.nextListener = undefined ;
									l.prevListener = undefined ;
									-- this.numListeners ;
								}
								l = l.nextListener ;
							}

						},
						/**
						 * Starts the EnterFrameTicker animation loop.
						 */
						start:function(){
							
							var AnimationTicker = BetweenJS.$.AnimationTicker ;
							var Animation = BetweenJS.$.Animation ;
							
							var EFT = this ;
							
							this.animation = AnimationTicker.createAnimation(
								function(timestamp){
									if(REG_TIME == timestamp) return ;
									REG_TIME = timestamp ;
									if(__EFT_START_TIME__ == ZERO) {
										__EFT_START_TIME__ = AnimationTicker.timestamp ;
									}
									EFT.update(AnimationTicker.timestamp) ;
								},
								function(timestamp){
									if(REG_TIME == timestamp) return ;
									EFT.draw(AnimationTicker.timestamp) ;
								}
							).start() ;
							
							this.started = true ;
						},
						/**
						 * Stops the EnterFrameTicker animation loop.
						 */
						stop:function(){
							this.animation.stop() ;
							this.started = false ;
						},
						/**
						 * Draws all drawable listeners.
						 * @param {number} ts - Timestamp for drawing
						 */
						draw:function(ts){
							
							var drawables = this.drawables ;
							var l = drawables.length ;
							for(var i = 0 ; i < l ; i ++){
								var drawable = drawables[i] ;
								drawable.draw(ts) ;
							}
						},
						/**
						 * Updates all ticker listeners and collects drawables.
						 * @param {number} time - Current time value
						 */
						update:function(time){
							
							var EFT = this ;
							
							var min = 0 ;
							var EFT = this ;

							EFT.time = time - __EFT_START_TIME__ ;
							var t = EFT.time ;
							var drawables = EFT.drawables = [] ;
							
							var i = (this.numListeners / 8 + 1) | 0 ; 
							var n = i * 8 - this.numListeners ;
							var listener = this.tickerListenerPaddings[0] ; 
							var l = this.tickerListenerPaddings[n] ;
							var ll = undefined ;
							
							if (!!(l.nextListener = this.first)) {
								this.first.prevListener = l ;
							}
							
							var j = 8 ;

							try {
									
								while (--i >= 0) {
									
									while(--j >= 0){
										
										var newt = t ;
										listener = listener.nextListener ;
										var AbstractTween = BetweenJS.$.AbstractTween ;
										
										if(!!!listener){
											listener = this.tickerListenerPaddings[n] ;
											j = 0 ;
											continue ;
										}
										
										if(listener instanceof AbstractTween){
											listener.triggerNext(newt) ;
											newt = newt - listener.startTime ;
											min ++ ;
											drawables.push(listener) ;
										}
		
										if (listener.tick(newt)) {
											if (!!listener.prevListener) {
												listener.prevListener.nextListener = listener.nextListener ;
											}
											if (!!listener.nextListener) {
												listener.nextListener.prevListener = listener.prevListener ;
											}
											if (listener == this.first) {
												this.first = listener.nextListener ;
											}
											if (listener == this.last) {
												this.last = listener.prevListener ;
											}
											ll = listener.prevListener ;
											listener.nextListener = undefined ;
											listener.prevListener = undefined ;
											listener = !!ll ? ll : this.tickerListenerPaddings[n] ;
											-- this.numListeners ;
										}
									}
									
								}
							} catch (error) {
								trace(error)
								EFT.stop() ;
							}
							

							if(min == 0){
								this.stop() ;
							}

							if (!!(this.first = l.nextListener)) {
								this.first.prevListener = undefined ;
							}
							else {
								this.last = undefined ;
							}
							l.nextListener = this.tickerListenerPaddings[n + 1] ;

						}
					}

				}) ;
			})

			// CORE.TWEENS
			Pkg.write('tweens', function(path){
				// FACTORY
				var TweenFactory = BetweenJSCore.TweenFactory = {
					/**
					 * Sets default easing and time on options if not provided.
					 * @param {Object} options - Tween options object
					 */
					optionDefaults:function(options){
						if(!!!options['ease']) options['ease'] = Expo.easeOut ;
						if(!!!options['time'] && options['time'] !== 0) options['time'] = BASE_TIME ;
					},
					/**
					 * Detects the tween type from options and creates the appropriate tween.
					 * @param {Object} options - Tween options object
					 * @return {Object} The created tween instance
					 */
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
					/**
					 * Checks for multiple targets and delegates to bulkcreate or single tween creation.
					 * @param {Object} options - Tween options containing a target
					 * @return {Object} A single tween or parallel tweens for multiple targets
					 */
					checkMultipleTargets:function(options){

						var n, t = options.target ;
						var isMulti = false ;
						if(!!t){
							if(isJQ(t)){
								n = t.size() ;
								
								if(n <= 0){
									throw new Error('Seems your jquery Object is empty : '+ t)
								}else if(n == 1){
									t = t[0] ;
								}else{
									t = t.toArray() ;
								}
							}

							if(t.constructor == Array){
								n = t.length ;
								// check if target element is not a script or other non-diplayable tag
								for(var i = 0 ; i < n ; i++){
									if(!!t[i] && !!t[i].tagName && /(script|link|style)/i.test(t[i].tagName)){
										t.splice(i, 1) ;
									}
								}
								n = t.length ;
								if(n <= 0){
									throw new Error('Seems your Array Object is empty : '+ t)
								}else if(n == 1){
									t = t[0] ;
								}else{
									isMulti = true ;
								}
							}
							options.target = t ;

							if(isMulti){
								return this.bulkcreate(options) ;
							}
						}

						return this.detectTweenTypeFromOptions(options) ;
					},
					/**
					 * Creates parallel tweens for multiple targets.
					 * @param {Object} options - Tween options object
					 * @return {Object} A ParallelTween containing tweens for each target
					 */
					bulkcreate:function(options){
						var targets = [].concat(options.target) ;
						var l = targets.length ;
						var arr = [] ;
						for(var i = 0 ; i < l ; i ++){
							var target = targets[i] ;
							options.target = target ;
							arr[i] = BetweenJS.create(options) ;
						}

						return BetweenJS.parallelTweens(arr) ;
					},
					/**
					 * Creates a tween from options, checking for multiple targets first.
					 * @param {Object} options - Tween options object
					 * @return {Object} The created tween instance
					 */
					create:function(options){

						return this.checkMultipleTargets(options) ;
					},
					/**
					 * Creates a basic tween.
					 * @param {Object} options - Tween options object
					 * @return {Object} The configured Tween instance
					 */
					createBasic:function(options){

						var tw = new Tween() ;
						
						return tw
							.configure(options)
							.checkPhysical()
							.setHandlers(options) ;
					},
					/**
					 * Creates an action tween (addChild, removeFromParent, func, load, timeout, interval, animationframe).
					 * @param {Object} options - Tween options containing an actions property
					 * @return {Object} The configured action tween instance
					 */
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
							case !!(t = actions.load) :
								tw = new (BetweenJS.$.LoadAction)() ;
							break ;
							case !!(t = actions.timeout) :
								tw = new (BetweenJS.$.TimeoutAction)() ;
							break ;
							case !!(t = actions.interval) :
								tw = new (BetweenJS.$.IntervalAction)() ;
							break ;
							case !!(t = actions.animationframe) :
								tw = new (BetweenJS.$.AnimationFrameAction)() ;
							break ;
						}

						return tw
							.configure(t)
							.setHandlers(options)
					},
					/**
					 * Creates a decorator tween (slice, scale, reverse, repeat, delay).
					 * @param {Object} options - Tween options containing a decorators property
					 * @return {Object} The configured decorator tween instance
					 */
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
							.configure(t)
							.checkPhysical()
							.setHandlers(options)
					},
					/**
					 * Creates a group tween (parallel or serial).
					 * @param {Object} options - Tween options containing a groups property
					 * @return {Object} The configured group tween instance
					 */
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
							.configure(t)
							.checkPhysical()
							.setHandlers(options)
					}
				}
				// TWEENS
				var AbstractTween = Type.define({
					pkg:'::AbstractTween',
					domain:BetweenJSCore,
					inherits:Traceable,
					registered:false,
					stopOnComplete:true,
					position:ZERO,
					time:NaN,
					startTime:NaN,
					updater:undefined,
					isPlaying:false,
					isPhysical:false,
					constructor:AbstractTween = function AbstractTween(){
						AbstractTween.base.call(this) ;
						this.isPlaying = false ;
						this.time = Tween.DEFAULT_TIME ;
					},
					/**
					 * Configures the tween with options.
					 * @param {Object} options - Configuration with stopOnComplete, initposition, etc.
					 * @return {Object} This tween instance
					 */
					configure:function(options){
						this.stopOnComplete = options['stopOnComplete'] || true ;
						this.position = options['initposition'] || ZERO ;
						
						// UPDATER REQUIRED
						if(this instanceof Tween){
							var updater = BetweenJS.$.UpdaterFactory.create(options) ;
							this.setUpdater(updater) ;
						}
						
						return this ;
					},
					///////////
					//// TWEEN METHODS
					///////////
					/**
					 * Checks if the updater is physics-based and sets the isPhysical flag.
					 * @return {Object} This tween instance
					 */
					checkPhysical:function(){
						if(this.updater.isPhysical) this.isPhysical = true ;
						return this ;
					},
					/**
					 * Sets event handlers from an options object.
					 * @param {Object} options - Options object with onStart, onUpdate, onComplete, etc.
					 * @return {Object} This tween instance
					 */
					setHandlers:function(options){//		EVENTS
						this.copyHandlersFrom(options) ;
						return this ;
					},
					fire:function(type){
						type = type.replace(/^\w/, function($1){return $1.toUpperCase()}) ;
						var f = this['on'+type] ;
						var p = this['on'+type+'Params'] || [] ;
						if (!!f) f.apply(this, [].concat(p)) ;
						return this ;
					},
					/**
					 * Binds an event handler to a tween event type.
					 * @param {String} type - Event type (start, update, complete, etc.)
					 * @param {Function} func - Handler function
					 * @return {Object} This tween instance
					 */
					bind:function(type, func){
						type = type.replace(/^\w/, function($1){return $1.toUpperCase()}) ;
						this['on'+type] = func ;
						this['on'+type+'Params'] = [{type:type, target:this}] ;
						
						return this ;
					},
					/**
					 * Unbinds an event handler from a tween event type.
					 * @param {String} type - Event type to unbind from
					 * @param {Function} func - Handler function to remove
					 * @return {Object} This tween instance
					 */
					unbind:function(type, func){
						type = type.replace(/^\w/, function($1){return $1.toUpperCase()}) ;
						
						if(this['on'+type] == func){
							this['on'+type] = undefined ;
							this['on'+type+'Params'] = undefined ;
							delete this['on'+type] ;
							delete this['on'+type+'Params'] ;
						}
						
						return this ;
					},
					/**
					 * Sets the updater for this tween.
					 * @param {Object} updater - The updater instance
					 * @return {Object} This tween instance
					 */
					setUpdater:function(updater){
						this.updater = updater ;
						return this ;
					},
					/**
					 * Sets the current position of the tween, clamped to valid range.
					 * @param {Number} position - Time position
					 * @return {Object} This tween instance
					 */
					setPosition:function(position){
						if (position < ZERO) position = ZERO ;
						if (position > this.time) position = this.time ;
						
						this.position = position ;
						return this ;
					},
					/**
					 * Sets the start time based on the current ticker time minus position.
					 * @param {Number} position - Time position to offset from current ticker time
					 * @return {Object} This tween instance
					 */
					setStartTime:function(position){
						var EFT = BetweenJS.$.EnterFrameTicker ;
						this.startTime = EFT.time - position ;
						return this ;
					},
					/**
					 * Sets the total duration of the tween.
					 * @param {Number} time - Duration in seconds
					 * @return {Object} This tween instance
					 */
					setTime:function(time){
						this.time = time ;
						return this ;
					},
					/**
					 * Registers the tween with the enter frame ticker to start receiving updates.
					 * @param {*} [p] - Optional parameter
					 * @return {Object} This tween instance
					 */
					register:function(p){
						var EFT = BetweenJS.$.EnterFrameTicker ;
						
						if(!EFT.started) EFT.start() ;
						
						if(!this.registered){
							EFT.addTickerListener(this) ;
							this.registered = true ;
						}
						
						return this ;
					},
					/**
					 * Unregisters the tween from the enter frame ticker.
					 * @return {Object} This tween instance
					 */
					unregister:function(){
						if(this.registered){
							BetweenJS.$.EnterFrameTicker.removeTickerListener(this) ;
							this.registered = false ;
						}
						
						return this ;
					},
					/**
					 * Sets up the tween for playback: marks as playing, registers ticker, seeks to position.
					 * @return {Object} This tween instance
					 */
					setup:function(){
						this.isPlaying = true ;
						var p = this.position ;
						p = isNaN(p) ? ZERO : p >= this.time ? ZERO : p ;
						
						this.register() ;
						
						this.nextFrame(function(){
							this.seek(p) ;
						}) ;
						
						return this ;
					},
					/**
					 * Tears down the tween: stops playing and unregisters from ticker.
					 * @return {Object} This tween instance
					 */
					teardown:function(){
						this.isPlaying = false ;
						this.unregister() ;

						return this ;
					},
					/**
					 * Schedules a callback to be called on the next frame.
					 * @param {Function} closure - Callback function
					 * @param {*} [params] - Additional parameters for the callback
					 * @return {void}
					 */

					nextFrame:function(closure, params){
						var args = __SLICE__.call(arguments) ;
						
						this.next = {
							closure:args.shift(),
							params:args
						} ;
						
					},
					/**
					 * Triggers the next-frame callback if one is scheduled.
					 * @return {void}
					 */
					triggerNext:function(){
						if(!!this.next){
							this.next.closure.apply(this, this.next.params) ;
							
							this.next = undefined ;
							delete this.next ;
						}
					},
					
					/**
					 * Moves the tween to a specific position in time.
					 * @param {Number} position - Time position or percent if isPercent is true
					 * @param {Boolean} [isPercent] - Whether position is a percentage of total time
					 * @return {Object} This tween instance
					 */
					seek:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						this.setPosition(position) ;
						this.setStartTime(this.position) ;
						
						return this ;
					},
					/**
					 * Toggles the tween between play and stop states.
					 * @return {Object} This tween instance
					 */
					toggle:function(){
						return this.isPlaying ? this.stop() : this.play() ;
					},
					start:function(){
						return this.rewind().play() ;
					},
					/**
					 * Rewinds the tween to the beginning (position 0).
					 * @param {*} [position] - Ignored, present for signature compatibility
					 * @return {Object} This tween instance
					 */
					rewind:function(position){
						return this.seek(ZERO) ;
					},
					/**
					 * Moves to a position and plays from there.
					 * @param {Number} position - Time position or percent
					 * @param {Boolean} [isPercent] - Whether position is a percentage
					 * @return {Object} This tween instance
					 */
					gotoAndPlay:function(position, isPercent){
						position = !!isPercent ?this.time * position : position ;
						
						if(!this.isPlaying)
							return this.seek(position).play() ;
						else
							this.seek(position) ;
							// this.tick(this.position) ;
						
						return this ;
					},
					/**
					 * Moves to a position and stops there.
					 * @param {Number} position - Time position or percent
					 * @param {Boolean} [isPercent] - Whether position is a percentage
					 * @return {Object} This tween instance
					 */
					gotoAndStop:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						this.update(position) ;
						return this.isPlaying
							? this.stop()
							: this.draw() ;
					},
					/**
					 * Starts or resumes playback of the tween.
					 * @return {Object} This tween instance
					 */
					play:function(){
						if (!this.isPlaying) {
							this.setup()
								.fire('play') ;
						}
						return this ;
					},
					stop:function(){
						if (this.isPlaying) {
							this.draw() ;
							this.teardown().fire('stop') ;
						}
						return this ;
					},
					/**
					 * Restarts the tween from the beginning.
					 * @return {Object} This tween instance
					 */
					restart:function(){
						if(this.isPlaying) this.stop();
						this.seek(0);
						this.play();
						return this ;
					},
					/**
					 * Updates the tween using the updater for non-finite position values.
					 * @param {Number} position - The position value
					 * @return {Object} Update result from the updater
					 */
					checkFiniteTime:function(position){
						return this.updater.update(position) ;
					},
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					/**
					 * Called on each frame tick to update the tween position.
					 * @param {Number} position - The new time position
					 * @return {Boolean} True if the tween has completed and should stop
					 */
					tick:function(position){
						
						if (!this.isPlaying) {
							return true ;
						}
						
						var r = this.update(position) ;
						
						if(r.started){
							//
						}
						
						if(r.decayed){
							//
							if (!this.stopOnComplete) {
								
								this.seek(ZERO) ;
								
							} else {
								this.isPlaying = false ;
								return true ;
							}
						}
						
						return false ;
					},
					/**
					 * Internal update that handles non-finite times and infinite duration.
					 * @param {Number} position - The time position
					 * @return {Object} Update result with started, decayed, granted, reversed flags
					 */
					internalUpdate:function(position){
						
						if(!isFinite(position)){
							return this.checkFiniteTime(position) ;
						}
						
						if(this.time == __XXL__){
							this.setTime(this.updater.update(Infinity)) ;
						}
						
						var r = this.setPositionAndFeedback(position) ;
						
						if(r.granted) {
							this.updater.update(this.position) ;
						}
						
						return r ;
					},
					/**
					 * Sets the position and computes feedback flags (started, decayed, reversed, granted).
					 * @param {Number} position - The time position to set
					 * @return {Object} Info object with started, decayed, reversed, granted properties
					 */
					setPositionAndFeedback:function(position){
						
						var started, 
							decayed, 
							granted, 
							reversed;
						
						if(position == this.position){
							// 3 cases
							// 1. position == 0
							// 2. position == this.time ;
							// 3. else = in the middle
							
								// 2 cases
								// 1. ascending
								// 1. descending
								
							// in any case set OriginStart to THAT value for later,
							
							this.lastRequest = position ;
							// and return Blocking / Ignoring stuff
							
							granted = false ;
							started = false ;
							decayed = false ;
							
						}else{
							
							granted = true ;
							reversed = (this.position >= position) ;
							
							if(reversed){
								started = position <= ZERO ;
								decayed = (this.position - this.time) >= ZERO ;
							}else{
								started = this.position <= ZERO ;
								decayed = (position - this.time) >= ZERO ;
							}
						}
						
						this.setPosition(position) ;
						
						return this.info = {
							started:started,
							decayed:decayed,
							reversed:reversed,
							granted:granted
						} ;
					},
					/**
					 * Updates the tween to a given position and fires relevant events.
					 * @param {Number} position - The time position to update to
					 * @return {Object} Update result with started, decayed, granted, reversed flags
					 */
					update:function(position){
						
						if(!isFinite(position)){
							return this.internalUpdate(position) ;
						}
						
						var s = this.internalUpdate(position) ;
						
						/////////////////////////////////// EVENTS
						// START
						if(s.started) this.fire('start') ;
						
						// UPDATE
						if(s.granted) this.fire('update') ;
						
						// COMPLETE
						if(s.decayed) this.endReached = true ;
						
						return s ;
					},
					/**
					 * Applies the current tween state to the target and fires draw/complete events.
					 * @return {void}
					 */
					draw:function(){
						
						this.internalDraw() ;
						
						this.fire('draw') ;

						if(this.endReached){
							if(!!this.stopOnComplete) this.teardown() ;
							this.fire('update') ;
							this.fire('complete') ;
							this.endReached = false ;
						}
						
					},
					/**
					 * Applies the current updater state to the target.
					 * @return {void}
					 */
					internalDraw:function(){
						this.updater.draw() ;
					},
					//////// END CAUTION
					//////// END CAUTION
					//////// END CAUTION
					/**
					 * Creates a clone of this tween.
					 * @return {Object} A new tween instance with the same configuration
					 */
					clone:function(){
						var instance = this.newInstance() ;
						if (!!instance) {
							instance.copyFrom(this) ;
						}
						return instance ;
					},
					/**
					 * Creates a new empty instance of the same tween type.
					 * @return {Object} A new AbstractTween instance
					 */
					newInstance:function(){
					   return new AbstractTween() ;
					},
					/**
					 * Copies properties and handlers from a source tween.
					 * @param {Object} source - The source tween to copy from
					 * @return {void}
					 */
					copyFrom:function(source){
						this.position = source.position ;
						this.time = source.time ;
						this.ease = source.ease ;
						this.stopOnComplete = source.stopOnComplete ;
						this.updater = source.updater.clone() ;
						
						this.copyHandlersFrom(source);
					},
					/**
					 * Copies event handlers (start, play, stop, update, draw, complete) from a source.
					 * @param {Object} source - The source tween to copy handlers from
					 * @return {void}
					 */
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
							
							if(!!source[listener]){
								this[listener] = source[listener] ;
								
								if(!!source[listenerParams]) this[listenerParams] = source[listenerParams] ;
							}
							
						}
					},
					/**
					 * Destroys the tween, stopping it if currently playing.
					 * @return {void}
					 */
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
					statics:{
						SAFE_TIME:__SAFE_TIME__,
						DEFAULT_TIME:__XXL__
					},
					constructor:Tween = function Tween(){
						Tween.base.call(this) ;
					},
					newInstance:function(){
						return new Tween() ;
					},
					copyFrom:function(source){
						Tween.factory.copyFrom.apply(this, [source]) ;
					}
				}) ;

				// ACTIONS
				Pkg.write('actions', function(path){
					var AbstractActionTween = Type.define({
						pkg:'::AbstractActionTween',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						duration:Tween.SAFE_TIME,
						/**
						 * Base class for action tweens that execute callbacks at specific times.
						 */
						constructor:AbstractActionTween = function AbstractActionTween(){
							AbstractActionTween.base.call(this) ;
						},
						configure:function(options){
							AbstractActionTween.factory.configure.apply(this, [options]) ;
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.duration ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							if(r.decayed){
								if(r.reversed){
									this.rollback() ;
								} else{
									this.action() ;
								}
							}
							
							return r ;
						},
						internalDraw:function(){},
						action:function(){},
						rollback:function(){},
						copyFrom:function(source){
							this.time = source['time'] ;
							this.copyHandlersFrom(source) ;
						}
						
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
						/**
						 * Action tween that executes a function at completion.
						 */
						constructor:FunctionAction = function FunctionAction(){
							FunctionAction.base.call(this) ;
						},
						configure:function(options){
							FunctionAction.factory.configure.apply(this, [options]) ;

							this.func = options['closure'] ;
							this.params = options['params'] ;

							if (!!options['useRollback']) {
								if (!!options['rollbackClosure']) {
									this.rollbackFunc		 = options['rollbackClosure'] ;
									this.rollbackParams		 = options['rollbackParams'] || this.params ;
								} else {
									this.rollbackFunc		 = this.func ;
									this.rollbackParams		 = options['rollbackParams'] || this.params ;
								}
							}

							return this ;
						},
						action:function(){
							if (!!this.func) this.func.apply(this, [].concat(this.params)) ;
						},
						rollback:function(){
							if (!!this.rollbackFunc) this.rollbackFunc.apply(this, [].concat(this.rollbackParams)) ;
						},
						newInstance:function(){
							return new FunctionAction() ;
						},
						copyFrom:function(source){
							FunctionAction.factory.copyFrom.apply(this, [source]) ;
							
							this.func = 			source['func'] ;
							this.params = 			source['params'] ;
							this.useRollback = 		source['useRollback'] ;
							this.rollbackFunc =		source['params'] ;
							this.rollbackParams = 	source['params'] ;
							
						}
					}) ;
					var TimeoutAction = Type.define({
						pkg:'::TimeoutAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
						/**
						 * Action tween that executes a function once after a duration elapses.
						 */
						constructor:TimeoutAction = function TimeoutAction(){
							TimeoutAction.base.call(this) ;
						},
						configure:function(options){
							TimeoutAction.factory.configure.apply(this, [options]) ;
							
							this.duration = options['duration'] || options['time'] || Tween.SAFE_TIME ;
							
							return this ;
						},
						clear:function(){
							return this.stop() ;
						},
						newInstance:function(){
							return new TimeoutAction() ;
						},
						copyFrom:function(source){
							TimeoutAction.factory.copyFrom.apply(this, [source]) ;
						}
					}) ;
					var IntervalAction = Type.define({
						pkg:'::IntervalAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
						/**
						 * Action tween that repeatedly executes a function at each interval duration.
						 */
						constructor:IntervalAction = function IntervalAction(){
							IntervalAction.base.call(this) ;
						},
						configure:function(options){
							IntervalAction.factory.configure.apply(this, [options]) ;
							
							this.duration = options['duration'] || options['time'] || Tween.SAFE_TIME ;
							this.stopOnComplete = false ;
							return this ;
						},
						internalUpdate:function(position){

							if(!isFinite(position)){
								return this.duration ;
							}

							if(this.time == __XXL__){
								this.setTime(this.update(Infinity)) ;
							}
							if(!this.cancelled){
								if(position >= this.duration) {
									this.action() ;
									var elapsed = Math.floor(position / this.duration) * this.duration ;
									this.startTime += elapsed ;
									position -= elapsed ;
								}

							}else if(!!this.cancelled){
								this.setTime(Tween.SAFE_TIME) ;
							}

							return this.setPositionAndFeedback(position) ;
						},
						action:function(){
							this.func.apply(this, [].concat(this.params)) ;
						},
						clear:function(){
							this.cancelled = true ;
							return this ;
						},
						newInstance:function(){
							return new IntervalAction() ;
						},
						copyFrom:function(source){
							IntervalAction.factory.copyFrom.apply(this, [source]) ;
						}
					}) ;

					var LoadAction = Type.define({
						pkg:'::LoadAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
						/**
						 * Action tween that loads a URL via XHR and fires a callback on completion.
						 */
						constructor:LoadAction = function LoadAction(){
							LoadAction.base.call(this) ;
						},
						configure:function(options){
							LoadAction.factory.configure.apply(this, [options]) ;
							this.duration = Infinity ;
							this.url = options.url ;
							this.postData = options.postData ;
							this.keepInLocalCache = options.keepInLocalCache !== false ;
							this.forceBrowserNoCache = options.forceBrowserNoCache === true ;
							

							return this ;
						},
						internalUpdate:function(position){
							
							// Fire the XHR on first call regardless of position
							// (serial chain may pass Infinity or NaN on init frame)
							if(!this.loaded && !this.loading){
								this.action() ;
							}else if(this.loaded || this.failed){
								this.setTime(Tween.SAFE_TIME) ;
							}
							
							if(!isFinite(position)){
								return this.duration ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(Infinity)) ;
							}
							
							return this.setPositionAndFeedback(position) ;
						},
						action:function(){
							this.loading = true ;
							
							var cache = BetweenJS.filescache = BetweenJS.filescache || {} ;
							
							var bank = [
								function () {return new XMLHttpRequest()},
								function () {return new ActiveXObject("Msxml2.XMLHTTP")},
								function () {return new ActiveXObject("Msxml3.XMLHTTP")},
								function () {return new ActiveXObject("Microsoft.XMLHTTP")}
							] ;
							var generateXHR = function () {
								var xhttp = false;
								var l = bank.length ;
								for (var i = 0 ; i < l ; i++) {
									try {
										 xhttp = bank[i]();
									}
									catch (e) {
										 continue;
									}
									break;
								}
								return xhttp;
							} ;
							
							var r = generateXHR() ;
							if (!r) {
								this.failed = true ;
								this.loading = false ;
								return this ;
							}
							
							var th = this ;
							var url = this.url ;
							var keepInLocalCache = this.keepInLocalCache ;
							var forceBrowserNoCache = this.forceBrowserNoCache ;
							var postData = this.postData ;
							var loc = forceBrowserNoCache ? url + '?t=' + Date.now() : url ;
							
							if(keepInLocalCache && url in cache){
								th.response = cache[url] ;
								if(!!th.func) th.func.apply(th, [].concat(th.params)) ;
								th.loaded = true ;
								th.loading = false ;
								return th ;
							}
							
							var method = !!postData ? 'POST' : 'GET' ;
							r.open(method , loc, true) ;
							r.setRequestHeader('Accept','*/*') ;
							
							if(method == 'POST'){
								r.setRequestHeader('Content-type','application/x-www-form-urlencoded') ;
							}
							r.onreadystatechange = function () {
								if (r.readyState != 4) return;
								if (r.status != 200 && r.status != 304) {
									th.failed = true ;
									th.response = r.statusText || 'RequestError' ;
									th.loaded = true ;
									th.loading = false ;
									return ;
								}
								th.response = r.responseText ;
								if(keepInLocalCache) cache[url] = th.response ;
								if(!!th.func) th.func.apply(th, [].concat(th.params)) ;
								th.loaded = true ;
								th.loading = false ;
							}
							if (r.readyState == 4) return ;
							r.send(postData || null) ;
							
							return this ;
						},
						newInstance:function(){
							return new LoadAction() ;
						},
						copyFrom:function(source){
							LoadAction.factory.copyFrom.apply(this, [source]) ;
						}
					}) ;
					var AnimationFrameAction = Type.define({
						pkg:'::AnimationFrameAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
						/**
						 * Action tween that starts a requestAnimationFrame-based animation loop.
						 */
						constructor:AnimationFrameAction = function AnimationFrameAction(){
							AnimationFrameAction.base.call(this) ;
						},
						configure:function(options){
							var Animation = BetweenJS.$.Animation ;
							AnimationFrameAction.factory.configure.apply(this, [options]) ;
							
							this.duration = Tween.SAFE_TIME ;
							var tt = this ;
							var func = this.func ;
							var params = this.params ;
							
							this.anim = new Animation(function(){
								func.apply(tt, [].concat(params)) ;
							}) ;

							return this ;
						},
						action:function(){
							this.anim.start() ;
						},
						clear:function(){
							this.anim.stop() ;
							return this.stop() ;
						},
						newInstance:function(){
							return new AnimationFrameAction() ;
						},
						copyFrom:function(source){
							AnimationFrameAction.factory.copyFrom.apply(this, [source]) ;
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
						configure:function(options){
							var PropertyMapper = BetweenJS.$.PropertyMapper ;
							AddChildAction.factory.configure.apply(this, [options]) ;
							
							this.target = PropertyMapper.checkNode(options['target']) ;
							this.parent = PropertyMapper.checkNode(options['parent']) ;

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
						},
						newInstance:function(){
							return new AddChildAction() ;
						},
						copyFrom:function(source){
							AddChildAction.factory.copyFrom.apply(this, [source]) ;
							
							this.target = 			source['target'] ;
							this.parent = 			source['parent'] ;
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
						configure:function(options){
							var PropertyMapper = BetweenJS.$.PropertyMapper ;
							RemoveFromParentAction.factory.configure.apply(this, [options]) ;

							this.target = PropertyMapper.checkNode(options['target']) ;

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
						},
						newInstance:function(){
							return new RemoveFromParentAction() ;
						},
						copyFrom:function(source){
							RemoveFromParentAction.factory.copyFrom.apply(this, [source]) ;
							
							this.target = 			source['target'] ;
							this.parent = 			source['parent'] ;
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
						/**
						 * Base decorator that wraps another tween to modify its behavior.
						 */
						constructor:TweenDecorator = function TweenDecorator(){
							TweenDecorator.base.call(this) ;
						},
						checkPhysical:function(){
							if(this.baseTween.isPhysical) this.isPhysical = true ;
							
							return this ;
						},
						configure:function(options){
							TweenDecorator.factory.configure.apply(this, [options]) ;
							this.baseTween = options['baseTween'] ;
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
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.baseTween.update(position) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;

							this.baseTween.update(this.position) ;
							
							return r ;
						},
						internalDraw:function(){
							this.baseTween.draw() ;
						},
						copyFrom:function(source){
							this.copyHandlersFrom(source) ;
							this.baseTween = source['baseTween'] ;
						}
					}) ;
					// SUBCLASSES
					var SlicedTween = Type.define({
						pkg:'::SlicedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						begin:0,
						end:1,
						/**
						 * Decorator that plays a slice of a base tween's timeline.
						 */
						constructor:SlicedTween = function SlicedTween(){
							SlicedTween.base.call(this) ;
						},
						configure:function(options){
							SlicedTween.factory.configure.apply(this, [options]) ;
							
							this.begin = options['begin'] || ZERO ;
							this.end = options['end'] || ONE ;
							this.isPercent = options['isPercent'] || false ;
							
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){

								var time = this.basetime = this.baseTween.update(position) ;
								
								if(this.isPercent){
									this.begin = time * this.begin ;
									this.end = time * this.end ;
									this.isPercent = undefined ;
								}
								
								if(this.begin < 0) this.begin = time + this.begin ;
								
								var reqtime = this.end - this.begin ;
								
								if(reqtime < ZERO){
									reqtime += this.basetime ;
									this.negative = true ;
								}
								
								if(reqtime == ZERO && this.begin !== ZERO){
									reqtime = this.basetime ;
									this.negative = true ;
								}
								
								return reqtime == ZERO ? __SAFE_TIME__ : reqtime + __SAFE_HACK__ ;
							}
							
							if(this.time == __XXL__){
								
								var reqtime = this.update(-Infinity) ; 
								this.setTime(reqtime) ;
								
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							if(r.granted) {
								var pos 	= this.position,
									bt 		= this.baseTween ;
								
								pos = this.begin + pos ;
								if(this.negative && pos > this.basetime) {
									pos = pos - this.basetime ;
									
								}
								
								bt.update(pos) ;
							}
							
							return r ;
						},
						newInstance:function(){
							return new SlicedTween() ;
						},
						copyFrom:function(source){
							SlicedTween.factory.copyFrom.apply(this, [source]) ;
							
							this.end 			= source['end'] ;
							this.begin 			= source['begin'] ;
						}
					}) ;
					var ScaledTween = Type.define({
						pkg:'::ScaledTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						scale:1,
						/**
						 * Decorator that scales the duration of a base tween.
						 */
						constructor:ScaledTween = function ScaledTween(){
							ScaledTween.base.call(this) ;
						},
						configure:function(options){
							ScaledTween.factory.configure.apply(this, [options]) ;
							this.scale = options['scale'] || 1.0 ;

							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.baseTween.update(-Infinity) * this.scale + __SAFE_HACK__ ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var isLonger = this.scale >= 1 ;
							
							var pos;
							var uppos;
							
							if(isLonger){
								pos = position / this.scale ;
							}else{
								pos = position ;
							}
							
							var s ;
							var r = this.setPositionAndFeedback(pos) ;
							
							if(isLonger){
								uppos = this.position ;
							}else{
								uppos = position / this.scale ;
							}

							if(r.granted) s = this.baseTween.update(uppos) ;
							
							return s || r ;
						},
						newInstance:function(){
							return new ScaledTween() ;
						},
						copyFrom:function(source){
							ScaledTween.factory.copyFrom.apply(this, [source]) ;
							
							this.scale 			= source['scale'] ;
						}
					}) ;
					var ReversedTween = Type.define({
						pkg:'::ReversedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						/**
						 * Decorator that reverses the direction of a base tween.
						 */
						constructor:ReversedTween = function ReversedTween(){
							ReversedTween.base.call(this) ;
						},
						configure:function(options){
							ReversedTween.factory.configure.apply(this, [options]) ;
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.baseTween.update(-Infinity) + __SAFE_HACK__ ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;

							if(r.granted) this.baseTween.update( this.baseTween.time - this.position ) ;
							
							return r ;
						},
						newInstance:function(){
							return new ReversedTween() ;
						},
						copyFrom:function(source){
							ReversedTween.factory.copyFrom.apply(this, [source]) ;
						}
					}) ;
					var RepeatedTween = Type.define({
						pkg:'::RepeatedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						repeatCount:2,
						/**
						 * Decorator that repeats a base tween a specified number of times.
						 */
						constructor:RepeatedTween = function RepeatedTween(){
						   RepeatedTween.base.call(this) ;
						},
						configure:function(options){

							RepeatedTween.factory.configure.apply(this, [options]) ;

							this.repeatCount = options['repeatCount'] || 2 ;
							
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return (this.basetime = this.baseTween.update(position)) * this.repeatCount ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							if(r.granted) {
								
								
								var childpos = this.position ;
								if (childpos >= 0) {
									childpos -= childpos < this.time
										? (this.basetime * parseInt(childpos / this.basetime))
										: (this.time - this.basetime) ;
								}
								
								this.baseTween.update(childpos) ;
								
							}
							
							return r ;
						},
						newInstance:function(){
							return new RepeatedTween() ;
						},
						copyFrom:function(source){
							RepeatedTween.factory.copyFrom.apply(this, [source]) ;
							
							this.repeatCount = source['repeatCount'] ;
						}
					}) ;
					var DelayedTween = Type.define({
						pkg:'::DelayedTween',
						domain:BetweenJSCore,
						inherits:TweenDecorator,
						basetime:undefined,
						delay:ZERO,
						postDelay:ZERO,
						/**
						 * Decorator that adds a delay before and/or after a base tween.
						 */
						constructor:DelayedTween = function DelayedTween(){
						   DelayedTween.base.call(this) ;
						},
						configure:function(options){
							DelayedTween.factory.configure.apply(this, [options]) ;
							
							this.delay = options['delay'] || ZERO ;
							this.postDelay = options['postDelay'] || ZERO ;
							
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.baseTween.update(position) + (this.delay + this.postDelay + __SAFE_HACK__) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							if(r.granted) this.baseTween.update(this.position - this.delay) ;		
							
							return r ;
						},
						newInstance:function(){
							return new DelayedTween() ;
						},
						copyFrom:function(source){
							DelayedTween.factory.copyFrom.apply(this, [source]) ;
							
							this.delay				= source['delay'] ;
							this.postDelay			= source['postDelay'] ;
						}
					}) ;

				}) ;
				// GROUPS
				Pkg.write('groups', function(path){
					
					var GroupTween = Type.define({
						pkg:'::GroupTween',
						domain:BetweenJSCore,
						inherits:AbstractTween,
						a:undefined,
						b:undefined,
						c:undefined,
						d:undefined,
						elements:undefined,
						length:0,
						/**
						 * Iterates over all child elements, calling a function for each.
						 * @param {Function} f - Callback function (el, index, array)
						 * @param {Boolean} [reversed] - Whether to iterate in reverse order
						 * @return {Array} Array of return values
						 */
						bulkFunc:function(f, reversed){
							var els = [] ;
							var ret = [] ;
							
							if(reversed !== true){
								for(var i = 0 ; i < Infinity ; i++){
									var s = this.getElementAt(i) ;
									if(!!!s) break ;
									els[i] = s ;
									ret[i] = f(s, i, els) ;
									if(ret[i] === BREAK) break ;
									if(ret[i] === CONTINUE) continue ;
								}
							}else{
								var l = this.length ;
								for(;l > 0 ; l--){
									var i = l - 1 ;
									var s = this.getElementAt(i) ;
									if(!!!s) break ;
									els[i] = s ;
									ret[i] = f(s, i, els) ;
									if(ret[i] === BREAK) break ;
									if(ret[i] === CONTINUE) continue ;
								}
							}
							return ret ;
						},
						getElementAt:function(index){
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
									return this.elements[index - 4] ;
								break ;
							}
						},
						/**
						 * A tween that manages a group of child tweens.
						 * @param {Array} [elements] - Array of child tweens
						 * @param {Function} [closure] - Optional callback for each element
						 */
						constructor:GroupTween = function GroupTween(elements, closure){
							GroupTween.base.call(this) ;
							this.elements = [] ;
						},
						/**
						 * Fills the group with child tweens from an array.
						 * @param {Array} elements - Array of child tween objects
						 * @param {Function} [closure] - Optional callback for each element
						 * @return {void}
						 */
						fill:function(elements, closure){
							
							var l = elements.length, tar ;
							closure = closure || function(){} ;
							
							if (l >= 1) {
								this.a = elements[0] ;
								closure(this.a, l) ;
								if (l >= 2) {
									this.b = elements[1] ;
									closure(this.b, l) ;
									if (l >= 3) {
										this.c = elements[2] ;
										closure(this.c, l) ;
										if (l >= 4) {
											this.d = elements[3] ;
											closure(this.d, l) ;
											if (l >= 5) {
												this.elements = new Array(l - 4) ;
												for (var i = 4 ; i < l ; ++i) {
													tar = this.elements[i - 4] = elements[i] ;
													closure(tar, l) ;
												}
											}
										}
									}
								}
							}
							
							this.length = l ;
						},
						copyFrom:function(source){
							this.copyHandlersFrom(source) ;
							
							this.a					= source['a'] ;
							this.b					= source['b'] ;
							this.c					= source['c'] ;
							this.d					= source['d'] ;
							this.elements			= source['elements'] ;
							this.length				= source['length'] ;
						}
					}) ;
					
					// PARALLELTWEEN
					var ParallelTween = Type.define({
						pkg:'::ParallelTween',
						domain:BetweenJSCore,
						inherits:GroupTween,
						tweens:undefined,
						/**
						 * Group tween that plays all child tweens simultaneously.
						 */
						constructor:ParallelTween = function ParallelTween(){
							ParallelTween.base.call(this) ;
						},
						checkPhysical:function(){
							
							var isPhysical = false ;
							
							this.bulkFunc(function(el, i){
								if(el.isPhysical) {
									isPhysical = el.isPhysical ;
									return BREAK ;
								}
							}) ;
							
							this.isPhysical = isPhysical ;
							
							return this ;
						},
						configure:function(options){
							ParallelTween.factory.configure.apply(this, [options]) ;
							
							this.fill(options['tweens']) ;
							
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								var t = 0 ;
								this.bulkFunc(function(el, i, arr){
									var s = el.update(position) ;
									t = s > t ? s : t ;
								}, true) ;
								return t ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var drawables = [], duration ;
							
							var fff 	= this,
								r		= this.setPositionAndFeedback(position) ;
							
							if(r.granted){
								
								this.bulkFunc(function(el, i, arr){
									
									if(el.time == __XXL__){
										el.setTime(el.update(Infinity)) ;
										
									}
									
									var local = fff.position ;
									
									if(el.position <= el.time){
										el.update(local) ;
										drawables.push(el) ;
									}
								}) ;
								
							}
							this.drawables = drawables ;
							
							return r ;
						},
						internalDraw:function(){
							var d = this.drawables ;
							
							if(!d) return ;
							var i, l = d.length ;
							for(i = 0 ; i < l ; i++){
								d[i].draw() ;
								// not drawing when tween stopped (logical)
							}
							
						},
						newInstance:function(){
							return new ParallelTween() ;
						},
						copyFrom:function(source){
							ParallelTween.factory.copyFrom.apply(this, [source]) ;
						}
						
					}) ;
					
					// SERIALTWEEN
					var SerialTween = Type.define({
						pkg:'::SerialTween',
						domain:BetweenJSCore,
						inherits:GroupTween,
						tweens:undefined,
						drawables:undefined,
						/**
						 * Group tween that plays all child tweens in sequence.
						 */
						constructor:SerialTween = function SerialTween(){
							SerialTween.base.call(this) ;
						},
						checkPhysical:function(){
							
							var isPhysical = false ;
							
							this.bulkFunc(function(el, i){
								if(el.isPhysical) {
									isPhysical = el.isPhysical ;
									return BREAK ;
								}
							}) ;
							
							this.isPhysical = isPhysical ;
							
							return this ;
						},
						configure:function(options){
							SerialTween.factory.configure.apply(this, [options]) ;
							
							this.fill(options['tweens']) ;
							
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								
								var t = 0 ;
								this.bulkFunc(function(el, i, arr){
									
									t += el.update(position) ;
									
								}, true) ;
								return t ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}

							var drawables = [] ;
							
							var fff 		= this,
								d 			= 0, 
								ld 			= 0, 
								extra 		= 0, 
								oneframe 	= 0, 
								local 		= 0, 
									
								lf 			= this.position,
								r 			= this.setPositionAndFeedback(position),
								lr 			= this.lastRequest ;
							
							if(r.granted) {
								
								var local, s ;
								
								if(r.reversed){
									
									d = this.time ;
									ld = d ;
									
									extra = 0 ;
									
									this.bulkFunc(function(el, i, arr){
										
										if(el.time == __XXL__){
											el.setTime(el.update(-Infinity)) ;
										}
										
										oneframe = lf - fff.position ;
										
										if(fff.position >= ((d-=el.time)- oneframe) && ld >= fff.position){
											
											local = (fff.position - d) + extra ;
											
											if(local < 0){
												extra = local ;
												local = 0 ;
											}else{
												extra = 0 ;
											}
											
											s = el.update(local) ;
											drawables.push(el) ;
										}
										
										ld = d ;
										
									}, true) ;
									
								}else{
									
									extra = 0 ;
									d = 0 ;
									var newtime = 0 ;
									this.bulkFunc(function(el, i, arr){
										
										if(el.time == __XXL__){
											el.setTime(el.update(Infinity)) ;
										}
										
										if (lf <= (d+= el.time) && ld <= fff.position) {
											
											local = fff.position - (d - el.time) ;
											
											if(local > el.time){
												extra = extra + (local - el.time) ;
												local = el.time ;
											}else{
												extra = 0 ;
											}
											
											s = el.update(local) ;
											drawables.push(el) ;
										}
										
										ld = d ;
										
									})
								}
								
								
							}
							this.drawables = drawables ;
							
							return r ;
						},
						internalDraw:function(){
							var d = this.drawables ;
							if(!d) return ;
							var i, l = d.length ;
							for(i = 0 ; i < l ; i++){
								d[i].draw() ;
							}
						},
						newInstance:function(){
							return new SerialTween() ;
						},
						copyFrom:function(source){
							SerialTween.factory.copyFrom.apply(this, [source]) ;
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
					/**
					 * Gets or creates an active updater instance, caching it in the map.
					 * @param {Object} map - Map of existing updaters
					 * @param {Array} updaters - Array to push new updaters into
					 * @param {Object} options - Tween options
					 * @return {Updater} The active updater instance
					 */
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
					/**
					 * Transforms an array of cue point objects into a transposed object of arrays.
					 * @param {Array} cp - Array of cue point objects
					 * @return {Object} Object with property keys mapped to arrays of values per cue
					 */
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
					/**
					 * Normalizes property names, resolves mappers, and declares required source/dest values.
					 * @param {Updater} updater - The updater to configure
					 * @param {Object} props - Properties object with to, from, cuepoints
					 * @return {Object} The processed properties object
					 */
					isofy:function(updater, props){
						
						// props = JSON.parse(JSON.stringify(props)) ;
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						var to = props['to'] ;
						var fr = props['from'] ;
						var cp = props['cuepoints'] ;

						var isValue = function(val){
							return !isNaN(val) ;
						}

						var declareRequired = function(outputname, o, val){
							var s ;
							var n = outputname ;
							if(!(n in o)) {
								
								if(isValue(val)) {
									o[n] = PropertyMapper.REQUIRED ;
								}else{
									o[n] = {} ;
									
									for(var s in val){
										
										declareRequired(s, o[n], val[s]) ;
									}
								}
							}
						}
						 
						
						var mappers = {} ;
						var val ;
						var s, r ;
						
						// cuepoints no need REQUIREDSTUFF to be written but needs to write
						if(!!cp){
							mappers['cp'] = {} ;
							
							for(s in cp){
								r = PropertyMapper.checkCustomMapper(cp, s) ;
								mappers['cp'][r.outputname] = r ;

								val = cp[s] ;
								// Name conflict -> OVERWRITE DEST WITH CHOSEN CONVENTION
								if(r.outputname != s){
									delete cp[s] ;
									cp[r.outputname] = r.value ;
									s = r.outputname ;
								}
								if(val != r.value){
									cp[s] = r.value ;
								}
								// Units ? -> set units in updater cache
								if(!!r.units){
									if(!updater.units[s]) updater.units[s] = r.units ;
								}
								// isRelative ? -> set relative in updater cache
								if(!!r.isRelative){
									if(updater.relativeMap['cp.' + s] === undefined) updater.relativeMap['cp.' + s] = r.isRelative ;
								}
							}
						}


						

						if(!!to){

							mappers['to'] = {} ;
							
							for(s in to){
								r = PropertyMapper.checkCustomMapper(to, s) ;
								
								mappers['to'][r.outputname] = r ;
								val = to[s] ;
								// Name conflict -> OVERWRITE DEST WITH CHOSEN CONVENTION
								if(r.outputname != s){
									delete to[s] ;
									to[r.outputname] = r.value ;
									s = r.outputname ;
								}
								
								// treat value
								if(val != r.value){
									to[s] = r.value ;
								}
								
								// Units ? -> set units in updater cache
								if(!!r.units){
									if(!updater.units[s]) updater.units[s] = r.units ;
								}
								
								// isRelative ? -> set relative in updater cache
								if(!!r.isRelative){
									if(!updater.relativeMap['to.' + s]) updater.relativeMap['to.' + s] = r.isRelative ;
								}
								
							}
						}


						if(!!fr){
							
							mappers['from'] = {} ;

							for(s in fr){
								
								r = PropertyMapper.checkCustomMapper(fr, s) ;
								
								mappers['from'][r.outputname] = r ;
								val = fr[s] ;
								// Name conflict -> OVERWRITE DEST WITH CHOSEN CONVENTION
								if(r.outputname != s){
									delete fr[s] ;
									fr[r.outputname] = r.value ;
									s = r.outputname ;
								}
								if(val != r.value){
									fr[s] = r.value ;
								}
								// Units ? -> set units in updater cache
								if(!!r.units){
									if(!updater.units[s]) updater.units[s] = r.units ;
								}
								// isRelative ? -> set relative in updater cache
								if(!!r.isRelative){
									if(!updater.relativeMap['fr.' + s]) updater.relativeMap['fr.' + s] = r.isRelative ;
								}
							}
						}
						
						var out ;
						// Write back SOURCE from DEST
						for(s in to){

							r = mappers['to'][s] || PropertyMapper.checkCustomMapper(to, s) ;
							out = r.outputname ;
							declareRequired(out, fr, to[out]) ;
							
						}
						// Write back DEST from SOURCE
						for(s in fr){
							
							r = mappers['from'][s] || PropertyMapper.checkCustomMapper(fr, s) ;
							out = r.outputname ;
							declareRequired(out, to, fr[out]) ;
						}

						if(!!cp){
							for(s in cp){
								r = mappers['cp'][s] || PropertyMapper.checkCustomMapper(cp, s) ;
								out = r.outputname ;
								declareRequired(out, to, cp[out]) ;
								declareRequired(out, fr, cp[out]) ;
							}
						}
						

						if(!props['from']) props['from'] = fr ;
						if(!props['to']) props['to'] = to ;
						
						return props ;
					},
					/**
					 * Processes tween options, creating updaters and nested child updaters as needed.
					 * @param {Object} map - Map of existing updaters
					 * @param {Array} updaters - Array to collect created updaters
					 * @param {Object} options - Tween options (target, to, from, ease, time, cuepoints)
					 * @return {Object} The processed user data descriptor
					 */
					treat:function(map, updaters, options){
						
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						var updater = UpdaterFactory.getActiveUpdater(map, updaters, options) ;

						updater.cache = {} ;

						var parent, child ;

						var desc = {
							'to':options['to'] || {},
							'from':options['from'] || {},
							'cuepoints':options['cuepoints'] || {}
						}

						var ease = options['ease'] ;
						var time = ease instanceof Physical ? BetweenJS.$.Tween.SAFE_TIME : options['time'] ;
						var target = options['target'] ;
						updater.target = target ;
						
						desc = this.isofy(updater, desc) ;
						
						updater.time = time ;
						updater.ease = ease ;
						updater.isPhysical = ease instanceof Physical ;
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
										
										if(value == PropertyMapper.REQUIRED){
											updater[action](name, PropertyMapper.REQUIRED) ;
										}else if (typeof value == "number") {
											updater[action](name, parseFloat(value)) ;
										}else{
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
					/**
					 * Creates an updater (or BulkUpdater) from tween options.
					 * @param {Object} options - Tween options
					 * @return {Updater|BulkUpdater} The created updater instance
					 */
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
					/**
					 * Creates an updater directly from options (convenience wrapper around make).
					 * @param {Object} options - Tween options
					 * @return {Updater|BulkUpdater} The created updater instance
					 */
					create:function(options){
						var updater = this.make(options) ;
						return updater ;
					},
					
					// ENTER REGISTRY UNIT
					/**
					 * Acquires a map/updaters pair from the object pool or creates new ones.
					 * @param {Object} map - Map placeholder (overwritten by pooled ref)
					 * @param {Array} updaters - Array placeholder (overwritten by pooled ref)
					 * @return {Object} Object with map and updaters properties
					 */
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
					/**
					 * Returns a map/updaters pair to the object pool for reuse.
					 * @param {Object} map - Map to clear and pool
					 * @param {Array} updaters - Array to clear and pool
					 * @return {void}
					 */
					unregisterUpdaters:function(map, updaters){
						for (var p in map) delete map[p] ;
						updaters.length = 0 ;
						this.mapPool[this.poolIndex] = map ;
						this.listPool[this.poolIndex] = updaters ;
						++ this.poolIndex ;
						return ;
					}
				}
				// UPDATER
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
					maxDuration:ZERO,
					time:ZERO,
					position:ZERO,
					isResolved:false,
					units:{},
					/**
					 * Creates an Updater that manages property interpolation over time.
					 */
					constructor:Updater = function Updater(){
						Updater.base.call(this) ;

						this.reset() ;
					},
					/**
					 * Resets the updater state, clearing all resolved values.
					 * @return {void}
					 */
					reset:function(){
						this.isResolved = false ;
						this.source = {} ;
						this.destination = {} ;
						this.relativeMap = {} ;
						this.units = {} ;
						this.cuepoints = {} ;
						this.duration = {} ;
						this.position = 
						this.maxDuration = ZERO ;
					},
					/**
					 * Calculates and stores the interpolation factor for a given position.
					 * @param {Number} position - Current time position
					 * @return {Updater} This updater for chaining
					 */
					setFactor:function(position){
						var factor = -Infinity ;
						if(this.isPhysical){
							if(position > factor){
								factor = position / this.time ;
							}
						}else{
							if(position > factor){
								var s ;
								if(position < this.time){
									s = this.ease.calculate(position, ZERO, ONE, this.time) ;
								}else{
									s = ONE ;
								}
								factor = s ;
							}
						}
						
						this.factor = factor ;
						
						return this ;
					},
					/**
					 * Sets the total duration for the updater.
					 * @param {Number} time - Duration
					 * @return {void}
					 */
					setTime:function(time){
						this.time = time ;
					},
					/**
					 * Sets the current position within the tween timeline.
					 * @param {Number} position - Current position
					 * @return {void}
					 */
					setPosition:function(position){
						this.position = position ;
					},
					/**
					 * Updates the updater to a given position, resolving values and calculating new state.
					 * @param {Number} position - Time position to update to
					 * @return {void}
					 */
					update:function(position){
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						this.resolveValues(true) ;
						
						this.setPosition(position) ;
						this.setFactor(this.position) ;
						this.updateObject() ;
						
					},
					/**
					 * Checks what time would result from an infinite position without modifying state.
					 * @param {Number} position - Infinite position (Infinity or -Infinity)
					 * @return {Number} The resolved absolute time
					 */
					checkTime:function(position){
						var t = this.resolveValues(false) ;
						return t > ZERO ? t : -t ;
					},
					/**
					 * Resolves all source and destination values, computing durations for physical eases.
					 * @param {Boolean} forReal - Whether to mark as resolved for real (prevents re-resolution)
					 * @return {Number} The total time
					 */
					resolveValues:function(forReal){
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						
						if(forReal){
							
							if(this.once){
								return this.time ;
							}else{
								this.once = true ;
							}
							
						}

						if(this.isResolved) return this.time ;

						var key,
							target = this.target,
							source = this.source,
							dest = this.destination,
							rMap = this.relativeMap,
							d = this.duration,
							usersource = this.userData['from'],
							userdest = this.userData['to'],
							duration,
							maxDuration = ZERO ;
						
						for (key in source) {
							if (usersource[key] == PropertyMapper.REQUIRED) {
								source[key] = this.getIn(key) ;
							}
							
							if (!!rMap['fr.' + key]) {	
								source[key] += this.getIn(key) ;
							}
						}

						for (key in dest) {

							if (userdest[key] == PropertyMapper.REQUIRED) {
								dest[key] = this.getIn(key) ;
							}
							
							if (!!rMap['to.' + key]) {
								dest[key] += this.getIn(key) ;
							}

							if(this.isPhysical){
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
							var cpduration = ZERO ;
							for (i = 0 ; i < l ; ++i) {

								var prev = cur || first ;
								
								if (rMap['cp.' + key]) {
									(cpVec[i] += this.getIn(key)) ;
								}

								cur = cpVec[i] ;

								if(this.isPhysical){
									cpduration += this.ease.getDuration(prev, cur > prev ? cur - prev : prev - cur) ;
									if(cpVec[i+1] === undefined){
										cpduration += this.ease.getDuration(cur, last > cur ? last - cur : cur - last) ;
									}
								}
							}
							if(this.isPhysical){
								d[key] = cpduration ;
								if (maxDuration < cpduration) {
									maxDuration = cpduration ;
								}
							}
						}
						
						if(this.isPhysical){
							
							this.maxDuration = maxDuration ;
							this.setTime(this.maxDuration) ;
							
						}

						this.isResolved = true ;
						return this.time ;
					},
					/**
					 * Interpolates all target properties based on the current factor, handling cue points.
					 * @return {void}
					 */
					updateObject:function(){

						var factor = this.factor ;
						
						var t = this.target,
							e = this.ease,
							d = this.destination,
							s = this.source,
							cp = this.cuepoints,
							dur = this.duration,
							position = this.position,
							invert = ONE - factor,
							cpVec, a, b, l, ip, it, p1, p2,
							name, val ;
						
						
						for (var name in d) {

							a = s[name] ;
							b = d[name] ;
							
							if(factor == ZERO){
								this.store(name, a) ;
								continue ;
								
							}else if(factor == ONE){
								this.store(name, b) ;
								continue ;
							}
							
							if(!!!cp[name]){
								if(this.isPhysical){
									val = e.calculate(position, a, b - a) ;
								}else{
									val = a * invert + b * factor ;
								}
							}else{
								if (factor != ONE && !!(cpVec = this.cuepoints[name])) {
									l = cpVec.length ;
									if (l == 1) {
										val = a + factor * (2 * invert * (cpVec[0] - a) + factor * (b - a)) ;
									} else {
										if (factor < ZERO)
											ip = ZERO ;
										else if (factor > ONE)
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
										
										val = p1 + (it * (2 * (1 - it) * (cpVec[ip] - p1)) + it * ((p2 - p1))) ;
									}
								} else {
									val = a * invert + b * factor ;
								}
							}

							this.store(name, val) ;
						}
					},
					/**
					 * Stores an interpolated value for later application.
					 * @param {String} name - Property name
					 * @param {Number} val - Interpolated value
					 * @return {void}
					 */
					store:function(name, val){
						this.value = this.value || {} ;
						this.value[name] = val ;
					},
					/**
					 * Applies all stored interpolated values to the target object.
					 * @return {void}
					 */
					draw:function(){
						var v = this.value, val ;
						for(var name in v){
							val = v[name] ;
							this.setIn(name, val) ;
						}
					},
					/**
					 * Sets a source (from) value for a property.
					 * @param {String} name - Property name (may start with > for relative)
					 * @param {*} value - Source value
					 * @return {void}
					 */
					setSourceValue:function(name, value){
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.source[name] = value ;
						this.relativeMap['source.' + name] = isRelative ;
					},
					/**
					 * Sets a destination (to) value for a property.
					 * @param {String} name - Property name (may start with > for relative)
					 * @param {*} value - Destination value
					 * @return {void}
					 */
					setDestinationValue:function(name, value){
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.destination[name] = value ;
						this.relativeMap['dest.' + name] = isRelative ;
					},
					/**
					 * Adds a cue point value for a property at a specific point in the timeline.
					 * @param {String} name - Property name
					 * @param {Number} value - Cue point value
					 * @return {void}
					 */
					addCuePoint:function(name, value){
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;

						var cuepoints = this.cuepoints[name] ;
						if (cuepoints === undefined) this.cuepoints[name] = cuepoints = [] ;
						cuepoints.push(value) ;
						// dont remember why this is no longer needed... 
						// this.relativeMap['cuepoints.' + name + '.' + (cuepoints.length - 1)] = isRelative ;
					},
					/**
					 * Reads a property value from the target using the appropriate getter.
					 * @param {String} name - Property name
					 * @return {*} The current property value
					 */
					getIn:function(name){
						if(isNOTDOM(this.target)) return this.target[name] ;
						var ss = BetweenJS.$.PropertyMapper.cache[name]['getMethod'](this.target, name, this.units[name]) ;
						return ss ;
					},
					/**
					 * Writes a property value to the target using the appropriate setter.
					 * @param {String} name - Property name
					 * @param {*} value - Value to set
					 * @return {void}
					 */
					setIn:function(name, value){

						if(isNOTDOM(this.target)) {
							this.target[name] = value ;
							return ;
						}
						BetweenJS.$.PropertyMapper.cache[name]['setMethod'](this.target, name, value, this.units[name]) ;
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
				// UPDATERPROXY
				var UpdaterProxy = Type.define({
					pkg:'::UpdaterProxy',
					domain:BetweenJSCore,
					inherits:Traceable,
					parent:undefined,
					child:undefined,
					propertyName:undefined,
					time:ZERO,
					isResolved:false,
					isPhysical:false,
					constructor:UpdaterProxy = function UpdaterProxy(parent, child, propertyName){
						UpdaterProxy.base.call(this) ;

						this.parent = parent ;
						this.child = child ;
						this.propertyName = propertyName ;
						this.isPhysical = this.parent.isPhysical ;
					},
					setTime:function(time){
						this.time = time ;
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > ZERO ? t : -t ;
					},
					resolveValues:function(forReal){
						
						if(forReal){
							if(this.once){
								return this.time ;
							}else{
								this.once = true ;
							}
							
						}else{
							if(this.isResolved){
								return this.time ;
							}
						}
						
						var p = this.parent ;
						var c = this.child ;
						var prm = p.relativeMap ;
						var crm = c.relativeMap ;
						var dest_reg = /dest[.]/ ;
						var source_reg = /source[.]/ ;
						
						if(!!p.relativeMap['to.'+this.propertyName]){
							for(var s in crm){
								if(dest_reg.test(s)) {
									crm[s.replace(dest_reg, 'to.')] = true ;
								}
							}
						}

						if(!!p.relativeMap['fr.'+this.propertyName]){
							for(var s in crm){
								if(source_reg.test(s)) {
									crm[s.replace(source_reg, 'fr.')] = true ;
								}
							}
						}

						if(!p.isResolved) p.resolveValues() ;
						
						var time = p.time ;
						
						if(this.isPhysical){
							
							
							if(!c.isResolved) c.resolveValues() ;
							
							if(time > c.time) c.setTime(time) ;
							else {
								time = c.time ;
								if(time > p.time) p.setTime(time) ;
							}
						}
						
						this.setTime(time) ;
						
						this.isResolved = true ;
						return this.time ;
					},
					update:function(position){
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						this.resolveValues(true) ;
						
						var pos = this.isPhysical ? this.child.time * this.parent.factor : position ;
						
						this.child.update(pos) ;
					},
					draw:function(){
						this.child.draw() ;
						this.child.target.__units = this.child.units ;
						this.parent.setIn(this.propertyName, this.child.target) ;
					},
					clone:function(source){
						return new UpdaterProxy(this.parent, this.child, this.propertyName) ;
					},
					destroy:function(){
						UpdaterProxy.factory.destroy.call(this) ;
					}
				}) ;
				// BULKUPDATER
				var BulkUpdater = Type.define({
					pkg:'::BulkUpdater',
					domain:BetweenJSCore,
					inherits:Poly,
					target:undefined,
					time:ZERO,
					isResolved:false,
					isPhysical:false,
					/**
					 * Groups multiple updaters for a single target.
					 * @param {Object|Element} target - The animation target
					 * @param {Array} updaters - Array of child updaters
					 */
					constructor:BulkUpdater = function BulkUpdater(target, updaters){
						var isPhysical = false ;
						
						this.target = target ;
						
						BulkUpdater.base.apply(this, [updaters, function(el){
							if(el.isPhysical) isPhysical = true ;
						}]) ;
						
						this.isPhysical = isPhysical ;
						this.length = updaters.length ;
					},
					setTime:function(time){
						this.time = time ;
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > 0 ? t : -t ;
					},
					resolveValues:function(forReal){
						
						if(forReal){
							if(this.once){
								return this.time ;
							}else{
								this.once = true ;
							}
						}else{
							if(this.isResolved){
								return this.time ;
							}
						}
						
						var time = this.time ;
						
						this.bulkFunc(function(c){
							c.resolveValues() ;
							time = c.time > time ? c.time : time ;
							c.setTime(time) ;
							time = c.time ;
						}) ;
						
						this.setTime(time) ;
						
						this.isResolved = true ;
						return this.time ;
					},
					update:function(position){
						var Tween = BetweenJS.$.Tween ;
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						this.resolveValues(true) ;
						
						var bulk = this ;
						
						var a = this.getElementAt(0) ;
						this.bulkFunc(function(c){
							c.update(position) ;
						}) ;
					},
					draw:function(){
						this.bulkFunc(function(el){
							el.draw() ;
						})
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
					constructor:CustomMapper = function CustomMapper(pattern, methods){
						this.pattern = pattern || CustomMapper.ALL ;

						this.parseMethod = methods['parseMethod'] ;
						this.getMethod = methods['getMethod'] ;
						this.setMethod = methods['setMethod'] ;

					},
					check:function(type, inputname, val){
						var val = type[inputname] || val ;
						
						if(val.constructor == Array){ // CUEPOINTS
							var bb = false ;
							var l = val.length ;
							var units, isRelative ;
							var outputname ;
							for(var i = 0 ; i < l ; i++){
								
								var vv = val[i] ;
								var r = this.parseMethod(type, inputname, vv, vv == '__REQUIRED__') ;
								
								val[i] = r.value ;
								outputname = r.outputname ;
								
								if(r.units !=='') units = r.units ;

								isRelative = r.isRelative ;
								
								bb = Boolean(bb || r.block) ;
								
								if(bb) break ;
							}
							
							return {
								outputname:outputname,
								inputname:inputname,
								value:val,
								units:units,
								isRelative:isRelative,
								custom:this,
								block:bb
							} ;
						}else{
							return this.parseMethod(type, inputname, val, val == '__REQUIRED__') ;
						}
					}
				}) ;
				
				var 
					COLOR_reg						= /((border|background)?color|background)$/i,
					ALPHA_reg						= /alpha|opacity/gi,
					SCROLL_reg 						= /scroll-?(left|top)?/gi,
					TRANSFORM_reg					= /^transform$/i,
					ALL_reg							= /(.*)$/,
					NAMEUNIT_reg 					= /((::)(%|c(m|h)|r?e(x|m)|in|p(x|c|t)|mm|v(h|w|m(in|ax)?)))$/i,
					VALUEUNIT_reg 					= /(%|c(m|h)|r?e(x|m)|in|p(x|c|t)|mm|v(h|w|m(in|ax)?))$/i,
					CAPSTODASH_reg 					= /[A-Z](?=[a-z])/g,
					CSS_SHORTCUT_reg 				= /(border)(width|color)/gi,
					BACKGROUND_reg  				= /backgroundcolor/i,
					MS_ALPHA_reg 					= /alpha\(opacity=|\)/g ;
				
				
				var PropertyMapper = Type.define({
					pkg:'::PropertyMapper',
					domain:BetweenJSCore,
					statics:{
						REQUIRED:'__REQUIRED__',
						cache:{},
						/**
						 * Checks if a property name matches a custom mapper and returns parsed info.
						 * @param {Object} type - The properties object (to, from, or cuepoints)
						 * @param {String} name - The property name to check
						 * @return {Object} Parsed result with outputname, value, units, isRelative, custom, block
						 */
						checkCustomMapper:function(type, name){

							var CustomMappers = BetweenJS.$.PropertyMapper.CustomMappers ;
							var val = type[name] ;
							var i, l, custom ;
							
							var inputname, outputname, units, isRelative ;
							
							var customs = CustomMappers ;
							l = customs.length ;
							
							var s ; 
							for(i = 0 ; i < l ; i ++){
								
								custom = customs[i] ;
								var tt = type[name] ;
								
								// KICK OUT UNDESIRABLES
								if(custom.pattern.test(name)){
									
									var s = custom.check(type, name, tt) ;
									if(s.block){
										// FOUND !!!!!
										break ;
									}

								}
								
								
							}
							
							/// REFERENCING CUSTOM AS A PARSER FOR THIS OUTPUTNAME
							var cached = PropertyMapper.cache[s.outputname] ;
							if(!cached) PropertyMapper.cache[s.outputname] = s.custom ;
							/// REFERENCING CUSTOM AS A PARSER FOR THIS OUTPUTNAME

							return s ;
						},
						CustomMappers:[
							
							/** Custom mapper for CSS transform properties. */
							new CustomMapper(TRANSFORM_reg, {
								parseMethod:function(type, inputname, val, required){
									return {
										inputname:inputname,
										outputname:'transform',
										units:'',
										value:val,
										isRelative:false,
										custom:this,
										block:true
									};
								},
								getMethod:function(tg, n){
									return BetweenJS.$.PropertyMapper.transformGet(tg);
								},
								setMethod:function(tg, n, val){
									BetweenJS.$.PropertyMapper.transformSet(tg, val);
								}
							}),
							
							/** Custom mapper for all other (non-specialized) properties. */
							new CustomMapper(ALL_reg, {
								parseMethod:function(type, inputname, val, required){

									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[name] : val ;
									

									var name = PropertyMapper.replaceCapitalToDash(inputname) ;
									var outputname = name ;
									var units ;
									var isRelative ;

									// UNITS FIRST
									var un = PropertyMapper.checkForUnits(name, val) ;
									units = un.units ;
									
									outputname = un.name ;
									val = un.value ;
									
									// THEN ISRELATIVE
									var relative = PropertyMapper.replaceRelative(outputname) ;
									var isRelative = relative.isRelative ;
									outputname = relative.name ;
									// ANYWAY RETURNING THIS
									var config = {
										inputname:inputname,
										outputname:outputname,
										units:units,
										value:val,
										isRelative:isRelative,
										custom:this,
										block:false
									}
									
									return config ;
								},
								getMethod:function getMethodAll(tg, n, unit){
									return BetweenJS.$.PropertyMapper.simpleGet(tg, n, unit || '') ;
								},
								setMethod:function setMethodAll(tg, n, val, unit){
									return BetweenJS.$.PropertyMapper.simpleSet(tg, n, val, unit || '') ;
								}
							}),
							
							/** Custom mapper for CSS color properties. */
							new CustomMapper(COLOR_reg, {
								parseMethod:function(type, inputname, val, required){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[inputname] : val ;
									var name = PropertyMapper.replaceCapitalToDash(inputname) ;
									var outputname = name ;
									
									// REPLACE IN CASE OF 'background' shorthand -> to 'background-color'
									outputname = outputname == 'background' ? outputname + '-color' : outputname ;
									
									// THEN ISRELATIVE
									var relative = PropertyMapper.replaceRelative(outputname) ;
									var isRelative = relative.isRelative ;
									outputname = relative.name ;
									
									if(required){
										val = {
											r:val,
											g:val,
											b:val,
											a:val
										}
									}else{
										val = BetweenJS.$.Color.toColorObj(val) ;
									}

									var config = {
										inputname:inputname,
										outputname:outputname,
										value:val,
										units:'',
										isRelative:isRelative,
										custom:this,
										block:true
									}

									return config ;
								},
								getMethod:function getMethodColor(tg, n){
									return BetweenJS.$.PropertyMapper.colorGet(tg, n) ;
								},
								setMethod:function setMethodColor(tg, n, val){
									if('v' in val){
										var rgb = BetweenJS.$.Color.HSVtoRGB(val) ;
										val.r = rgb.r;
										val.g = rgb.g;
										val.b = rgb.b;
									}else if('l' in val){
										var rgb = BetweenJS.$.Color.HSLtoRGB(val) ;
										val.r = rgb.r;
										val.g = rgb.g;
										val.b = rgb.b;
									}
									return BetweenJS.$.PropertyMapper.colorSet(tg, n, val) ;
								}
							}),
							
							/** Custom mapper for CSS alpha/opacity properties. */
							new CustomMapper(ALPHA_reg, {
								parseMethod:function(type, inputname, val, required){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[inputname] : val ;
									
									var outputname = inputname ;

									var relative = PropertyMapper.replaceRelative(outputname) ;
									var isRelative = relative.isRelative ;
									
									outputname = 'opacity' ;
									
									var config = {
										inputname:inputname,
										outputname:outputname,
										value:val,
										units:'',
										isRelative:isRelative,
										custom:this,
										block:true
									}
									
									return config ;
								},
								getMethod:function getMethodAlpha(tg, n){
									return BetweenJS.$.PropertyMapper.alphaGet(tg, n) ;
								},
								setMethod:function setMethodAlpha(tg, n, val){
									return BetweenJS.$.PropertyMapper.alphaSet(tg, n, val) ;
								}
							}),
							/** Custom mapper for scroll position properties. */
							new CustomMapper(SCROLL_reg, {
								parseMethod:function(type, inputname, val, required){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[inputname] : val ;
									
									var outputname = inputname ;

									var relative = PropertyMapper.replaceRelative(outputname) ;
									var isRelative = relative.isRelative ;
									
									outputname = relative.name ;

									var config = {
										inputname:inputname,
										outputname:outputname,
										value:val,
										units:'',
										isRelative:isRelative,
										custom:this,
										block:true
									}
									
									return config ;
								},
								getMethod:function getMethodScroll(tg, n){
									return BetweenJS.$.PropertyMapper.scrollGet(tg, n) ;
								},
								setMethod:function setMethodScroll(tg, n, val){
									return BetweenJS.$.PropertyMapper.scrollSet(tg, n, val) ;
								}
							})
							
						],
						/**
						 * Detects units embedded in a property name via :: syntax.
						 * @param {String} name - Property name possibly containing ::unit suffix
						 * @return {Object} Object with name and unit properties
						 */
						detectNameUnits:function(name){
							
							var unit ;
							var n = name.replace(NAMEUNIT_reg, function($1, $2){
								unit = arguments[3] ;
								return '' ;
							}) ;
							return {name:n, unit:unit} ;
						},
						/**
						 * Detects CSS units in a string value.
						 * @param {String} value - Value string possibly ending with a CSS unit
						 * @return {Object} Object with unit and numeric value
						 */
						detectValueUnits:function(value){

							if(typeof(value) != 'string') return {unit : ''} ;
							
							var unit ;

							value = value.replace(VALUEUNIT_reg, function($1, $2){
								unit = arguments[0] ;
								return '' ;
							}) ;

							return {unit:unit, value:parseFloat(value)} ;
						},
						/**
						 * Checks both name and value for unit specifications.
						 * @param {String} name - Property name
						 * @param {*} val - Property value
						 * @return {Object} Object with units, name, and value
						 */
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
						/**
						 * Converts camelCase property names to dash-case.
						 * @param {String} name - camelCase property name
						 * @return {String} Dash-case property name
						 */
						replaceCapitalToDash:function(name){
							
							return name.replace(CAPSTODASH_reg, function($1){
								return '-' + $1.toLowerCase() ;
							}) ;
						},
						/**
						 * Detects and strips the relative prefix from a property name.
						 * @param {String} name - Property name starting with > for relative
						 * @return {Object} Object with isRelative bool and cleaned name
						 */
						replaceRelative:function(name){
							var o = {isRelative:REL_reg.test(name)} ;
							o.name = o.isRelative ? name.substr(1) : name ;
							return o ;
						},
						/**
						 * Gets a computed CSS style value from a DOM element.
						 * @param {Element} tg - The target DOM element
						 * @param {String} name - CSS property name
						 * @return {String} The computed style value
						 */
						getStyle:function(tg, name){
							var val = '' ;
							if(window.getComputedStyle){
								
								name = CSS_SHORTCUT_reg.test(name) ? name.replace(CSS_SHORTCUT_reg, '$1Top$2') : name ;
								val = (tg.style[name] !== '') ? tg.style[name] : window.getComputedStyle (tg, '')[name] ;
								
							}else if(tg.currentStyle){
								try{
									val = name == 'background-color' ? tg.currentStyle['backgroundColor'] : this.cssHackGet(tg, name) ;
								}catch(e){}
							}
							
							return val ;
						},
						/**
						 * Sets a CSS style property on a DOM element.
						 * @param {Element} tg - The target DOM element
						 * @param {String} name - CSS property name
						 * @param {*} val - Property value
						 * @return {void}
						 */
						setStyle:function(tg, name, val){
							tg['style'][name] = val ;
						},
						/**
						 * IE fallback to get computed CSS values.
						 * @param {Element} el - The target DOM element
						 * @param {String} name - CSS property name
						 * @return {String} The computed style value
						 */
						cssHackGet:function(el, name){
							if (el.currentStyle) {
								
								if (BACKGROUND_reg.test(name)) {
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
						/**
						 * Gets the current scroll position of a target.
						 * @param {Object|Element} target - The scrollable target (window, document, or element)
						 * @param {String} name - Property name (scrollTop, scrollLeft)
						 * @param {String} [unit] - Optional unit
						 * @return {Number} The scroll position
						 */
						scrollGet:function(target, name, unit) {
							return (target === window || target === document) ?
							(
								this[(name == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] ||
								(PropertyMapper.isIEunder9 && document.documentElement[name]) ||
								document.body[name]
							) :
							target[name] ;
						},
						/**
						 * Sets the scroll position of a target.
						 * @param {Object|Element} target - The scrollable target
						 * @param {String} name - Property name (scrollTop, scrollLeft)
						 * @param {Number} val - Scroll position value
						 * @param {String} [unit] - Optional unit
						 * @return {void}
						 */
						scrollSet:function(target, name, val, unit) {
							if(target === window || target === document){
								try{
									this[(name == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] = parseInt(val) ;
								}catch(e){
									if(!PropertyMapper.isIEunder8) document.documentElement[name] = parseInt(val) ;
									else document.body[name] = parseInt(val) ;
								}
							}else{
								target[name] = parseInt(val) ;
							}
						},
						/**
						 * Gets the opacity value of a target (0-100 scale).
						 * @param {Object|Element} target - The target element
						 * @param {String} pname - Property name
						 * @return {Number} Opacity value from 0 to 100
						 */
						alphaGet:function(target, pname){
							var val ;
							if(window.getComputedStyle){
								val = this.getStyle(target, 'opacity') ;
								val = val * 100 ;
							} else{
								val = this.getStyle(target, 'filter') ;
								val = val == '' ? 100 : val.replace(MS_ALPHA_reg, '') ;
							}
							
							return val ;
						},
						/**
						 * Sets the opacity value of a target (0-100 scale).
						 * @param {Object|Element} target - The target element
						 * @param {String} pname - Property name
						 * @param {Number} val - Opacity value from 0 to 100
						 * @return {void}
						 */
						alphaSet:function(target, pname, val){
							if(window.getComputedStyle){
								return target['style']['opacity'] = val / 100 ;
							}else{
								return target['style']['filter'] = 'alpha(opacity='+val+')' ;
							}
						},
						
						
						
						/**
						 * Gets a color value from a target and converts to a color object.
						 * @param {Object|Element} target - The target element
						 * @param {String} pname - CSS color property name
						 * @return {Object} Color object with r, g, b, a properties
						 */
						colorGet:function(target, pname){
							var Color = BetweenJS.$.Color ;
							return Color.toColorObj(this.getStyle(target, pname)) ;
						},
						
						/**
						 * Sets a color property on a target from a color object.
						 * @param {Object|Element} target - The target element
						 * @param {String} pname - CSS color property name
						 * @param {Object} val - Color object with r, g, b, a
						 * @return {void}
						 */
						colorSet:function(target, pname, val){
							var Color = BetweenJS.$.Color ;
							this.setStyle(target, pname, Color.toColorString(Color.safe(val))) ;
						},
						
						
						/**
						 * Gets a simple property value from a target, stripping units.
						 * @param {Object|Element} tg - The target
						 * @param {String} n - Property name
						 * @param {String} [unit] - Unit to strip from the value
						 * @return {Number} The numeric property value
						 */
						simpleGet:function(tg, n, unit){
							if(isDOM(tg)){
								try {
									return this.simpleDOMGet(tg, n, unit || 'px') ;
								} catch (error) {
									
								}
							}
							var str = String(tg[n]) ;
							return Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
						},
						/**
						 * Sets a simple property value on a target, appending units.
						 * @param {Object|Element} tg - The target
						 * @param {String} n - Property name
						 * @param {Number} v - Numeric value
						 * @param {String} [unit] - Unit to append
						 * @return {void}
						 */
						simpleSet:function(tg, n, v, unit){
							if(isDOM(tg)){
								try {
									return this.simpleDOMSet(tg, n, v, unit || 'px') ;
								} catch (error) {
								}
							}
								
							tg[n] = unit == '' ? v : v + unit ;
						},
						/**
						 * Gets a computed CSS property value from a DOM element.
						 * @param {Element} tg - The DOM element
						 * @param {String} n - CSS property name
						 * @param {String} [unit] - Unit to strip
						 * @return {Number} The numeric property value
						 */
						simpleDOMGet:function(tg, n, unit){
							var str = this.getStyle(tg, n) ;
							
							str = Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
							
							return str ;
						},
						/**
						 * Sets a CSS property on a DOM element with unit.
						 * @param {Element} tg - The DOM element
						 * @param {String} n - CSS property name
						 * @param {Number} v - Numeric value
						 * @param {String} [unit] - CSS unit to append
						 * @return {void}
						 */
						simpleDOMSet:function(tg, n, v, unit){
							this.setStyle(tg, n, v + unit) ;
						},
						/**
						 * Generates a CSS rule string for sequential class-based animations.
						 * @param {String} selector - CSS selector prefix
						 * @param {String} propertyname - CSS property name
						 * @param {Number} [min=0] - Starting value
						 * @param {Number} max - Ending value (exclusive)
						 * @param {String} [units] - CSS unit
						 * @param {String} [str=''] - Accumulator string
						 * @return {String} Generated CSS rules
						 */
						printCSSRules:function(selector, propertyname, min, max, units, str){
							min = min == undefined ? 0 : min ;
							str = str == undefined ? '' : str ;
							for(var i = min ; i < max ; i ++){
								str += '\n' +
										selector + i +
										'{' +
											propertyname + ':' + i + (units || '') +
										'}'
							}
							return str ;
						},
						/**
						 * Resolves a jQuery or DOM target to a raw DOM node.
						 * @param {Object|Element} tg - jQuery object or DOM element
						 * @return {Element} The DOM node
						 */
						checkNode:function(tg){
							var n ;
							if(isDOM(tg) || 'appendChild' in tg)
								n = tg ;
							else if(isJQ(tg)) // jQuery
								n = tg.get(0) ;
							return n ;
						},
						/**
						 * Checks if a target is a jQuery object.
						 * @param {*} tg - The target to check
						 * @return {Boolean} Whether the target is a jQuery object
						 */
						isJQ:function(tg){
							return isJQ(tg) ;
						},
						/**
						 * Checks if a target is a DOM element.
						 * @param {*} tg - The target to check
						 * @return {Boolean} Whether the target is a DOM element
						 */
						isDOM:function(tg){
							return isDOM(tg) ;
						},
						/**
						 * Gets the current CSS transform of a target as decomposed properties.
						 * @param {Element} tg - The DOM element
						 * @return {Object} Decomposed transform properties (translateX, translateY, rotate, scaleX, scaleY, skewX, etc.)
						 */
						transformGet:function(tg){
							var PM = BetweenJS.$.PropertyMapper;
							var m = PM.parseTransformMatrix(tg);
							if(!m) return {translateX:0, translateY:0, rotate:0, rotateZ:0, scaleX:1, scaleY:1, skewX:0, rotateX:0, rotateY:0, translateZ:0, scaleZ:1};
							if(m.is3d){
								var r = PM.decomposeMatrix3D(m.vals);
								if(r){
									r.rotate = r.rotateZ;
									return r;
								}
							}
							var r = PM.decomposeMatrix2D(m.a, m.b, m.c, m.d, m.e, m.f);
							r.rotateX = 0; r.rotateY = 0; r.rotateZ = r.rotate || 0;
							r.translateZ = 0; r.scaleZ = 1;
							return r;
						},
						/**
						 * Sets the CSS transform on a target from decomposed properties.
						 * @param {Element} tg - The DOM element
						 * @param {Object} val - Transform properties object
						 * @return {void}
						 */
						transformSet:function(tg, val){
							if(!val || typeof val !== 'object') return;
							var PM = BetweenJS.$.PropertyMapper;
							tg.style.transform = PM.composeTransformString(val);
						},
						/**
						 * Parses the CSS transform matrix string from a DOM element.
						 * @param {Element} tg - The DOM element
						 * @return {Object|null} Parsed matrix values or null if none
						 */
						parseTransformMatrix:function(tg){
							var style = window.getComputedStyle(tg, '');
							var str = style.transform || style.webkitTransform || '';
							if(!str || str === 'none') return null;
							var m = str.match(/matrix\(([^)]+)\)/);
							if(m){
								var vals = m[1].split(',').map(parseFloat);
								return {a:vals[0], b:vals[1], c:vals[2], d:vals[3], e:vals[4], f:vals[5]};
							}
							m = str.match(/matrix3d\(([^)]+)\)/);
							if(m){
								var vals = m[1].split(',').map(parseFloat);
								var isPure2d = (
									Math.abs(vals[2]) < 1e-10 && Math.abs(vals[3]) < 1e-10 &&
									Math.abs(vals[6]) < 1e-10 && Math.abs(vals[7]) < 1e-10 &&
									Math.abs(vals[8]) < 1e-10 && Math.abs(vals[9]) < 1e-10 &&
									Math.abs(vals[10] - 1) < 1e-10 && Math.abs(vals[11]) < 1e-10 &&
									Math.abs(vals[14]) < 1e-10 && Math.abs(vals[15] - 1) < 1e-10
								);
								if(isPure2d){
									return {a:vals[0], b:vals[1], c:vals[4], d:vals[5], e:vals[12], f:vals[13]};
								}
								return {is3d:true, vals:vals};
							}
							return null;
						},
						/**
						 * Decomposes a 2D transformation matrix into translate, rotate, scale, skew.
						 * @param {Number} a - Matrix element (0,0)
						 * @param {Number} b - Matrix element (0,1)
						 * @param {Number} c - Matrix element (1,0)
						 * @param {Number} d - Matrix element (1,1)
						 * @param {Number} e - Matrix element (0,2) translateX
						 * @param {Number} f - Matrix element (1,2) translateY
						 * @return {Object} Decomposed transform with translateX, translateY, rotate, scaleX, scaleY, skewX
						 */
						decomposeMatrix2D:function(a, b, c, d, e, f){
							var det = a * d - b * c;
							var eps = 1e-10;
							if(Math.abs(det) < eps){
								return {translateX:e, translateY:f, rotate:0, scaleX:0, scaleY:0, skewX:0};
							}
							var tx = e, ty = f;
							var row0x = a, row0y = b;
							var sx = Math.sqrt(row0x * row0x + row0y * row0y);
							row0x /= sx; row0y /= sx;
							var k = row0x * c + row0y * d;
							var row1x = c - k * row0x;
							var row1y = d - k * row0y;
							var sy = Math.sqrt(row1x * row1x + row1y * row1y);
							row1x /= sy; row1y /= sy;
							if(row0x * row1y - row0y * row1x < 0){
								sx = -sx; row0x = -row0x; row0y = -row0y;
							}
							var rot = Math.atan2(row0y, row0x) * 180 / Math.PI;
							return {translateX:tx, translateY:ty, rotate:rot, scaleX:sx, scaleY:sy, skewX:Math.atan(k / sy) * 180 / Math.PI};
						},
						/**
						 * Decomposes a 3D transformation matrix (16 elements) into individual transforms.
						 * @param {Array} vals - 16-element matrix array
						 * @return {Object|null} Decomposed transform with translate, rotate, scale, skew, or null if invalid
						 */
						decomposeMatrix3D:function(vals){
							var m = vals.slice();
							if(Math.abs(m[15]) < 1e-10) return null;
							var i;
							for(i = 0; i < 16; i++) m[i] /= m[15];
							var tx = m[12], ty = m[13], tz = m[14];
							var perspectiveX = m[3], perspectiveY = m[7], perspectiveZ = m[11], perspectiveW = m[15];
							if(Math.abs(perspectiveX) > 1e-10 || Math.abs(perspectiveY) > 1e-10 || Math.abs(perspectiveZ) > 1e-10){
								if(Math.abs(perspectiveX) < 1e-10 && Math.abs(perspectiveY) < 1e-10 && perspectiveZ < 0){
									perspectiveW = -1 / perspectiveZ;
								}else{
									perspectiveW = undefined;
								}
								m[3] = m[7] = m[11] = 0; m[15] = 1;
							}else{
								perspectiveW = undefined;
							}
							var row = [
								[m[0], m[1], m[2]],
								[m[4], m[5], m[6]],
								[m[8], m[9], m[10]]
							];
							var sx = Math.sqrt(row[0][0]*row[0][0] + row[0][1]*row[0][1] + row[0][2]*row[0][2]);
							row[0][0] /= sx; row[0][1] /= sx; row[0][2] /= sx;
							var kxy = row[0][0]*row[1][0] + row[0][1]*row[1][1] + row[0][2]*row[1][2];
							row[1][0] -= kxy * row[0][0]; row[1][1] -= kxy * row[0][1]; row[1][2] -= kxy * row[0][2];
							var sy = Math.sqrt(row[1][0]*row[1][0] + row[1][1]*row[1][1] + row[1][2]*row[1][2]);
							row[1][0] /= sy; row[1][1] /= sy; row[1][2] /= sy;
							kxy /= sy;
							var kxz = row[0][0]*row[2][0] + row[0][1]*row[2][1] + row[0][2]*row[2][2];
							row[2][0] -= kxz * row[0][0]; row[2][1] -= kxz * row[0][1]; row[2][2] -= kxz * row[0][2];
							var kyz = row[1][0]*row[2][0] + row[1][1]*row[2][1] + row[1][2]*row[2][2];
							row[2][0] -= kyz * row[1][0]; row[2][1] -= kyz * row[1][1]; row[2][2] -= kyz * row[1][2];
							var sz = Math.sqrt(row[2][0]*row[2][0] + row[2][1]*row[2][1] + row[2][2]*row[2][2]);
							row[2][0] /= sz; row[2][1] /= sz; row[2][2] /= sz;
							kxz /= sz; kyz /= sz;
							var pd = row[0][0]*(row[1][1]*row[2][2] - row[1][2]*row[2][1]) -
							         row[0][1]*(row[1][0]*row[2][2] - row[1][2]*row[2][0]) +
							         row[0][2]*(row[1][0]*row[2][1] - row[1][1]*row[2][0]);
							if(pd < 0){
								sx = -sx; row[0][0] = -row[0][0]; row[0][1] = -row[0][1]; row[0][2] = -row[0][2];
							}
							var trace = row[0][0] + row[1][1] + row[2][2];
							var qx, qy, qz, qw, s;
							if(trace > 0){
								s = 0.5 / Math.sqrt(trace + 1);
								qw = 0.25 / s;
								qx = (row[1][2] - row[2][1]) * s;
								qy = (row[2][0] - row[0][2]) * s;
								qz = (row[0][1] - row[1][0]) * s;
							}else if(row[0][0] > row[1][1] && row[0][0] > row[2][2]){
								s = 2 * Math.sqrt(1 + row[0][0] - row[1][1] - row[2][2]);
								qw = (row[1][2] - row[2][1]) / s;
								qx = 0.25 * s;
								qy = (row[0][1] + row[1][0]) / s;
								qz = (row[0][2] + row[2][0]) / s;
							}else if(row[1][1] > row[2][2]){
								s = 2 * Math.sqrt(1 + row[1][1] - row[0][0] - row[2][2]);
								qw = (row[2][0] - row[0][2]) / s;
								qx = (row[0][1] + row[1][0]) / s;
								qy = 0.25 * s;
								qz = (row[1][2] + row[2][1]) / s;
							}else{
								s = 2 * Math.sqrt(1 + row[2][2] - row[0][0] - row[1][1]);
								qw = (row[0][1] - row[1][0]) / s;
								qx = (row[0][2] + row[2][0]) / s;
								qy = (row[1][2] + row[2][1]) / s;
								qz = 0.25 * s;
							}
							var rx = Math.atan2(-2*(qy*qz - qx*qw), 1 - 2*(qx*qx + qy*qy));
							var sinp = 2*(qx*qz + qy*qw);
							if(sinp > 1) sinp = 1; else if(sinp < -1) sinp = -1;
							var ry = Math.asin(sinp);
							var rz = Math.atan2(-2*(qx*qy - qz*qw), 1 - 2*(qy*qy + qz*qz));
							var out = {
								translateX:tx, translateY:ty, translateZ:tz,
								rotateX:rx * 180 / Math.PI,
								rotateY:ry * 180 / Math.PI,
								rotateZ:rz * 180 / Math.PI,
								scaleX:sx, scaleY:sy, scaleZ:sz,
								skewX:Math.atan(kxy) * 180 / Math.PI
							};
							if(perspectiveW !== undefined) out.perspectiveW = perspectiveW;
							return out;
						},
						/**
						 * Composes a CSS transform string from decomposed transform properties.
						 * @param {Object} val - Transform properties object
						 * @return {String} CSS transform string
						 */
						composeTransformString:function(val){
							var u = val.__units || {}, p = [], rv = BetweenJS.$.PropertyMapper.roundVal;
							if(val.rotate !== undefined && val.rotateZ === undefined) val.rotateZ = val.rotate;
							if(val.rotateZ !== undefined && val.rotate === undefined) val.rotate = val.rotateZ;
							var is3d = (val.rotateX !== undefined && Math.abs(val.rotateX) > 1e-6) ||
							           (val.rotateY !== undefined && Math.abs(val.rotateY) > 1e-6) ||
							           (val.translateZ !== undefined && Math.abs(val.translateZ) > 1e-6) ||
							           (val.scaleZ !== undefined && Math.abs(val.scaleZ - 1) > 1e-6) ||
							           val.perspectiveW !== undefined;
							if(is3d){
								if(val.perspectiveW) p.push('perspective(' + rv(val.perspectiveW, 2) + 'px)');
								if(val.translateZ !== undefined && val.translateZ !== 0) p.push('translateZ(' + rv(val.translateZ, 2) + (u.translateZ || 'px') + ')');
								if(val.translateY !== undefined && val.translateY !== 0) p.push('translateY(' + rv(val.translateY, 2) + (u.translateY || 'px') + ')');
								if(val.translateX !== undefined && val.translateX !== 0) p.push('translateX(' + rv(val.translateX, 2) + (u.translateX || 'px') + ')');
								if(val.rotateX !== undefined && val.rotateX !== 0) p.push('rotateX(' + rv(val.rotateX, 2) + (u.rotateX || 'deg') + ')');
								if(val.rotateY !== undefined && val.rotateY !== 0) p.push('rotateY(' + rv(val.rotateY, 2) + (u.rotateY || 'deg') + ')');
								if(val.rotateZ !== undefined && val.rotateZ !== 0) p.push('rotateZ(' + rv(val.rotateZ, 2) + (u.rotateZ || 'deg') + ')');
								if(val.scaleX !== undefined && val.scaleX !== 1) p.push('scaleX(' + rv(val.scaleX, 4) + ')');
								if(val.scaleY !== undefined && val.scaleY !== 1) p.push('scaleY(' + rv(val.scaleY, 4) + ')');
								if(val.scaleZ !== undefined && val.scaleZ !== 1) p.push('scaleZ(' + rv(val.scaleZ, 4) + ')');
								if(val.skewX !== undefined && val.skewX !== 0) p.push('skewX(' + rv(val.skewX, 2) + (u.skewX || 'deg') + ')');
							}else{
								if(val.translateX !== undefined && val.translateX !== 0) p.push('translateX(' + rv(val.translateX, 2) + (u.translateX || 'px') + ')');
								if(val.translateY !== undefined && val.translateY !== 0) p.push('translateY(' + rv(val.translateY, 2) + (u.translateY || 'px') + ')');
								if(val.scaleX !== undefined && val.scaleX !== 1) p.push('scaleX(' + rv(val.scaleX, 4) + ')');
								if(val.scaleY !== undefined && val.scaleY !== 1) p.push('scaleY(' + rv(val.scaleY, 4) + ')');
								if(val.rotate !== undefined && val.rotate !== 0) p.push('rotate(' + rv(val.rotate, 2) + (u.rotate || 'deg') + ')');
								if(val.skewX !== undefined && val.skewX !== 0) p.push('skewX(' + rv(val.skewX, 2) + (u.skewX || 'deg') + ')');
							}
							return p.length ? p.join(' ') : 'none';
						},
						/**
						 * Rounds a number to a specified number of decimal places.
						 * @param {Number} v - The value to round
						 * @param {Number} decimals - Number of decimal places
						 * @return {Number} The rounded value
						 */
						roundVal:function(v, decimals){
							var f = Math.pow(10, decimals);
							return Math.round(v * f) / f;
						}
					}

				}) ;

			}) ;
		}) ;

		
		// CSS
		Pkg.write('css', function(path){
			//COLORS
			var reg_RGB         = /(^rgba*\()|(\)$)/gmi ;
			var reg_HSV         = /(^hsva*\()|(\)$)/gmi ;
			var reg_HSL         = /(^hsla*\()|(\)$)/gmi ;
			var reg_RGBA        = /^rgba*\(/i ;
			var reg_HSVA        = /^hsva*\(/i ;
			var reg_HSLA        = /^hsla*\(/i ;

			var reg_A           = /a/ ;
			var reg_HX          = /^#/ ;
			var reg_BLANK       = / /mg ;
			var reg_LAST2       = /.{2}$/ ;
			var reg_SPLIT2       = /.{2}/g ;
			
			var hsl_open = "hsl(" ;
			var rgb_open = "rgb(" ;
			var hsl_close = ")" ; 
			var rgb_close = ")" ;
			
			var
				RGB_SPLIT_reg 					= /(rgba?\(|\)| )/gi,
				HSV_SPLIT_reg 					= /(hsva?\(|\)| )/gi,
				RGB_HSV_SPLIT_reg 				= /((rgb|hsv)a?\(|\)| )/gi,
				RGB_HSV_HSL_SPLIT_reg 			= /((rgb|hsv|hsl)a?\(|\)| )/gi,
				HEX_reg 						= /^(0x|#)/,
				CSS_SHORT_reg 					= /^[a-z]+$/i ;

			var 
				
				isDefined 						= function(val){ return val !== undefined },
				isSTR 							= function(val){ return typeof val == 'string' },
				isUINT		 					= function(val){ return typeof val == 'number' },
				isHEX			 				= function(val){ return isSTR(val) && HEX_reg.test(val) },
				isCSSSHORTCUT			 		= function(val){ return isSTR(val) && CSS_SHORT_reg.test(val) && val in BetweenJS.$.Color.css },
				isRGBHSVSTR				 		= function(val){ return isSTR(val) && RGB_HSV_SPLIT_reg.test(val) },
				isStringRGBAColor 				= function(val){ return isSTR(val) && RGB_SPLIT_reg.test(val) },
				isStringHSVAColor 				= function(val){ return isSTR(val) && HSV_SPLIT_reg.test(val) },
				isColorOBJ		 				= function(val){ return !isSTR(val) &&  (isDefined(val.r) || isDefined(val.h))  } ;
			
			var 
				defaultRGB						= { r:0, 	g:0, 	b:0, 	a:1.0},
				maxRGB 							= {	r:255, 	g:255, 	b:255, 	a:1.0},
				minRGB 							= {	r:0, 	g:0, 	b:0, 	a:0.0},
				
				defaultHSV						= {	h:0, 	s:0, 	v:0, 	a:1.0},
				maxHSV 							= {	h:360, 	s:100, 	v:100, 	a:1.0},
				minHSV 							= {	h:0, 	s:0, 	v:0, 	a:0.0} ;
				
			var and								= function(v){ return v & 0xFF }
			var base2							= function(v){ return v < 10 ? v = '0' + v : v }
			var hexify							= function(v){ return base2(parseInt(v).toString(16)).toUpperCase() }
			var splitSTR						= function(v){ return v.replace(RGB_HSV_SPLIT_reg, '').split(',') }
			
			var shorthandHEX					= function(h){
													if((h = h.replace(HEX_reg, '')).length == 3) 
														h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2) ;
													return h.toUpperCase() } ;
			
			
			var RGBtoHSV, HSVtoRGB, HSLtoHSV, HSVtoHSL, HSLtoRGB, RGBtoHSL ;
			var Color = Type.define({
				pkg:'::Color',
				domain:BetweenJSCore,
				statics:{
					
					////////// RGBA HSVA CONVERSIONS
					/* 
					/// weird, because simplier, but heavier so... discarded for now
					rgb2hsv:function(o) {
						
						var r = o.r / 255, g = o.g / 255, b = o.b / 255, a = o.a ;
						var m = {} ;
						var v= Math.max(r, g, b), c = v - Math.min(r, g, b) ;
						var h = c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)) ; 
						m.h = 60 * ( h < 0 ? h + 6 : h) ;
						m.s = (v&&c/v ) * 100 ;
						m.v = v * 100 ;
						
						if(isDefined(a)) m.a = a ;
						
						return m ;
					},
					
					hsv2rgb:function (o) {
						var h = o.h, s = o.s / 100, v = o.v / 100, a = o.a ;   
						m = {} ;      
						var f = function (n) {
							var k = ( n + h / 60) % 6 ;
							return (v - v * s * Math.max( Math.min(k, 4 - k, 1), 0)) ;     
						} 
						m.r = f(5) * 255 ;
						m.g = f(3) * 255 ;
						m.b = f(1) * 255 ;
						
						if(isDefined(a)) m.a = a ;

						return m ;
					},
					*/
					/**
					 * Converts an RGB color object to HSV.
					 * @param {Object} o - RGB color object with r, g, b, and optional a properties
					 * @return {Object} HSV color object with h, s, v, and optional a properties
					 */
					RGBtoHSV:RGBtoHSV = function(o){
						// return BetweenJS.$.Color.rgb2hsv(o) ; 

						var r = o.r, g = o.g, b = o.b, a = o.a ;
						var m = {} ;
						
						if( r != g || r != b ){
							if ( g > b ) {
								if ( r > g ) { //r>g>b
									m.h = 60 * (g - b) / (r - b) ;
									m.s = (r - b) / r * 100 ;
									m.v = r / 255 * 100 ;
								}else if( r < b ){ //g>b>r
									m.h = 60 * (b - r) / (g - r) + 120 ;
									m.s = (g - r) / g * 100 ;
									m.v = g / 255 * 100 ;
								}else { //g=>r=>b
									m.h = 60 * (b - r) / (g - b) + 120 ;
									m.s = (g - b) / g * 100 ;
									m.v = g / 255 * 100 ;
								}
							}else{
								if ( r > b ) { // r>b=>g
									m.h = 60 * (g - b) / (r - g) ;
									m.s = (r - g) / r * 100 ;
									m.v = r / 255 * 100 ;
									if ( m.h < 0 ) m.h += 360 ;
								}else if ( r < g ){ //b=>g>r
									m.h = 60 * (r - g) / (b - r) + 240 ;
									m.s = (b - r) / b * 100 ;
									m.v = b / 255 * 100 ;
								}else { //b=>r=>g
									m.h = 60 * (r - g) / (b - g) + 240 ;
									m.s = (b - g) / b  * 100 ;
									m.v = b / 255 * 100 ;
								}
							}
						}else {
							m.h = m.s = 0 ;
							m.v = r / 255 * 100 ;
						}
						
						m.h = Math.round(m.h) ;
						m.s = Math.round(m.s) ;
						m.v = Math.round(m.v) ;
						
						if(isDefined(a)) m.a = a ;

						return m ;
					},
					/**
					 * Converts an HSV color object to RGB.
					 * @param {Object} o - HSV color object with h, s, v, and optional a properties
					 * @return {Object} RGB color object with r, g, b, and optional a properties
					 */
					HSVtoRGB:HSVtoRGB = function(o){
						// return BetweenJS.$.Color.hsv2rgb(o) ;

						var h = o.h, s = o.s, v = o.v, a = o.a ;
						var m = {} ;
						
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
						m.g = Math.round(m.g) ;
						m.b = Math.round(m.b) ;
						
						if(isDefined(a)) m.a = a ;

						return m ;
					},
					/**
					 * Converts an HSL color object to HSV.
					 * @param {Object} o - HSL color object with h, s, l, and optional a properties
					 * @return {Object} HSV color object with h, s, v, and optional a properties
					 */
					HSLtoHSV:HSLtoHSV = function(o){

						var h = o.h, s = o.s / 100, l = o.l / 100, a = o.a ;
						var v = l + s * Math.min(l, 1 - l) ;
						s = v === 0 ? 0 : 2 * (1 - l / v) ;
						s = parseFloat(Number(Math.round(s * 10000) / 100).toFixed(3)) ; 
						v = parseFloat(Number(Math.round(v * 10000) / 100).toFixed(3)) ; 
						var m = {h:h, s:s, v:v} ; 
						if(isDefined(a)) m.a = a ;
						return m ;
					},
					/**
					 * Converts an HSV color object to HSL.
					 * @param {Object} o - HSV color object with h, s, v, and optional a properties
					 * @return {Object} HSL color object with h, s, l, and optional a properties
					 */
					HSVtoHSL:HSVtoHSL = function(o){
						var h = o.h, s = o.s, v = o.v, a = o.a ;
						var l = (200 - s) * v / 200 ;
						s = (l === 0 || l === 100) ? 0 : parseFloat(Number(((v - l) / Math.min(l, 100 - l)) * 100).toFixed(2)) ;
						var m = {h:h, s:s, l:l} ;
						if(isDefined(a)) m.a = a ;
						return m ;
					},
					/**
					 * Converts an HSL color object to RGB (via HSV).
					 * @param {Object} o - HSL color object with h, s, l, and optional a properties
					 * @return {Object} RGB color object with r, g, b, and optional a properties
					 */
					HSLtoRGB:HSLtoRGB = function(o){
						return BetweenJS.$.Color.HSVtoRGB(BetweenJS.$.Color.HSLtoHSV(o))
					},
					/**
					 * Converts an RGB color object to HSL (via HSV).
					 * @param {Object} o - RGB color object with r, g, b, and optional a properties
					 * @return {Object} HSL color object with h, s, l, and optional a properties
					 */
					RGBtoHSL:RGBtoHSL = function(o){
						return BetweenJS.$.Color.HSVtoHSL(BetweenJS.$.Color.RGBtoHSV(o))
					},
					/**
					 * Creates an RGB color object.
					 * @param {number} r - Red value (0-255)
					 * @param {number} g - Green value (0-255)
					 * @param {number} b - Blue value (0-255)
					 * @param {number} [a] - Alpha value (0-1)
					 * @return {Object} RGB color object
					 */
					makeRGB:function(r, g, b, a){
						var m = {r:r, g:g, b:b} ; 
						if(isDefined(a)) m.a = a ;
						return m ;
					},
					/**
					 * Creates an HSV color object.
					 * @param {number} h - Hue value (0-360)
					 * @param {number} s - Saturation value (0-100)
					 * @param {number} v - Value/Brightness (0-100)
					 * @param {number} [a] - Alpha value (0-1)
					 * @return {Object} HSV color object
					 */
					makeHSV:function(h, s, v, a){
						var m = {h:h, s:s, v:v} ;
						if(isDefined(a)) m.a = a ;
						return m ;
					},
					/**
					 * Creates an HSL color object.
					 * @param {number} h - Hue value (0-360)
					 * @param {number} s - Saturation value (0-100)
					 * @param {number} l - Lightness value (0-100)
					 * @param {number} [a] - Alpha value (0-1)
					 * @return {Object} HSL color object
					 */
					makeHSL:function(h, s, l, a){
						var m = {h:h, s:s, l:l} ;
						if(isDefined(a)) m.a = a ;
						return m ;
					},
					
					////////// RGBA CONVERSIONS
					
					/**
					 * Converts a color value to an unsigned integer.
					 * @param {number|string|Object} val - Color as UINT, HEX string, RGB string, or color object
					 * @return {number} Color as unsigned integer
					 */
					toUINT:function(val){
						var res ;
						
						switch(true){
							case isUINT(val) :
								res = val ;
							break ;
							case isHEX(val) :
								res = parseInt(shorthandHEX(val), 16) ;
							break ;
							case isSTR(val) :
								val = splitSTR(val) ;
								res = parseInt('0x'+ hexify(val[0]) + hexify(val[1]) + hexify(val[2]) + (val.length > 3 ? hexify(val[3] * 255) : '')) ;
							break ;
							case isColorOBJ(val) :
								res = parseInt('0x'+ hexify(val.r) + hexify(val.g) + hexify(val.b) + (isDefined(val.a) ? hexify(val.a * 255) : '')) ;
							break ;
						}
						
						return res ;
					},
					/**
					 * Converts a color value to a HEX string.
					 * @param {number|string|Object} val - Color as UINT, HEX string, RGB string, or color object
					 * @return {string} HEX color string (e.g. #FF0000)
					 */
					toHEX:function(val){
						var res ;
						
						switch(true){
							case isUINT(val) :
								res = '#' + hexify(val) ;
							break ;
							case isHEX(val) :
								res = '#' + shorthandHEX(val) ;
							break ;
							case isSTR(val) :
								val = splitSTR(val) ;
								res = '#' + hexify(val[0]) + hexify(val[1]) + hexify(val[2] + (val.length > 3 ? hexify(val[3] * 255) : '')) ;
							break ;
							case isColorOBJ(val) :
								res = '#' + hexify(val.r) +  hexify(val.g) +  hexify(val.b) + (isDefined(val.a) ? hexify(val.a * 255) : '') ;
							break ;
						}
						return res ;
					},
					/**
					 * Converts a color value to an RGB or RGBA string.
					 * @param {number|string|Object} val - Color as UINT, HEX string, RGB string, or color object
					 * @return {string} RGB/RGBA color string (e.g. rgb(255,0,0))
					 */
					toSTR:function(val){
						var r, g, b, h, s, v, a ;
						
						switch(true){
							case isUINT(val) :
								return this.toSTR(this.toHEX(val)) ;
							break ;
							case isHEX(val) :
								val = shorthandHEX(val).match(/.{1,2}/g) ;
								r = parseInt(val[0], 16) ;
								g = parseInt(val[1], 16) ;
								b = parseInt(val[2], 16) ;
								a = val.length > 3 ? parseInt(val[3], 16) / 255  : undefined ;
							break ;
							case isSTR(val) :
								return val ;
							break ;
							case isColorOBJ(val) :
								r = val.r ;
								g = val.g ;
								b = val.b ;
								a = val.a ;
							break ;
						}
						var isA = isDefined(a) ;
						var app = isA ? 'rgba(' : 'rgb(', sep = ', ', end = ')' ;
						return app + r + sep + g + sep + b + (isA ? sep + a : '' ) + end ;
					},
					/**
					 * Converts a color value to an RGB color object.
					 * @param {number|string|Object} val - Color as UINT, HEX string, RGB string, or color object
					 * @return {Object} RGB color object with r, g, b, and optional a properties
					 */
					toOBJ:function(val){
						var r, g, b, h, s, v, a ;
						
						switch(true){
							case isUINT(val) :
								return this.toOBJ(this.toHEX(val)) ;
							break ;
							case isHEX(val) :
								val = shorthandHEX(val).match(/.{1,2}/g) ;
								r = parseInt(val[0], 16) ;
								g = parseInt(val[1], 16) ;
								b = parseInt(val[2], 16) ;
								a = val.length > 3 ? parseInt(val[3], 16) / 255  : undefined ;
							break ;
							case isSTR(val) :
								val = splitSTR(val) ;
								r = parseInt(val[0]) ;
								g = parseInt(val[1]) ;
								b = parseInt(val[2]) ;
								a = val.length > 3 ? parseFloat(val[3])  : undefined ;
							break ;
							case isColorOBJ(val) :
								return val ;
							break ;
						}
						
						var res = {r:r, g:g, b:b} ;
						if(isDefined(a)) res.a = a ;
						
						return res ;
					},
					
					/**
					 * Converts a color value to a string representation.
					 * @param {number|string|Object} val - Color value to convert
					 * @param {string} [mode] - Color mode (unused)
					 * @return {string} RGB/RGBA color string
					 */
					toColorString:function(val, mode){
						return this.toSTR(val) ;
					},
					/**
					 * Converts a color value to an RGB color object.
					 * @param {number|string|Object} val - Color value to convert
					 * @param {string} [mode] - Color mode (unused)
					 * @return {Object} RGB color object
					 */
					toColorObj:function(val, mode){
						return this.toOBJ(val) ;
					},

					/**
					 * Clamps color values to valid ranges for the given mode.
					 * @param {Object} val - Color object to clamp
					 * @param {string} [mode] - Color mode ('rgb' or 'HSV')
					 * @return {Object} The clamped color object
					 */
					safe:function(val, mode){
						
						var MODE = mode || 'rgb' ;
						
						var max = MODE == 'HSV' ? maxHSV : maxRGB ;
						var min = MODE == 'HSV' ? minHSV : minRGB ;
						
						for(var s in max){
							var m = max[s] ;
							var n = min[s] ;
							var v = val[s] ;
							if(v > m) val[s] = m ;
							if(v < n) val[s] = n ;
						}
						
						return val ;
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
			
			
			var RGB, HSV, HSL;
			
			var ColorMode = Type.define({
				pkg:'::ColorMode',
				domain:BetweenJSCore,
				statics:{
					RGBtoHSV:RGBtoHSV,
					RGBtoHSL:RGBtoHSL,
					HSVtoRGB:HSVtoRGB,
					HSVtoHSL:HSVtoHSL,
					HSLtoRGB:HSLtoRGB,
					HSLtoHSV:HSLtoHSV,
					fromStr: function (s, reg, dest) {
						var arr = s.replace(reg, '').replace(reg_BLANK, '').split(',') ;
						var hasAlpha = arr.length > 3 ;
						if(hasAlpha) return dest(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]), parseFloat(Number(arr[3] || 1.0).toFixed(2))) ;
						return dest(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2])) ;
					},
					fromObj: function(o, mode){
						switch(true){
							case 'r' in o :
								return (mode == 'HSV') ? RGBtoHSV(o) : (mode == 'HSL') ? RGBtoHSL(o) : o ; 
							case 'v' in o :
								return (mode == 'RGB') ? HSVtoRGB(o) : (mode == 'HSL') ? HSVtoHSL(o) : o ; 
							case 'l' in o :
								return (mode == 'RGB') ? HSLtoRGB(o) : (mode == 'HSV') ? HSLtoHSV(o) : o ; 
						}
					},
					RGB:Type.define({
						pkg:'::RGB',
						domain:ColorMode,
						statics:{
							fromInt:function(i){
								var s = i.toString(16) ;
								var hasAlpha = s.length > 6 ;
								var n, a ;
								if(hasAlpha) {
									n = parseInt(s.replace(reg_LAST2, ''), 16) ;
									a = parseInt(s.match(reg_LAST2)[0], 16) ;
									a = parseFloat((a / 255).toFixed(2)) ;
								}else{ n = i }
								
								return BJS.$.Color.makeRGB((n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, (n & 0x000000FF), a) ;
							},
							fromHex:function(h){
								var hex = h.replace(reg_HX, '') ;
								var tot = parseInt('0x' + hex) ; 
								var rgb = (hex.match(reg_SPLIT2)) ;
								if(rgb.length > 3) return BJS.$.Color.makeRGB(parseInt('0x' + rgb[0]), parseInt('0x' + rgb[1]), parseInt('0x' + rgb[2]), parseFloat((parseInt('0x' + rgb[3]) / 255).toFixed(2))) ;
								return BJS.$.Color.makeRGB(parseInt('0x' + rgb[0]), parseInt('0x' + rgb[1]), parseInt('0x' + rgb[2])) ;
							},
							fromStr:function(s){
								switch(true){
									case reg_RGBA.test(s) :
										return BJS.$.ColorMode.fromStr(s, reg_RGB, BJS.$.Color.makeRGB) ;
									case reg_HSVA.test(s) :
										return HSVtoRGB(HSV.fromStr(s)) ;
									case reg_HSLA.test(s):
										return HSLtoRGB(HSL.fromStr(s)) ;
								}
							},
							fromAlias:function(a){ return RGB.fromHex(BJS.$.Color.css[a]) },
							fromObj:function(o){ return BJS.$.ColorMode.fromObj(o, 'RGB') }, 
							format:function(o){
								return rgb_open + o.r + ', ' + o.g + ', ' +  o.b + (!!o.a ? (', ' + o.a ) : '') + rgb_close ;
							},
							fromAllStrings:function(s){
								return HEX_reg.test(s) ? 
									RGB.fromHex(s) : RGB_HSV_HSL_SPLIT_reg.test(s) ? 
									RGB.fromStr(s) : RGB.fromAlias(s) ;
							}
						},
						constructor:RGB = function RGB(r, g, b, a){
							switch(arguments.length){
								case 1 :
									return typeof r == 'string' ? RGB.fromAllStrings(r) : typeof r == 'number' ? RGB.fromInt(r) : RGB.fromObj(r) ;
								case 3 :
								case 4 :
									return BJS.$.Color.makeRGB(r, g, b, a) ;
							}
						}
					}),
					HSV:Type.define({
						pkg:'::HSV',
						domain:ColorMode,
						statics:{
							fromInt:function(i){ return RGBtoHSV(RGB.fromInt(i)) },
							fromHex:function(h){ return RGBtoHSV(RGB.fromHex(h)) },
							fromStr:function(s){
								switch(true){
									case reg_RGBA.test(s) :
										return RGBtoHSV(RGB.fromStr(s)) ;
									case reg_HSVA.test(s) :
										return BJS.$.ColorMode.fromStr(s, reg_HSV, BJS.$.Color.makeHSV) ;
									case reg_HSLA.test(s):
										return HSLtoHSV(HSL.fromStr(s)) ;
								}
							},
							fromObj:function(o){ return BJS.$.ColorMode.fromObj(o, 'HSV') },
							fromAlias:function(a){ return HSV.fromHex(BJS.$.Color.css[a]) },
							toRGB:function(o){ return HSVtoRGB(o) },
							toHSL:function(o){ return HSVtoHSL(o) },
							fromHSL:function(o){ return HSLtoHSV(o) },
							format:function(o, toMode){
								return (toMode != 'HSL') ? RGB.format(HSV.toRGB(o)) :
									HSL.format(HSV.toHSL(o)) ;
							},
							fromAllStrings:function(s){
								return HEX_reg.test(s) ? 
									HSV.fromHex(s) : RGB_HSV_HSL_SPLIT_reg.test(s) ? 
									HSV.fromStr(s) : HSV.fromAlias(s) ;
							}
						},
						constructor:HSV = function HSV(h, s, v, a){
							switch(arguments.length){
								case 1 :
									return typeof h == 'string' ? HSV.fromAllStrings(h) : typeof h == 'number' ? HSV.fromInt(h) : HSV.fromObj(h) ;
								case 3 :
								case 4 :
									return BJS.$.Color.makeHSV(h, s, v, a) ;
							}
						}
					}),
					HSL:Type.define({
						pkg:'::HSL',
						domain:ColorMode,
						statics:{
							fromInt:function(i){ return RGBtoHSL(RGB.fromInt(i)) },
							fromHex:function(h){ return RGBtoHSL(RGB.fromHex(h)) },
							fromStr:function(s){
								switch(true){
									case reg_RGBA.test(s) :
										return RGBtoHSL(RGB.fromStr(s)) ;
									case reg_HSVA.test(s) :
										return HSVtoHSL(HSV.fromStr(s)) ;
									case reg_HSLA.test(s):
										return BJS.$.ColorMode.fromStr(s, reg_HSL, BJS.$.Color.makeHSL) ;
								}
							},
							fromObj:function(o){ return BJS.$.ColorMode.fromObj(o, 'HSL') },
							fromAlias:function(a){ return HSL.fromHex(BJS.$.Color.css[a]) },
							toRGB:function(o){ return HSLtoRGB(o) },
							toHSV:function(o){ return HSLtoHSV(o) },
							format:function(o, toMode){
								if(toMode == 'RGB') return RGB.format(HSL.toRGB(o)) ;
								return hsl_open + o.h + ' ' + o.s + ' ' +  o.l + (!!o.a ? (' / ' + o.a ) : '') + hsl_close ;
							},
							fromAllStrings:function(s){
								return HEX_reg.test(s) ? 
									HSL.fromHex(s) : RGB_HSV_HSL_SPLIT_reg.test(s) ? 
									HSL.fromStr(s) : HSL.fromAlias(s) ;
							}
						},
						constructor:HSL = function HSL(h, s, l, a){
							switch(arguments.length){
								case 1 :
									return typeof h == 'string' ? HSL.fromAllStrings(h) : typeof r == 'number' ? HSL.fromInt(h) : HSL.fromObj(h) ;
								case 3 :
								case 4 :
									return BJS.$.Color.makeHSL(h, s, l, a) ;
							}
						}
					})
				}
			})

		}) ;
		
		// EASE
		Pkg.write('ease', function(path){
			/* EASINGS */
			/* Thanks to Robert Penner & Yossi */
			var Ease = Type.define({
				pkg:'::Ease',
				/**
				 * Base easing class. Creates an ease instance with a given calculation function.
				 * @param {Function} calc - The easing calculation function (t, b, c, d) => value
				 */
				constructor:Ease = function Ease(calc){
					this.calculate = calc || function calculate(t, b, c, d){
						return c * t / d + b ;
					}
				}
			})
			/** Linear ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Circular ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Cubic ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Exponential ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Quadratic ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Quartic ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Quintic ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Sine ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/** Bounce ease with 4 variants: easeIn, easeOut, easeInOut, easeOutIn. */
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
			/**
			 * Creates an elastic ease-in function.
			 * @param {Number} [a] - Amplitude
			 * @param {Number} [p] - Period
			 * @return {Ease} An Ease instance
			 */
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
			/**
			 * Creates an elastic ease-out function.
			 * @param {Number} [a] - Amplitude
			 * @param {Number} [p] - Period
			 * @return {Ease} An Ease instance
			 */
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
			/**
			 * Creates an elastic ease-in-out function.
			 * @param {Number} [a] - Amplitude
			 * @param {Number} [p] - Period
			 * @return {Ease} An Ease instance
			 */
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
			/**
			 * Creates an elastic ease-out-in function.
			 * @param {Number} [a] - Amplitude
			 * @param {Number} [p] - Period
			 * @return {Ease} An Ease instance
			 */
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
					/**
					 * Creates a custom ease from a user-provided function.
					 * @param {Function} f - The easing function (t, b, c, d) => value
					 * @return {Ease} An Ease instance wrapping the function
					 */
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
					defaultFrameRate:__FPS__,
					/**
					 * Creates a uniform physical ease with constant velocity.
					 * @param {Number} [velocity=10] - Velocity per second in frames
					 * @param {Number} [frameRate] - Target frame rate (defaults to Physical.defaultFrameRate)
					 * @return {PhysicalUniform} A PhysicalUniform ease instance
					 */
					uniform:function(velocity, frameRate){
						return new PhysicalUniform(velocity || TEN, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					},
					/**
					 * Creates an accelerating physical ease.
					 * @param {Number} [acceleration=1] - Acceleration per frame
					 * @param {Number} [initialVelocity=0] - Initial velocity
					 * @param {Number} [frameRate] - Target frame rate (defaults to Physical.defaultFrameRate)
					 * @return {PhysicalAccelerate} A PhysicalAccelerate ease instance
					 */
					accelerate:function(acceleration, initialVelocity, frameRate){
						return new PhysicalAccelerate(initialVelocity || ZERO, acceleration || ONE, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					},
					/**
					 * Creates an exponential decay physical ease.
					 * @param {Number} [factor=0.2] - Decay factor (0-1)
					 * @param {Number} [threshold=0.0001] - Threshold at which to stop
					 * @param {Number} [frameRate] - Target frame rate (defaults to Physical.defaultFrameRate)
					 * @return {PhysicalExponential} A PhysicalExponential ease instance
					 */
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
				/**
				 * Accelerating physical ease using constant acceleration.
				 * @param {Number} iv - Initial velocity
				 * @param {Number} a - Acceleration
				 * @param {Number} fps - Frame rate
				 */
				constructor:PhysicalAccelerate = function PhysicalAccelerate(iv, a, fps){
					this.iv = iv ;
					this.a = a ;
					this.fps = fps ;
				},
				/**
				 * Calculates duration given start value and change.
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} Duration in seconds
				 */
				getDuration:function(b, c){
					var iv = c < 0 ? - this.iv : this.iv ;
					var a = c < 0 ? - this.a : this.a ;

					return ((-iv + Math.sqrt(iv * iv - 4 * (a / TWO) * -c)) / (2 * (a / TWO))) * (ONE / this.fps);
				},
				/**
				 * Calculates the eased value at a given time.
				 * @param {Number} t - Elapsed time in frames
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} The interpolated value
				 */
				calculate:function(t, b, c){
					var f = c < 0 ? -1 : 1 ;
					var n = t / (ONE / this.fps) ;
					return b + (f * this.iv) * n + ((f * this.a) * n) * n / TWO ;
				}
			}) ;
			var PhysicalExponential = Type.define({
				pkg:'physical',
				inherits:Physical,
				f:undefined,
				th:undefined,
				fps:undefined,
				/**
				 * Exponential decay physical ease.
				 * @param {Number} f - Decay factor (0-1)
				 * @param {Number} th - Threshold for stopping
				 * @param {Number} fps - Frame rate
				 */
				constructor:PhysicalExponential = function PhysicalExponential(f, th, fps){
					this.f = f ;
					this.th = th ;
					this.fps = fps ;
				},
				/**
				 * Calculates duration given start value and change.
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} Duration in seconds
				 */
				getDuration:function(b, c){
					return Math.log(this.th / c) / Math.log(1 - this.f) * (ONE / this.fps) ;
				},
				/**
				 * Calculates the eased value at a given time.
				 * @param {Number} t - Elapsed time in frames
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} The interpolated value
				 */
				calculate:function(t, b, c){
					return b + c * (1 - Math.pow(1 - this.f, t / (ONE / this.fps))) ;
				}
			}) ;
			var PhysicalUniform = Type.define({
				pkg:'physical',
				inherits:Physical,
				v:undefined,
				fps:undefined,
				/**
				 * Uniform (constant velocity) physical ease.
				 * @param {Number} v - Velocity
				 * @param {Number} fps - Frame rate
				 */
				constructor:PhysicalUniform = function PhysicalUniform(v, fps){
					this.v = v ;
					this.fps = fps ;
				},
				/**
				 * Calculates duration given start value and change.
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} Duration in seconds
				 */
				getDuration:function(b, c){
					return (c / (c < 0 ? -this.v : this.v)) * (ONE / this.fps) ;
				},
				/**
				 * Calculates the eased value at a given time.
				 * @param {Number} t - Elapsed time in frames
				 * @param {Number} b - Start value
				 * @param {Number} c - Change (end - start)
				 * @return {Number} The interpolated value
				 */
				calculate:function(t, b, c){
					return b + (c < 0 ? -this.v : this.v) * (t / (ONE / this.fps)) ;
				}
			});

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
				
				/**
				 * Creates a tween from an options object.
				 * @param {Object} options - Tween configuration with target, to/from, time, ease, etc.
				 * @return {TweenLike} The created tween instance
				 */
				create:function create(options){
					if(!!!options.target) throw new Error('BetweenJS: The target is undefined') ;
					return BetweenJS.$.TweenFactory.create(options) ;
				},
				/**
				 * Creates a regular tween between from/to values.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} [to] - Destination property values
				 * @param {Object} [from] - Starting property values
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				tween:function tween(target, to, from, time, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						from: from,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates a tween that animates TO values from current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				to:function to(target, to, time, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates a tween that animates FROM values to current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} from - Starting property values
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				from:function from(target, from, time, ease){
					return BetweenJS.create({
						target: target,
						from: from,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates and optionally applies a tween at a specific time.
				 * @param {Object} options - Tween configuration options
				 * @param {Boolean} [applyInBetweenContext] - Whether to apply in between context
				 * @return {TweenLike} The created tween instance
				 */
				apply:function apply(options, applyInBetweenContext){
					
					var applyTime = options['applyTime'] || ZERO ;
					options['time'] = options['time'] || ZERO ;
					
					var tw = BetweenJS.create(options) ;
					
					if(!applyInBetweenContext && applyTime) tw.gotoAndStop(applyTime) ;
					
					return tw ;
				},
				/**
				 * Instantly applies properties to a target object.
				 * @param {Object|Element} target - The target object or DOM element
				 * @param {Object} properties - Property values to apply instantly
				 * @return {TweenLike} The created tween instance
				 */
				instant:function instant(target, properties){
					
					return BetweenJS.apply({
						target:tg,
						to:properties,
						time:__SAFE_TIME__,
						ease:Linear.easeOut
					}, true) ;
				},
				/**
				 * Creates a bezier tween between from/to values with cue points.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Object} from - Starting property values
				 * @param {Object} cuepoints - Bezier curve cue points
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				bezier:function bezier(target, to, from, cuepoints, time, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						from: from,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates a bezier tween animated TO values from current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Object} cuepoints - Bezier curve cue points
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				bezierTo:function bezierTo(target, to, cuepoints, time, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates a bezier tween animated FROM values to current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} from - Starting property values
				 * @param {Object} cuepoints - Bezier curve cue points
				 * @param {Number} [time=1.0] - Duration of the tween
				 * @param {Function} [ease=Linear.easeNone] - Easing function
				 * @return {TweenLike} The created tween instance
				 */
				bezierFrom:function bezierFrom(target, from, cuepoints, time, ease){
					return BetweenJS.create({
						target: target,
						from: from,
						cuepoints: cuepoints,
						time: time,
						ease: ease
					}) ;
				},
				/**
				 * Creates a physics-based tween between from/to values.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Object} from - Starting property values
				 * @param {Function} [ease=Physical.exponential()] - Physics easing function
				 * @return {TweenLike} The created tween instance
				 */
				physical:function physical(target, to, from, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						from: from,
						ease: ease
					}) ;
				},
				/**
				 * Creates a physics-based tween TO values from current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Function} [ease=Physical.exponential()] - Physics easing function
				 * @return {TweenLike} The created tween instance
				 */
				physicalTo:function physicalTo(target, to, ease){
					return BetweenJS.create({
						target: target,
						to: to,
						ease: ease
					}) ;
				},
				/**
				 * Creates a physics-based tween FROM values to current state.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} from - Starting property values
				 * @param {Function} [ease=Physical.exponential()] - Physics easing function
				 * @return {TweenLike} The created tween instance
				 */
				physicalFrom:function physicalFrom(target, from, ease){
					return BetweenJS.create({
						target: target,
						from: from,
						ease: ease
					}) ;
				},
				/**
				 * Creates and applies a physics-based tween at a specific time.
				 * @param {Object|Element} target - The target object or DOM element to animate
				 * @param {Object} to - Destination property values
				 * @param {Object} from - Starting property values
				 * @param {Function} [ease=Physical.exponential()] - Physics easing function
				 * @param {Number} [applyTime] - Time position to apply
				 * @return {TweenLike} The created tween instance
				 */
				physicalApply:function physicalApply(target, to, from, ease, applyTime){
					return BetweenJS.create({
						target: target,
						to: to,
						from: from,
						ease: ease
					}).update(applyTime).draw() ;
				},
				/**
				 * Runs multiple tweens in parallel (variadic arguments).
				 * @param {...TweenLike} tween - Tweens to run in parallel
				 * @return {TweenLike} A parallel group tween
				 */
				parallel:function parallel(tween){
					return BetweenJS.parallelTweens(__SLICE__.call(arguments)) ;
				},
				/**
				 * Runs an array of tweens in parallel.
				 * @param {Array} tweens - Array of tweens to run in parallel
				 * @return {TweenLike} A parallel group tween
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
				/**
				 * Runs multiple tweens in sequence (variadic arguments).
				 * @param {...TweenLike} tween - Tweens to run in sequence
				 * @return {TweenLike} A serial group tween
				 */
				serial:function serial(tween){
					return BetweenJS.serialTweens(__SLICE__.call(arguments)) ;
				},
				/**
				 * Runs an array of tweens in sequence.
				 * @param {Array} tweens - Array of tweens to run in sequence
				 * @return {TweenLike} A serial group tween
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
				/**
				 * Scales a tween's duration by a multiplier.
				 * @param {TweenLike} tween - The tween to scale
				 * @param {Number} [scale=1] - Duration scale multiplier
				 * @return {TweenLike} A scaled tween decorator
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
				/**
				 * Slices a portion of a tween between begin and end.
				 * @param {TweenLike} tween - The tween to slice
				 * @param {Number} [begin=0] - Start position or percent
				 * @param {Number} [end=1] - End position or percent
				 * @param {Boolean} [isPercent=false] - Whether begin/end are percentages
				 * @return {TweenLike} A sliced tween decorator
				 */
				slice:function slice(tween, begin, end, isPercent){
					
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
				/**
				 * Reverses a tween's direction.
				 * @param {TweenLike} tween - The tween to reverse
				 * @return {TweenLike} A reversed tween decorator
				 */
				reverse:function reverse(tween){
					
					if(tween instanceof BetweenJS.$.ReversedTween && !!tween.baseTween){
						return tween.baseTween ;//.seek(position) ;
					}

					var options = {
						decorators:{
							reverse:{
								baseTween:tween
							}
						}
					} ;

					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/**
				 * Repeats a tween a specified number of times.
				 * @param {TweenLike} tween - The tween to repeat
				 * @param {Number} [repeatCount=2] - Number of times to repeat
				 * @return {TweenLike} A repeated tween decorator
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
				/**
				 * Adds pre-delay and/or post-delay to a tween.
				 * @param {TweenLike} tween - The tween to delay
				 * @param {Number} [delay=0] - Pre-delay duration
				 * @param {Number} [postDelay=0] - Post-delay duration
				 * @return {TweenLike} A delayed tween decorator
				 */
				delay:function delay(tween, delay, postDelay){
					var options = {
						decorators:{
							delay:{
								baseTween:tween,
								delay:delay,
								postDelay:postDelay
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/**
				 * Creates an action tween that appends a child DOM element to a parent.
				 * @param {Element} target - The child element to add
				 * @param {Element} parent - The parent element to append to
				 * @return {TweenLike} An action tween instance
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
				/**
				 * Creates an action tween that removes a DOM element from its parent.
				 * @param {Element} target - The element to remove
				 * @return {TweenLike} An action tween instance
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
				/**
				 * Creates an action tween that calls a function with parameters.
				 * @param {Function} closure - The function to call
				 * @param {Array} [params] - Parameters to pass to the function
				 * @param {Boolean} [useRollback] - Whether to use a rollback function
				 * @param {Function} [rollbackClosure] - Function to call on rollback
				 * @param {Array} [rollbackParams] - Parameters for the rollback function
				 * @return {TweenLike} An action tween instance
				 */
				func:function func(closure, params, useRollback, rollbackClosure, rollbackParams){
					var options = {
						actions:{
							func:{
								closure:closure,
								params:params,
								useRollback:useRollback,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams
							}
						}
					}

					return BetweenJS.$.TweenFactory.createAction(options) ;
				},
				/**
				 * Creates an action tween that loads a resource from a URL.
				 * @param {String} url - The URL to load
				 * @param {Function|Object} [callback] - Callback function or options object
				 * @param {Array} [params] - Parameters to pass to the callback
				 * @return {TweenLike} An action tween instance
				 */
				load:function(url, callback, params){
					var options = {url: url};
					if(typeof callback === 'object'){
						// Options form: BJS.load(url, {callback, params, nocache, postData})
						var opts = callback;
						if(typeof opts.callback === 'function') options.closure = opts.callback;
						if(opts.params) options.params = opts.params;
						if(opts.postData) options.postData = opts.postData;
						if(opts.nocache){
							options.forceBrowserNoCache = true ;
							options.keepInLocalCache = false ;
						}
					}else{
						// Positional form: BJS.load(url, callback, params)
						if(typeof callback === 'function') options.closure = callback;
						if(params) options.params = params;
					}
					var actionsOptions = {
						actions:{
							load:options
						}
					}
					var uid = getTimer() ;
					var tw = BetweenJS.$.TweenFactory.createAction(actionsOptions) ;
					tw.uid = uid ;
					return (CACHE_LOAD[uid] = tw) ;
				},
				/**
				 * Stops and clears a load action tween by its UID.
				 * @param {Number|Object} uid - UID or tween object to clear
				 * @return {TweenLike} The stopped tween
				 */
				clearLoad:function(uid){
					var cc = isNaN(uid)? uid : CACHE_LOAD[uid] ;
					uid = cc.uid ;
					delete CACHE_LOAD[uid] ;
					return cc.stop() ;
				},
				/**
				 * Creates a repeating interval action tween.
				 * @param {Number} duration - Interval duration
				 * @param {Function} closure - Function to call on each interval
				 * @param {Array} [params] - Parameters to pass to the function
				 * @param {Boolean} [useRollback] - Whether to use a rollback function
				 * @param {Function} [rollbackClosure] - Function to call on rollback
				 * @param {Array} [rollbackParams] - Parameters for the rollback function
				 * @param {Boolean} [force] - Force creation even if duplicate
				 * @return {TweenLike} An action tween instance
				 */
				interval:function(duration, closure, params, useRollback, rollbackClosure, rollbackParams, force){
					var uid = getTimer() ;
					
					var options = {
						actions:{
							interval:{
								duration:duration,
								closure:closure,
								params:params,
								useRollback:useRollback,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams,
								force:force
							}
						}
					}

					var tw = BetweenJS.$.TweenFactory.createAction(options) ;
					tw.uid = uid ;
					return (CACHE_INTERVAL[uid] = tw) ;
				},
				/**
				 * Creates a timeout action tween that fires once after a duration.
				 * @param {Number} duration - Timeout duration
				 * @param {Function} closure - Function to call after timeout
				 * @param {Array} [params] - Parameters to pass to the function
				 * @param {Boolean} [useRollback] - Whether to use a rollback function
				 * @param {Function} [rollbackClosure] - Function to call on rollback
				 * @param {Array} [rollbackParams] - Parameters for the rollback function
				 * @param {Boolean} [force] - Force creation even if duplicate
				 * @return {TweenLike} An action tween instance
				 */
				timeout:function(duration, closure, params, useRollback, rollbackClosure, rollbackParams, force){
					var uid = getTimer() ;
					
					var options = {
						actions:{
							timeout:{
								duration:duration,
								closure:closure,
								params:params,
								useRollback:useRollback,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams,
								force:force
							}
						}
					}

					var tw = BetweenJS.$.TweenFactory.createAction(options) ;
					tw.uid = uid ;
					return (CACHE_TIMEOUT[uid] = tw) ;
				},
				/**
				 * Stops and clears a timeout action by its UID.
				 * @param {Number|Object} uid - UID or tween object to clear
				 * @return {TweenLike} The stopped tween
				 */
				clearTimeout:function(uid){
					var cc = isNaN(uid)? uid : CACHE_TIMEOUT[uid] ;
					uid = cc.uid ;
					delete CACHE_TIMEOUT[uid] ;
					return cc.stop() ;
				},
				/**
				 * Stops and clears an interval action tween by its UID.
				 * @param {Number|Object} uid - UID or tween object to clear
				 * @return {TweenLike} The stopped tween
				 */
				clearInterval:function(uid){
					var cc = isNaN(uid)? uid : CACHE_INTERVAL[uid] ;
					uid = cc.uid ;
					delete CACHE_INTERVAL[uid] ;
					return cc.stop() ;
				},
				/**
				 * Creates an animation frame action tween.
				 * @param {Function} closure - Function to call on each animation frame
				 * @param {Array} [params] - Parameters to pass to the function
				 * @param {Boolean} [useRollback] - Whether to use a rollback function
				 * @param {Function} [rollbackClosure] - Function to call on rollback
				 * @param {Array} [rollbackParams] - Parameters for the rollback function
				 * @param {Boolean} [force] - Force creation even if duplicate
				 * @return {TweenLike} An action tween instance
				 */
				animationframe:function(closure, params, useRollback, rollbackClosure, rollbackParams, force){
					var uid = getTimer() ;
					
					var options = {
						actions:{
							animationframe:{
								closure:closure,
								params:params,
								useRollback:useRollback,
								rollbackClosure:rollbackClosure,
								rollbackParams:rollbackParams,
								force:force
							}
						}
					}

					var tw = BetweenJS.$.TweenFactory.createAction(options) ;
					tw.uid = uid ;

					return (CACHE_ANIM_FRAME[uid] = tw) ;
				},
				/**
				 * Cancels and clears an animation frame action by its UID.
				 * @param {Number|Object} uid - UID or tween object to cancel
				 * @return {void}
				 */
				cancelanimationframe:function(uid){
					var cc = isNaN(uid)? uid : CACHE_ANIM_FRAME[uid] ;
					if(!!!cc) return ;
					uid = cc.uid ;
					delete CACHE_ANIM_FRAME[uid] ;
					return cc.clear() ;
				}
			}
		}) ;
		
		// BJS Shortcut
		Type.appdomain['BJS'] = Type.appdomain['BTW'] = BetweenJS ;
		
		// ===== MODERN ENHANCEMENTS (May 2026) =====
		// Backwards-compatible: Promise API, stagger, timeline, global controls
		(function(bjs){
			var AbstractTween = bjs.$.AbstractTween;
			var AnimationTicker = bjs.$.AnimationTicker;
			var EFT = bjs.$.EnterFrameTicker;
			var origPlay = AbstractTween.prototype.play;

			// 1. Promise support for .play() and .then()
			// .play() returns the tween for chaining, now with .then() for Promise-style
			// .then(onFulfilled) on a tween registers a completion callback and returns the tween for serial() chaining
			// Does NOT interfere with existing .onComplete callback pattern
			var origFire = AbstractTween.prototype.fire;
			/**
			 * Override: fires a tween event and resolves pending promises on complete.
			 * @param {String} type - Event type (complete, start, play, etc.)
			 * @return {Object} The tween instance
			 */
			AbstractTween.prototype.fire = function(type){
				var result = origFire.call(this, type);
				if(type === 'Complete' || type === 'complete'){
					var list = this._deferreds;
					if(list){
						for(var i = 0; i < list.length; i++){
							list[i].resolve(this);
						}
						this._deferreds = [];
					}
					var cbs = this._thenCallbacks;
					if(cbs){
						for(var i = 0; i < cbs.length; i++){
							cbs[i](this);
						}
						this._thenCallbacks = [];
					}
				}
				return result;
			};
			/**
			 * Override: plays the tween and returns a Promise-aware result.
			 * @return {Object} The tween instance with .then()/.catch() promise methods
			 */
			AbstractTween.prototype.play = function(){
				var result = origPlay.call(this);
				var self = this;
				var deferred = {};
				deferred.promise = new Promise(function(resolve){
					deferred.resolve = resolve;
				});
				if(!this._deferreds) this._deferreds = [];
				this._deferreds.push(deferred);
				result.then = function(r, j){ return deferred.promise.then(r, j); };
				result.catch = function(j){ return deferred.promise.catch(j); };
				return result;
			};

			// .then(onFulfilled) on any tween instance — registers a completion callback,
			// returns the tween itself so it can be used in serial()/parallel() chains:
			//   BJS.serial(tw1, ajax.then(fn), tw2)
			/**
			 * Registers a completion callback on the tween (Promise-style).
			 * @param {Function} onFulfilled - Callback when tween completes
			 * @param {Function} [onRejected] - Optional rejection handler
			 * @return {Object} The tween instance for chaining
			 */
			AbstractTween.prototype.then = function(onFulfilled, onRejected){
				if(typeof onFulfilled === 'function'){
					if(!this._thenCallbacks) this._thenCallbacks = [];
					this._thenCallbacks.push(onFulfilled);
				}
				return this;
			};

			// 2. BJS.stagger() - animate array of targets with staggered delay
			//   BJS.stagger([el1, el2, el3], {opacity:100}, {stagger:0.05, time:0.3, ease:Expo.easeOut})
			/**
			 * Creates staggered tweens for an array of targets.
			 * @param {Array} targets - Array of target objects or DOM elements
			 * @param {Object} to - Destination property values
			 * @param {Object} [options] - Options with stagger, from, time, ease, onComplete
			 * @return {TweenLike} A parallel group tween with staggered delays
			 */
			bjs.stagger = function(targets, to, options){
				options = options || {};
				var staggerDelay = options.stagger || 0.05;
				var from = options.from;
				var time = options.time || 0.5;
				var ease = options.ease || Linear.easeOut;
				var tweens = [];
				var l = targets.length;
				for(var i = 0; i < l; i++){
					var tw = bjs.create({
						target: targets[i],
						to: to,
						from: from,
						time: time,
						ease: ease
					});
					tweens.push(staggerDelay ? bjs.delay(tw, i * staggerDelay) : tw);
				}
				var parallel = bjs.parallelTweens(tweens);
				if(options.onComplete) parallel.onComplete = options.onComplete;
				return parallel;
			};

			// 3. BJS.timeline() - simple timeline builder (fluent API)
			//   var tl = BJS.timeline();
			//   tl.add(tween1).add(tween2, 0.5).play();
			/**
			 * Creates a simple timeline builder with fluent API.
			 * @return {Object} A timeline object with add(), play(), onComplete(), getDuration()
			 */
			bjs.timeline = function(){
				var tweens = [];
				var currentTime = 0;
				return {
					add: function(tween, offset){
						offset = offset || 0;
						tweens.push(offset > 0 ? bjs.delay(tween, offset) : tween);
						currentTime += (tween.time || 0) + offset;
						return this;
					},
					play: function(){
						var serial = bjs.serialTweens(tweens);
						if(this._onComplete) serial.onComplete = this._onComplete;
						serial.play();
						return serial;
					},
					onComplete: function(fn){
						this._onComplete = fn;
						return this;
					},
					getDuration: function(){ return currentTime; }
				};
			};

			// 4. Global play/pause/resume for the entire animation system
			/**
			 * Pauses the entire animation system.
			 * @return {void}
			 */
			bjs.pause = function(){ AnimationTicker.haltSystem(); };
			/**
			 * Resumes the entire animation system after a pause.
			 * @return {void}
			 */
			bjs.resume = function(){ AnimationTicker.restoreSystem(); };
			/**
			 * Checks if the animation system is currently playing.
			 * @return {Boolean} Whether the system is active and not halted
			 */
			bjs.isPlaying = function(){ return AnimationTicker.started && !AnimationTicker.HALT; };

			// 5. BJS.clear() - stop all active tweens immediately
			/**
			 * Stops all active tweens immediately and resets the ticker.
			 * @return {void}
			 */
			bjs.clear = function(){
				if(EFT.started) EFT.stop();
				if(AnimationTicker.started) AnimationTicker.stop();
				EFT.numListeners = 0;
				EFT.first = undefined;
				EFT.last = undefined;
			};

			// 6. Auto-pause on visibility change (battery-friendly)
			// Note: blur/focus is handled by events.js with shift+space integration
			if(typeof document !== 'undefined'){
				var onVisChange = function(){
					if(document.hidden || document.webkitHidden){
						if(AnimationTicker.started && !AnimationTicker.HALT){
							bjs.__suspended = true;
							AnimationTicker.haltSystem();
						}
					}else if(bjs.__suspended){
						bjs.__suspended = false;
						AnimationTicker.restoreSystem();
					}
				};
				document.addEventListener('visibilitychange', onVisChange);
				document.addEventListener('webkitvisibilitychange', onVisChange);
			}

			// 7. Fix: BJS.instant had a bug (used 'tg' instead of 'target')
			/**
			 * Instantly applies properties to a target (fixed version).
			 * @param {Object|Element} target - The target object or DOM element
			 * @param {Object} properties - Property values to apply instantly
			 * @return {TweenLike} The created tween instance
			 */
			bjs.instant = function instant(target, properties){
				return bjs.apply({
					target: target,
					to: properties,
					time: bjs.$.Tween.SAFE_TIME,
					ease: Linear.easeOut
				}, true);
			};

			// 8. BJS.restart(tween) - clean stop+replay from beginning
			/**
			 * Stops a tween and replays it from the beginning.
			 * @param {Object} tween - The tween to restart
			 * @return {Object} The restarted tween
			 */
			bjs.restart = function(tween){
				return tween.restart();
			};

			// 9. BJS.stopAll() - stop every active tween across all sections
			/**
			 * Stops every active tween across the entire system.
			 * @return {void}
			 */
			bjs.stopAll = function(){
				var listeners = [];
				var l = EFT.first;
				while(!!l){
					listeners.push(l);
					l = l.nextListener;
				}
				for(var i = 0; i < listeners.length; i++){
					if(listeners[i].isPlaying && listeners[i].stop) listeners[i].stop();
				}
			};

			// 10. Fluent decorator API — chain on the tween directly:
			//   BJS.create({target:el, to:{left:500}}).reverse().delay(0.3).play()
			/**
			 * Returns a reversed version of this tween.
			 * @return {TweenLike} A reversed tween decorator
			 */
			AbstractTween.prototype.reverse = function(){
				return bjs.reverse(this);
			};
			/**
			 * Returns a sliced portion of this tween.
			 * @param {Number} [begin=0] - Start position or percent
			 * @param {Number} [end=1] - End position or percent
			 * @param {Boolean} [isPercent=false] - Whether begin/end are percentages
			 * @return {TweenLike} A sliced tween decorator
			 */
			AbstractTween.prototype.slice = function(begin, end, isPercent){
				return bjs.slice(this, begin, end, isPercent);
			};
			/**
			 * Returns a time-scaled version of this tween.
			 * @param {Number} scale - Duration scale multiplier
			 * @return {TweenLike} A scaled tween decorator
			 */
			AbstractTween.prototype.scale = function(scale){
				return bjs.scale(this, scale);
			};
			/**
			 * Returns a delayed version of this tween.
			 * @param {Number} [delay=0] - Pre-delay duration
			 * @param {Number} [postDelay=0] - Post-delay duration
			 * @return {TweenLike} A delayed tween decorator
			 */
			AbstractTween.prototype.delay = function(delay, postDelay){
				return bjs.delay(this, delay, postDelay);
			};
			/**
			 * Returns a repeated version of this tween.
			 * @param {Number} [repeatCount=2] - Number of times to repeat
			 * @return {TweenLike} A repeated tween decorator
			 */
			AbstractTween.prototype.repeat = function(repeatCount){
				return bjs.repeat(this, repeatCount);
			};

		})(BetweenJS);

	})})()
) ;