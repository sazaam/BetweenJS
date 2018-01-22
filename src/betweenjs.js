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
 * authored under Spark Project License
 *
 * by saz aka True
 * sazaam[(at)gmail.com]
 * 2011-2012
 *
 */
'use strict' ;
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
        throw new Error('Should use Type.js Dependancy') ;
	})()) ;

	return Pkg.write('org.libspark.betweenjs', function(path){
		var BetweenJSCore = {} ;
		// GetTimer Implementation
		var getNow = function(){
				if('performance' in window) {
					return window.performance.now ? performance.now() : new Date.getTime() ;
				}
				return new Date().getTime() ;
			},
			getTimer = function(){
				return getNow() - liveTime ;
			} ;

		var liveTime = getNow(),
			OFF_TIME = 0,
			TIME = NaN,
			concat = function(p){;return
				(Pkg.definition('org.libspark.betweenjs.css::CSSPropertyMapper').isIE && p === undefined) ? [] : p },
			valueExists = function(o, val){return !!o ? o[val] : undefined },
			cloneReplaceObject = function(o, ex, rewrite){
				if(!!!o) return ;
				var p = !!rewrite ? o : {} ;
				ex = ex || {} ;
				for(var s in o){
					if(!(s in ex)){
						p[s] = o[s] ;
					}else{
						if(!!ex[s]){
							p[s] = ex[s] ;
						}else{

						}
					}
				}
				return p ;
			},
			cacheInterval = {}, cacheTimeout = {},
			units_reg = /(px|em|pc|pt|%)$/,
			relative_reg =/^\$/ ;


		// REQUESTANIMATIONFRAME implementation BY ORNORM
		(function () {
			var lastTime = getTimer(),
				now,
				timeout,
				vendors = ['ms', 'moz', 'webkit', 'o'];

			if (!window.requestAnimationFrame)
				for (var x = 0; x < vendors.length; ++x) {
					window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
					window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
				}
			requestAnimationFrame = window.requestAnimationFrame || function (callback) {
				now = getNow() ;
				timeout = Math.max(0, simulationTimestep - (now - lastTime));
				lastTime = now + timeout;
				return setTimeout(function () {
					callback(now + timeout);
				}, timeout);
			};

			cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;
		})();




		Pkg.write('core', function(path){

			var Traceable =  Type.define({
				pkg:'::Traceable',
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

			}) ;
			// CORE.TICKERS
			Pkg.write('loops', function(){

				var AnimationTicker = Type.define({
					pkg:'::AnimationTicker',
					domain:BetweenJSCore,
					constructor:AnimationTicker = function AnimationTicker(){
						//
					},
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
						innerFunc:function(timestamp){
							var anim = AnimationTicker ;
							TIME = timestamp ;
							timestamp = timestamp - OFF_TIME ;
							anim.timestamp = timestamp * .001 ;
							anim.func(timestamp) ;
							anim.ID = requestAnimationFrame(anim.innerFunc) ;
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
					constructor:Animation = function Animation(func){
						this.enable(func) ;
					},
					enable:function(func){
						this.func = func ;
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

			// CORE.SINGLE
			Pkg.write('single', function(path){
				// ENTERFRAMETICKER
				var EnterFrameTicker = Type.define({
					pkg:'::EnterFrameTicker',
					domain:BetweenJSCore,
					first:undefined,
					numListeners:0,
					coreListenersMax: 0,
					tickerListenerPaddings:undefined,
					time:undefined,
					constructor:EnterFrameTicker = function EnterFrameTicker(){
						var AnimationTicker = Pkg.definition('org.libspark.betweenjs.core.loops::AnimationTicker') ;

						EnterFrameTicker.instance = this ;

						AnimationTicker.start() ;

						var prevListener = undefined,
							max = this.coreListenersMax = 8 ;

						this.tickerListenerPaddings = new Array(max) ;
						this.numListeners = 0 ;
						this.drawables = [] ;

						for (var i = 0; i < max; ++i) {
							var listener = new (Pkg.definition('org.libspark.betweenjs.core.tickers::TickerListener'))() ;
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
						var a = new Animation(function(timestamp){
							EFT.update(AnimationTicker.timestamp) ;
						}) ;
						
						this.animation = a.start() ;
						this.started = true ;
					},
					stop:function(){

						var a = this.animation ;
						this.animationLoop = a.stop() ;
						this.started = false ;
					},
					update:function(time){

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
								var AbstractTween = Pkg.definition('org.libspark.betweenjs.core.tweens::AbstractTween') ;
								// if(listener instanceof AbstractTween) drawables.push(listener) ;
								if(listener instanceof AbstractTween && !!listener.startTime) {
									t = t - listener.startTime ;
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

						if (!!(this.first = l.nextListener))
							this.first.prevListener = undefined ;

						l.nextListener = this.tickerListenerPaddings[n + 1] ;
					}
				}) ;
			})

			// CORE.TWEENS
			Pkg.write('tweens', function(path){
				// FACTORY
				var TweenFactory = {
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
						var updater = BetweenJS.updaterFactory.create(options) ;
						this.setUpdater(updater) ;
						return this ;
					},
					/*

						TWEEN & UPDATER SETTINGS

					*/
					prepare:function(options){
						var AbstractActionTween = Pkg.definition('org.libspark.betweenjs.core.tweens.actions::AbstractActionTween') ;
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
						var EFT = (Pkg.definition('org.libspark.betweenjs.core.single::EnterFrameTicker')).instance ;
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
						var EFT = (Pkg.definition('org.libspark.betweenjs.core.single::EnterFrameTicker')).instance ;
						EFT.addTickerListener(this) ;
						if(!EFT.started) EFT.start() ;
						return this ;
					},
					unregister:function(){
						var EFT = (Pkg.definition('org.libspark.betweenjs.core.single::EnterFrameTicker')).instance ;
						EFT.removeTickerListener(this) ;
						return this ;
					},
					setup:function(){
						this.isPlaying = true ;
						this
							.register()
							.seek(this.position >= this.time ? 0 : this.position) ;
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
					}
				}) ;
				// SUBCLASSES
				var Tween = Type.define({
					pkg:'::Tween',
					domain:BetweenJSCore,
					inherits:AbstractTween,
					statics:{
						spawner:TweenFactory
					},
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
							safeTime:Number.EPSILON * 2
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
							this.time = this.basetime * this.repeatCount ;

							return this ;
						},
						prepare:function(){

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
							return (position > 0 && position < Number.EPSILON) ? 0 : position ;
						},
						internalUpdate:function(position){

							var d = 0, ld = 0, lt = this.lastPosition, l , i , t ;
							var cur ;
							if ((position - lt) >= 0) {
								if (!!this.a) {
									if (lt <= (d += this.a.time) && ld <= position) {
										this.a.update(this.checkForEpsilon(position - ld)) ;
									}
									ld = d ;

									if (!!this.b) {
										if (lt <= (d += this.b.time) && ld <= position) {
											this.b.update(this.checkForEpsilon(position - ld)) ;
										}
										ld = d ;

										if (!!this.c) {
											if (lt <= (d += this.c.time) && ld <= position) {
												this.c.update(this.checkForEpsilon(position - ld)) ;
											}
											ld = d ;

											if (!!this.d) {
												if (lt <= (d += this.d.time) && ld <= position) {
													this.d.update(this.checkForEpsilon(position - ld)) ;
												}
												ld = d ;

												if (!!this.targets) {
													l = this.targets.length ;
													for (i = 0 ; i < l ; ++i) {
														t = this.targets[i] ;
														if (lt <= (d += t.time) && ld <= position) {
															t.update(this.checkForEpsilon(position - ld)) ;
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
										}
										ld = d ;
									}
								}
								if (!!this.d) {
									if (lt >= (d -= this.d.time) && ld >= position) {
										this.d.update(this.checkForEpsilon(position - d)) ;
									}
									ld = d ;
								}
								if (!!this.c) {
									if (lt >= (d -= this.c.time) && ld >= position) {
										this.c.update(this.checkForEpsilon(position - d)) ;
									}
									ld = d ;
								}
								if (!!this.b) {
									if (lt >= (d -= this.b.time) && ld >= position) {
										this.b.update(this.checkForEpsilon(position - d)) ;
									}
									ld = d ;
								}
								if (!!this.a) {
									if (lt >= (d -= this.a.time) && ld >= position) {
										this.a.update(this.checkForEpsilon(position - d)) ;
									}
									ld = d ;
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
				var UpdaterFactory = {
					poolIndex:0,
					mapPool:[],
					listPool:[],
					create:function(options){
						// SET DEFAULTS

						var BulkUpdater = Pkg.definition('org.libspark.betweenjs.core.updaters::BulkUpdater'),
							map, updaters, updater, l, source, dest, cuepoints,
							r = this.registerUpdaters(map, updaters) ;

						map = r.map,
						updaters = r.updaters ;

						var getActiveUpdater = function(){
							var upstr = 'org.libspark.betweenjs.core.updaters::Updater' ;
							var updater = map[upstr] ;

							if (!!!updater) {

								updater = new (Pkg.definition(upstr))() ;
								updater.setOptions(options) ;

								if (!!updaters) updaters.push(updater) ;
								map[upstr] = updater ;
							}

							return updater ;
						} ;

						var treat = function(mode, type){
							var UpdaterProxy = Pkg.definition('org.libspark.betweenjs.core.updaters::UpdaterProxy') ;
							var action, o, name, value, parent, child, updater, isRelative, cp, i, l ;
							var target = options['target'],
								source = options['from'],
								dest = options['to'],
								cuepoints = options['cuepoints'],
								ease = options['ease'],
								time = options['time'] ;

							action = type == 'source' ? 'setSourceValue' : 'setDestinationValue' ;

							if(!!!(o = options[mode])) return ;

							o = Pkg.definition('org.libspark.betweenjs.css::CSSPropertyMapper').colorStringtoObj(o) ;

							for (var name in o) {
								// BEZIER CASE
								if(type == 'cuepoints'){
									if (typeof(value = cuepoints[name]) == 'number') {
										value = [value] ;
									}
									if (value.constructor == Array) {
										name = (isRelative = relative_reg.test(name)) ? name.substr(1) : name ;
										cp = value ;
										l = cp.length ;
										for (i = 0 ; i < l ; ++i) {
											getActiveUpdater(options, map, updaters).addCuePoint(name, cp[i], isRelative) ;
										}
									} else {
										if (map[name] !== true) {
											parent = getActiveUpdater(options, map, updaters) ;

											child = UpdaterFactory.create({
												'target' : parent.getObject(name),
												'to' : valueExists(dest, name),
												'from' : valueExists(source, name),
												'ease' : ease,
												'time' : time
											}) ;
											updaters.push(new UpdaterProxy(parent, child, name)) ;
											map[name] = true ;
										}
									}

								}else{// REGULAR CASE
									
									// WHEN PROVIDED VALUE IS NUMBER
									if (typeof(value = o[name]) == "number") {
										
										name = (isRelative = relative_reg.test(name)) ? name.substr(1) : name ;
										parent = getActiveUpdater(options, map, updaters) ;
										parent[action](name, parseFloat(value), isRelative) ;

									} else {
										// WHEN OBJECTS ARE PASSED IN
										var existsInSource = (!!source && name in source)
										if (type == 'source' || (type == 'dest' && !existsInSource)) {
											
											parent = getActiveUpdater(options, map, updaters) ;
											
											child = UpdaterFactory.create({
												'target' : parent.getObject(name),
												'to' : type == 'source' ? valueExists(dest, name) : value,
												'from' : type == 'source' ? value : valueExists(source, name),
												'ease' : ease,
												'time' : time
											}) ;
											
											var proxy = new UpdaterProxy(parent, child, name) ;
											updaters.push(proxy) ;
										}
									}

								}

							}
						} ;

						source = treat('from', 'source'),
						dest = treat('to', 'dest'),
						cuepoints = treat('cuepoints', 'cuepoints') ;
						
						l = updaters.length ;

						switch(l){
							case 0: break;
							case 1:
								updater = updaters[0] ;
								if(updater.isPhysical){
									updater.physicalTimeEval() ;
								}
								break;
							default:
								updater = new BulkUpdater(options['target'], updaters) ;
								trace(updater)
								break;
						}

						r = this.unregisterUpdaters(map, updaters) ;
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
					statics:{
						ind:0,
						spawner:UpdaterFactory
					},
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
					constructor:Updater = function Updater(){
						this.reset() ;
						this.name = 'updater_' + Updater.ind++ ;
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
					setOptions:function(options){
						for(var name in options){
							switch(name){
								case 'target' :
									this.setTarget(options['target']) ;
									break;
								case 'ease' :
									this.setEase(options['ease']) ;
									break;
								case 'time' :
									this.setTime(options['time']) ;
									break;
								//////////////// IGNORES
								case 'to' :
								case 'from' :
								case 'cuepoints' :
								case 'position' :
								break;
								//////////////// DEFAULT WRITING
								default :
									this[name] = options[name] ;
							}
						}

						return this ;
					},
					setTarget:function(target){
						this.target = target ;
						this.checkUnits() ;
					},
					setEase:function(ease){
						this.ease = ease ;
						this.setPhysical() ;
					},
					setPhysical:function(){
						this.isPhysical = this.ease instanceof Physical ;
					},
					setFactor:function(position){
						var factor = 0.0 ;

						if(position > factor){
							factor = position < this.time ? this.ease.calculate(position, 0.0, 1.0, this.time) : 1.0 ;
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

						if (this.isResolved === false) {
							this.resolveValues() ;
							this.isResolved = true ;
						}

						this.setPosition(position) ;
						this.setFactor(position) ;

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
							}else{

								if(this.isPhysical){
									if (position >= dur[name]) {
										factor = 1.0 ;
										invert = 1.0 - factor ;
									} else if(position <= 0.0){
										factor = 0.0 ;
										invert = 1.0 - factor ;
									}else {
										factor = e.calculate(position, a, b - a) / b ;
										invert = 1.0 - factor ;
									}
								}

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
							
							this.setObject(name, val) ;
						}
					},
					checkUnits:function(){
						var ctor = this.target.constructor ;

						switch(true){
							case ctor === undefined : // IE 7-
							case (/HTML[a-zA-Z]*Element/.test(ctor)) :
								this.units = {} ;
							break ;
							default:
							break ;
						}
						return this ;
					},
					setSourceValue:function(propertyName, value, isRelative){
						if(isRelative === undefined) isRelative = false ;

						if(this.units === undefined){
							this.source[propertyName] = value ;
							this.relativeMap['source.' + propertyName] = isRelative ;
						}else{
							propertyName = this.retrieveUnits(propertyName) ;
							this.source[propertyName] = value ;
							this.relativeMap['source.' + propertyName] = isRelative ;
						}
					},
					setDestinationValue:function(propertyName, value, isRelative){
						if(isRelative === undefined) isRelative = false ;

						if(this.units === undefined){
							this.destination[propertyName] = value ;
							this.relativeMap['dest.' + propertyName] = isRelative ;
						}else{
							propertyName = this.retrieveUnits(propertyName) ;
							this.destination[propertyName] = value ;
							this.relativeMap['dest.' + propertyName] = isRelative ;
						}
					},
					addCuePoint:function(propertyName, value, isRelative){
						var cuepoints = this.cuepoints[propertyName] ;
						if (cuepoints === undefined) this.cuepoints[propertyName] = cuepoints = [] ;
						cuepoints.push(value) ;
						this.relativeMap['cp.' + propertyName + '.' + cuepoints.length] = isRelative ;
					},
					getObject:function(propertyName, cond){
						var CSSPropertyMapper ;
						if(!!!this.units){
							return this.target[propertyName] ;
						}else{
							CSSPropertyMapper = Pkg.definition('org.libspark.betweenjs.css::CSSPropertyMapper') ;
							propertyName = this.retrieveUnits(propertyName) ; // here check for unit in string
							var props = CSSPropertyMapper.check(propertyName) ;
							var pname = props.cssprop ;
							var pget = props.cssget ;
							var n = pget(this.target, pname, this.units[propertyName], cond) ; // here will apply special treatment upon checks in CSSPropertyMapper.check() method
							return n ;
						}
					},
					setObject:function(propertyName, value){
						var CSSPropertyMapper ;
						if(this.units === undefined){
							this.target[propertyName] = value ;
						}else{
							CSSPropertyMapper = Pkg.definition('org.libspark.betweenjs.css::CSSPropertyMapper') ;
							propertyName = this.retrieveUnits(propertyName) ;

							var props = CSSPropertyMapper.check(propertyName) ;
							var pname = props.cssprop ;
							var pset = props.cssset ;

							pset(this.target, pname, this.units[propertyName], isNaN(value) ? value : Number(value).toFixed(2)) ;
						}
					},
					retrieveUnits:function(propertyName){

						if(this.units[propertyName] !== undefined) {
							return this.units[propertyName] == '' ? propertyName : propertyName.replace(new RegExp(this.units[propertyName]+'$', 'gi'), '') ;
						}

						var regPX = /::PX$/i,
						regEM = /::EM$/i,
						regPCT = /::%$/,
						regPC = /::PC$/i,
						regNONE = /::NONE$/ ;

						switch(true){
							case (regNONE.test(propertyName)) :
								propertyName = propertyName.replace(regNONE, '') ;
								this.units[propertyName] = '' ;
							break ;
							case (regPC.test(propertyName)) :
								propertyName = propertyName.replace(regPC, '') ;
								this.units[propertyName] = 'pc' ;
							break ;
							case (regPCT.test(propertyName)) :
								propertyName = propertyName.replace(regPCT, '') ;
								this.units[propertyName] = '%' ;
							break ;
							case (regEM.test(propertyName)) :
								propertyName = propertyName.replace(regEM, '') ;
								this.units[propertyName] = 'em' ;
							break ;
							case (regPX.test(propertyName)) :
								propertyName = propertyName.replace(regPX, '') ;
							default :
								this.units[propertyName] = 'px' ;
							break ;
						}

						return propertyName ;
					},
					physicalTimeEval:function(){
						if (this.isResolved === false) {
							this.resolveValues() ;
							this.isResolved = true ;
						}
					},
					resolveValues:function(){
						var key,
							target = this.target,
							source = this.source,
							dest = this.destination,
							rMap = this.relativeMap,
							d = this.duration,
							duration,
							maxDuration = 0.0 ;

						for (key in source) {
							if (!!!dest[key]) {
								dest[key] = this.getObject(key) ;
							}
							if (!!rMap['source.' + key]) {
								source[key] += this.getObject(key) ;
							}
						}

						for (key in dest) {
							if (!!!source[key]) {
								source[key] = this.getObject(key) ;
							}
							if (!!rMap['dest.' + key]) {
								dest[key] += this.getObject(key) ;
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
							cpVec = cuepoints[key] ;
							l = cpVec.length ;
							for (i = 0 ; i < l ; ++i) {
								if (rMap['cp.' + key + '.' + i]) {
									var ss = cpVec[i] ;
									cpVec[i] += this.getObject(key) ;
									var sss = cpVec[i] ;

									if(this.isPhysical){
										duration = this.ease.getDuration(ss, ss < sss ? sss - ss : ss - sss  ) ;
										maxDuration += duration ;
									}

								}
							}
						}

						if(this.isPhysical){
							this.maxDuration = maxDuration ;
							this.time = this.maxDuration ;
						}
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
					}
				}) ;
				var UpdaterProxy = Type.define({
					pkg:'::UpdaterProxy',
					parent:undefined,
					child:undefined,
					propertyName:undefined,
					time:NaN,
					constructor:UpdaterProxy = function UpdaterProxy(parent, child, propertyName){

						this.parent = parent ;
						this.child = child ;
						this.propertyName = propertyName ;

					},
					setTime:function(time){
						var c = this.child.time ;
						var p = this.parent.time ;

						this.time = c > p ? c : p ;
					},
					update:function(position){
						this.child.update(position) ;
						this.parent.setObject(this.propertyName, this.child.target) ;
					},
					clone:function(source){
						return new UpdaterProxy(this.parent, this.child, this.propertyName) ;
					}
				}) ;
				var BulkUpdater = Type.define({
					pkg:'::BulkUpdater',
					target:undefined,
					a:undefined,
					b:undefined,
					c:undefined,
					d:undefined,
					updaters:undefined,
					time:1,
					checkUpdater:function(updater){
						if(updater instanceof Updater){
							if(updater.isPhysical){
								updater.physicalTimeEval() ;
							}
						}else if(updater instanceof UpdaterProxy){
							updater.setTime() ;
						}
						return updater ;
					},
					constructor:BulkUpdater = function BulkUpdater(target, updaters){

						this.target = target ;
						this.length = updaters.length ;

						var l = updaters.length, t, tar ;

						var time = 0 ;

						if (l >= 1) {
							this.a = this.checkUpdater(updaters[0]) ;
							t = this.a.time ;
							time = t > time ? t : time ;
							if (l >= 2) {
								this.b = this.checkUpdater(updaters[1]) ;
								t = this.b.time ;
								time = t > time ? t : time ;
								if (l >= 3) {
									this.c = this.checkUpdater(updaters[2]) ;
									t = this.c.time ;
									time = t > time ? t : time ;
									if (l >= 4) {
										this.d = this.checkUpdater(updaters[3]) ;
										t = this.d.time ;
										time = t > time ? t : time ;
										if (l >= 5) {
											this.updaters = new Array(l - 4) ;
											for (var i = 4 ; i < l ; ++i) {
												tar = this.updaters[i - 4] = this.checkUpdater(updaters[i]) ;
												t = tar.time ;
												time = t > time ? t : time ;
											}
										}
									}
								}
							}
						}

						this.time = time ;
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
					getObject:function(name){
						return this.target[name] ;
					},
					setObject:function(name, val){
						this.target[name] = val ;
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
						if (!!this.a) {
							this.a.update(position) ;
							if (!!this.b) {
								this.b.update(position) ;
								if (!!this.c) {
									this.c.update(position) ;
									if (!!this.d) {
										this.d.update(position);
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
					}
				}) ;

			}) ;

		}) ;

		var BetweenJS = Type.define({
			pkg:'::BetweenJS',
			domain:Type.appdomain,
			constructor:BetweenJS = function BetweenJS(){
				throw 'Not meant to be instanciated... BetweenJS::ctor' ;
			},
			statics:{
				$:BetweenJSCore,
				animationTicker:(Pkg.definition('org.libspark.betweenjs.core.loops::AnimationTicker')),
				enterFrameTicker:new (Pkg.definition('org.libspark.betweenjs.core.single::EnterFrameTicker'))() , // main and unique ticker, see class EnterFrameTicker
				updaterFactory:(Pkg.definition('org.libspark.betweenjs.core.updaters::Updater')).spawner, // all in the name, generated updaters are intermede objects between tweens and their target
				tweenFactory:(Pkg.definition('org.libspark.betweenjs.core.tweens::Tween')).spawner, // aTween Factory
				/*
					Core (static-like init), where
					main Ticker instance created & launched,
					(also set to tick forever from start, to disable, @see BetweenJS.enterFrameTicker.stop())
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
					return BetweenJS.tweenFactory.create(options) ;
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
					return BetweenJS.tweenFactory.createGroup(options) ;
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
					return BetweenJS.tweenFactory.createGroup(options) ;
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

					return BetweenJS.tweenFactory.createDecorator(options) ;
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

					return BetweenJS.tweenFactory.createDecorator(options) ;
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

					return BetweenJS.tweenFactory.createDecorator(options) ;

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
					return BetweenJS.tweenFactory.createDecorator(options) ;
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
					return BetweenJS.tweenFactory.createDecorator(options) ;
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

					return BetweenJS.tweenFactory.createAction(options) ;
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

					return BetweenJS.tweenFactory.createAction(options) ;
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

					return BetweenJS.tweenFactory.createAction(options) ;
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

					var tw = BetweenJS.tweenFactory.createAction(options) ;
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

		// EASEES
		// CORE.EASING
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
				constructor:Linear = function Linear(){
				},
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
				constructor:Circ = function Circ(){
				},
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
				constructor:Cubic = function Cubic(){
				},
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
				constructor:Expo = function Expo(){
				},
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
				constructor:Quad = function Quad(){
				},
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
				constructor:Quart = function Quart(){
				},
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
				constructor:Quint = function Quint(){
				},
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
				constructor:Sine = function Sine(){
				},
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
				constructor:Bounce = function Bounce(calc, s){
				},
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
				constructor:Elastic = function Elastic(){
				},
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
				constructor:Back = function Back(){
				},
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
				constructor:Custom = function Custom(){
				},
				statics:{
					func:function func(f){
						return new Ease(f) ;
					}
				}
			}) ;
			// PHYSICAL
			var Physical = Type.define({
				pkg:'physical::Physical',
				inherits:Ease,
				domain:Type.appdomain,
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

			// CSSPROPERTYMAPPER
			var CSSPropertyMapper = Type.define({
				pkg:'::CSSPropertyMapper',
				constructor:CSSPropertyMapper = function CSSPropertyMapper(){
					throw 'Not meant to be instanciated... CSSPropertyMapper' ;
				},
				statics:{
					initialize:function initialize(domain){
						var comp = window.getComputedStyle ;
						CSSPropertyMapper.hasComputedStyle = !!comp && typeof(comp) == 'function' ;
						CSSPropertyMapper.isIE = /MSIE/.test(navigator.userAgent) ;
						CSSPropertyMapper.isIEunder9 = /MSIE [0-8]/.test(navigator.userAgent) ;
						CSSPropertyMapper.isIEunder8 = /MSIE [0-7]/.test(navigator.userAgent) ;
					},
					cache:{},
					getScroll:function(target, name, unit) {
					  return (target === window || target === document) ?
					  (
						this[(name == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] ||
						(CSSPropertyMapper.isIEunder9 && document.documentElement[name]) ||
						document.body[name]
					  ) :
					  target[name] ;
					},
					setScroll:function(target, name, unit, val) {
					  if(target === window || target === document){
						try{
							this[(name == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] = parseInt(val) ;
						}catch(e){
							if(!CSSPropertyMapper.isIEunder8) document.documentElement[name] = parseInt(val) ;
							else document.body[name] = parseInt(val) ;
						}
					  }else{
						target[name] = parseInt(val) ;
					  }
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
					cssSimpleGet:function(target, pname, unit){
						var str = target['style'][pname] ;
						if(str == '') {
							str = CSSPropertyMapper.hasComputedStyle ?
							window.getComputedStyle (target, '')[pname].replace(units_reg, '') :
							target.currentStyle[pname].replace(units_reg, '') ;
						}
						var r = Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), ''))
						return r ;
					},
					cssSimpleSet:function(target, pname, unit, val){
						return target['style'][pname] = val + unit ;
					},
					cssColorGet:function(target, pname, unit){
						var val, n, o ;
						if(CSSPropertyMapper.hasComputedStyle){
							var shortreg = /(border)(width|color)/gi ;
							(shortreg.test(pname) && (pname = pname.replace(shortreg, '$1Top$2'))) ;
							val = (target.style[pname] !== '') ? target.style[pname] : window.getComputedStyle (target, '')[pname] ;
						}else{
							val = pname == 'backgroundColor'? target.currentStyle[pname] : CSSPropertyMapper.cssHackGet(target, pname)
						}
						if(val == '') val = 'transparent' ;
						
						if(val == 'transparent'){
							CSSPropertyMapper.cssColorSet(target, pname, undefined,'transparent') ;
						}
						
						switch(true){
							case (/^#/.test(val)) :
								var hex = val.replace(/^#/, '') ;
								if(hex.length == 3){
									var h1 = hex.charAt(0), h2 = hex.charAt(1), h3 = hex.charAt(2) ;
									hex = h1 + h1 + h2 + h2 + h3 + h3 ;
								}
								n = parseInt('0x'+hex) ;
								o = {r:(n & 0xFF0000) >> 16, g:(n & 0xFF00) >> 8, b:(n & 0xFF)}
							break ;
							case (/rgb/i.test(val)) :
								var str = val.replace(/(rgb\(|\)| )/gi, '') ;
								var p = str.split(',') ;
								var r = (p[0] & 0xFF), g = (p[1] & 0xFF), b = (p[2] & 0xFF) ;
								o = {r:r,g:g,b:b} ;
							break ;
							//case typeof val == 'string' :
								//if(!val in CSSPropertyMapper.presetColors) throw new Error('Color name is not a valid browser color preset >>> ' +val) ;
							//break ;
							default:
								o = {r:(n & 0xFF0000) >> 16, g:(n & 0xFF00) >> 8, b:(n & 0xFF)}
							break;
						}
						
						return o ;
					},
					cssColorSet:function(target, pname, unit, val){
						if(val == 'transparent'){
							return target['style'][pname] = 'transparent'  ;
						}
						
						if ('h' in val && 's' in val && 'v' in val){
							val = CSSPropertyMapper.HSVtoRGB(val) ;
						}
						var r = parseInt(val.r),
						g = parseInt(val.g),
						b = parseInt(val.b) ;
						
						return target['style'][pname] = 'rgb('+r+','+g+','+b+')'  ;
					},
					HEXtoRGB:function(hex, returnObj){
						var n ;
						hex = hex.replace(/^(0x|#)/, '') ;
						if(hex.length == 3)
							hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) ;
						n = parseInt('0x'+hex) ;
						var r = (n & 0xFF0000) >> 16 ;
						var g = (n & 0xFF00) >> 8 ;
						var b = (n & 0xFF) ;
						return !!returnObj ? {r:r, g:g, b:b} : 'rgb('+r+','+g+','+b+')' ;
					},
					HEXtoHSV:function(hex, returnObj){
						var res = CSSPropertyMapper.RGBtoHSV(CSSPropertyMapper.HEXtoRGB(hex, true)) ;
						return !!returnObj ? res : 'hsv('+(res.h) +','+(res.s)+','+(res.v)+')' ;
					},
					RGBtoHSV:function(o, r, g, b){
						if (typeof o == 'string') o = CSSPropertyMapper.colorStringtoObj(o) ;
						var m = {} ;
						r = r || o.r ,
						g = g || o.g ,
						b = b || o.b ;
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
						return m ;
					},
					HSVtoRGB:function(o, h, s, v){
						if (typeof o == 'string') o = CSSPropertyMapper.colorStringtoObj(o) ;

						var m = {} ;
						h = h || o.h ,
						s = (s || o.s) * .01 ,
						v = (v || o.v) * .01 ;
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
						return m ;
					},
					colorStringtoObj:function(val, n, res){

						if(typeof(val) != 'string') {
							if('h' in val && 's' in val && 'v' in val){
								val = 'hsv('+val['h']+','+val['s']+','+val['v']+')' ;
							}else if('r' in val && 'g' in val && 'b' in val ){
								val = 'rgb('+val['r']+','+val['g']+','+val['b']+')' ;
							}else{
								if(Type.is(val, Array)){
									var o = {r:[],g:[], b:[]} ;
									for(var i = 0 ; i < val.length ; i ++){
										var colobj = CSSPropertyMapper.colorStringtoObj(val[i]) ;
										o.r.push(colobj.r) ;
										o.g.push(colobj.g) ;
										o.b.push(colobj.b) ;
									}
									return o ;
								}
								return val ;
							}
						}

						if(/^[a-z]+$/i.test(val) && val in BetweenJS.Colors.css){
							val = BetweenJS.Colors.css[val] ;
						}
						if(/^(0x|#)/.test(val)){
							res = CSSPropertyMapper.HEXtoRGB(val.replace(/^(0x|#)/, ''), true) ;
						}else if(/rgb/i.test(val)){
							var str = val.replace(/(rgb\(|\)| )/gi, '') ;
							var p = str.split(',') ;
							var r = (p[0] & 0xFF),
							g = (p[1] & 0xFF),
							b = (p[2] & 0xFF) ;
							res = {r:r,g:g,b:b} ;
						}else if(/hsv/i.test(val)){
							var str = val.replace(/(hsv\(|\)| )/gi, '') ;
							var p = str.split(',') ;
							var h = (p[0] & 0xFF),
							s = (p[1] & 0xFF),
							v = (p[2] & 0xFF) ;
							res = CSSPropertyMapper.HSVtoRGB({h:h, s:s, v:v}) ;
						}
						return res ;
					},
					cssScrollPositionGet:function(target, pname, unit){
						return CSSPropertyMapper.getScroll(target, pname, unit) ;
					},
					cssScrollPositionSet:function(target, pname, unit, val){
						CSSPropertyMapper.setScroll(target, pname, unit, val) ;
					},
					cssAlphaGet:function(target, pname, unit){
						var val ;
						if(CSSPropertyMapper.hasComputedStyle){
							val = (target.style['opacity'] != '') ? target.style['opacity'] : window.getComputedStyle(target, '')['opacity'] ;
							val = val * 100 ;
						}
						else
							val = target.currentStyle['filter'] == '' ? 100 : target.currentStyle['filter'].replace(/alpha\(opacity=|\)/g, '') ;

						return val ;
					},
					cssAlphaSet:function(target, pname, unit, val){
						if(CSSPropertyMapper.hasComputedStyle){
							return target['style']['opacity'] = val / 100 ;
						}else{
							return target['style']['filter'] = 'alpha(opacity='+val+')' ;
						}
					},
					check:function(name){
						var formats = CSSPropertyMapper.formats ;
						var cache = CSSPropertyMapper.cache ;

						if(/-/.test(name)) name = name.replace(/-(\w)/g, function($0, $1){return $1.toUpperCase()}) ;

						if(name in cache) {return cache[name] } ;
						var o ;
						
						switch(true){
							case /((border|background)?color|background)/gi.test(name) :
								o = {
									cssprop:name,
									cssget:CSSPropertyMapper.cssColorGet,
									cssset:CSSPropertyMapper.cssColorSet
								} ;
							break ;
							case /scroll(left|top)?/gi.test(name) :
								o = {
									cssprop:name,
									cssget:CSSPropertyMapper.cssScrollPositionGet,
									cssset:CSSPropertyMapper.cssScrollPositionSet
								} ;
							break ;
							case /alpha|opacity/g.test(name) :
								o = {
									cssprop:name,
									cssget:CSSPropertyMapper.cssAlphaGet,
									cssset:CSSPropertyMapper.cssAlphaSet
								}
							break ;
							default :
								o = {
									cssprop:name,
									cssget:CSSPropertyMapper.cssSimpleGet,
									cssset:CSSPropertyMapper.cssSimpleSet
								}
							break ;
						}
						cache[name] = o ;
						return o ;
					}
				}
			}) ;
			//COLORS
			var Colors = Type.define({
				pkg:'::Colors',
				domain:BetweenJS,
				constructor:Colors = function Colors(){
				},
				statics:{
					HEXtoRGB:CSSPropertyMapper.HEXtoRGB,
					HEXtoHSV:CSSPropertyMapper.HEXtoHSV,
					RGBtoHSV:CSSPropertyMapper.RGBtoHSV,
					HSVtoRGB:CSSPropertyMapper.HSVtoRGB,
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

