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
	
		var sl = [].slice ;
		var trace = window.trace = function trace(){
			if(window.console === undefined) return arguments[arguments.length - 1] ;
			if('apply' in console.log) console.log.apply(console, arguments) ;
			else console.log([].concat(sl.call(arguments))) ;
			return arguments[arguments.length - 1] ;
		},
		name_r = /function([^\(]+)/, pkg_r = /::(.+)$/, abs_r = /^\//, DEFS = {}, PKG_SEP = '::',
		getctorname = function(cl, name){ return (cl = cl.match(name_r))? cl[1].replace(' ', ''):'' },
		keep_r = /constructor|hashCode|hashcode|toString|model|pkg|(app)?domain/,
		retrieve = function retrieve(from, prop, p){ try { p = from[prop] ; return p } finally { if(prop != 'constructor') from[prop] = undefined , delete from[prop] }},
		merge = function(from, into, nocheck){ 
			for(var s in from) {
				
				if(!keep_r.test(s) || nocheck === true) {
					into[s] = from[s] ;
					if(nocheck !== true) {
						if(!!!window.opera) delete from[s] ;
						else from[s] = undefined ;
					}
				} ;
			}
			return into ;
		},
		toArray = function toArray(arr, p, l){	p = p || [], l = arr.length ; while(l--) p.unshift(arr[l]) ; return p },
		PKG = {} , Type, Pkg,
		customs = [] ;
		
		Type = {
			globals:{},
			merge:merge,
			internals:{},
			appdomain:window,
			guid:0,
			format:function format(type){
				if(!type) return type ; // cast away undefined & null
				if(!!type.slot) return type ; // cast away custom classes
				if(!!type.hashcode) return Type.getDefinitionByHash(type) ; // is a slot object
				if(Type.of(type, 'number')) return Type.getDefinitionByHash(type) ;
				if(Type.of(type, 'string')) return Type.getDefinitionByName(type) ;
				if(Type.is(type, Array)) for(var i = 0, l = type.length ; i < l ; i++) type[i] = format(type[i]) ;
				return type ;
			},
			hash:function hash(qname){
				for (var i = 0 , h = 0 ; i < qname.length ; i++) h = 31 * ((h << 31) - h) + qname.charCodeAt(i), h &= h ;
				return h ;
			},
			customDefinitionChecks:function(closure){
				customs[customs.length] = closure ;
			},
			customize:function(properties, def){
				if(customs.length)
				for(var i = 0 ; i < customs.length ; i++){
					properties = customs[i](properties, def) ;
				}
				return properties ;
			},
			define:function define(properties, mixins){
				
				var args = sl.call(arguments) ;
				properties = args.shift() ;
				mixins = args ;
				var model, basemodel = {} ;
				if(Type.of(properties, 'function')) {
					var m = properties() ;
					model = merge(m, basemodel, true) ;
					return Type.define.apply(Type, [model].concat(mixins)) ;
				}
				
				if(mixins.length) properties.mixins = mixins ;
				model = merge(properties, basemodel, true) ;
				
				var staticinit , isinterface = false ;
				var domain = retrieve(properties, 'domain') ;
				var pkg = retrieve(properties, 'pkg') || '' ;
				var def = retrieve(properties, 'constructor') ;
				
				var defIsObject = def == Object ;
				
				if( pkg.indexOf('@')!= -1 ){
					isinterface = true ;
					pkg = pkg.replace('@', '') ;
				}
				var name = defIsObject ? '' : (def.name || getctorname(def.toString())).replace(/Constructor$/, '') ;
				
				if(pkg_r.test(pkg)) pkg = pkg.replace(pkg_r, function(){name = arguments[1]; return ''}) ;
				
				if(!!Type.hackpath) pkg = abs_r.test(pkg) ? pkg.replace(abs_r, '') : pkg !='' ? Type.hackpath +(pkg.indexOf('.') == 0 ? pkg : '.'+ pkg) : Type.hackpath ;
				
				if(name == '' ) name = 'Anonymous'+(++Type.guid) ;
				
				if(defIsObject) 
					def = Function('return function '+name+'(){\n\t \n}')() ;
				
				properties = Type.customize(properties, def) ;
				
				var mixes = retrieve(properties, 'mixins') ;
				var superclass = retrieve(properties, 'inherits') ;
				var interfaces = retrieve(properties, 'interfaces') ;
				var statics = retrieve(properties, 'statics') ;
				var protoinit = retrieve(properties, 'protoinit') ;
				
				
				superclass = Type.format(superclass) || Object ;
				interfaces = Type.format(interfaces) || [] ;
				
				// set hashCode here
				var qname = pkg == '' ? name : pkg + PKG_SEP + name ;
				var hash = Type.hash(qname) ;
				
				// write classes w/ hash reference and if domain is specified, in domain
				(DEFS[hash] = def).slot = {
					appdomain:domain,
					qualifiedclassname:name,
					pkg:pkg,
					fullqualifiedclassname:qname,
					hashcode:hash,
					isinterface:isinterface,
					model:model,
					toString:function toString(){ return 'Type@'+qname+'Definition'}
				} ;
				
				
				def.toString = function toString(){ return '[' + ( isinterface ? "interface " : "class " ) + qname + ']' }
				
				// set defaults
				!! domain && (domain[name] = def) ; // Alias checks, we don't want our anonymous classes to endup in window or else
				(!!Type.hackpath) && Pkg.register(qname, def) ;
				
				var T = function(){
					// set base & factory references
					def.base = superclass ;
					def.factory = superclass.prototype ;
					// write overrides
					merge(properties, this, false) ;
					
					this.constructor = def ;
				}
				
				T.prototype = superclass.prototype ;
				def.prototype = new T() ;
				
				
				(function plug(plugs){
					if(!!!plugs) return ;
					var l = plugs.length ;
					for(var i = 0 ; i < l ; i++){
						var mix = plugs[i] ;
						if(Type.is(mix, Array) && mix.length) plug(mix) ; 
						else if(!! mix.slot) merge(mix.slot.model, def.prototype, false) ; 
						else merge(mix, def.prototype, false) ;
					}
				})(mixes) ;
				
				
				// protoinit 
				if (!!protoinit) protoinit.apply(def.prototype, [def, domain]) ;
				
				
				if (!!statics) {
					staticinit = retrieve(statics, 'initialize') ;
					merge(statics, def, false) ;
				}
				// static initialize
				if(!!staticinit) staticinit.apply(def, [def, domain]) ;
				Type.implement(def, interfaces.concat(superclass.slot ? superclass.slot.interfaces || [] : [])) ;
				return def ;
			},
			implement:function implement(definition, interfaces){
				
				var c, method, cname, ints = definition.slot.interfaces = definition.slot.interfaces || [] ;
				if(!!Type.is(interfaces, Array)) {
					for(var i = 0, l = interfaces.length ; i < l ; i++) {
						var f = interfaces[i] ;
						
						c = f.prototype , cname = f.slot.fullqualifiedclassname ;
						
						for (method in c) {
							if(keep_r.test(method)) continue ;
							
							if(!definition.prototype.hasOwnProperty(method)) throw new TypeError("NotImplementedMethodException "+c.constructor.slot.pkg+'.@'+c.constructor.slot.qualifiedclassname+"::" + method + "() absent from class " + definition.slot.fullqualifiedclassname) ;
						}
						ints[ints.length] = cname ;
					}
				}else ints[ints.length] = interfaces.slot.fullqualifiedclassname ;
				return definition ;
			},
			is:function is(instance, definition){ return instance instanceof definition },
			of:function of(instance, typestr){ return (!!typestr) ? (typeof instance === typestr) : (typeof instance) },
			definition:function definition(qobj, domain){return Type.getDefinitionByName(qobj, domain)},
			getType:function getType(type){ return (!!type.constructor && !!type.constructor.slot) ? type.constructor.slot : type.slot || 'unregistered_type'},
			getQualifiedClassName:function getQualifiedClassName(type){ return Type.getType(type).toString() },
			getFullQualifiedClassName:function getFullQualifiedClassName(type){ return Type.getType(type).fullqualifiedclassname },
			getDefinitionByName:function getDefinitionByName(qname, domain){ 
				var absname = (Type.hackpath || '') + (qname.indexOf('::') !=-1 ? (qname.indexOf('::') == 0 ? qname : '.' + qname) : '::' + qname) ;
				return (domain || Type.appdomain)[qname] || Type.globals[qname] || DEFS[Type.hash(qname)] || (domain || Type.appdomain)[absname] || Type.globals[absname] || DEFS[Type.hash(absname)]
			},
			getDefinitionByHash:function getDefinitionByHash(hashcode){ return DEFS[hashcode] },
			getAllDefinitions:function getAllDefinitions(){ return DEFS }
		}
		
		Pkg = {
			register:function register(path, definition){
				if(arguments.length > 2){
					var args = sl.call(arguments) ;
					var pp = args.shift(), ret, qq ;
					
					for(var i = 0, l = args.length ; i < l ; i++){
						ret = args[i] ;
						qq = ret.pkg || '' ;
						ret = Pkg.register( (qq == '' || qq.indexOf('::') != -1 ? qq :'.' + qq ), args[i]) ;
					}
					return ret;
				}if(!!definition.slot) // is already result of Type.define()
					path = definition.slot.fullqualifiedclassname ;
				else { // transform it into Type.define() result
					definition.pkg = path ;
					definition = Type.define(definition) ;
					path = definition.slot.fullqualifiedclassname ;
				}
				return (PKG[path] = definition) ;
			},
			write:function write(path, obj){
				var oldpath = Type.hackpath ;
				Type.hackpath = !!oldpath && !abs_r.test(path) ? oldpath + '.' +path : path.replace(abs_r, '') ;
				try{
					// if obj is an Array
					if(Type.is(obj, Array)) {
						for(var i = 0 , arr = [], l = obj.length ; i < l ; i ++)
							// if is an anonymous object, but with named References to write
							arr[arr.length] = write(path, obj[i]) ;
						return arr[arr.length - 1] ;
					}
					// if a function is passed
					else if(Type.of(obj, 'function')){
						if(!!obj.slot) return Pkg.register(path, obj) ;
						var o = new (obj)(path) ;
						if(Type.is(obj, Array)){
							for(var i = 0 ; i < o.length ; i++){
								var oo = o[i] ;
								if(!!oo.slot) write(path, oo) ;
							}
							return o ;
						}
						return (!!o) ? !!o.slot ? write(path, o) : undefined : undefined ;
					}
					// if anonymous object is passed
					else {
						return Pkg.register.apply(Pkg, sl.call(arguments)) ;
					}
				}catch(e){ trace(e) }
				finally {
					Type.hackpath = oldpath ; if(!!!oldpath) delete Type.hackpath ;
				}
			},
			definition:function definition(path){ return PKG[path] || Type.globals[path] },
			getAllDefinitions:function getAllDefinitions(){ return PKG }
		}
		// GLOBALS
		window.Type = Type ;
		window.Pkg = Pkg ;
		
	})()) ;
	
	return Pkg.write('org.libspark.betweenjs', function(path){
		// GetTimer Implementation
		var getTimer = function(){
		   return new Date().getTime() - ___d ;
		} , ___d = new Date().getTime() ;
		var sl = [].slice ;
		// will need that...
		function concat(p){
			return (CSSPropertyMapper.isIE && p === undefined) ? [] : p ;
		}
		var cacheInterval = {}, cacheTimeout = {} ;
		var unitsreg = /(px|em|pc|pt|%)$/ ;
		
		
		var complexTween = function(tw, target){
			var args = sl.call(arguments) , arr;
			tw = args.shift() ;
			target = args.shift() ;
			
			if(target.length && !!(arr = []))
				if(target.length == 1) return tw.apply(null, [target[0]].concat(args)) ;
				for(var i = 0 , l = target.length ; i < l ; i++)
					arr[arr.length] = tw.apply(null, [target[i]].concat(args))
				return BetweenJS.parallelTweens(arr) ;
		} ;
		var isComplex = function(target){
			return !!(target.length) ;
		} ;
		
		// REQUESTANIMATIONFRAME implementation BY PAUL IRISH
		(function() {
			var lastTime = 0;
			var vendors = ['ms', 'moz', 'webkit', 'o'];
			for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'] ;
				window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'] ;
			}
			if (!window.requestAnimationFrame)
				window.requestAnimationFrame = function(callback, element) {
					var currTime = new Date().getTime() ;
					var timeToCall = Math.max(0, 16 - (currTime - lastTime)) ;
					var id = window.setTimeout(function() { callback(currTime + timeToCall) ; }, timeToCall) ;
					lastTime = currTime + timeToCall ;
					return id ;
				}
			if (!window.cancelAnimationFrame)
				window.cancelAnimationFrame = function(id) {
					window.clearTimeout(id) ;
				}
		})() ;
		
		// here other classes
		var CSSPropertyMapper = Type.define({
			pkg:'::CSSPropertyMapper',
			constructor:CSSPropertyMapper = function CSSPropertyMapper(){
				throw 'Not meant to be instanciated... CSSPropertyMapper' ;
			},
			statics:{
				initialize:function initialize(domain){
					var comp = window.getComputedStyle ;
					CSSPropertyMapper.hasComputedStyle = comp !== undefined && typeof(comp) == 'function';
					CSSPropertyMapper.isIE = /MSIE/.test(navigator.userAgent) ;
					CSSPropertyMapper.isIEunder9 = /MSIE [0-8]/.test(navigator.userAgent) ;
					CSSPropertyMapper.isIEunder8 = /MSIE [0-7]/.test(navigator.userAgent) ;
				},
				formats:{
					'positionprop':/scroll(left|top)?/gi,
					'separatorprop':/-/,
					'colorextprop':/((border|background)?color|background)[^:]*$/gi
				},
				cache:{},
				getScroll:function(target, name, unit) {
					return (target === window || target === document) ?
					(
						this[(name.search(/top/i) != -1) ? 'pageYOffset' : 'pageXOffset'] ||
							(CSSPropertyMapper.isIEunder9 && document.documentElement[name]) ||
								document.body[name]
					) : target[name] ;
				},
				setScroll:function(target, name, unit, val) {
					if(target === window || target === document){
						try{
							this[(name.search(/top/i) != -1) ? 'pageYOffset' : 'pageXOffset'] = parseInt(val) ;
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
						window.getComputedStyle (target, '')[pname].replace(unitsreg, '') :
						target.currentStyle[pname].replace(unitsreg, '') ;
					}
					// trace(str, target.currentStyle[pname], unit, target)
					// trace(target)
					return Number(unit == '' ? str : str.replace(new RegExp(unit+'.*$'), ''))
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
						val = pname == 'backgroundColor' ? target.currentStyle[pname] : CSSPropertyMapper.cssHackGet(target, pname)
					}
					if(val == '') val = 'transparent' ;
					
					switch(true){
						case (/^#/.test(val)) :
							var hex = val.replace(/^#/, '') ;
							if(hex.length == 3){
								hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) ;
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
						default:
							o = {r:(n & 0xFF0000) >> 16, g:(n & 0xFF00) >> 8, b:(n & 0xFF)}
						break;
					}
					
					if(BetweenJS.colormode == 'hsv'){ // only h, s, v in o
						o = CSSPropertyMapper.RGBtoHSV(o) ;
					}
					
					return o ;
				},
				cssColorSet:function(target, pname, unit, val){
					
					if (BetweenJS.colormode == 'hsv' && 'h' in val && 's' in val && 'v' in val){
						val = CSSPropertyMapper.HSVtoRGB(val) ;
					}
					
					var r = parseInt(val.r), 
					g = parseInt(val.g), 
					b = parseInt(val.b) ; 
					return target['style'][pname] = 'rgb('+r+','+g+','+b+')'  ;
				},
				RGBtoHSV:function(o, r, g, b){ // obsolete and not debugged
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
					var m = {} , oh ;
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
				check:function(name){
					var formats = CSSPropertyMapper.formats ;
					var cache = CSSPropertyMapper.cache ;
					if(name in cache) {return cache[name] } ;
					var o ;
					
					switch(true){
						case formats['positionprop'].test(name) :
							o = {
								cssprop:name,
								cssget:CSSPropertyMapper.getScroll,
								cssset:CSSPropertyMapper.setScroll
							} ;
						break ;
						case formats['separatorprop'].test(name) :
							return (cache[name] = CSSPropertyMapper.check(name.replace(/-(\w)/g, function($0, $1){return $1.toUpperCase()}))) ;
						break ;
						case formats['colorextprop'].test(name) :
							o = {
								cssprop:name,
								cssget:CSSPropertyMapper.cssColorGet,
								cssset:CSSPropertyMapper.cssColorSet
							} ;
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
		// SINGLE.UPDATER
		var UpdaterFactory = Type.define({
			pkg:'single.updater::UpdaterFactory',
			constructor:UpdaterFactory = function UpdaterFactory(){
			   //
			},
			poolIndex:0,
			mapPool:[],
			listPool:[],
			create:function(target, dest, source){
				var map, updaters, name, value, isRelative, parent, child, updater ;
				var units ;
				if (this.poolIndex > 0) {
					--this.poolIndex ;
					map = this.mapPool[this.poolIndex] ;
					updaters = this.listPool[this.poolIndex] ;
				}
				else {
					map = {} ;
					updaters = [] ;
				}
				
				if (source !== undefined) {
					
					
					source = this.checkStringObj(source) ;
					
					for (name in source) {
						if (typeof(value = source[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters).setSourceValue(name, parseFloat(value), isRelative) ;
						}
						else {
							parent = this.getUpdaterFor(target, name, map, updaters) ;
							child = this.create(parent.getObject(name), dest !== undefined ? dest[name] : undefined, value) ;
							updaters.push(new UpdaterLadder(parent, child, name));
						}
					}
				}
				
				if (dest !== undefined) {
					
					dest = this.checkStringObj(dest) ;
					for (name in dest) {
						if (typeof(value = dest[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters).setDestinationValue(name, parseFloat(value), isRelative) ;
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
			createBezier:function(target, dest, source, controlPoint){
				var map, updaters, name, value, isRelative, parent, child, updater, cp, i ;
				var units ;
				if (this.poolIndex > 0) {
					--this.poolIndex ;
					map = this.mapPool[this.poolIndex] ;
					updaters = this.listPool[this.poolIndex] ;
				}
				else {
					map = {} ;
					updaters = [] ;
				}
				
				if (source !== undefined) {
				
					source = this.checkStringObj(source) ;
					
					for (name in source) {
						if (typeof(value = source[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters, 'bezier').setSourceValue(name, parseFloat(value), isRelative) ;
						}
						else {
							parent = this.getUpdaterFor(target, name, map, updaters, 'bezier') ;
							child = this.createBezier(parent.getObject(name), dest !== undefined ? dest[name] : undefined, value, controlPoint !== undefined ? controlPoint[name] : undefined) ;
							updaters.push(new UpdaterLadder(parent, child, name));
						}
					}
					
				}
				if (dest !== undefined) {
					
					dest = this.checkStringObj(dest) ;
					
					for (name in dest) {
						if (typeof(value = dest[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters, 'bezier').setDestinationValue(name, parseFloat(value), isRelative) ;
						} else {
							if (!(source !== undefined && name in source)) {
								parent = this.getUpdaterFor(target, name, map, updaters, 'bezier') ;
								child = this.createBezier(parent.getObject(name), value, source !== undefined ? source[name] : undefined, controlPoint !== undefined ? controlPoint[name] : undefined) ;
								updaters.push(new UpdaterLadder(parent, child, name)) ;
							}
						}
					}
				}
				
				if (controlPoint !== undefined) {
					
					controlPoint = this.checkStringObj(controlPoint) ;
					for (name in controlPoint) {
						
						if (typeof(value = controlPoint[name]) == 'number') {
							value = [value] ;
						}
						if (value instanceof Array) {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							cp = value ;
							l = cp.length ;
							for (i = 0 ; i < l ; ++i) {
								this.getUpdaterFor(target, name, map, updaters, 'bezier').addControlPoint(name, cp[i], isRelative) ;
							}
						} else {
							if (map[name] !== true) {
								var bezierUpdater = this.getUpdaterFor(target, name, map, updaters, 'bezier') ;
								child = this.createBezier(bezierUpdater.getObject(name), dest !== undefined ? dest[name] : undefined, source !== undefined ? source[name] : undefined, value) ;
								updaters.push(new UpdaterLadder(bezierUpdater, child, name)) ;
								map[name] = true ;
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
			createPhysical:function(target, dest, source, easing){
				var map, updaters, name, value, isRelative, parent, child, updater ;
				var units ;
				if (this.poolIndex > 0) {
					--this.poolIndex ;
					map = this.mapPool[this.poolIndex] ;
					updaters = this.listPool[this.poolIndex] ;
				}
				else {
					map = {} ;
					updaters = [] ;
				}
				if (source !== undefined) {
					
					source = this.checkStringObj(source) ;
					
					for (name in source) {
						if (typeof(value = source[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters, 'physical', easing).setSourceValue(name, parseFloat(value), isRelative) ;
						}
						else {
							parent = this.getUpdaterFor(target, name, map, updaters, 'physical', easing) ;
							child = this.createPhysical(parent.getObject(name), dest !== undefined ? dest[name] : undefined, value, easing) ;
							updaters.push(new PhysicalUpdaterLadder(parent, child, name));
						}
					}
					
				}
				if (dest !== undefined) {
					
					dest = this.checkStringObj(dest) ;
					
					for (name in dest) {
						if (typeof(value = dest[name]) == "number") {
							if ((isRelative = /^\$/.test(name))) {
								name = name.substr(1) ;
							}
							this.getUpdaterFor(target, name, map, updaters, 'physical', easing).setDestinationValue(name, parseFloat(value), isRelative) ;
						} else {
							if (!(source !== undefined && name in source)) {
								parent = this.getUpdaterFor(target, name, map, updaters, 'physical', easing) ;
								child = this.createPhysical(parent.getObject(name), value, source !== undefined ? source[name] : undefined, easing) ;
								updaters.push(new PhysicalUpdaterLadder(parent, child, name)) ;
							}
						}
					}
				}
				
				var l = updaters.length ;
				
				if (l == 1) {
					updater = updaters[0] ;
				}else if (l > 1) {
					updater = new CompositePhysicalUpdater(target, updaters) ;
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
			getUpdaterFor:function(target, propertyName, map, list, mode, easing){
				var updaterClass ;
				switch(mode){
					case 'bezier' :
						updaterClass = BezierUpdater ;
					break ;
					case 'physical' :
						updaterClass = PhysicalUpdater ;
					break ;
					default:
						updaterClass = ObjectUpdater ;
					break ;
				}
				
				if (updaterClass !== undefined) {
					var upstr = updaterClass.slot.qualifiedclassname ;
					
					var updater = map[upstr] ;
					if (updater === undefined) {
						updater = new (updaterClass)() ;
						updater.setTarget(target, easing) ;
						
						map[upstr] = updater ;
						if (list !== undefined) {
							list.push(updater) ;
						}
					}
					return updater ;
				}
				return undefined ;
			},
			checkStringObj:function(val, n, res){
				
				if(typeof(val) != 'string') {
					if('h' in val && 's' in val && 'v' in val){
						val = 'hsv('+val['h']+','+val['s']+','+val['v']+')' ;
					}else if('r' in val && 'g' in val && 'b' in val ){
						val = 'rgb('+val['r']+','+val['g']+','+val['b']+')' ;
					}else return val ;
				}
				if(typeof(val) != 'string') return val ;
				
				if(/^(0x|#)/.test(val)){
					var hex = val.replace(/^(0x|#)/, '') ;
					if(hex.length == 3)
						hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) ;
					n = parseInt('0x'+hex) ;
					res = {r:(n & 0xFF0000) >> 16, g:(n & 0xFF00) >> 8, b:(n & 0xFF)} ;
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
					var h = p[0], 
					s = p[1],
					v = p[2] ;
					res = CSSPropertyMapper.HSVtoRGB({h:h,s:s,v:v}) ;
				}
				if(BetweenJS.colormode == 'hsv'){return CSSPropertyMapper.RGBtoHSV(res)}
				return res ;
			}
		});
		// SINGLE.TICKER
		var EnterFrameTicker = Type.define({
			pkg:'single.ticker::EnterFrameTicker',
			first:undefined,
			numListeners:0,
			tickerListenerPaddings:undefined,
			time:undefined,
			constructor:EnterFrameTicker = function EnterFrameTicker(){
				this.numListeners = 0 ;
				this.tickerListenerPaddings = new Array(10) ;
				var prevListener = undefined ;
				this.all = {} ;
				for (var i = 0 ; i < 10 ; ++i ) {
					var listener = new TickerListener() ; 
					if (prevListener !== undefined) {
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
				if (!!this.first) {
					if (!!this.first.prevListener) {
						this.first.prevListener.nextListener = listener ;
						listener.prevListener = this.first.prevListener ;
					}
					listener.nextListener = this.first ;
					this.first.prevListener = listener ;
				}
				this.first = listener ;
				// var uid = listener.uid = this.time+'::'+this.numListeners ;
				
				// this.all[uid] = listener ;
				
				++this.numListeners ;
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
				// delete this.all[listener.uid] ;
				// delete listener['uid'] ;
			},
			start:function(){
				this.time = getTimer() * .001 ;
				this.render() ;
			},
			render:function(){
				var eft = this ;
				eft.update() ;
				var f = function(){eft.render()} ;
				eft.interval = window.requestAnimationFrame(f) ;
			},
			stop:function(){
				window.cancelAnimationFrame(this.interval) ;
			},
			setInactive:function(cond){
				if(cond) this.stop() ;
				else this.start() ;
			},
			update:function(){
				var t = this.time = getTimer() * .001 ;
				var n = 8 - (this.numListeners % 8) ;
				var listener = this.tickerListenerPaddings[0] ; 
				var l = this.tickerListenerPaddings[n] ;
				var ll ;
				
				if (!!(l.nextListener = this.first)) {
					this.first.prevListener = l ;
				}
				
				while (!!listener.nextListener) {
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
					if ((listener = listener.nextListener).tick(t)) {
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
				}
				if (!!(this.first = l.nextListener)) {
					this.first.prevListener = undefined ;
				}
				l.nextListener = this.tickerListenerPaddings[n + 1] ;
			}
		}) ;
		// CORE.TICKERS
		var TickerListener = Type.define({
			pkg:'core.tickers::TickerListener',
			prevListener:undefined,
			nextListener:undefined,
			constructor:TickerListener = function TickerListener(){
				
			},
			tick:function(time){
				return false ;
			}
		}) ;
		// CORE.UPDATERS
		var AbstractUpdater = Type.define({
			pkg:'core.updaters::AbstractUpdater',
			isResolved:false,
			target:undefined,
			constructor:AbstractUpdater = function AbstractUpdater(){ 
			   this.isResolved = false ;
			},
			setTarget:function(target, easing){
				this.target = target ;
				if(easing !== undefined) this.easing = easing ;
			},
			setSourceValue:function(propertyName, value, isRelative){},
			setDestinationValue:function(propertyName, value, isRelative){},
			getObject:function(propertyName){},
			setObject:function(propertyName, value){},
			update:function(factor){
				if (this.isResolved === false) {
					this.resolveValues() ;
					this.isResolved = true ;
				}
				this.updateObject(factor) ;
			},
			resolveValues:function(){},
			updateObject:function(){},
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
			}
		}) ;
		var ObjectUpdater = Type.define({
			pkg:'core.updaters::ObjectUpdater',
			inherits:AbstractUpdater,
			target:undefined,
			source:undefined,
			destination:undefined,
			relativeMap:undefined,
			constructor:ObjectUpdater = function ObjectUpdater(){
				ObjectUpdater.base.call(this) ;
				this.source = {} ;
				this.destination = {} ;
				this.relativeMap = {} ;
			},
			setTarget:function(target, easing){
				ObjectUpdater.factory.setTarget.apply(this, [target, easing]) ;
				
				var ctor = target.constructor ;
				
				switch(true){
					case ctor === undefined : // IE 7-
					case (/HTML[a-zA-Z]*Element/.test(ctor)) :
						this.units = {} ;
					break ;
					
					// case ctor === Class :
					case ctor === Date :
					case ctor === Number :
					case ctor === String :
					case ctor === Function :
					case ctor === Object :
					default:
						
					break ;
				}
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
			getObject:function(propertyName, cond){
				if(this.units === undefined){
					return this.target[propertyName] ;
				}else{
					propertyName = this.retrieveUnits(propertyName) ; // here check for unit in string
					var props = CSSPropertyMapper.check(propertyName) ;
					var pname = props.cssprop ;
					var pget = props.cssget ;
					var n = pget(this.target, pname, this.units[propertyName], cond) ; // here will apply special treatment upon checks in CSSPropertyMapper.check() method
					return n ;
				}
			},
			setObject:function(propertyName, value){
				if(this.units === undefined){
					this.target[propertyName] = value ;
				}else{
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
			resolveValues:function(){
				
				var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap ;
				for (key in source) {
					if (dest[key] === undefined) {
						dest[key] = this.getObject(key) ;
					}
					if (!!rMap['source.' + key]) {
						source[key] += this.getObject(key) ;
					}
				}
				
				
				for (key in dest) {
					if (source[key] === undefined) {
						source[key] = this.getObject(key) ;
					}
					if (!!rMap['dest.' + key]) {
						dest[key] += this.getObject(key) ;
					}
				}
			},
			updateObject:function(factor){
				var invert = 1.0 - factor ;
				var ttt = this.timeouts ;
				var t = this.target ;
				var d = this.destination ;
				var s = this.source ;
				var tt = this ;
				for (var name in d) {
					var val = s[name] * invert + d[name] * factor ;
					
					if(this.units === undefined){
						
						tt.setObject(name, val) ;
						
					}else{
						try{
							// BetweenJS.getTweensOf(t) ;
							tt.setObject(name, val) ;
							
						}catch(e){
							trace('setting the object throws an error...', name, val, e)
						}
					}
				}
			},
			newInstance:function(){
				return new ObjectUpdater() ;
			},
			copyFrom:function(source){
				ObjectUpdater.factory.copyFrom.apply(this, [source]) ;
				var obj = source ;
				
				this.target = obj.target ;
				this.units = obj.units ;
				this.copyObject(this.source, obj.source) ;
				this.copyObject(this.destination, obj.destination) ;
				this.copyObject(this.relativeMap, obj.relativeMap) ;
			},
			copyObject:function(to, from){
				for (var s in from) {
					to[s] = from[s] ;
				}
			}
		}) ;
		var CompositeUpdater = Type.define({
			pkg:'core.updaters::CompositeUpdater',
			target:undefined,
			a:undefined,
			b:undefined,
			c:undefined,
			d:undefined,
			updaters:undefined,
			constructor:CompositeUpdater = function CompositeUpdater(target, updaters){
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
			setSourceValue:function(propertyName, value, isRelative){},
			setDestinationValue:function(propertyName, value, isRelative){},
			getObject:function(propertyName){
				return undefined ;
			},
			setObject:function(propertyName, value){},
			update:function(factor){
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
				
				return new CompositeUpdater(this.target, updaters) ;
			}
		}) ;
		var UpdaterLadder = Type.define({
			pkg:'core.updaters::UpdaterLadder',
			target:undefined,
			parent:undefined,
			child:undefined,
			propertyName:undefined,
			constructor:UpdaterLadder = function UpdaterLadder(parent, child, propertyName){
				this.parent = parent ;
				this.child = child ;
				this.propertyName = propertyName ;
			},
			setSourceValue:function(propertyName, value, isRelative){},
			setDestinationValue:function(propertyName, value, isRelative){},
			getObject:function(propertyName){
				return undefined ;
			},
			setObject:function(propertyName, value){},
			resolveValues:function(){},
			update:function(factor){
				this.child.update(factor) ;
				this.parent.setObject(this.propertyName, this.child.target) ;
			},
			clone:function(source){
				return new UpdaterLadder(this.parent, this.child, this.propertyName) ;
			}
		}) ;
		var PhysicalUpdaterLadder = Type.define({
			pkg:'core.updaters::PhysicalUpdaterLadder',
			target:undefined,
			parent:undefined,
			child:undefined,
			propertyName:undefined,
			easing:undefined,
			duration:0.0,
			constructor:PhysicalUpdaterLadder = function PhysicalUpdaterLadder(parent, child, propertyName){
				this.parent = parent ;
				this.child = child ;
				this.propertyName = propertyName ;
				this.duration = this.parent.duration ;
			},
			setSourceValue:function(propertyName, value, isRelative){},
			setDestinationValue:function(propertyName, value, isRelative){},
			getObject:function(propertyName){},
			setObject:function(propertyName, value){},
			resolveValues:function(){},
			update:function(factor){
				this.child.update(factor) ;
				this.parent.setObject(this.propertyName, this.child.target) ;
			},
			clone:function(source){
				return new PhysicalUpdaterLadder(this.parent, this.child, this.propertyName) ;
			}
		}) ;
		var BezierUpdater = Type.define({
			pkg:'core.updaters::BezierUpdater',
			inherits:ObjectUpdater,
			target:undefined,
			source:undefined,
			destination:undefined,
			relativeMap:undefined,
			controlPoint:undefined,
			constructor:BezierUpdater = function BezierUpdater(){
				BezierUpdater.base.call(this) ;
				this.controlPoint = {} ;
			},
			addControlPoint:function(propertyName, value, isRelative){
				var controlPoint = this.controlPoint[propertyName] ;
				if (controlPoint === undefined) this.controlPoint[propertyName] = controlPoint = [] ;
				controlPoint.push(value) ;
				this.relativeMap['cp.' + propertyName + '.' + controlPoint.length] = isRelative ;
			},
			resolveValues:function(){
				BezierUpdater.factory.resolveValues.call(this) ;
				var key, target = this.target, rMap = this.relativeMap, 
				controlPoint = this.controlPoint, cpVec, l, i ;
				for (key in controlPoint) {
					cpVec = controlPoint[key] ;
					l = cpVec.length ;
					for (i = 0 ; i < l ; ++i) {
						if (rMap['cp.' + key + '.' + i]) {
							cpVec[i] += this.getObject(key) ;
						}
					}
				}
			},
			updateObject:function(factor){
				var invert = 1.0 - factor,
				t = this.target,
				d = this.destination,
				s = this.source,
				cp = this.controlPoint,
				cpVec, b, l, ip, it, p1, p2, name, val;
				
				for (name in d) {
					b = s[name] ;
					if (factor != 1.0 && (cpVec = this.controlPoint[name]) !== undefined) {
						if ((l = cpVec.length) == 1) {
							val = b + factor * (2 * invert * (cpVec[0] - b) + factor * (d[name] - b)) ;
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
							val = p1 + it * (2 * (1 - it) * (cpVec[ip] - p1) + it * (p2 - p1)) ;
						}
					} else {
						val = b * invert + d[name] * factor ;
					}
					this.setObject(name, val) ;
				}
			},
			newInstance:function(){
				return new BezierUpdater() ;
			},
			copyFrom:function(source)		{
				BezierUpdater.factory.copyFrom.apply(this, [source])
				this.copyObject(this.controlPoint, source.controlPoint) ;
			}
		}) ;
		var PhysicalUpdater = Type.define({
			pkg:'core.updaters::PhysicalUpdater',
			inherits:ObjectUpdater,
			target:undefined,
			source:undefined,
			destination:undefined,
			relativeMap:undefined,
			easing:undefined,
			duration:undefined,
			time:undefined,
			maxDuration:0.0,
			isResolved:false,
			constructor:PhysicalUpdater = function PhysicalUpdater(){
				PhysicalUpdater.base.call(this) ;
				this.duration = {} ;
				this.maxDuration = 0.0 ;
				this.isResolved = false ;
			},
			resolveValues:function(){
				var key, target = this.target, source = this.source, dest = this.destination, rMap = this.relativeMap,
				d = this.duration, duration, maxDuration = 0.0 ;
				var val ;
				var un = this.units ;
				var noUnits = un === undefined ;
				
				for (key in source) {
					if (dest[key] === undefined) {
						dest[key] = this.getObject(key) ;
					}
					if (!!rMap['source.' + key]) {
						source[key] += this.getObject(key) ;
					}
				}
				for (key in dest) {
					
					if (source[key] === undefined) {
						source[key] = this.getObject(key) ;
					}
					if (!!rMap['dest.' + key]) {
						dest[key] += this.getObject(key) ;
					}
					duration = this.easing.getDuration(source[key], source[key] < dest[key] ? dest[key] - source[key] : source[key] - dest[key]  ) ;
					d[key] = duration ;
					if (maxDuration < duration) {
						maxDuration = duration ;
					}
				}
				
				this.maxDuration = maxDuration ;
				this.time = this.maxDuration ;
				this.isResolved = true ;
			},
			update:function(time){
				if (!this.isResolved) {
					this.resolveValues() ;
				}
				
				var t = this.target,
				e = this.easing,
				dest = this.destination,
				src = this.source,
				d = this.duration,
				s, name, val ;
				for (name in dest) {
					if (time >= d[name]) {
						val = dest[name] ;
					} else {
						s = src[name] ;
						val = e.calculate(time, s, dest[name] - s) ;
					}
					this.setObject(name, val) ;
				}
			},
			newInstance:function(){
				return new PhysicalUpdater() ;
			},
			copyFrom:function(source){
				PhysicalUpdater.factory.copyFrom.apply(this, [source]) ;
				this.easing = source.easing ;
			}
		}) ;
		// CORE.TWEENS
		var AbstractTween = Type.define({
			pkg:'core.tweens::AbstractTween',
			inherits:TickerListener,
			constructor:AbstractTween = function AbstractTween(ticker, position){
			   this.isPlaying = false ;
			   this.time = .5 ;
			   this.stopOnComplete = true ;
			   AbstractTween.base.call(this) ;
			   this.ticker = ticker ;
			   this.position = position || 0 ;
			},
			ticker:undefined,
			time:.5,
			position:0,
			isPlaying:false,
			stopOnComplete:true,
			onPlay:undefined,
			onPlayParams:undefined,
			onStop:undefined,
			onStopParams:undefined,
			onUpdate:undefined,
			onUpdateParams:undefined,
			onComplete:undefined,
			onCompleteParams:undefined,
			play:function(){
				if (!this.isPlaying) {
					if(this.ticker.numListeners == 0) this.ticker.setInactive(false) ;
					if (this.position >= this.time) {
						this.position = 0 ;
					}
					var t = this.ticker.time ;
					
					this.startTime = t - this.position ;
					this.isPlaying = true ;
					
					this.ticker.addTickerListener(this) ;
					
					if (this.onPlay !== undefined) {
					   this.onPlay.apply(this, concat(this.onPlayParams)) ;
					}
					this.tick(t) ;
				}
				
				return this ;
			},
			firePlay:function(){
				if (this.onPlay !== undefined) {
				   this.onPlay.apply(this, concat(this.onPlayParams)) ;
				}
				return this ;
			},
			stop:function(){
				if (this.isPlaying) {
					
					this.ticker.removeTickerListener(this) ;
					if(this.ticker.numListeners == 0) this.ticker.setInactive(true) ;
					
					this.isPlaying = false ;
					
					if (this.onStop !== undefined) {
						this.onStop.apply(this, concat(this.onStopParams)) ;
					}
				}
				return this ;
			},
			fireStop:function(){
				if (this.onStop !== undefined) {
					this.onStop.apply(this, concat(this.onStopParams)) ;
				}
				return this ;
			},
			togglePause:function(){
				if (this.isPlaying) {
					return this.stop() ;
				}
				else {
					return this.play() ;
				}
			},
			gotoAndPlay:function(position){
				if (position < 0) {
					position = 0 ;
				}
				if (position > this.time) {
					position = this.time ;
				}
				this.position = position ;
				return this.play() ;
			},
			gotoAndStop:function(position){
				if (position < 0) {
					position = 0 ;
				}
				if (position > this.time) {
					position = this.time ;
				}
				this.position = position ;
				this.internalUpdate(position) ;
				
				if (this.onUpdate !== undefined) {
					this.onUpdate.apply(this, concat(this.onUpdateParams)) ;
				}
				return this.stop() ;
			},
			update:function(time){
				var isComplete = false ;
				if ((this.position < this.time && this.time <= time) || (0 < this.position && time <= 0)) {
					isComplete = true ;
				}
				
				this.position = time ;
				this.internalUpdate(time) ;
				
				if (this.onUpdate !== undefined) {
					this.onUpdate.apply(this, concat(this.onUpdateParams)) ;
				}
				
				if (isComplete) {
					if (this.onComplete !== undefined) {
						this.onComplete.apply(this, concat(this.onCompleteParams)) ;
					}
				}
				
				return this ;
			},
			tick:function(time){
				if (this.isPlaying === false) {
					return true ;
				}
				
				var t = time - this.startTime ;
				
				this.position = t ;
				this.internalUpdate(t) ;
				var sss = this ;
				
				if (this.onUpdate !== undefined) {
					this.onUpdate.apply(this, concat(this.onUpdateParams)) ;
				}
				
				if (this.isPlaying === true) {
					
					if (t >= this.time) {
						
						this.position = this.time ;
						
						if (this.stopOnComplete === true) {
							
							this.isPlaying = false ;
							
							if (this.onComplete !== undefined) {
								this.onComplete.apply(this, concat(this.onCompleteParams)) ;
							}
							
							return true ;
						}else {
							
							if (this.onComplete !== undefined) {
								this.onComplete.apply(this, concat(this.onCompleteParams)) ;
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
			internalUpdate:function(time){},
			clone:function(){
				var instance = newInstance() ;
				if (instance !== undefined) {
					instance.copyFrom(this) ;
				}
				return instance ;
			},
			newInstance:function(){
			   return undefined;
			},
			copyFrom:function(source){
				this.ticker = source.ticker ;
				this.time = source.time ;
				this.easing = source.easing ;
				this.stopOnComplete = source.stopOnComplete ;
				this.copyHandlersFrom(source);
			},
			copyHandlersFrom:function(){
				this.onPlay = source.onPlay ;
				this.onPlayParams = source.onPlayParams ;
				this.onStop = source.onStop ;
				this.onStopParams = source.onStopParams ;
				this.onUpdate = source.onUpdate ;
				this.onUpdateParams = source.onUpdateParams ;
				this.onComplete = source.onComplete ;
				this.onCompleteParams = source.onCompleteParams ; 
			}
		}) ;
		var AbstractActionTween = Type.define({
			pkg:'core.tweens::AbstractActionTween',
			inherits:AbstractTween,
			lastTime:undefined,
			constructor:AbstractActionTween = function AbstractActionTween(ticker){
				AbstractActionTween.base.apply(this, [ticker, 0]) ;
				this.time = 0.01 ;
				this.lastTime = -1 ;
			},
			internalUpdate:function(time){
				if (this.lastTime < 0.01 && time >= 0.01) {
					this.action() ;
				}else if (this.lastTime > 0 && time <= 0) {
					this.rollback() ;
				}
				this.lastTime = time ;
			},
			action:function(){},
			rollback:function(){}
		}) ;
		var TweenDecorator = Type.define({
			pkg:'core.tweens::TweenDecorator',
			inherits:AbstractTween,
			baseTween:undefined,
			constructor:TweenDecorator = function TweenDecorator(baseTween, position){
				TweenDecorator.base.apply(this, [baseTween.ticker, position]) ;
				this.baseTween = baseTween ;
				this.time = baseTween.time ;
			},
			play:function(){
				if (this.isPlaying === false) {
					
					this.baseTween.firePlay() ;
					TweenDecorator.factory.play.call(this) ;
				}
				return this ;
			},
			firePlay:function(){
				TweenDecorator.factory.firePlay.call(this) ;
				this.baseTween.firePlay() ;
				
				return this ;
			},
			stop:function(){
				if (this.isPlaying === true) {
					TweenDecorator.factory.stop.call(this) ;
					this.baseTween.fireStop() ;
				}
				return this ;
			},
			fireStop:function(){
				TweenDecorator.factory.fireStop.call(this) ;
				this.baseTween.fireStop() ;
				return this ;
			},
			internalUpdate:function(time){
				this.baseTween.update(time) ;
			}
		}) ;
		// TWEENS
		var ObjectTween = Type.define({
			pkg:'tweens::ObjectTween',
			inherits:AbstractTween,
			easing:undefined,
			updater:undefined,
			target:undefined,
			constructor:ObjectTween = function ObjectTween(ticker){
			   ObjectTween.base.apply(this, [ticker, 0]) ;
			},
			internalUpdate:function(time){
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
			newInstance:function(){
				return new ObjectTween(this.ticker); 
			},
			copyFrom:function(source){
				ObjectTween.factory.copyFrom.apply(this, [source]) ;
				this.updater = source.updater.clone() ;
			}
		}) ;
		var PhysicalTween = Type.define({
			pkg:'tweens::PhysicalTween',
			inherits:AbstractTween,
			updater:undefined,
			target:undefined,
			setted:false,
			constructor:PhysicalTween = function PhysicalTween(ticker){
				PhysicalTween.base.apply(this, [ticker, 0]) ;
				this.setted = false ;
			},
			settings:function(){
				if(this.updater !== undefined){
					this.target = this.updater.target ;
				}
			},
			internalUpdate:function(time){
				if(this.setted !== true){
					this.settings() ;
					this.setted = true ;
				}
				
				this.updater.update(time);
				this.time = this.updater.time ;
			},
			newInstance:function(){
				return new PhysicalTween(this.ticker) ;
			},
			copyFrom:function(source){
				PhysicalTween.factory.copyFrom.apply(this, [source]) ;
				this.updater = source.updater.clone() ;
			}
		}) ;
		// ACTIONS
		var FunctionAction = Type.define({
			pkg:'actions::FunctionAction',
			inherits:AbstractActionTween,
			func:undefined,
			params:undefined,
			useRollback:false,
			rollbackFunc:undefined,
			rollbackParams:undefined,
			constructor:FunctionAction = function FunctionAction(ticker, func, params, useRollback, rollbackFunc, rollbackParams){
				FunctionAction.base.apply(this, [ticker, 0]) ;
				this.func = func ;
				this.params = params ;
				
				if (useRollback !== undefined) {
					if (rollbackFunc !== undefined) {
						this.rollbackFunc = rollbackFunc ;
						this.rollbackParams = rollbackParams ;
					} else {
						this.rollbackFunc = func ;
						this.rollbackParams = params ;
					}
				}
			},
			action:function(){
				if (this.func !== undefined) this.func.apply(this, concat(this.params)) ;
			},
			rollback:function(){
				if (this.rollbackFunc !== undefined) this.rollbackFunc.apply(this, concat(this.rollbackParams)) ;
			}
		}) ;
		var TimeoutAction = Type.define({
			pkg:'actions::TimeoutAction',
			inherits:AbstractActionTween,
			duration:0,
			func:undefined,
			params:undefined,
			constructor:TimeoutAction = function TimeoutAction(ticker, duration, func, params, useRollback, rollbackFunc, rollbackParams){
				TimeoutAction.base.apply(this, [ticker, 0]) ;
				this.time = duration || 0 ;
				this.func = func ;
				this.params = params ;
				
				if (useRollback !== undefined) {
					if (rollbackFunc !== undefined) {
						this.rollbackFunc = rollbackFunc ;
						this.rollbackParams = rollbackParams ;
					} else {
						this.rollbackFunc = func ;
						this.rollbackParams = params ;
					}
				}
			},
			internalUpdate:function(time){
				if(time >= this.time){
					this.action() ;
				}
			},
			action:function(){
				if (this.func !== undefined) this.func.apply(this, concat(this.params)) ;
			},
			clear:function(){
				return this.stop() ;
			},
			stop:function(){
				return TimeoutAction.factory.stop.call(this) ;
			},
			rollback:function(){
				if (this.rollbackFunc !== undefined) this.rollbackFunc.apply(this, concat(this.rollbackParams)) ;
			}
		}) ;
		var IntervalAction = Type.define({
			pkg:'actions::IntervalAction',
			inherits:AbstractActionTween,
			duration:0,
			func:undefined,
			params:undefined,
			constructor:IntervalAction = function IntervalAction(ticker, timer, func, params, useRollback, rollbackFunc, rollbackParams){
				IntervalAction.base.apply(this, [ticker, 0]) ;
				this.time = NaN ;
				this.timer = (timer / 1000) || 0 ;
				this.func = func ;
				this.count = 0 ;
				this.params = params ;
				
				if (useRollback !== undefined) {
					if (rollbackFunc !== undefined) {
						this.rollbackFunc = rollbackFunc ;
						this.rollbackParams = rollbackParams ;
					} else {
						this.rollbackFunc = func ;
						this.rollbackParams = params ;
					}
				}
			},
			internalUpdate:function(time){
				this.globaltime = time ;
				this.timestamp = time ;
				
				var t = time / (this.timer) ;
				
				if(t > (this.count + 1)){
					this.count++ ;
					this.action() ;
				}
			},
			action:function(){
				if(this.func !== undefined) this.func.apply(this, concat(this.params)) ;
			},
			clear:function(){
				this.time = 0 ;
				return this ;
			},
			stop:function(){
				return this.clear() ;
			},
			rollback:function(){
				if (this.rollbackFunc !== undefined) this.rollbackFunc.apply(this, concat(this.rollbackParams)) ;
			}
		}) ;
		var AddChildAction = Type.define({
			pkg:'actions::AddChildAction',
			inherits:AbstractActionTween,
			target:undefined,
			parent:undefined,
			constructor:AddChildAction = function AddChildAction(ticker, target, parent){
				AddChildAction.base.apply(this, [ticker, 0]) ;
				this.target = target ;
				this.parent = parent ;
			},
			action:function(){
				if (this.target !== undefined && this.parent !== undefined && this.target.parentNode !== this.parent) {
					if(!! this.parent.jquery)
						this.parent.append(this.target) ;
					else
					this.parent.appendChild(this.target) ;
				}
			},
			rollback:function(){
				if (this.target !== undefined && this.parent !== undefined && this.target.parentNode === this.parent) {
					if(!! this.parent.jquery)
						this.target.remove()
					else
					this.parent.removeChild(this.target) ;
				}
			}
		}) ;
		var RemoveFromParentAction = Type.define({
			pkg:'actions::RemoveFromParentAction',
			inherits:AbstractActionTween,
			target:undefined,
			constructor:RemoveFromParentAction = function RemoveFromParentAction(ticker, target){
				RemoveFromParentAction.base.apply(this, [ticker, 0]) ;
				this.target = target ;
			},
			action:function(){
				if (this.target !== undefined && this.target.parentNode !== null) {
					if(!!this.target.jquery)
						this.target.remove() ;
					else{				
						this.parent = this.target.parentNode ;
						this.parent.removeChild(this.target) ;
					}
				}
			},
			rollback:function(){
				if (this.target !== undefined && this.parent !== undefined) {
					if(!!this.target.jquery){
						this.parent.append(this.target) ;
					}else{				
						this.parent.appendChild(this.target) ;
						this.parent = undefined ;
					}
				}
			}
		}) ;
		// DECORATORS
		var SlicedTween = Type.define({
			pkg:'tweens.decorators::SlicedTween',
			inherits:TweenDecorator,
			begin:0,
			end:1,
			constructor:SlicedTween = function SlicedTween(baseTween, begin, end){
			   SlicedTween.base.apply(this, [baseTween, 0]) ;
			   this.end = end || 1 ;
			   this.begin = begin || 0 ;
			   this.time = this.end - this.begin ;
			   if(end - begin == 0) this.instantUpdate = true ;
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
			pkg:'tweens.decorators::ScaledTween',
			inherits:TweenDecorator,
			scale:1,
			constructor:ScaledTween = function ScaledTween(baseTween, scale){
			   ScaledTween.base.apply(this, [baseTween, 0]) ;
			   this.scale = scale || 1 ;
			   this.time = this.scale * baseTween.time ;
			},
			internalUpdate:function(time){
			   this.baseTween.update(time / this.scale) ;
			},
			newInstance:function(){
				return new ScaledTween(this.baseTween.clone(), this.scale) ;
			}
		}) ;
		var ReversedTween = Type.define({
			pkg:'tweens.decorators::ReversedTween',
			inherits:TweenDecorator,
			constructor:ReversedTween = function ReversedTween(baseTween, position){
			   ReversedTween.base.apply(this, [baseTween, position]) ;
			   this.time = baseTween.time ;
			},
			internalUpdate:function(time){
			   this.baseTween.update(this.time - time) ;
			},
			newInstance:function(){
				return new ReversedTween(this.baseTween.clone(), 0) ;
			}
		}) ;
		var RepeatedTween = Type.define({
			pkg:'tweens.decorators::RepeatedTween',
			inherits:TweenDecorator,
			basetime:undefined,
			repeatCount:2,
			constructor:RepeatedTween = function RepeatedTween(baseTween, repeatCount){
			   RepeatedTween.base.apply(this, [baseTween, 0]) ;
			   this.repeatCount = repeatCount || 2 ;
			   this.basetime = baseTween.time ;
			   this.time = this.repeatCount * this.basetime ;
			},
			internalUpdate:function(time){
			   if (time >= 0) {
				   time -= time < this.time ? this.basetime * parseInt(time / this.basetime) : this.time - this.basetime ;
			   }
			   this.baseTween.update(time) ;
			},
			newInstance:function(){
				return new RepeatedTween(this.baseTween.clone(), this.repeatCount) ;
			}
		}) ;
		var DelayedTween = Type.define({
			pkg:'tweens.decorators::DelayedTween',
			inherits:TweenDecorator,
			basetime:undefined,
			preDelay:.5,
			postDelay:.5,
			constructor:DelayedTween = function DelayedTween(baseTween, preDelay, postDelay){
			   DelayedTween.base.apply(this, [baseTween, 0]) ;
			   this.preDelay = preDelay || 0 ;
			   this.postDelay = postDelay || 0 ;
			   this.time = this.preDelay + baseTween.time + this.postDelay ;
			},
			internalUpdate:function(time){
			   this.baseTween.update(time - this.preDelay) ;
			},
			newInstance:function(){
				return new DelayedTween(this.baseTween.clone(), this.preDelay, this.postDelay) ;
			}
		}) ;
		// GROUPS
		var ParallelTween = Type.define({
			pkg:'groups::ParallelTween',
			inherits:AbstractTween,
			a:undefined,
			b:undefined,
			c:undefined,
			d:undefined,
			targets:undefined,
			constructor:ParallelTween = function ParallelTween(targets, ticker, position){
				ParallelTween.base.apply(this, [ticker, position]) ;
					
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
			}
		}) ;
		var SerialTween = Type.define({
			pkg:'groups::SerialTween',
			inherits:AbstractTween,
			a:undefined,
			b:undefined,
			c:undefined,
			d:undefined,
			targets:undefined,
			lastTime:0,
			constructor:SerialTween = function SerialTween(targets, ticker, position){
				SerialTween.base.apply(this, [ticker, position]) ;
					
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
				var d = 0, ld = 0, lt = this.lastTime, l , i , t ;
				var cur ;
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
			}
		}) ;
		// CORE.EASING
		var Physical = Type.define({
			pkg:'core.easing::Physical',
			statics:{
				defaultFrameRate:30.0,
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
			pkg:'core.easing::PhysicalAccelerate',
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
			pkg:'core.easing::PhysicalExponential',
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
			pkg:'core.easing::PhysicalUniform',
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
		
		var BetweenJS = Type.define({
			domain:Type.appdomain,
			pkg:'::BetweenJS',
			constructor:BetweenJS = function BetweenJS(){
				throw 'Not meant to be instanciated... BetweenJS::ctor' ;
			},
			statics:{
				ticker:new EnterFrameTicker() , // main and unique ticker, see class EnterFrameTicker
				updaterFactory:new UpdaterFactory(), // all in the name, generated updaters are intermede objects between tweens and their target
				getTimer:getTimer, // points towards shortened-scope getTimer method
				/*
					tween
					
					Creates a regular tween object.
					Takes in a target object, any object. Values in target such as numerals or other objects with numerals, will be able to tween.
					Passing in a 'to' and a 'from' object will set source and destination values for the tween.
					time is the duration of the tween.
					set an easing for the tween in the set of provided easings, or custom one @see CustomFunctionEasing
					
					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				tween:function tween(target, to, from, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.tween, target, to, from, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.create(target, to, from) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					to
					
					@param target Object/HtmlDomElement
					@param to Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				to:function to(target, to, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.to, target, to, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.create(target, to, undefined) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					from
					
					@param target Object/HtmlDomElement
					@param from Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				from:function from(target, from, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.from, target, from, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.create(target, undefined, from) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					apply
					
					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param time Float (default : 1.0)
					@param applyTime Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				apply:function apply(target, to, from, time, applyTime, easing){
					if(isComplex(target)) return complexTween(BetweenJS.apply, target, to, from, time, applyTime, easing) ;
					
					if(applyTime === undefined) applyTime = 1.0 ;
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.create(target, to, from) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					tween.update(applyTime) ;
					return tween ;
				},
				/*
					bezier
					
					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param controlPoint Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				bezier:function bezier(target, to, from, controlPoint, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.bezier, target, to, from, controlPoint, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createBezier(target, to, from, controlPoint) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					bezierTo
					
					@param target Object/HtmlDomElement
					@param to Object
					@param controlPoint Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				bezierTo:function bezierTo(target, to, controlPoint, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.bezierTo, target, to, controlPoint, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createBezier(target, to, undefined, controlPoint) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					bezierFrom
					
					@param target Object/HtmlDomElement
					@param from Object
					@param controlPoint Object
					@param time Float (default : 1.0)
					@param easing Easing (default : Linear.easeNone)
					
					@return TweenLike Object
				*/
				bezierFrom:function bezierFrom(target, from, controlPoint, time, easing){
					if(isComplex(target)) return complexTween(BetweenJS.bezierFrom, target, from, controlPoint, time, easing) ;
					
					var tween = new ObjectTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createBezier(target, undefined, from, controlPoint) ;
					tween.time = time || 1.0 ;
					tween.easing = easing || Linear.easeNone ;
					return tween ;
				},
				/*
					physical
					
					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param easing Easing (default : Physical.exponential())
					
					@return TweenLike Object
				*/
				physical:function physical(target, to, from, easing){
					if(isComplex(target)) return complexTween(BetweenJS.physical, target, to, from, easing) ;
					
					var tween = new PhysicalTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, from, easing || Physical.exponential()) ;
					return tween ;
				},
				/*
					physicalTo
					
					@param target Object/HtmlDomElement
					@param to Object
					@param easing Easing (default : Physical.exponential())
					
					@return TweenLike Object
				*/
				physicalTo:function physicalTo(target, to, easing){
					if(isComplex(target)) return complexTween(BetweenJS.physicalTo, target, to, easing) ;
					
					var tween = new PhysicalTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, undefined, easing || Physical.exponential()) ;
					return tween ;
				},
				/*
					physicalFrom
					
					@param target Object/HtmlDomElement
					@param from Object
					@param easing Easing (default : Physical.exponential())
					
					@return TweenLike Object
				*/
				physicalFrom:function physicalFrom(target, from, easing){
					if(isComplex(target)) return complexTween(BetweenJS.physicalFrom, target, from, easing) ;
					
					var tween = new PhysicalTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createPhysical(target, undefined, from, easing || Physical.exponential()) ;
					return tween ;
				},
				/*
					physicalApply
					
					@param target Object/HtmlDomElement
					@param to Object
					@param from Object
					@param applyTime Float (default : 1.0)
					@param easing Easing (default : Physical.exponential())
					
					@return TweenLike Object
				*/
				physicalApply:function physicalApply(target, to, from, applyTime, easing){
					if(isComplex(target)) return complexTween(BetweenJS.physicalApply, target, to, from, applyTime, easing) ;
					
					if(applyTime === undefined) applyTime = 1.0 ;
					var tween = new PhysicalTween(BetweenJS.ticker) ;
					tween.updater = BetweenJS.updaterFactory.createPhysical(target, to, from, easing || Physical.uniform()) ;
					tween.update(applyTime) ;
					return tween ;
				},
				/*
					parallel
					
					@param [tween TweenLike, ...]
					
					@return TweenLike Object
				*/
				parallel:function parallel(tween){
					return BetweenJS.parallelTweens(sl.call(arguments)) ;
				},
				/*
					parallelTweens
					
					@param tweens Array[TweenLike]
					
					@return TweenLike Object
				*/
				parallelTweens:function parallelTweens(tweens){
					return new ParallelTween(tweens, BetweenJS.ticker, 0) ;
				},
				/*
					serial
					
					@param [tween TweenLike, ...]
					
					@return TweenLike Object
				*/
				serial:function serial(tween){
					return BetweenJS.serialTweens(sl.call(arguments)) ;
				},
				/*
					serialTweens
					
					@param tweens Array[TweenLike]
					
					@return TweenLike Object
				*/
				serialTweens:function serialTweens(tweens){
					return new SerialTween(tweens, BetweenJS.ticker, 0) ;
				},
				/*
					reverse
					
					@param tween TweenLike
					@param reversePosition Float (default : 0.0)
					
					@return TweenLike TweenDecorator Object
				*/
				reverse:function reverse(tween, reversePosition){
					if(reversePosition === undefined) reversePosition = false ;
					var pos = reversePosition !== undefined ? tween.time - tween.position : 0.0 ;
					if (tween instanceof ReversedTween) {
						return new TweenDecorator(tween.baseTween, pos) ;
					}
					return new ReversedTween(tween, pos) ;
				},
				/*
					repeat
					
					@param tween TweenLike
					@param repeatCount Integer (default : 2)
					
					@return TweenLike TweenDecorator Object
				*/
				repeat:function repeat(tween, repeatCount){
					return new RepeatedTween(tween, repeatCount) ;
				},
				/*
					repeat
					
					@param tween TweenLike
					@param scale Float (percent, default : 1)
					
					@return TweenLike TweenDecorator Object
				*/
				scale:function scale(tween, scale){
					return new ScaledTween(tween, scale) ;
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
					if(begin === undefined) begin = 0 ;
					if(end === undefined) end = 1 ;
					if(isPercent === undefined) isPercent = false ;
					if(isPercent){
						begin = tween.time * begin ;
						end = tween.time * end ;
					}
					if (begin > end) {
						return new ReversedTween(new SlicedTween(tween, end, begin), 0) ;
					}
					
					return new SlicedTween(tween, begin, end) ;
				},
				/*
					delay
					
					@param tween TweenLike
					@param delay Float (default : 0)
					@param postDelay Float (default : 0)
					
					@return TweenLike TweenDecorator Object
				*/
				delay:function delay(tween, delay, postDelay){
					return new DelayedTween(tween, delay || 0, postDelay || 0) ;
				},
				/*
					addChild
					
					@param target HtmlDomElement
					@param parent HtmlDomElement
					
					@return TweenLike AbstactActionTween Object
				*/
				addChild:function addChild(target, parent){
					if(isComplex(target)) return complexTween(BetweenJS.addChild, target, parent) ;
					
					return new AddChildAction(BetweenJS.ticker, target, parent) ;
				},
				/*
					removeFromParent
					
					@param target HtmlDomElement
					@param parent HtmlDomElement
					
					@return TweenLike AbstactActionTween Object
				*/
				removeFromParent:function removeFromParent(target){
					if(isComplex(target)) return complexTween(BetweenJS.removeFromParent, target) ;
					
					return new RemoveFromParentAction(BetweenJS.ticker, target) ;
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
				func:function func(ffunc, params, useRollback, rollbackFunc, rollbackParams){
					return new FunctionAction(BetweenJS.ticker, ffunc, params, useRollback, rollbackFunc, rollbackParams) ;
				},
				/*
					timeout
					
					@param duration Float
					@param func Function
					@param params Array
					
					@return TweenLike AbstactActionTween Object
				*/
				timeout:function timeout(duration, func, params){
					var uid = getTimer() ;
					var tw = new TimeoutAction(BetweenJS.ticker, duration, func, params) ;
					tw.uid = uid ;
					return (cacheTimeout[uid] = tw) ;
				},
				clearTimeout:function clearTimeout(uid){
					var cc = cacheTimeout[uid] ;
					delete cacheTimeout[uid] ;
					return cc.stop() ;
				},
				/*
					interval
					
					@param timer Integer
					@param func Function
					@param params Array
					
					@return TweenLike AbstactActionTween Object
				*/
				interval:function interval(timer, func, params){
					var uid = getTimer() ;
					var tw = new IntervalAction(BetweenJS.ticker, timer, func, params) ;
					tw.uid = uid ;
					return (cacheInterval[uid] = tw) ;
				},
				clearInterval:function clearInterval(uid){
					var cc = cacheInterval[uid] ;
					delete cacheInterval[uid] ;
					return cc.stop() ;
				},
				getTweensOf:function getTweensOf(target){
					
					var t = BetweenJS.ticker ;
					var all = t.all ;
					trace('---------------------')
					for(var s in all){
						trace(s, all[s])
					}
				},
				findBaseTweens:function findBaseTweens(ll, target){
				   var arr = [] ;
				   
				   // trace(ll)
				   
				   
				   return arr ;
				}
			}
		}) ;
		
		Pkg.write('easings', function(path){
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
				constructor:Custom = function Custom(){
				},
				domain:Type.appdomain,
				statics:{
					func:function func(f){
						return new Ease(f) ;
					}
				}
			})
		})
		
	})})()
) ;

