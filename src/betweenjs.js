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
		
		var running 				= false,
			started 				= false,
			panic 					= false,
			// specials
			CACHE_TIMEOUT 			= {},
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
						createAnimation:function(update, draw){
							return new Animation(update, draw) ;
						},
						begin:function(timestamp, __FRAME_DELTA__){
							// UNUSED
							BetweenJSCore.settings.begin(timestamp, __FRAME_DELTA__) ;
						},
						update:function(timestamp){
							// UNUSED
							BetweenJSCore.settings.update(timestamp) ;
							
							var loops = this.loops ;
							var l = loops.length ;
							for(var i = 0 ; i < l ; i++){
								var loop = loops[i] ;
								loop.update(timestamp) ;
								
								if(loop.die){
									loop.stop() ;
								}
							}
						},
						draw:function(timestamp){
							// UNUSED
							BetweenJSCore.settings.draw(timestamp) ;
							
							var loops = this.loops ;
							var l = loops.length ;
							for(var i = 0 ; i < l ; i++){
								var loop = loops[i] ;
								loop.draw(timestamp) ;
							}
						},
						end:function(__FPS__, panic){
							// UNUSED
							BetweenJSCore.settings.end(__FPS__, panic) ;
						},
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
						haltSystem:function(){
							var anim = AnimationTicker ;
							anim.HALT = true ;
						},
						restoreSystem:function(){
							var anim = AnimationTicker ;
							anim.HALT = false ;
							anim.start() ;
						},
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
									panic = true ;
									break ;
								}
							}
							
							// BETWEENJS TICKER
							anim.draw(__FRAME_DELTA__ / __SIM_TIMESTEP__) ;
							
							anim.end(__FPS__, panic) ;
							
							panic = false ;
						},
						start:function(){
							var anim = AnimationTicker ;
							anim.started = true ;
							
							anim.ID = requestAnimationFrame(function(now){
								__OFF_TIME__ += isNaN(__TIME__) ? ZERO : now - __TIME__;
								anim.innerFunc(now) ;
							}) ;
						},
						stop:function(){
							var anim = AnimationTicker ;
							cancelAnimationFrame(anim.ID) ;
							
							anim.started = false ;
							delete anim.ID ;
						},
						attach:function(loop){
							var lo = this.loops ;
							lo[lo.length] = loop ;
							if(lo.length == 1) {
								this.start() ;
							}
						},
						detach:function(loop){
							this.reorder() ;
							this.loops.splice(loop.index, 1) ;
							
							if(this.loops.length == 0) this.stop() ;
						},
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
					constructor:Animation = function Animation(update, draw){
						Animation.base.call(this) ;
						this.enable(update, draw) ;
					},
					enable:function(update, draw){
						this.update = update ;
						this.draw = draw ;
					},
					start:function(){
						AnimationTicker.attach(this) ;
						return this ;
					},
					stop:function(){
						AnimationTicker.detach(this) ;
						this.destroy() ;
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
					constructor:TickerListener = function TickerListener(){

					},
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
						removeTickerListener:function(listener){

							var l = this.first ;

							while(!!l){
								if(l == listener){
									if(!!l.prevListener){
										l.prevListener.nextListener = l.nextListener ;
										l.nextListener = undefined ;
									}else{
										this.first = l.nextListener ;
									}

									if(!!l.nextListener){
										l.nextListener.prevListener = l.prevListener;
										l.prevListener = undefined ;
									}else{
										this.last = l.prevListener ;
									}
									-- this.numListeners ;
								}
								l = l.nextListener ;
							}

						},
						start:function(){
							
							var AnimationTicker = BetweenJS.$.AnimationTicker ;
							var Animation = BetweenJS.$.Animation ;
							
							var EFT = this ;
							
							this.animation = AnimationTicker.createAnimation(
								function(timestamp){
									if(__EFT_START_TIME__ == ZERO) {
										__EFT_START_TIME__ = AnimationTicker.timestamp ;
									}
									EFT.update(AnimationTicker.timestamp) ;
								},
								function(timestamp){
									EFT.draw(AnimationTicker.timestamp) ;
								}
							).start() ;
							
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
											listener = ll ;
											-- this.numListeners ;
										}
									}
									
								}
							} catch (error) {
								trace(error)
								EFT.stop() ;
							}
							

							if(min == 0){
								// trace('stopping')
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
					optionDefaults:function(options){
						if(!!!options['ease']) options['ease'] = Expo.easeOut ;
						if(!!!options['time'] && options['time'] !== 0) options['time'] = BASE_TIME ;
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
					create:function(options){

						return this.checkMultipleTargets(options) ;
					},
					createBasic:function(options){

						var tw = new Tween() ;
						
						return tw
							.configure(options)
							.checkPhysical()
							.setHandlers(options) ;
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
							case !!(t = actions.animationframe) :
								tw = new (BetweenJS.$.AnimationFrameAction)() ;
							break ;
						}

						return tw
							.configure(t)
							.setHandlers(options)
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
							.configure(t)
							.checkPhysical()
							.setHandlers(options)
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
					checkPhysical:function(){
						if(this.updater.isPhysical) this.isPhysical = true ;
						return this ;
					},
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
					bind:function(type, func){
						type = type.replace(/^\w/, function($1){return $1.toUpperCase()}) ;
						this['on'+type] = func ;
						this['on'+type+'Params'] = [{type:type, target:this}] ;
						
						return this ;
					},
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
					/*

						TWEEN & UPDATER SETTINGS

					*/
					setUpdater:function(updater){
						this.updater = updater ;
						return this ;
					},
					setPosition:function(position){
						if (position < ZERO) position = ZERO ;
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
					register:function(p){
						var EFT = BetweenJS.$.EnterFrameTicker ;
						
						if(!EFT.started) EFT.start() ;
						
						if(!this.registered){
							EFT.addTickerListener(this) ;
							this.registered = true ;
						}
						
						return this ;
					},
					unregister:function(){
						if(this.registered){
							// BetweenJS.$.EnterFrameTicker.removeTickerListener(this) ;
							this.registered = false ;
						}
						
						return this ;
					},
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
					
					teardown:function(){
						this.isPlaying = false ;

						this.unregister() ;

						return this ;
					},

					nextFrame:function(closure, params){
						var args = __SLICE__.call(arguments) ;
						
						this.next = {
							closure:args.shift(),
							params:args
						} ;
						
					},
					
					triggerNext:function(){
						if(!!this.next){
							this.next.closure.apply(this, this.next.params) ;
							
							this.next = undefined ;
							delete this.next ;
						}
					},
					
					/*

						TIMELINE SETTINGS

					*/
					seek:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						this.setPosition(position) ;
						this.setStartTime(this.position) ;
						
						return this ;
					},
					toggle:function(){
						return this.isPlaying ? this.stop() : this.play() ;
					},
					start:function(){
						return this.rewind().play() ;
					},
					rewind:function(position){
						return this.seek(ZERO) ;
					},
					gotoAndPlay:function(position, isPercent){
						position = !!isPercent ?this.time * position : position ;
						
						if(!this.isPlaying)
							return this.seek(position).play() ;
						else
							this.tick(this.position) ;
						
						return this ;
					},
					gotoAndStop:function(position, isPercent){
						position = !!isPercent ? this.time * position : position ;
						this.update(position) ;
						return this.isPlaying
							? this.stop()
							: this.draw() ;
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
					checkFiniteTime:function(position){
						return this.updater.update(position) ;
					},
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
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
								
								// this.stop() ;
								return true ;
							}
						}
						
						return false ;
					},
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
					update:function(position){
						
						if(!isFinite(position)){
							return this.internalUpdate(position) ;
						}
						
						this.oldtime = this.time ;
						
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
					draw:function(){
						
						this.internalDraw() ;
						
						if(this.endReached){
							this.fire('update') ;
							this.fire('complete') ;
							this.endReached = false ;
						}
						
						this.fire('draw') ;
					},
					internalDraw:function(){
						this.updater.draw() ;
					},
					//////// END CAUTION
					//////// END CAUTION
					//////// END CAUTION
					clone:function(){
						var instance = this.newInstance() ;
						if (!!instance) {
							instance.copyFrom(this) ;
						}
						return instance ;
					},
					newInstance:function(){
					   return new AbstractTween() ;
					},
					copyFrom:function(source){
						this.position = source.position ;
						this.time = source.time ;
						this.ease = source.ease ;
						this.stopOnComplete = source.stopOnComplete ;
						this.updater = source.updater.clone() ;
						
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
							
							if(!!source[listener]){
								this[listener] = source[listener] ;
								
								if(!!source[listenerParams]) this[listenerParams] = source[listenerParams] ;
							}
							
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
					var AnimationFrameAction = Type.define({
						pkg:'::AnimationFrameAction',
						domain:BetweenJSCore,
						inherits:FunctionAction,
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
						constructor:GroupTween = function GroupTween(elements, closure){
							GroupTween.base.call(this) ;
							this.elements = [] ;
						},
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
							
							var isRight = this.name == 'SerialTween_1' ;
							
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
					isofy:function(updater, props){
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						var to = props['to'] ;
						var fr = props['from'] ;
						var cp = props['cuepoints'] ;

						var s, r ;

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
									for(t in val){
										declareRequired(t, o[n], val[t]) ;
									}
								}
							}
						}
						 
						
						var mappers = {} ;
						var val ;
						
						
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
									if(updater.relativeMap['cp' + '.' + s] === undefined) updater.relativeMap['cp' + '.' + s] = r.isRelative ;
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
									if(updater.relativeMap['to' + '.' + s] === undefined) updater.relativeMap['to' + '.' + s] = r.isRelative ;
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
									if(updater.relativeMap['fr' + '.' + s] === undefined) updater.relativeMap['fr' + '.' + s] = r.isRelative ;
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
						
						// updater.source = desc['from'] ;
						// updater.destination = desc['to'] ;
						// updater.cuepoints = desc['cuepoints'] ;
						
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
						return updater ;
					},
					
					// ENTER REGISTRY UNIT
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
						this.position = 
						this.maxDuration = ZERO ;
					},
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
					setTime:function(time){
						this.time = time ;
					},
					setPosition:function(position){
						this.position = position ;
					},
					update:function(position){
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						this.resolveValues(true) ;
						
						this.setPosition(position) ;
						this.setFactor(this.position) ;
						this.updateObject() ;
						
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > ZERO ? t : -t ;
					},
					resolveValues:function(forReal){
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						
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
							if (rMap['source.' + key]) {
								source[key] += this.getIn(key) ;
							}
						}

						for (key in dest) {

							if (userdest[key] == PropertyMapper.REQUIRED) {
								dest[key] = this.getIn(key) ;
							}
							
							if (rMap['dest.' + key]) {
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

								if (rMap['cuepoints.' + key + '.' + i]) {
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
								// if(this.isPhysical){
									// if (position >= dur[name]) {
										// val = b ;
									// }else{
										// val = e.calculate(position, a, b - a) ;
									// }
								// }else{
									// val = a * invert + b * factor ;
								// }
								
								val = a * invert + b * factor ;
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
					store:function(name, val){
						this.value = this.value || {} ;
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
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.source[name] = value ;
						this.relativeMap['source.' + name] = isRelative ;
					},
					setDestinationValue:function(name, value){
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;
						this.destination[name] = value ;
						this.relativeMap['dest.' + name] = isRelative ;
					},
					addCuePoint:function(name, value){
						var isRelative = REL_reg.test(name) ;
						if(isRelative) name = name.substr(1) ;

						var cuepoints = this.cuepoints[name] ;
						if (cuepoints === undefined) this.cuepoints[name] = cuepoints = [] ;
						cuepoints.push(value) ;
						this.relativeMap['cuepoints.' + name + '.' + cuepoints.length] = isRelative ;
					},
					getIn:function(name){
						if(isNOTDOM(this.target)) return this.target[name] ;
						var ss = BetweenJS.$.PropertyMapper.cache[name]['getMethod'](this.target, name, this.units[name]) ;
						return ss ;
					},
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
						
						if(!p.isResolved) p.resolveValues() ;
						
						var time = p.time ;
						
						if(this.isPhysical){
							
							var c = this.child ;
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
								// trace(custom.pattern)
								// KICK OUT UNDESIRABLES
								if(custom.pattern.test(name)){
									// trace('HELLO', custom.pattern)
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
									return BetweenJS.$.PropertyMapper.colorSet(tg, n, val) ;
								}
							}),
							
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
						detectNameUnits:function(name){
							
							var unit ;
							var n = name.replace(NAMEUNIT_reg, function($1, $2){
								unit = arguments[3] ;
								return '' ;
							}) ;
							return {name:n, unit:unit} ;
						},
						detectValueUnits:function(value){

							if(typeof(value) != 'string') return {unit : ''} ;
							
							var unit ;

							value = value.replace(VALUEUNIT_reg, function($1, $2){
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
							
							return name.replace(CAPSTODASH_reg, function($1){
								return '-' + $1.toLowerCase() ;
							}) ;
						},
						replaceRelative:function(name){
							var o = {isRelative:REL_reg.test(name)} ;
							o.name = o.isRelative ? name.substr(1) : name ;
							return o ;
						},
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
						setStyle:function(tg, name, val){
							tg['style'][name] = val ;
						},
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
						// SCROLL
						scrollGet:function(target, name, unit) {
							return (target === window || target === document) ?
							(
								this[(name == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] ||
								(PropertyMapper.isIEunder9 && document.documentElement[name]) ||
								document.body[name]
							) :
							target[name] ;
						},
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
						// ALPHA
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
						alphaSet:function(target, pname, val){
							if(window.getComputedStyle){
								return target['style']['opacity'] = val / 100 ;
							}else{
								return target['style']['filter'] = 'alpha(opacity='+val+')' ;
							}
						},
						
						
						
						colorGet:function(target, pname){
							var Color = BetweenJS.$.Color ;
							return Color.toColorObj(this.getStyle(target, pname)) ;
						},
						
						colorSet:function(target, pname, val){
							var Color = BetweenJS.$.Color ;
							this.setStyle(target, pname, Color.toColorString(Color.safe(val))) ;
						},
						
						
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
						simpleSet:function(tg, n, v, unit){
							if(isDOM(tg)){
								try {
									return this.simpleDOMSet(tg, n, v, unit || 'px') ;
								} catch (error) {
								}
							}
								
							tg[n] = unit == '' ? v : v + unit ;
						},
						simpleDOMGet:function(tg, n, unit){
							var str = this.getStyle(tg, n) ;
							
							str = Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
							
							return str ;
						},
						simpleDOMSet:function(tg, n, v, unit){
							this.setStyle(tg, n, v + unit) ;
						},
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
						checkNode:function(tg){
							var n ;
							if(isDOM(tg) || 'appendChild' in tg)
								n = tg ;
							else if(isJQ(tg)) // jQuery
								n = tg.get(0) ;
							return n ;
						},
						isJQ:function(tg){
							return isJQ(tg) ;
						},
						isDOM:function(tg){
							return isDOM(tg) ;
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
				apply:function apply(options, applyInBetweenContext){
					
					var applyTime = options['applyTime'] || ZERO ;
					options['time'] = options['time'] || ZERO ;
					
					var tw = BetweenJS.create(options) ;
					
					if(!applyInBetweenContext && applyTime) tw.gotoAndStop(applyTime) ;
					
					return tw ;
				},
				
				instant:function instant(tg, properties){
					
					return BetweenJS.apply({
						target:tg,
						to:properties,
						time:__SAFE_TIME__,
						ease:Linear.easeOut
					}, true) ;
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
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
					return BetweenJS.create({
						target: target,
						to: to,
						from: from,
						ease: ease
					}).update(applyTime).draw() ;
				},
				/*
					parallel

					@param [tween TweenLike, ...]

					@return TweenLike Object
				*/
				parallel:function parallel(tween){
					return BetweenJS.parallelTweens(__SLICE__.call(arguments)) ;
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
					return BetweenJS.serialTweens(__SLICE__.call(arguments)) ;
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
					scale

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
					reverse

					@param tween TweenLike
					@param reversePosition Float (default : 0.0)

					@return TweenLike TweenDecorator Object
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
								delay:delay,
								postDelay:postDelay
							}
						}
					} ;
					return BetweenJS.$.TweenFactory.createDecorator(options) ;
				},
				/*
					addChild

					@param target HtmlDomElement
					@param parent HtmlDomElement

					@return TweenLike AbstractActionTween Object
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

					@return TweenLike AbstractActionTween Object
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

					@return TweenLike AbstractActionTween Object
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
				/*
					timeout

					@param duration Float
					@param func Function
					@param params Array

					@return TweenLike AbstractActionTween Object
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
				/*
					clearTimeout

					@param uid Integer

					@return TweenLike AbstractActionTween Object
				*/
				clearTimeout:function(uid){
					var cc = isNaN(uid)? uid : CACHE_TIMEOUT[uid] ;
					uid = cc.uid ;
					delete CACHE_TIMEOUT[uid] ;
					return cc.stop() ;
				},
				/*
					animationframe

					@param func Function
					@param params Array

					@return TweenLike AbstractActionTween Object
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

					return (CACHE_TIMEOUT[uid] = tw) ;
				},
				/*
					cancelanimationframe

					@param uid Integer

					@return TweenLike AbstractActionTween Object
				*/
				cancelanimationframe:function(uid){
					var cc = isNaN(uid)? uid : CACHE_TIMEOUT[uid] ;
					uid = cc.uid ;
					delete CACHE_TIMEOUT[uid] ;
					return cc.clear() ;
				}
			}
		}) ;
		
		// BJS Shortcut
		Type.appdomain['BJS'] = BetweenJS ;
		
		// CSS
		Pkg.write('css', function(path){
			//COLORS
			
			var
				RGB_SPLIT_reg 					= /(rgba?\(|\)| )/gi,
				HSV_SPLIT_reg 					= /(hsva?\(|\)| )/gi,
				RGB_HSV_SPLIT_reg 				= /((rgb|hsv)a?\(|\)| )/gi,
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
				isColorOBJ		 					= function(val){ return !isSTR(val) &&  (isDefined(val.r) || isDefined(val.h))  } ;
			
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
													h = h.replace(HEX_reg, '') ;
													if(h.length == 3) 
														h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2) ;
													return h.toUpperCase() ;
												}
			
			
			var Color = Type.define({
				pkg:'::Color',
				domain:BetweenJSCore,
				statics:{
					
					////////// RGBA HSVA CONVERSIONS
					
					RGBtoHSV:function(r, g, b, a){
						
						var m = {} ;
						
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
						
						if(isDefined(a)) m.a = a ;

						return m ;
					},
					HSVtoRGB:function(h, s, v, a){

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
					
					
					////////// RGBA CONVERSIONS
					
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
					
					toColorString:function(val, mode){
						
						return this.toSTR(val) ;
					},
					
					toColorObj:function(val, mode){
						
						return this.toOBJ(val) ;
					},
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
					defaultFrameRate:__FPS__,
					uniform:function(velocity, frameRate){
						return new PhysicalUniform(velocity || TEN, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
					},
					accelerate:function(acceleration, initialVelocity, frameRate){
						return new PhysicalAccelerate(initialVelocity || ZERO, acceleration || ONE, isNaN(frameRate) ? Physical.defaultFrameRate : frameRate) ;
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

					return ((-iv + Math.sqrt(iv * iv - 4 * (a / TWO) * -c)) / (2 * (a / TWO))) * (ONE / this.fps);
				},
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
				constructor:PhysicalExponential = function PhysicalExponential(f, th, fps){
					this.f = f ;
					this.th = th ;
					this.fps = fps ;
				},
				getDuration:function(b, c){
					return (Math.log(this.th / c) / Math.log(1 - this.f) + 1) * (ONE / this.fps) ;
				},
				calculate:function(t, b, c){
					return -c * Math.pow(1 - this.f, (t / (ONE / this.fps)) - 1) + (b + c) ;
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
					return (c / (c < 0 ? -this.v : this.v)) * (ONE / this.fps) ;
				},
				calculate:function(t, b, c){
					return b + (c < 0 ? -this.v : this.v) * (t / (ONE / this.fps)) ;
				}
			});

		}) ;
		
	})})()
) ;