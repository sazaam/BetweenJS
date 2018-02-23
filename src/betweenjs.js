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
		var ONE 			= 1.0 ;
		var TWO 			= 2.0 ;
		var XXL				= 1e10 ;
		var MAX				= 19;
		// Externally-Pusblishable settings
		var BetweenJSCore = {
			settings:{
				begin:NOOP,
				update:NOOP,
				draw:NOOP,
				end:NOOP
			},
			Decimal:{
				add:function(n1, n2){
					var s1, s2, l1, l2 ;
					
					s1 = n1 + n2 ;
					l1 = (''+s1).length ;
					
					if(l1 < MAX) return s1 ;
					
					s2 = ((n1 * XXL) + (n2 * XXL)) / XXL ;
					l2 = (''+s2).length ;
					
					return l1 < l2 ? s1 : s2 ;
				},
				sub:function(n1, n2){
					var s1, s2, l1, l2 ;
					
					s1 = n1 - n2 ;
					l1 = (''+s1).length ;
					
					if(l1 < MAX) return s1 ;
					
					s2 = ((n1 * XXL) - (n2 * XXL)) / XXL ;
					l2 = (''+s2).length ;
					
					return l1 < l2 ? s1 : s2 ;
				},
				mul:function(n1, n2){
					var s1, s2, l1, l2 ;
					
					s1 = n1 * n2 ;
					l1 = (''+s1).length ;
					
					if(l1 < MAX) return s1 ;
					
					s2 = ((n1 * XXL) * (n2 * XXL)) / XXL / XXL ;
					l2 = (''+s2).length ;
					
					return l1 < l2 ? s1 : s2 ;
				},
				div:function(n1, n2){
					var s1, s2, l1, l2 ;
					
					s1 = n1 / n2 ;
					l1 = (''+s1).length ;
					
					if(l1 < MAX) return s1 ;
					
					s2 = ((n1 * XXL) / (n2 * XXL)) ;
					l2 = (''+s2).length ;
					
					return l1 < l2 ? s1 : s2 ;
				}
			}
		} ;
		
			// Animation Ticker Core
		var getNow 			= function(){ return ('performance' in window) && ('now' in window.performance) ? performance.now() : new Date().getTime() },
			getTimer 		= function(){ return getNow() - __LIVE_TIME__ },
			// other utils
			concat 			= function(p){ return (p === undefined) ? [] : p },
			valueExists 	= function(o, val){ return !!o ? o[val] : undefined },
			checkForEpsilon = function(p){return (p > ZERO && p < __EPSILON__) ? ZERO : p },
			isJQ			=function(tg){ return 'jQuery' in tg || 'selector' in tg },
			isDOM 			= function(tg, c){ return ((c = tg.constructor) === undefined || (DOM_reg.test(c))) } ;
		
		var ADD 			= function(n1, n2){ return BetweenJS.$.Decimal.add(n1, n2) },
			SUB				= function(n1, n2){ return BetweenJS.$.Decimal.sub(n1, n2) },
			MUL				= function(n1, n2){ return BetweenJS.$.Decimal.mul(n1, n2) },
			DIV				= function(n1, n2){ return BetweenJS.$.Decimal.div(n1, n2) } ;
		
		
			// Animation & TIcker Control
		var __LIVE_TIME__ 			= getNow(),
			__TIME__				= NaN,
			__OFF_TIME__ 			= ZERO,
			__EPSILON__ 			= 'EPSILON' in Number ? Number.EPSILON : .01,
			__FPS__ 				= 60 ;
		
		var __SIM_TIMESTEP__ 		= 1000 / __FPS__,
			__FRAME_DELTA__ 		= ZERO,
			__LAST_FRAME_TIME_MS__ 	= ZERO,
			__LAST_FPS_UPDATE__ 	= ZERO,
			__FRAMES_THIS_SECOND__ 	= ZERO,
			__NUM_UPDATES_STEP__ 	= ZERO,
			__MIN_FRAME_DELAY__ 	= ZERO,
			__SAFE_TIME__ 			= ZERO,
			__XXL__ 				= XXL ;
		
		var BASE_TIME 				= .75 ;

		var running 				= false,
			started 				= false,
			panic 					= false,
			// specials
			CACHE_TIMEOUT 			= {},
			// regexp
			DOM_reg 				= /HTML[a-zA-Z]*Element/,
			units_reg 				= /(px|em|pc|pt|%)$/,
			relative_reg 			=/^\$/ ;
		
		(function () {
			// REQUEST / CANCEL ANIMATIONFRAME
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
							if(ret[i] === true) break ;
						}
					}else{
						var l = this.length ;
						for(;l > 0 ; l--){
							var i = l - 1 ;
							var s = this.getElementAt(i) ;
							if(!!!s) break ;
							els[i] = s ;
							ret[i] = f(s, i, els) ;
							if(ret[i] === true) break ;
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
							
							__TIME__= timestamp ;
							
							anim.timestamp = faketimestamp * .001 ;
							anim.ID = requestAnimationFrame(anim.innerFunc) ;

							__FRAME_DELTA__ += timestamp - __LAST_FRAME_TIME_MS__ ;
							__LAST_FRAME_TIME_MS__ = timestamp ;
							
							// UNUSED
							begin(timestamp, __FRAME_DELTA__) ;
							
							
							if (timestamp > __LAST_FPS_UPDATE__ + 1000) {
								__FPS__ = 0.25 * __FRAMES_THIS_SECOND__ + 0.75 * __FPS__ ;
								__LAST_FPS_UPDATE__ = timestamp ;
								__FRAMES_THIS_SECOND__ = 0 ;
							}

							__FRAMES_THIS_SECOND__++ ;
							__NUM_UPDATES_STEP__ = 0 ;

							while (__FRAME_DELTA__ >= __SIM_TIMESTEP__) {
								// UNUSED
								update(__SIM_TIMESTEP__) ;
								
								// BETWEENJS TICKER
								anim.func(faketimestamp) ;

								__FRAME_DELTA__ -= __SIM_TIMESTEP__ ;
								if (++__NUM_UPDATES_STEP__ >= 240) {
									panic = true ;
									break ;
								}
							}
							
							// UNUSED
							draw(__FRAME_DELTA__ / __SIM_TIMESTEP__) ;
							
							// BETWEENJS TICKER
							anim.draw(__FRAME_DELTA__ / __SIM_TIMESTEP__) ;
							
							// UNUSED
							end(__FPS__, panic) ;
							panic = false ;
						},
						start:function(){
							var anim = AnimationTicker ;
							anim.started = true ;
							anim.ID = requestAnimationFrame(function(now){
								__OFF_TIME__ += isNaN(__TIME__) ? 0 : now - __TIME__;
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
				var EnterFrameTicker = Type.define({
					pkg:'::EnterFrameTicker',
					domain:BetweenJSCore,
					statics:{
						first:undefined,
						numListeners:0,
						coreListenersMax: 0,
						tickerListenerPaddings:undefined,
						time:undefined,
						archive:undefined,
						initialize:function initialize(domain){

							var AnimationTicker = BetweenJSCore.AnimationTicker ;

							AnimationTicker.start() ;

							var prevListener = undefined,
								max = this.coreListenersMax = 10 ;

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
							this.archive = {} ;
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
							var a = this.archive ;
							for(var s in a){
								delete a[s] ;
							}
							delete this.archive ;
							
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
							
							if(!!this.archive[time]) return ;
							else{this.archive[time] = time}
							
							
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
									if(listener instanceof AbstractTween){
										if(!!listener.startTime){
											t = SUB(t, listener.startTime) ;
											min ++ ;
											
										}
										drawables.push(listener) ;
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
						if(!!!options['time']) options['time'] = BASE_TIME ;
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
							.configure(options)
							.setHandlers(options)
							.assignUpdater(options) ;
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
							.setHandlers(options)
					}
				}
				// TWEENS
				var AbstractTween = Type.define({
					pkg:'::AbstractTween',
					domain:BetweenJSCore,
					inherits:Traceable,
					isPlaying:false,
					stopOnComplete:true,
					position:ZERO,
					time:NaN,
					startTime:NaN,
					updater:undefined,
					isPlaying:false,
					stopOnComplete:true,
					archive:{},
					constructor:AbstractTween = function AbstractTween(){
						AbstractTween.base.call(this) ;
						this.isPlaying = false ;
						this.time = Tween.DEFAULT_TIME ;
					},
					configure:function(options){
						this.stopOnComplete = options['stopOnComplete'] || true ;
						this.position = options['initposition'] || ZERO ;
						
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
						this.startTime = SUB(EFT.time, position) ;
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
						p = isNaN(p) ? ZERO : p >= this.time ? ZERO : p ;
						
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
						position = !!isPercent ? MUL(this.time, position) : position ;
						
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
						return this.seek(ZERO) ;
					},
					gotoAndPlay:function(position, isPercent){
						position = !!isPercent ? MUL(this.time, position) : position ;
						
						if(!this.isPlaying)
							return this.seek(position).play() ;
						else
							this.tick(this.position) ;
						
						return this ;
					},
					gotoAndStop:function(position, isPercent){
						position = !!isPercent ? MUL(this.time, position) : position ;
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
					checkFiniteTime:function(position){
						return this.updater.update(position) ;
					},
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					//////// CAUTION MANY CLASSES DEPENDING ON THIS UPDATE / TICK / INTERNALUPDATE
					tick:function(position){
						
						if (!this.isPlaying) return true ;
						
						var r = this.update(position) ;
						
						if(r.started){
							//
						}
						
						if(r.decayed){
							//
							if (!this.stopOnComplete) {
								
								this.seek(ZERO) ;
								
							} else {
								
								this.stop() ;
								
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
						
						this.updater.update(this.position) ;
						
						return r ;
					},
					setPositionAndFeedback:function(position){
						
						var started, 
							decayed, 
							reversed = (this.position >= position) ;
						
						if(reversed){
							started = position <= ZERO ;
							decayed = SUB(this.position, this.time) >= ZERO ;
						}else{
							started = this.position <= ZERO ;
							decayed = SUB(position, this.time) >= ZERO ;
						}
						
						this.setPosition(position) ;
						
						return this.info = {
							started:started,
							decayed:decayed,
							reversed:reversed
						} ;
					},
					update:function(position){
						
						if(!isFinite(position)){
							return this.internalUpdate(position) ;
						}
						
						var s = this.internalUpdate(position) ;
						
						/////////////////////////////////// EVENTS
						// START
						if(s.started) this.fire('start') ;
						
						// UPDATE
						this.fire('update') ;
						
						// COMPLETE
						if(s.decayed) this.fire('complete') ;
						
						return s ;
					},
					draw:function(){
						this.internalDraw() ;
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
					statics:{
						SAFE_TIME:__EPSILON__,
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
						constructor:AbstractActionTween = function AbstractActionTween(){
							AbstractActionTween.base.call(this) ;
						},
						configure:function(options){
							AbstractActionTween.factory.configure.apply(this, [options]) ;
							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return Tween.SAFE_TIME ;
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
							RemoveFromParentAction.factory.configure.apply(this, [options]) ;

							this.target =  PropertyMapper.checkNode(options['target']) ;

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
							this.end = options['end'] || 1.0 ;
							this.begin = options['begin'] || 0.0 ;

							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return this.end - this.begin ;
							}
							
							if(this.time == __XXL__){
								
								this.setTime(this.update(-Infinity)) ;
								
								if(SUB(this.end, this.begin) == 0) {
									this.instantUpdate = true ;
									this.baseTween.update(this.begin) ;
									s.started = true ;
									s.decayed = true ;
									
									return s ;
								}
								
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							var pos 	= this.position,
								bt 		= this.baseTween ;
							
							if (pos > 0) {
								if (pos < this.time) {
									bt.update(ADD(pos , this.begin)) ;
								} else {
									bt.update(this.end) ;
								}
							} else {
								bt.update(this.begin) ;
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
								return this.baseTween.update(-Infinity) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(DIV(position, this.scale)) ;
							
							this.baseTween.update(DIV(this.position, this.scale)) ;
							
							return r ;
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
								return this.baseTween.update(-Infinity) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							this.baseTween.update(this.baseTween.time - this.position) ;
							
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
								return MUL((this.basetime = this.baseTween.update(position)), this.repeatCount) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							var childpos = this.position ;
							if (childpos >= 0) {
								childpos -= childpos < this.time
									? MUL(this.basetime, parseInt(childpos / this.basetime))
									: SUB(this.time, this.basetime) ;
							}
							
							this.baseTween.update(childpos) ;
							
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
						delay:0,
						postDelay:0,
						constructor:DelayedTween = function DelayedTween(){
						   DelayedTween.base.call(this) ;
						},
						configure:function(options){
							DelayedTween.factory.configure.apply(this, [options]) ;
							
							this.delay = options['delay'] || 0 ;
							this.postDelay = options['postDelay'] || 0 ;

							return this ;
						},
						internalUpdate:function(position){
							
							if(!isFinite(position)){
								return ADD(this.baseTween.update(position) , ADD(this.delay, this.postDelay)) ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var r = this.setPositionAndFeedback(position) ;
							
							
							this.baseTween.update(this.position - this.delay) ;		
							
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
									if(ret[i] === true) break ;
								}
							}else{
								var l = this.length ;
								for(;l > 0 ; l--){
									var i = l - 1 ;
									var s = this.getElementAt(i) ;
									if(!!!s) break ;
									els[i] = s ;
									ret[i] = f(s, i, els) ;
									if(ret[i] === true) break ;
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
							
							var fff 	= this,
								r		= this.setPositionAndFeedback(position) ;
							
							this.bulkFunc(function(el, i, arr){
								
								if(el.time == __XXL__){
									el.setTime(el.update(Infinity)) ;
								}
								
								el.update(fff.position) ;
								
							}) ;
							
							return r ;
						},
						internalDraw:function(){
							
							this.bulkFunc(function(el){
								el.draw() ;
							}) ;
							
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
						drawable:undefined,
						durations:[],
						constructor:SerialTween = function SerialTween(){
							SerialTween.base.call(this) ;
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
									t = ADD(t, el.update(position)) ;
								}, true) ;
								
								return t ;
							}
							
							if(this.time == __XXL__){
								this.setTime(this.update(-Infinity)) ;
							}
							
							var drawables = [], cur ;
							
							var fff 		= this,
								d 			= 0, 
								ld 			= 0, 
								extra 		= 0, 
								oneframe 	= 0, 
								local 		= 0, 
									
								lf 			= this.position,
								r 			= this.setPositionAndFeedback(position) ;
							
							
							if(r.reversed){
								
								d = this.time ;
								ld = d ;
								
								extra = 0 ;
								
								this.bulkFunc(function(el, i, arr){
									
									if(el.time == __XXL__){
										el.setTime(el.update(-Infinity)) ;
									}
									
									oneframe = lf - fff.position ;
									
									if(fff.position >= ((d-= el.time) - oneframe) && ld >= fff.position){
										
										var local = (fff.position - d) + extra ;
										
										if(local < 0){
											extra = local ;
											local = 0 ;
										}else{
											extra = 0 ;
										}
										
										el.update(local) ;
										drawables.push(el) ;
									}
									
									ld = d ;
										
									
								}, true) ;
								
							}else{
								
								this.bulkFunc(function(el, i, arr){
									
									if(el.time == __XXL__){
										el.setTime(el.update(Infinity)) ;
									}
									
									if (lf <= (d + el.time) && ld <= (fff.position)) {
										
										var local = fff.position - d ;
										
										el.update(local) ;
										drawables.push(el) ;
									}
									
									d += (el.time) ;
									ld = d ;
								})
								
							}
							
							this.drawables = drawables ;
							
							return r ;
						},
						internalDraw:function(){
							var d = this.drawables ;
							
							if(!d) return ;
							var i, l = d.length ;
							for(;l > 0; l--){
								i = l - 1 ;
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

						var safeWriteIn = function(s, o){
							if(!(s in o)) o[s] = PropertyMapper.REQUIRED ;
						}

						// cuepoints no need REQUIREDSTUFF to be written bur needs to write
						if(!!cp){
							for(s in cp){
								s = PropertyMapper.checkCustomMapper(updater, 'cuepoints', cp, s) ;
								safeWriteIn(s, to) ;
								safeWriteIn(s, fr) ;
							}
						}

						// Write back SOURCE from DEST
						for(s in to){
							s = PropertyMapper.checkCustomMapper(updater, 'to', to, s) ;
							safeWriteIn(s, fr) ;
						}

						// Write back DEST from SOURCE
						for(s in fr){
							s = PropertyMapper.checkCustomMapper(updater, 'from', fr, s) ;
							safeWriteIn(s, to) ;
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
							'cuepoints':options['cuepoints']
						}

						var ease = options['ease'] ;
						var time = ease instanceof Physical ? BetweenJS.$.Tween.SAFE_TIME : options['time'] ;
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
										
										if(value == PropertyMapper.REQUIRED){
											updater[action](name, PropertyMapper.REQUIRED) ;
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
								factor = position < this.time ? this.ease.calculate(position, ZERO, ONE, this.time) : ONE ;
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
						
						if(!this.isResolved){
							this.resolveValues(true) ;
							this.isResolved = true ;
						}
						
						this.setPosition(position) ;
						
						this.setFactor(this.position) ;
						
						this.updateObject() ;
						
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > 0 ? t : -t ;
					},
					resolveValues:function(forReal){
						var PropertyMapper = BetweenJS.$.PropertyMapper ;
						
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
							var cpduration = 0 ;
							for (i = 0 ; i < l ; ++i) {

								var prev = cur || first ;

								if (rMap['cuepoints.' + key + '.' + i]) {
									(cpVec[i] += this.getInObject(key)) ;
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

							if(!!!cp[name]){
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
						return BetweenJS.$.PropertyMapper.cache[name]['getMethod'](this.target, name, this.units[name]) ;
					},
					setIn:function(name, value){
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
					time:0,
					isResolved:false,
					constructor:UpdaterProxy = function UpdaterProxy(parent, child, propertyName){
						UpdaterProxy.base.call(this) ;

						this.parent = parent ;
						this.child = child ;
						this.propertyName = propertyName ;
						this.isPhysical = this.parent.isPhysical ;
						this.setTime(this.parent.time) ;
					},
					setTime:function(time){
						this.time = time ;
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > 0 ? t : -t ;
					},
					resolveValues:function(){
						var p = this.parent ;
						var time = p.time ;
						var isPhysical = p.isPhysical ;
						
						if(isPhysical){
							var c = this.child ;
							if(!c.isResolved){
								c.resolveValues() ;
								c.isResolved = true ;
								
								if(time > c.time) c.setTime(time) ;
								else {
									time = c.time ;
									p.setTime(time) ;
								}
							}
						}
						
						this.setTime(time) ;
						
						return this.time ;
					},
					update:function(position){
						var Tween = BetweenJS.$.Tween ;
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						if(!this.isResolved){
							this.resolveValues() ;
							this.isResolved = true ;
						}
						
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
				// BULKUPDATER
				var BulkUpdater = Type.define({
					pkg:'::BulkUpdater',
					domain:BetweenJSCore,
					inherits:Poly,
					target:undefined,
					time:0,
					isResolved:false,
					isPhysical:false,
					constructor:BulkUpdater = function BulkUpdater(target, updaters){
						var isPhysical = false ;
						
						this.target = target ;
						
						BulkUpdater.base.apply(this, [updaters, function(el){
							isPhysical = isPhysical || el.isPhysical ;
						}]) ;
						
						this.length = updaters.length ;
					},
					setTime:function(time){
						this.time = time ;
					},
					checkTime:function(position){
						var t = this.resolveValues() ;
						return t > 0 ? t : -t ;
					},
					resolveValues:function(position){
						var time = this.time ;
						var isPhysical = false ;
						
						this.bulkFunc(function(c){
							isPhysical = isPhysical || c.isPhysical ;
							
							if(!c.isResolved){
								c.resolveValues() ;
								c.isResolved = true ;
								
								if(time > c.time) c.setTime(time) ;
								else time = c.time ;
							}
						}) ;
						
						this.setTime(time) ;
						return this.time ;
					},
					update:function(position){
						var Tween = BetweenJS.$.Tween ;
						
						if(!isFinite(position)){
							return this.checkTime(position) ;
						}
						
						if(!this.isResolved){
							this.resolveValues() ;
							this.isResolved = true ;
						}
						
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
						var units, isRelative ;
						
						if(val.constructor == Array){ // CUEPOINTS
							var bb = false ;
							var l = val.length ;
							for(var i = 0 ; i < l ; i++){
								
								var vv = val[i] ;
								var r = this.parseMethod(updater, typename, type, name, vv) ;
								val[i] = r.value ;
								name = r.name ;
								
								if(r.units !=='') units = r.units ;
								
								isRelative = r.isRelative ;
								
								bb = Boolean(bb || r.block) ;
								
								if(bb) break ;
							}
							
							return {
								name:name,
								value:val,
								units:units,
								isRelative:isRelative,
								block:bb
							} ;

						}else{
							
							return this.parseMethod(updater, typename, type, name, val, val == '__REQUIRED__') ;
						}
					}
				}) ;
				var PropertyMapper = Type.define({
					pkg:'::PropertyMapper',
					domain:BetweenJSCore,
					statics:{
						REQUIRED:'__REQUIRED__',
						cache:{},
						checkCustomMapper:function(updater, typename, type, name){
							var UpdaterFactory = BetweenJS.$.UpdaterFactory ;
							var CustomMappers = BetweenJS.$.PropertyMapper.CustomMappers ;
							var val = type[name] ;
							var i, l, s, j, ll, custom, pattern ;
							
							var customs = CustomMappers ;
							var accurate ;
							l = customs.length ;
							var units, isRelative ;
							
							var localname = name ;
							
							for(i = 0 ; i < l ; i ++){
								
								custom = customs[i] ;
								
								var tt = type[name] ;
								
								// KICK OUT UNDESIRABLES
								if(!custom.pattern.test(name)) continue ;
								
								
								s = custom.check(updater, typename, type, name, tt) ;
								
								accurate = custom ;
								
								// SET VALUE IS A START
								if(tt !== s.value) type[name] = s.value ;
								// IF NAME DIFFERENT PERFORM SMART REWRITE
								if(localname != s.name){
									// SET NEW NAME INSTEAD OF OLD
									localname = s.name ;
									// ERASE IN TARGET PROPS OBJ
									delete type[name] ;
								}
								
								// REWRITE VALUE WITH NEW NAME
								type[localname] = s.value ;
								
								if(s.units){
									units = s.units ;
								}
								
								if(s.isRelative){
									isRelative = s.isRelative ;
								}
								
								if(s.block){
									// FOUND !!!!!
									break ;
									
								} else {
									// FOUND BUT MODIFED NOSAVE & SMART REWRITE !!!!!
									continue ; // WILL RECHECK THINGS
								}
								
							}
							
							// SET
							if(!!units) updater.units[localname] = units ;
							if(!!isRelative) updater.relativeMap[typename + '.' + localname] = isRelative ;
							
							// ONLY ONCE AT FINAL
							if(!(localname in PropertyMapper.cache) || PropertyMapper.cache[localname] !== accurate){
								PropertyMapper.cache[localname] = accurate ;								
							}
							
							return localname ;
						},
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
								}
							}),
							new CustomMapper(/((border|background)?color|background)$/i, {
								parseMethod:function(updater, typename, type, name, val, required){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[name] : val ;

									name = name == 'background' ? name + '-color' : name ;
									name = PropertyMapper.replaceCapitalToDash(name) ;
									
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
								}
							}),
							new CustomMapper(/alpha|opacity/gi, {
								parseMethod:function(updater, typename, type, name, val, required){
									var PropertyMapper = BetweenJS.$.PropertyMapper ;
									val = val === undefined ? type[name] : val ;
									
									// TODO CSSPROPERTY-OPACITY-MISSING BROWSERS OPACITY TO WORK
									name = 'opacity' ;
									
									return {
										name:name,
										value:val,
										block:true
									}
								},
								getMethod:function getMethodAlpha(tg, n){
									return BetweenJS.$.PropertyMapper.alphaGet(tg, n) ;
								},
								setMethod:function setMethodAlpha(tg, n, val){
									return BetweenJS.$.PropertyMapper.alphaSet(tg, n, val) ;
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
								val = val == '' ? 100 : val.replace(/alpha\(opacity=|\)/g, '') ;
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
							str = Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), '')) ;
							return str ;
						},
						simpleDOMSet:function(tg, n, v, unit){
							this.setStyle(tg, n, v + unit) ;
						},
						printCSSRules:function(selector, propertyname, max, min, str){
							min = min == undefined ? 0 : min ;
							str = str == undefined ? '' : str ;
							for(var i = min ; i < max ; i ++){
								str += '\n' +
										selector + i +
										'{' +
											propertyName + ':' + i + 
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
										if(!!tg && isJQ(tg)) {
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

									if(isJQ(target)) { // is jquery element

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
					}).update(applyTime).draw() ;
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
					}).update(applyTime).draw() ;
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
						return tween.baseTween.seek(position) ;
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
								func:closure,
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
								func:closure,
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
									(v & 100) * .01 , 
									'hsv') ;
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
									1 , 
									'hsv') ;
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
					safe:function(val, mode){
						var MODE = mode || 'rgb' ;
						
						var max = {r:255, g:255, b:255, a:1.0} ;
						var min = {r:0, g:0, b:0, a:0.0} ;
						
						for(var s in max){
							var m = max[s] ;
							var n = min[s] ;
							var v = val[s] ;
							if(v > m) val[s] = m ;
							if(v < n) val[s] = n ;
						}
						
						return val ;
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