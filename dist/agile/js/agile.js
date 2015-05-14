/*
*	Agile Lite 移动前端框架
*	Version	:	1.0.2 beta
*	Author	:	nandy007
*   License MIT
*/
var A = (function($){
	var Agile = function(){
		this.$ = $;
		this.options = {
			version : '1.0.2',
			clickEvent : ('ontouchstart' in window)?'tap':'click',
			agileReadyEvent : 'agileready',
			readyEvent : 'ready', //宿主容器的准备事件，默认是document的ready事件
			backEvent : 'backmenu', //宿主容器的返回按钮
			complete : false, //是否启动完成
			crossDomainHandler : null, //跨域请求的处理类
			showPageLoading : false, //ajax默认是否有loading界面
			viewSuffix : 'html', //加载静态文件的默认后缀
			toastDuration : 2000, //toast显示时间
			lazyloadPlaceholder : '' //懒人加载默认图片
		};
		
		this.pop = {
			hasAside : false,
			hasPop : false
		};
	};
	
	var _launchMap = {};
	
	/**
     * 注册Agile框架的各个部分，可扩充
     * @param {String} 控制器的唯一标识
     * @param {Object} 任意可操作的对象，建议面向对象变成返回的对象
     */
	Agile.prototype.register = function(key, obj){
		//if(this[key]) return false;
		this[key] = obj;
		if(obj.launch){
			_launchMap[key] = obj.launch;
		}
	};
	
	var _doLaunch = function(){
		for(var k in _launchMap){
			_launchMap[k]();
		}
		A.options.complete = true;
		$(document).trigger(A.options.agileReadyEvent);
	};
	
	/**
     * 启动Agile
     * @param {Object} 要初始化的一些参数
     */
	Agile.prototype.launch = function(opts){
		if(A.options.complete==true) return;
		$.extend(this.options, opts);
		var _this = this;
		if($(document)[this.options.readyEvent]){
			$(document)[this.options.readyEvent](_doLaunch);
		}else{
			$(document).on(this.options.readyEvent, _doLaunch);
		}
	};
	return new Agile();
})(window.Zepto||jQuery);

//控制器
(function($){

	/**
     * 控制器的基本结构，形如{key:{selector:'控制器选择器'，默认为body',handler:function($trigger){}}}
     * selector为选择器，handler为处理函数
     * @private
     */
	var _controllers = {
		default : {//默认控制器
			selector : '[data-toggle="view"]',
			handler : function(hash, el){				
				$el = $(el);				
				var toggleType = $el.data('toggle');
				var urlObj = A.util.parseURL(hash);
				var hashObj = urlObj.getHashobject();				
				var controllerObj = _controllers[toggleType]||{};				
				var $target = $(hashObj.tag);
				var $container = $(controllerObj.container);				
				function _event($target, $current){					
					$target.data('params', urlObj.getQueryobject());					
					var targetRole = $target.data('role')||'';					
					var show = function($el){
						if(!$el.hasClass('active')) $el.addClass('active');					
						if(!$el.attr('__init_controller__')){												
							$el.attr('__init_controller__', true);
							$el.trigger(targetRole+'load');
						}													
						$el.trigger(targetRole+'show');
					};
					
					var hide = function($el){
						$el.removeClass('active').trigger(targetRole+'hide');
					};
					if(controllerObj.isToggle){						
						if($target.hasClass('active')){
							hide($target);
						}else{
							show($target);
						}
						return;
					}

					show($target);
					if($current&&$current.length>0) {
						hide($current);
					}
				}
				
				function _setDefaultTransition($el){
					var targetTransition = $el.data('transition')||controllerObj.transition;
					if(targetTransition) $el.data('transition', targetTransition);
				};
				
				function _next(){														
					var targetRole = $target.data('role');
					var toggleSelector = targetRole?'[data-role="'+targetRole+'"].active':'.active';
					if($target.hasClass('active')){
						_event($target);
						controllerObj.complete&&controllerObj.complete($target, {result:'thesame'});
					}else{
						var $current = $target.siblings(toggleSelector);
						_setDefaultTransition($current);_setDefaultTransition($target);
						A.anim.change($current, $target, false, function(){				
							_event($target, $current);
						});	
						controllerObj.complete&&controllerObj.complete($target, {result:'success'});
					}
				}
				
				if($target.length==0){
					if($container.length==0){
						controllerObj.complete&&controllerObj.complete($target, {result:'nocontainer'});
						return;
					};
										
					A.util.getHTML(urlObj.getURL(), function(html){
						if(!html){
							controllerObj.complete&&controllerObj.complete($target, {result:'requesterror'});
							return;
						}
						$target = $(html);
						$container.append($target);
						_next();
					});
				}else{
					_next();
				}

			}
		},
		html : {//多页模式请复写此控制器
			selector : '[data-toggle="html"]',
			handler : function(hash){
				var urlObj = A.util.parseURL(hash);
				location.href = urlObj.getURL();
			}
		},
		section : {
			selector : '[data-toggle="section"]',
			container : '#section_container',
			transition : 'slide',
			history : [],
			complete : function($target, msg){
				var _add2History = function(hash,noState){
			    	var hashObj = A.util.parseURL(hash).getHashobject();
			    	var _history = _controllers.section.history;
			    	if(_history.length==0||(_history.length>0&&$(_history[0].tag).length==0)){
			    		noState = true;
			    	}
					
			        if(noState){//不添加浏览器历史记录
			            _history.shift(hashObj);
			            window.history.replaceState(hashObj,'',hash);
			        }else{
			            window.history.pushState(hashObj,'',hash);
			        }
			        
			        _history.unshift(hashObj);
			    };
				var hash = '#'+$target.attr('id');
				msg = msg||{};
				if(msg.result=='thesame'){
					_add2History(hash ,true);
				}else if(msg.result=='success'){
					_add2History(hash ,false);
				}
			}
		},
		article : {
			selector : '[data-toggle="article"]',
			container : '[data-role="section"].active'
		},
		modal : {
			selector : '[data-toggle="modal"]',
			container : 'body',
			isToggle : true
		},
		aside : {
			selector : '[data-toggle="aside"]',
			container : '#aside_container',
			handler : function(hash){
				if(hash){
					A.Aside.show(hash);
				}else{
					A.Aside.hide();
				}
				
			}
		},
		back : {
			selector : '[data-toggle="back"]',
			handler : function(hash){
				if(hash){
					$(document).trigger(A.options.backEvent);
					return;
				}
				var _history = _controllers.section.history;
				
				var locationObj = A.util.parseURL(location.href);
				if('#'+locationObj.getFragment()==_history[0].tag){
					return;
				}

				var $current = $(_history.shift().tag);
		    	var $target = $(_history[0].tag);	
		        A.anim.change($current, $target, true, function(){		        			       	       	
		        	var targetRole = $target.data('role');
		        	$target.addClass('active').trigger(targetRole+'show');
					$current.removeClass('active').trigger(targetRole+'hide');
		        });
			}
		}
	};	
		
	var controller = {};//定义控制器
	/**
     * 添加控制器
     * @param {Object} 控制器对象，形如{key:{selector:'',handler:function(){}}}
     */
	controller.add = function(c){	
		$.extend(_controllers, c);
	};
	
	/**
     * 获取全部控制器
     * @param {String} 控制器的key，如果有key则返回当前key的控制器，没有key则返回全部控制器
     */
	controller.get = function(key){
		return key?_controllers[key]:_controllers;
	};	
	
	/**
     * 为所有控制器创建调用方法
     * @private 只能初始化一次，启动后添加的不生效
     */
	var _makeHandler = function(){

		for(var k in _controllers){			
			(function(k){
				//定义JS调用函数
				controller[k] = function(hash, el){					
					var toggleType = k;
					var $el = el?$(el):$('<a data-toggle="'+k+'" href="'+hash+'"></a>');
					var curr = _controllers[toggleType]?(_controllers[toggleType].handler?toggleType:'default'):'default';
					_controllers[curr].handler(hash, $el);
				};
				//定义点击触发事件
				$(document).on(A.options.clickEvent, _controllers[k]['selector'], function(){
					var k = $(this).data('toggle');
					var hash = $(this).attr('href')||'#';
					controller[k](hash, $(this));
					return false;
				});
			})(k);
		}
	};
	
	/**
     * 启动控制器，如果需要在启动agile的时候启动，则函数名必须叫launch
     */
	controller.launch = function(){
		_makeHandler();
	};

	A.register('Controller', controller);
})(A.$);

//组件
(function($){
	var component = {};
	
	var _components = {
		default : {
			selector : '[data-role="component"]',
			handler : function(el, roleType){
				var $el = $(el);
				if($el.hasClass('active')){
					return;
				}
				var componentObj = _components[roleType]||{};
				var $current;
				var curSelector = '[data-role="'+roleType+'"].active';
				if(componentObj.container){
					$current = $el.parents(componentObj.container).first().find(curSelector);
				}else{
					$current = $el.siblings(curSelector+'.active');
				}
				$el.addClass('active');
				$current.removeClass('active');
			}
		},
		tab : {
			selector : '[data-role="tab"]',
			handler : function(el, roleType){
				var $el = $(el);
				var toggleType = $el.data('toggle');
				if(toggleType=='section'||toggleType=='modal'||toggleType=='html'){
					return;
				}
				_components['default'].handler(el, roleType);
			}
		},
		scroll : {
			selector : '[data-role="article"].active',
			event : 'articleload',
			handler : function(el, roleType){
				var onPullDown = function(){
					
				};
				var onPullUp = function(){
					
				};
				
				var options = {
					verticle : {},
					horizontal : {
						scrollbars : false,
						scrollX : true,
						scrollY : false
					},
					scroll : {
						scrollX : true,
						scrollY : true
					},
					pulldown : {
						onPullDown : onPullDown
					},
					pullup : {
						onPullUp : onPullUp
					},
					pull : {
						onPullDown : onPullDown,
						onPullUp : onPullUp
					}
				};

				var _doScroll = function($scroll){
					var opts = options[$scroll.data('scroll')];
					A.Scroll('#'+$scroll.attr('id'), opts).refresh();
				};
				
				var _doRefresh = function($el){
					A.Refresh('#'+$el.attr('id'), options[$el.data('scroll')]).refresh();
				};
				
				var $el = $(el||this);
				var scrollType = $el.data('scroll');
				
				if(scrollType=='verticle'||scrollType=='horizontal'||scrollType=='scroll') _doScroll($el);	
							
				if(scrollType=='pulldown'||scrollType=='pullup'||scrollType=='pull') _doRefresh($el);
				
				var scrolls = $el.find('[data-scroll="verticle"],[data-scroll="horizontal"],[data-scroll="scroll"]');
				for(var i=0;i<scrolls.length;i++){
					_doScroll($(scrolls[i]));
				}
				
				scrolls = $el.find('[data-scroll="pulldown"],[data-scroll="pullup"],[data-scroll="pull"]');
				for(var i=0;i<scrolls.length;i++){
					_doRefresh($(scrolls[i]));
				}
			}
		},
		formcheck : {
			selector : '[data-role="article"].active',
			event : 'articleload',
			handler : function(el, roleType){
				var $el = $(el);
				
				var _doInit = function($el){
					$el.on(A.options.clickEvent, function(e){
						if(e.target.tagName.toLowerCase()=='input'){
							return true;
						}
			    		try{
			        		var checkObj = $el.find('input')[0];
			        		checkObj.checked = !checkObj.checked;
			    		}catch(e){}
			    		return false;
			    	});
				};
				
				if($el.data('role')=='select'||$el.data('role')=='checkbox'||$el.data('role')=='radio'){
					_doInit($el);
				}else{
					var els = $el.find('[data-role="select"],[data-role="checkbox"],[data-role="radio"]');
					for(var i=0;i<els.length;i++){
						_doInit($(els[i]));
					}
				}
			}
		},
		toggle : {
			selector : '[data-role="article"].active',
			event : 'articleload',
			handler : function(el, roleType){
				var $el = $(el);
				var _doToggle = function($el){
					
					if($el.find('div.toggle-handle').length>0){//已经初始化
			            return;
			        }
			        var name = $el.attr('name');
			        var onValue = $el.data('on-value');
			        onValue = typeof onValue=='undefined'?'':onValue;
			        var offValue = $el.data('off-value');
			        offValue = typeof offValue=='undefined'?'':offValue;
			        //添加隐藏域，方便获取值
			        if(name){
			            $el.append('<input type="hidden" name="'+name+'" value="'+($el.hasClass('active')?onValue:offValue)+'"/>');
			        }
			        $el.append('<div class="toggle-handle"></div>');
			        $el.on(A.options.clickEvent, function(){
			            var $t = $(this),v = $t.hasClass('active')?offValue:onValue;
			            $t.toggleClass('active').trigger('toggle',[v]);//定义toggle事件
			            $t.find('input').val(v);
			            return false;
			        });
				};
				
				if($el.data('role')=='toggle'){
					_doToggle($el);
				}else{
					var toggles = $el.find('[data-role="toggle"]');
					for(var i=0;i<toggles.length;i++){
						_doToggle($(toggles[i]));
					}
				}
			}
		},
		'lazyload' : {
			selector : '[data-role="article"].active',
			event : 'articleload',
			handler : function(el, roleType){
				var $el = $(el);

		    	var _doLazyload = function($el){
		    		var placeholder = $el.attr('placeholder')||A.options.lazyloadPlaceholder;
			    	if(!$el.attr('src')&&placeholder) $el.attr('src', placeholder);
					var source = A.util.script($el.data('source'));
			    	var eTop = $el.offset().top;//元素的位置
			    	var validateDistance = 100;
			    	var winHeight = $(window).height()+validateDistance;
			    	if(eTop<0||eTop>winHeight) return;
			    	
			    	var type = $el.data('type');
			    	if(type=='base64'){
			    		A.ajax({
			    			url : source,
			    			success : function(data){
			    				_injectImg($el, data);
			    			},
			    			isBlock : false
			    		});
			    	}else{
			    		var img = new Image();
			    		img.src = source;
			    		if(img.complete) {
			    			_injectImg($el, source);
			    			img = null;
			    	    }else{
			    	    	img.onload = function(){
			    				_injectImg($el, source);
			    				img = null;
			        		};
			
			    	    }
			    	}
		    	};
		    	
		    	var _injectImg = function($el, data){
		    		if(!$el.data('source')) return;
		    		A.anim.run($el,'fadeOut', function(){
		    			$el.css('opacity', '0');		    				    			
		    			$el[0].onload = function(){			
		    				A.anim.run($el,'fadeIn', function(){
		    					$el.css('opacity', '1');
		    					A.Component.scroll($el.closest('[data-scroll]'));
		    					$el.removeAttr('data-source');
		    				});
		        		};
		        		$el.attr('src', data);	
		    		});
		    	};

		    	if($el.data('source')){
		    		_doLazyload($el);
		    	}else{
		    		var lazyloads = $el.find('img[data-source]');
		    		for(var i=0;i<lazyloads.length;i++){
		    			_doLazyload($(lazyloads[i]));
		    		}
		    	}		    	
			}
		}
	};
	
	/**
     * 添加组件
     * @param {Object} 控制器对象，形如{key:{selector:'',handler:function(){}}}
     */
	component.add = function(c){
		$.extend(_components, c);
	};
	
	/**
     * 获取全部组件
     * @param {String} 组件的key，如果有key则返回当前key的组件，没有key则返回全部组件
     */
	component.get = function(key){
		return key?_components[key]:_components;
	};
	
	/**
     * 初始化组件
     * @private 仅能调用一次
     */
	_makeHandler = function(){		
		for(var k in _components){		
			(function(k){	
				//定义JS调用函数
				component[k] = function(hash){
					var roleType = k;
					var curr = _components[roleType]?(_components[roleType].handler?roleType:'default'):'default';
					_components[curr].handler(hash, roleType);
				};
				//定义触发事件	
				if(!_components[k]['selector']) return;
				$(document).on(_components[k].event||A.options.clickEvent, _components[k]['selector'], function(){	
								
					var curr = _components[k].handler?k:'default';				
					_components[curr].handler(this, k);			
					return false;		
				});
				
			})(k);
		}

	};
	
	//启动组件
	component.launch = function(){
		_makeHandler();
	};
	
	A.register('Component', component);
})(A.$);

//动画封装
(function($){
	
	var anim = {};
	
	anim.classes = {//形如：[[currentOut,targetIn],[currentOut,targetIn]]
		empty : [['empty','empty'],['empty','empty']],
		slide : [['slideLeftOut','slideLeftIn'],['slideRightOut','slideRightIn']],
		cover : [['','slideLeftIn'],['slideRightOut','']],
		slideUp : [['','slideUpIn'],['slideDownOut','']],
		slideDown : [['','slideDownIn'],['slideUpOut','']],
		popup : [['','scaleIn'],['scaleOut','']],
		flip : [['slideLeftOut','flipOut'],['slideRightOut','flipIn']]
	};
	
	anim.addClass = function(cssObj){
		$.extend(anim.classes, cssObj||{});
	};
	
	/**
     * 添加控制器
     * @param {Object} 要切换动画的jQuery对象
     * @param {String} 动画样式
     * @param {Number} 动画时间
     * @param {Function} 动画结束的回调函数
     */
	anim.run = function($el, cls, cb){
		var $el = $($el);

		if($el.length==0){
			cb&&cb();
			return;
		}
		if(typeof cls=='object'){
			$el.animate(cls,250,'linear',function(){ cb&&cb();});
			return;
		}
		cls = (cls||'empty')+' anim';
		$el.addClass(cls).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',function(){			
			$el.removeClass(cls);
			cb&&cb();
		});
	};
	
	/**
     * 添加控制器
     * @param {String} 要切换的当前对象selector
     * @param {String} 要切换的目标对象selector
     * @param {Boolean} 是否返回
     * @param {Function} 动画结束的回调函数
     */
	anim.change = function(current, target, isBack ,callback){
		
		var $current = $(current);
		var $target = $(target);
		
		if($current.length+$target.length==0){
			callback&&callback();
			return;
		}
		
		var targetTransition = $target.data('transition');
		if(!anim.classes[targetTransition]){
			callback&&callback();
			return;
		}
		var transitionType = anim.classes[targetTransition][isBack?1:0];
		anim.run($current, transitionType[0]);							
		anim.run($target, transitionType[1], function(){	
			callback&&callback();
		});
	};
	
	A.register('anim', anim);

})(A.$);

//ajax封装
(function($){
	
	//用法继承jQuery的$.ajax
	var ajax = function(opts){
		
		var success = opts.success;
		var error = opts.error;
		
		var random = '__ajax_random__='+Math.random();
    	opts.url += (opts.url.split(/\?|&/i).length==1?'?':'&')+random;

		var _success = function(data){
			success&&success(data);
		};
		var _error = function(data){
			error&&error();
		};

		opts.success = _success;
		opts.error = _error;
		
		$.ajax(opts);
	};
	
	A.register('ajax', ajax);
})(A.$);

(function($){
	var util = {};
	
	util.script = function(str){	
		str = (str||'').trim();
		var tag = false;
		
    	str = str.replace(/\$\{([^\}]*)\}/g, function(s, s1){
    		try{
    			tag = true;
    			return eval(s1.trim());
    		}catch(e){
    			return '';
    		}

    	});

    	return tag?util.script(str):str;
    };	
	
	util.provider = function(str, data){
    	str = (str||'').trim();
    	return str.replace(/\$\{([^\}]*)\}/g, function(s, s1){   		
    		return data[s1.trim()]||'';
    	});
    };
    
	var URLParser = function(url) {

	    this._fields = {
	        'Username' : 4,   //用户
	        'Password' : 5,   //密码
	        'Port' : 7,       //端口
	        'Protocol' : 2,   //协议
	        'Host' : 6,       //主机
	        'Pathname' : 8,   //路径
	        'URL' : 0,
	        'Querystring' : 9,//查询字符串
	        'Fragment' : 10,   //锚点
	        'Filename' : -1,//文件名,不含后缀
	        'Queryobject' : -1, //查询字串对象
	        'Hashobject' : -1 //hash对象
	    };

	    this._values = {};
	    this._regex = null;
	    this.version = 0.1;
	    this._regex = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/;
	    for(var f in this._fields)
	    {
	        this['get' + f] = this._makeGetter(f);
	    }

	    if (typeof url != 'undefined')
	    {
	        this._parse(url);
	    }
	};
	URLParser.prototype.setURL = function(url) {
	    this._parse(url);
	};

	URLParser.prototype._initValues = function() {
	    for(var f in this._fields)
	    {
	        this._values[f] = '';
	    }
	};

	URLParser.prototype._parse = function(url) {
	    this._initValues();
	    var r = this._regex.exec(url);

	    if (!r) throw "DPURLParser::_parse -> Invalid URL";

	    for(var f in this._fields) if (typeof r[this._fields[f]] != 'undefined')
	    {
	        this._values[f] = r[this._fields[f]];
	    }
	};
	URLParser.prototype._makeGetter = function(field) {
	    return function() {
	    	if(field=='Filename'){
	    		var path = this._values['URL'];
	    		return path.substring((path.lastIndexOf('/')||-1)+1,path.indexOf('.')||path.indexOf('?')||path.indexOf('#')||path.length);
	    	}else if(field=='Queryobject'){
	    		var query = this._values['Querystring']||'';
	            var seg = query.split('&');
	            var obj = {};
	            for(var i=0;i<seg.length;i++){
	                var s = seg[i].split('=');
	                obj[s[0]] = s[1];
	            }
	            return obj;
	    	}else if(field=='Hashobject'){
	    		return {
		        	url : this.getURL(),
		            hash : '#'+(this.getFragment()||this.getFilename()),
		            tag : '#'+(this.getFragment()||this.getFilename()),
		            query : this.getQuerystring(),
		            param : this.getQueryobject()
		       };
	    	}
	    	
	        return this._values[field];
	    };
	};
	
	//url解析类
	util.parseURL = function(url){
		url = util.script(url||'');
		if(url.indexOf('#')==0){
			url = url.replace('#','')+(A.options.viewSuffix?'.'+A.options.viewSuffix:'');
		}	

		return new URLParser(url);
   	};
   	
   	util.isCrossDomain = function(url){
    	if(!url||url.indexOf(':')<0) return false;

    	var urlOpts = util.parseURL(url);

    	if(!urlOpts.getProtocol()) return false;

    	return !((location.protocol.replace(':','')+location.host)==(urlOpts.getProtocol()+urlOpts.getHost()+':'+urlOpts.getPort()));
    };

    util.checkBoolean = function(){
    	var result = false;
    	for(var i=0;i<arguments.length;i++){
    		if(typeof arguments[i]=='boolean'){
    			return arguments[i];
    		}
    	}
    	return result;
    };
	
	var _isCrossDomain = function(url){
    	if(!url||url.indexOf(':')<0) return false;

    	var urlOpts = A.util.parseURL(url);

    	if(!urlOpts.getProtocol()) return false;

    	return !((location.protocol.replace(':','')+location.host)==(urlOpts.getProtocol()+urlOpts.getHost()+':'+urlOpts.getPort()));
    };
    

    /*
     * $.ajax函数封装，判断是否有跨域，并且设置跨域处理函数
     * @param ajax json对象，进行简单统一处理，如果需要完整功能请使用$.ajax
     * */
    util.ajax = function(opts){
    	if(!opts||!opts.url) return;
    	opts.url = util.script(opts.url);
    	var _isBlock = util.checkBoolean(opts.isBlock,A.options.showPageLoading);

    	opts.dataType = (opts.dataType||'text').toLowerCase();
		if(_isBlock) A.showMask();
    	var ajaxData = {
                url : opts.url,
                timeout : 20000,
                type : opts.type||'get',
                dataType : opts.dataType,
                success : function(html){
                	if(_isBlock) A.hideMask();
                    opts.success && opts.success(opts.dataType=='text'?util.script(html):html);
                },
                error : function(html){
                	if(_isBlock) A.hideMask();
                	opts.error && opts.error(null);
                }
           };

    	var isCross = _isCrossDomain(opts.url);

    	var handler = A.ajax;
		
    	if(isCross){
    		ajaxData.dataType = A.options.crossDomainHandler?ajaxData.dataType:'jsonp';
    		handler = A.options.crossDomainHandler||handler;
    	}
    	if(ajaxData.dataType.toLowerCase()=='jsonp'){
    		ajaxData.jsonp = opts.jsonp||'agilecallback';
    	}

    	if(_isBlock) A.showMask();

    	handler(ajaxData);
    };
    
    /*
     * $.ajax函数封装，不允许跨域
     * @param url地址，必选
     * @param callback回调函数，可选
     * 
     * */
    util.getHTML = function(url, callback){
    	A.ajax({
    		url : url,
    		type : 'get',
    		dataType : 'text',
    		success : function(html){
    			callback&&callback(A.util.script(html||''));
    		},
    		error : callback
    	});
    };
    
    
    util.readyAlarm = function($inner,targetName,eventName){
	
		var _return = {};
		
		for(var k in $inner){
			if(typeof $inner[k]!='function'){
				_return[k] = $inner[k];
				continue;
			}
			_return[k] = (function(k){
				return function(){
							try{
								return $inner[k].apply(this, arguments);
							}catch(e){
								A.alert('提示', '请在'+(eventName||A.options.readyEvent)+'之后调用'+targetName+'.'+k+'桥接函数');
							}						
						};
			})(k);
		}
		return _return;
	};

    A.register('util', util);

})(A.$);

(function($){
	
	var _index_key_ = {};
	
	var scroll = function(selector, opts){
		
		var $el = $(selector);
		var eId = $el.attr('id');
		if($el.length==0||!eId){
			return null;
		}else if(_index_key_[eId]){
			return _index_key_[eId];
		}
		
		var $scroll;
		
		var costomOpts = {
			scrollTop : 'scrollTop',
			scrollBottom : 'scrollBottom'
		};
		
		var options = {
			mouseWheel: true,
			scrollbars : 'custom',
			fadeScrollbars : true
		};
		$.extend(options, $el.data('scroll-options')||{});
		$.extend(options, opts||{});

		$scroll = new IScroll(selector, options);
		$scroll.on('scrollEnd' , function(){
			if(this.y==0){
            	this._execEvent(costomOpts.scrollTop);//自定义事件滑动到顶部
            }else if(this.y==this.maxScrollY){
            	this._execEvent(costomOpts.scrollBottom);//自定义事件滑动到底部
            }
                      		
			A.Component.lazyload($el);//初始化懒人加载
		});
		
		_index_key_[eId] = $scroll;

		$scroll.on('destroy', function(){
			delete _index_key_[eId];
		});

		$el.trigger('scrollInit');//自定义scroll初始化事件
		

		return _index_key_[eId];
	};

  	
    
    A.register('Scroll', scroll);
	
	
})(A.$);

(function($){
	
	var _index_key_ = {};
	
	/*
     * refresh上拉下拉刷新
     * @param selector，scroll容器的id选择器
     * @param 选项，目前仅支持onPullDown事件和onPullUp事件，{onPullDown:function(){},onPullUp:function(){}}
     * 
     * */
    function refresh(selector, opts) {

    	var $el = $(selector);
    	var eId = $el.attr('id'); 	
    	if(_index_key_[eId]) return _index_key_[eId];
    	
		var $scroller = $el.children().first();
		var myScroll; 
    	var $pullDownEl, $pullDownL;  
    	var $pullUpEl, $pullUpL; 
    	var pullDownHeight, pullUpHeight; 
    	var refreshStep = -1;//加载状态-1默认，0显示提示下拉信息，1显示释放刷新信息，2执行加载数据，只有当为-1时才能再次加载
    	
    	var pullDownOpts = {
    		id : 'agile-pulldown',
    		iconStyle : 'agile-pulldown-icon',
    		labelStyle : 'agile-pulldown-label',
    		normalLabel : '下拉刷新',
    		releaseLabel : '释放加载',
    		refreshLabel : '加载中，请稍后',
    		normalStyle : '',
    		releaseStyle : 'release',
    		refreshStyle : 'refresh',
    		callback : null,
    		callbackEvent : 'pulldown'
    	};
    	var pullUpOpts = {
    		id : 'agile-pullup',
    		iconStyle : 'agile-pullup-icon',
    		labelStyle : 'agile-pullup-label',
    		normalLabel : '上拉刷新',
    		releaseLabel : '释放加载',
    		refreshLabel : '加载中，请稍后',
    		normalStyle : '',
    		releaseStyle : 'release',
    		refreshStyle : 'refresh',
    		callback : null,
    		callbackEvent : 'pullup'
    	};
    	
    	if(opts.onPullDown){
    		$pullDownEl = $('<div id="'+pullDownOpts.id+'"><div class="'+pullDownOpts.iconStyle+'"></div><div class="'+pullDownOpts.labelStyle+'">'+pullDownOpts.normalLabel+'</div></div>').prependTo($scroller);
	        $pullDownL = $pullDownEl.find('.'+pullDownOpts.labelStyle);   
	        pullDownHeight = $pullDownEl.height();
	        $pullDownEl.attr('class','').hide();
	        pullDownOpts.callback = opts.onPullDown;
    	}
    	
    	if(opts.onPullUp){
    		$pullUpEl = $('<div id="'+pullUpOpts.id+'"><div class="'+pullUpOpts.iconStyle+'"></div><div class="'+pullUpOpts.labelStyle+'">'+pullUpOpts.normalLabel+'</div></div>').appendTo($scroller);
	        $pullUpL = $pullUpEl.find('.'+pullUpOpts.labelStyle);   
	        pullUpHeight = $pullUpEl.height();
	        $pullUpEl.attr('class','').hide();
	        pullUpOpts.callback = opts.onPullUp;
    	}

        myScroll = A.Scroll('#'+eId, {  
			probeType: 2,//probeType：1对性能没有影响。在滚动事件被触发时，滚动轴是不是忙着做它的东西。probeType：2总执行滚动，除了势头，反弹过程中的事件。这类似于原生的onscroll事件。probeType：3发出的滚动事件与到的像素精度。注意，滚动被迫requestAnimationFrame（即：useTransition：假）。  
            bounce:true,//边界反弹  
            interactiveScrollbars:true,//滚动条可以拖动  
            shrinkScrollbars:'scale',// 当滚动边界之外的滚动条是由少量的收缩。'clip' or 'scale'.  
            click: true ,// 允许点击事件  
            keyBindings:true,//允许使用按键控制  
            momentum:true// 允许有惯性滑动  
        });  

        if(!myScroll) return null;
        //滚动时  
        myScroll.on('scroll', function(){
        	if(refreshStep==2){
        		//do nothing
        	}else if($pullDownEl && this.y > 0 && this.y < pullDownHeight){
           		$pullDownEl.show().removeClass(pullDownOpts.releaseStyle);
           		$pullDownL.html(pullDownOpts.normalLabel);  
           		refreshStep = 0;
           	}else if($pullDownEl && this.y >= pullDownHeight){
           		$pullDownEl.addClass(pullDownOpts.releaseStyle);
           		$pullDownL.html(pullDownOpts.releaseLabel);
           		refreshStep = 1;
           	}else if($pullUpEl && this.y < 0 && -this.y > -(this.maxScrollY - pullUpHeight)){
	            $pullUpEl.addClass(pullUpOpts.releaseStyle);
           		$pullUpL.html(pullUpOpts.releaseLabel); 
           		refreshStep = 1;
           	}else if($pullUpEl && this.y < 0 && -this.y > -this.maxScrollY && -this.y <= -(this.maxScrollY - pullUpHeight) ){
           		$pullUpEl.show().removeClass(pullUpOpts.releaseStyle);  
	            $pullUpL.html(pullUpOpts.normalLabel);  
	           	refreshStep = 0;
           	}
            
            if(this.y >0 && refreshStep > -1 && refreshStep < 2){
            	$pullDownEl.css('margin-top', - Math.max(pullDownHeight - this.y, 0));
            }
        }); 
        //滚动完毕  
        myScroll.on('scrollEnd', function(){
            if(refreshStep == 1){
	            if ($pullUpEl && $pullUpEl.hasClass(pullUpOpts.releaseStyle)) {  
	                $pullUpEl.removeClass(pullUpOpts.releaseStyle).addClass(pullUpOpts.refreshStyle);  
	                $pullUpL.html(pullUpOpts.refreshLabel);  
	                refreshStep = 2;  
	                pullUpOpts.callback.call(this);
	                this._execEvent(pullUpOpts.callbackEvent);
	            }else if($pullDownEl && $pullDownEl.hasClass(pullDownOpts.releaseStyle)){  	            	
	                $pullDownEl.removeClass(pullDownOpts.releaseStyle).addClass(pullDownOpts.refreshStyle);  
	                $pullDownL.html(pullDownOpts.refreshLabel);  
	                refreshStep = 2;  
	                pullDownOpts.callback.call(this);
	                this._execEvent(pullDownOpts.callbackEvent);
	            }
	            window.setTimeout(function(){
	            	if(refreshStep==2) myScroll.refresh();
	            },5000);
            }else{
            	myScroll.refresh();
            }
        });  
        
        myScroll.on('refresh', function(){

        	if(refreshStep!=-1){
	        	refreshStep = -1;	        	 
	            if($pullDownEl){
	            	$pullDownEl.attr('class','').hide();  
	            	$pullDownEl.css('margin-top', 0);
	            }	            
	            if($pullUpEl){
	            	$pullUpEl.attr('class','').hide();
	            }
        	}
        	
        });

        _index_key_[eId] = myScroll;
        
        $el.trigger('refreshInit');
        
        return _index_key_[eId];
    }
    
    A.register('Refresh', refresh);
    
})(A.$);

(function($){
	
	var _index_key_ = {};
	
	/*
     * slider滑动容器
     * @param selector，slider容器的id选择器
     * @param 选项，auto：是否自动播放|自动播放的毫秒数；dots：指示点显示的位置，center|right|left|hide；change：每次切换slider后的事件，{auto:false,dots:'right',change:function(){}}
     * 
     * */
	var slider = function(selector, opts){
		var $el = $(selector);
		var eId = $el.attr('id');
		
		if(_index_key_[eId]) return _index_key_[eId];
		
		var sliderOpts = {
			auto : false,
			change : function(){
				
			},
			dots : ''
		};
		$.extend(sliderOpts, opts);
		
		var $scroller,$slide,outWidth,slideNum,$dots;

		
		var init = function(){
			if(!$el.hasClass('active')) $el.addClass('active');
			$scroller = $el.children('.scroller');
			$slide = $scroller.children('.slide');
			outWidth = $el.parent().width();
			slideNum = $slide.length;
			$scroller.width(outWidth*slideNum);
			$slide.width(outWidth);
			$el.height()?$scroller.height($el.height()):$el.height($scroller.height());
		};
		
		var createDots = function(){
			
			$el.find('.dots').remove();
			
			var arr = [];
			arr.push('<div class="dots">');
			for(var i=0;i<slideNum;i++){
				arr.push('<div class="dotty"></div>');
			}
			arr.push('</div>');
			
			$dots = $(arr.join('')).appendTo($el).addClass(sliderOpts.dots).find('.dotty');
		};
		
		init();//第一步初始化
		createDots();//第二步创建dots

		var options = {
			scrollbars : false,
			scrollX: true,
			scrollY: false,
			momentum: false,
			snap: true,
			snapSpeed: 400,
			keyBindings: true
		};
		
		var myScroll = A.Scroll('#'+eId, options);
		
		var index = 0;
		
		myScroll.on('scrollEnd', function(){
			index = this.currentPage.pageX;
			var curSlide = $($slide.get(index));
			var curDots = $($dots.get(index));
			
			if(!curSlide.hasClass('active')){
				sliderOpts.change&&sliderOpts.change.call(this, index);
				curSlide.addClass('active').trigger('slidershow').siblings('.active').removeClass('active').trigger('sliderhide');
				curDots.addClass('active').siblings('.active').removeClass('active');
			}
		});
		
		myScroll.on('refresh', function(){
			init();
			createDots();
		});
		
		myScroll.goToPage(index, 0, options.snapSpeed);

		if(sliderOpts.auto){
			window.setInterval(function(){
				index = index==slideNum?0:index+1;
				myScroll.goToPage(index, 0, options.snapSpeed);
			}, typeof sliderOpts.auto=='boolean'?5000:sliderOpts.auto);
		}
		
		_index_key_[eId] = myScroll;
		
		return _index_key_[eId];
	};
	
	A.register('Slider', slider);
})(A.$);


(function($){
    var $asideContainer,$sectionContainer,$sectionMask;
    var init = function(){
        $asideContainer = $('#aside_container');
        $sectionContainer = $('#section_container');
        if($('#section_container_mask').length==0) $sectionMask = $('<div id="section_container_mask"></div>').appendTo('#section_container');
        //添加各种关闭事件
        $sectionMask.on(A.options.clickEvent, function(){
        	hideAsideMenu();
        	return false;
        });
		
		$sectionMask.on('swipeleft', function(e){
			var $activeAside = $('#aside_container aside.active');
			if($activeAside.data('position') == 'left'){
				hideAsideMenu();
			}
		});
		
		$sectionMask.on('swiperight', function(e){
			var $activeAside = $('#aside_container aside.active');
			if($activeAside.data('position') == 'right'){
				hideAsideMenu();
			}
		});


        $(document).on('swiperight','section.active[data-aside-left]',function(e){
        	if($(e.target).closest('[data-role="slider"]').length==0){
        		showAsideMenu($(this).data('aside-left'));
        	}
        });
        
        $(document).on('swipeleft','section.active[data-aside-right]',function(e){
        	if($(e.target).closest('[data-role="slider"]').length==0){
        		showAsideMenu($(this).data('aside-right'));
        	}
        });

    };
    /**
     * 打开侧边菜单
     * @param selector css选择器或element实例
     */
    var showAsideMenu = function(selector){
        var $aside = $(selector).addClass('active'),
            transition = $aside.data('transition'),// push overlay  reveal
            position = $aside.data('position') || 'left',
            showClose = $aside.data('show-close'),
            width = $aside.width(),
            translateX = (position=='left'?'':'-')+width+'px';
        var cssName = {
        	aside : {},
        	section : {}
        };
        cssName.aside[position] = width+'px';
        cssName.section['left'] = translateX;
        if(transition == 'overlay'){
            A.anim.run($aside, cssName.aside);
        }else if(transition == 'reveal'){
            A.anim.run($sectionContainer, cssName.section);
        }else{//默认为push
            A.anim.run($aside, cssName.aside);
            A.anim.run($sectionContainer, cssName.section);
        }

        $('#section_container_mask').show();
        A.pop.hasAside = true;
    };
    /**
     * 关闭侧边菜单
     * @param duration {int} 动画持续时间
     * @param callback 动画完毕回调函数
     */
    var hideAsideMenu = function(duration,callback){
        var $aside = $('#aside_container aside.active'),
            transition = $aside.data('transition'),// push overlay  reveal
            position = $aside.data('position') || 'left',
            translateX = position == 'left'?'-100%':'100%';

        var _finishTransition = function(){
            $aside.removeClass('active');
            A.pop.hasAside = false;
            callback && callback.call(this);
        };
        
        var cssName = {
        	aside : {},
        	section : {}
        };
        cssName.aside[position] = 0;
        cssName.section['left'] = 0;
        
        if(transition == 'overlay'){
            A.anim.run($aside, cssName.aside, _finishTransition);
        }else if(transition == 'reveal'){
            A.anim.run($sectionContainer, cssName.section, _finishTransition);
        }else{//默认为push
            A.anim.run($aside, cssName.aside);
            A.anim.run($sectionContainer, cssName.section, _finishTransition);
        }
        $('#section_container_mask').hide();
    };  
    
    A.register('Aside', {
        init : init,
        show : showAsideMenu,
        hide : hideAsideMenu
    });
})(A.$);

/**
 * 弹出框组件
 */
(function($){
    var _popup,_mask,transition,clickMask2close,     
        ANIM = {
            top : ['slideDownIn','slideUpOut'],
            bottom : ['slideUpIn','slideDownOut'],
            center : ['bounceIn','bounceOut'],
            left : ['slideRightIn','slideLeftOut'],
            right : ['slideLeftIn','slideRightOut'],
            'default' : ['fadeIn','fadeOut']
        },
        TEMPLATE = {
            alert : '<div class="popup-title">${title}</div><div class="popup-content">${content}</div><div id="popup_btn_container"><a data-toggle="closePopup" class="agile-icon agile-popup-alert-ok">${ok}</a></div>',
            confirm : '<div class="popup-title">${title}</div><div class="popup-content">${content}</div><div id="popup_btn_container"><a class="cancel agile-icon agile-popup-alert-cancel">${cancel}</a><a class="agile-icon agile-popup-alert-ok">${ok}</a></div>',
            loading : '<i class="agile-icon agile-popup-spinner"></i><p>${title}</p>'
        };

    /**
     * 全局只有一个popup实例
     * @private
     */
    var _init = function(){
        $('body').append('<div id="agile_popup"></div><div id="agile_popup_mask"></div>');
        _mask = $('#agile_popup_mask');
        _popup = $('#agile_popup');
        _subscribeEvents();
    };

    var _show = function(opts){
    	var options = {
    		html : '',//位于pop中的内容
    		pos : 'default',//pop显示的位置和样式,default|top|bottom|center|left|right|custom
    		css : {},//自定义的样式
    		isBlock : false,//是否禁止关闭，false为不禁止，true为禁止
    		onShow : undefined, //@event 在popup内容加载完毕，动画开始前触发
            onHide : undefined, //@event 在popup隐藏后触发
            onClose : undefined //@event 在popup被手动关闭后触发 
    	};
    	$.extend(options,opts);
    	
    	clickMask2close = !options.isBlock;
    	
    	_popup.data('block', options.isBlock);
    	_popup.attr({'style':'','class':''});
    	_popup.css(options.css);
    	_popup.addClass(options.pos);
    	   	
    	transition = ANIM[options.pos];
    	
    	_mask.show();
        
        _popup.html(options.html).show();
        
        var popHeight = _popup.height();
        //显示获取容器高度，调整至垂直居中
        if(options.pos == 'center') _popup.css('margin-top','-'+popHeight/2+'px');

        //执行onShow事件，可以动态添加内容
        options.onShow && options.onShow.call(_popup);
        $(document).trigger('popupshow', [_popup]);
        options.onHide && $(document).on('popuphide',function(){
			options.onHide();
        	options.onHide = undefined;
        });
        options.onClose && $(document).on('popupclose',function(){
        	options.onClose();
        	options.onClose = undefined;
        });
        if(transition) A.anim.run(_popup,transition[0]);
        
        A.pop.hasPop = true;

    };

    /**
     * 关闭弹出框
     * @param noTransition 立即关闭，无动画
     */
    var _hide = function(noTransition){
        _mask.hide();
        if(transition && !noTransition){
            A.anim.run(_popup,transition[1],function(){
                _popup.hide().empty();
                A.pop.hasPop = false;
            });
        }else{
            _popup.hide().empty();
            A.pop.hasPop = false;
        }
        $(document).trigger('popuphide');
    };
    var _subscribeEvents = function(){
    	var closePopup = function(){
    		_hide();
    		$(document).trigger('popupclose');
    	};

        _mask.on(A.options.clickEvent, function(){
            clickMask2close &&  closePopup();
            return false;
        });
        _popup.on(A.options.clickEvent,'[data-toggle="closePopup"]',function(){closePopup();return false;});
    };
    /**
     * alert组件
     * @param title 标题
     * @param content 内容
     */
    var _alert = function(title,content,btnName){
        var markup = A.util.provider(TEMPLATE.alert, {title : title, content:content, ok:btnName || '确定'});
        _show({
            html : markup,
            pos : 'center',
            isBlock : true
        });
    };

    /**
     * confirm 组件
     * @param title 标题
     * @param content 内容
     * @param okFunc 确定按钮handler
     * @param cancelFunc 取消按钮handler
     */
    var _confirm = function(title,content,okFunc,cancelFunc){
        var markup = A.util.provider(TEMPLATE.confirm, {title : title, content:content, cancel:'取消', ok:'确定'});
        _show({
            html : markup,
            pos : 'center',
            isBlock : true
        });
        $('#popup_btn_container .agile-popup-alert-ok').on(A.options.clickEvent, function(){
            _hide();
            okFunc.call(this);
            return false;
        });
        $('#popup_btn_container .agile-popup-alert-cancel').on(A.options.clickEvent, function(){
            _hide();
            cancelFunc.call(this);
            return false;
        });
    };


    /**
     * loading组件
     * @param text 文本，默认为“加载中...”
     * @param closeCallback 函数，当loading被人为关闭的时候的触发事件
     */
    var _loading = function(text,closeCallback){
        var markup = A.util.provider(TEMPLATE.loading, {title : text||'加载中'});
        _show({
            html : markup,
            pos : 'loading',
            isBlock : true,
            onClose : closeCallback
        });
    };

    /**
     * actionsheet组件
     * @param buttons 按钮集合
     * [{color:'red',text:'btn',handler:function(){}},{color:'red',text:'btn',handler:function(){}}]
     */
    var _actionsheet = function(buttons,showCancel){
        var markup = '<div class="actionsheet"><div class="actionsheet_group">';
        var defaultCalssName = "button block agile-popup-actionsheet-normal";
        var defaultCancelCalssName = "button block agile-popup-actionsheet-cancel";
        var showCancel = showCancel==false?false:(showCancel||true);
        $.each(buttons,function(i,n){
            markup += '<button class="'+(n.css||defaultCalssName)+'">'+ n.text +'</button>';
        });
        markup += '</div>';
        if(showCancel) markup += '<button class="'+(typeof showCancel=='string'?showCancel:defaultCancelCalssName)+'">取消</button>';
        markup += '</div>';
        
        _show({
            html : markup,
            pos : 'bottom',
            css : {'background':'transparent'},
            onShow : function(){           	
                $(this).find('button').each(function(i,button){              	
                    $(button).on(A.options.clickEvent,function(){
                        if(buttons[i] && buttons[i].handler){
                            buttons[i].handler.call(button);
                        }
                        _hide();
                        return false;
                    });
                });
            }
        });
    };
    
    /**
     * 带箭头的弹出框
     * @param html 弹出的内容可以是html文本也可以输button数组
     * @param el 弹出位置相对的元素对象
     * @param onShow [可选] 显示之前执行
     */
    var _popover = function(html,el,onShow){
    	var markup = [];
    	markup.push('<div class="popover-angle"></div>');
    	if(typeof html=='object'){
    		markup.push('<ul class="popover-items">');
    		for(var i=0;i<html.length;i++){
    			markup.push('<li>'+html[i].text+'</li>');
    		}
    		markup.push('</ul>');
    	}else{
    		markup.push(html);
    	}

        _show({
            html : markup.join(''),
            onShow : function(){     
            	
            	var $del = $(document);
            	var dHeight = $del.height();
            	var dWidth = $del.width();

            	var $rel = $(el);
            	var rHeight = $rel.height();
            	var rWidth = $rel.width();
    			var rTop = $rel.offset().top;
    			var rLeft = $rel.offset().left;
    			var rCenter = rLeft+(rWidth/2);
    			var $el = $(this).addClass('popover');
    			var $angle = $($el.find('.popover-angle').get(0));
    			var gapH = $angle.height()/2;
    			var gapW = Math.ceil($angle.width()*Math.sqrt(2))-4;

				var height = $el.height();
            	var width = $el.width();
				
				var posX = rCenter==dWidth/2?'center':(rCenter>dWidth/2?'right':'left');
    			var posY = dHeight-height-rHeight<0&&rTop>height?'up':'down';
    			
    			var elCss = {}, anCss = {};
    			
    			if(posY=='up'){
    				elCss.top = rTop - (height + gapH);
    				anCss.bottom = -gapH+4;
    			}else{
    				elCss.top = rTop + (rHeight + gapH);
    				anCss.top = -gapH+4;
    			}
    			
    			if(posX=='center'){
    				elCss.left = '50%';
    				elCss['margin-left'] = -width/2;
    				anCss.left = (width-gapW)/2;
    			}else if(posX=='right'){
    				elCss.right = rCenter-width>0?dWidth-rLeft-rWidth:4;
    			}else if(posX=='left'){
					elCss.left = dWidth-rCenter-width>0?rLeft:4;
    			}
    			
    			$el.css(elCss);
    			
    			var center = $el.offset().left+width/2;
    			anCss.left = anCss.left||width/2+(rCenter-center)-gapW/2;	
    			$angle.css(anCss);

                $(this).find('.popover-items li').each(function(i,button){             	
                    $(button).on(A.options.clickEvent,function(){
                        if(html[i] && html[i].handler){
                            html[i].handler.call(button);
                        }
                        _hide();
                        return false;
                    });
                });
            }
        });
    };

    _init();
    	
	var _ext = {};
	
	/**
     * 显示loading框
     * @param text
     */
    _ext.showMask = function(text, closeCallback){
    	if(typeof text=='function'){
    		closeCallback = text;
    		text = '';
    	}
        _loading(text, closeCallback);
    };
    /**
     * 关闭loading框
     */
    _ext.hideMask = function(){
        _hide(true);
    };
    
    _ext.alert = _alert;
    
    _ext.confirm = _confirm;
    /**
     * 弹出窗口
     * @param options
     */
    _ext.popup = _show;
    /**
     * 关闭窗口
     */
    _ext.closePopup = _hide;
    /**
     * 带箭头的弹出框
     * @param html 弹出的内容可以是html文本也可以输button数组
     * @param el 弹出位置相对的元素对象
     * @param onShow [可选] 显示之前执行
     */
    _ext.popover = _popover;
    
    /**
     * actionsheet
     * @param buttons 按钮组
     */
    _ext.showActionsheet = function(buttons){
        _actionsheet(buttons, true);
    };
    
    
    
    for(var k in _ext){
    	A.register(k, _ext[k]);
    }
    
})(A.$);

(function($){
    var _toast,timer;

    var _init = function(){
        //全局只有一个实例
        $('body').append('<div id="agile_toast"></div>');
        _toast = $('#agile_toast');
    };

    /**
     * 关闭消息提示
     */
    var _hide = function(){
        A.anim.run(_toast,'scaleOut',function(){
            _toast.hide();
           _toast.empty();
        });
    };
    /**
     * 显示消息提示
     * @param type 类型  toast|alarm
     * @param text 文字内容
     * @param duration 持续时间 为0则不自动关闭,默认为3000ms
     */
    var _show = function(type,text,duration){
    	duration = duration||3000;
        if(timer) clearTimeout(timer);
        _toast.attr('class',type).html('<a>'+text+'</a>').show();
        A.anim.run(_toast,'scaleIn');
        if(duration !== 0){//为0 不自动关闭
            timer = setTimeout(_hide,duration || A.options.toastDuration);
        }
    };

    _init();
    
    
    var _ext = {};
    /**
     *  显示消息
     * @param text
     * @param duration 持续时间
     */
    _ext.showToast = function(text,duration){
        _show('toast',text,duration);
    };   
    _ext.alarmToast = function(text,duration){
        _show('alarm',text,duration);
    };
    
    for(var k in _ext){
    	A.register(k, _ext[k]);
    }
    
})(A.$);

/*
 * 事件处理
 * */
(function($){
	var event = {},_events = {};

	 /**
     * 处理浏览器的后退事件
     * @private
     */
	_events.back = function(){
		$(window).on('popstate', function(e){  
			A.Controller.back(false);
			return;
    	});
	};
	
	/**
     * 处理data-cache="false"的容器缓存
     * @private
     */
	_events.removeCache = function(){
		var controller = A.Controller.get();
		var eName = [];
		for(var k in controller){
			eName.push(k+'hide');
		}
		$(document).on(eName.join(' '), '[data-cache="false"]', function(){
			$(this).remove();
		});
	};
	
	/**
     * 处理返回事件
     * @private
     */
	_events.backEvent = function(){
		$(document).on(A.options.backEvent, function(event, func){
			if(A.pop.hasPop){
				if($('#agile_popup').data('block')==false){
					A.closePopup();
				}
				
			}else if($('.modal.active').length>0){
				A.Controller.modal('#'+$('.modal.active').first().attr('id'));
			}else if(A.pop.hasAside){
				A.Controller.aside();
			}else if(A.Controller.get('section').history.length<2){	
	    		$(document).trigger('beforeunload');//触发关闭页面事件
	    	}else{
	    		window.history.go(-1);
	    	}
		});
	};
	
	_events.zepto = function(){
		if($!=window.Zepto) return;
		$(document).on('click', 'a[data-toggle]', function(){return false; });
		$(document).on('swipeLeft','[data-aside-right]', function(){$(this).trigger('swipeleft');});
		$(document).on('swipeRight','[data-aside-left]',function(){$(this).trigger('swiperight');});
	};
	
	/**
     * 初始化相关组件
     */
	_events.initComponents = function(){

		$(document).on(A.options.agileReadyEvent, function(){
			//初始化section
			var sectionSelecor = A.Controller.get()['section']['container']+' [data-role="section"]';
			var $section = $(sectionSelecor+'.active').first();
			if($section.length==0) $section = $(sectionSelecor).first();
			A.Controller.section('#'+$section.attr('id'));
			//初始化侧边栏
			A.Aside.init();
		});
		
		$(document).on('sectionload', 'section', function(){
			//初始化article
			A.Controller.article('#'+$(this).find('[data-role="article"].active').attr('id'));		
		});
		
		$(document).on('modalload', '.modal', function(){
			//初始化article
			A.Controller.article('#'+$(this).find('[data-role="article"].active').attr('id'));		
		});
	};
	
	/**
     * @param {Object} 添加的事件对象 {key:function(){}}
     */
	event.add = function(obj){
		$.extend(_events, obj||{});
	};
	
	/**
     * 启动event
     */
	event.launch = function(){
		for(var k in _events){
			_events[k]();
		}
	};
	
	A.register('event', event);
})(A.$);

(function($){
	
	var Template = function(selecotr){
		this.$el = $(selecotr);
	};
	
	Template.prototype.getTemplate = function(cb){
		var $el = this.$el;
		var source = $el.attr('src');
		var tmpl = $el.html().trim();
		if(tmpl){
			cb&&cb(tmpl);
		}else if(source){
			A.util.getHTML(A.util.script(source), function(html){
				$el.text(html);
				cb&&cb(html);
			});
		}else{
			cb&&cb('');
		}
	};
	
	Template.prototype.render = function(url, cb){
		var data;
		if(typeof url=='object'){
			data = url;
			url = '';
		}
		if(!data&&!url){
			cb&&cb();
			return;
		}
		var tmplHTML = this.$el.html().trim();
		if(data&&tmplHTML){
			var html = '';
			try{
				html =  template.compile(tmplHTML)(data);
			}catch(e){}
			cb&&cb(html, tmplHTML, data);
			return html;
		}
		
		this.getTemplate(function(tmpl){
			if(url){
				A.util.ajax({
					url : url,
					dataType : 'json',
					success : function(data){
						var render = template.compile(tmpl);
                    	html = render(data);
                    	cb&&cb(html, tmpl, data);
					},
					error : function(){
						cb&&cb();
					}
				});
			}else{
				
				var render = template.compile(tmpl);
                html = render(data);
                cb&&cb(html, tmpl, data);
			}
		});

	};
	
	var _render = function(type, url, cb){
		var $el = this.$el;	
		this.render(url, function(html, tmpl, data){
			var $referObj = $el;
			var id = $el.attr('id');
			var tag = '#'+$el.attr('id');
			var $oldObj = $el.parent().find('[__inject_dependence__="'+tag+'"]');
			if(type=='replace'){
				$oldObj.remove();
				//$referObj = $el;
			}else if(type=='after'){
				$referObj = $oldObj.length==0?$el:$oldObj.last();
			}else if(type=='before'){
				//$referObj = $el;
			}

			var $html = $(html).attr('__inject_dependence__',tag);
			$referObj.after($html);
			
			cb&&cb($html, tmpl, data);
			
			$el.trigger('renderEnd', [$html]);
		});
	};
	
	Template.prototype.renderReplace = function(url, cb){
		_render.call(this, 'replace', url, cb);
	};
	
	Template.prototype.renderAfter = function(url, cb){
		_render.call(this, 'after', url, cb);
	};
	Template.prototype.renderBefore = function(url, cb){
		_render.call(this, 'before', url, cb);
	};
	
	A.register('template', function(selecotr){
		return new Template(selecotr);
	});
})(A.$);

/*
 * 扩展JSON:A.JSON.stringify和A.JSON.parse，用法你懂
 * */
(function(){
	var JSON = {};

	JSON.parse = function(str){
		try{
			return eval("("+str+")");
		}catch(e){
			return null;
		}
	};

	JSON.stringify = function(o){
		var r = [];
		if(typeof o =="string") return "\""+o.replace(/([\'\"\\])/g,"\\$1").replace(/(\n)/g,"\\n").replace(/(\r)/g,"\\r").replace(/(\t)/g,"\\t")+"\"";
		if(typeof o =="undefined") return "";
		if(typeof o != "object") return o.toString();
		if(o===null) return null;
		if(o instanceof Array){
			for(var i =0;i<o.length;i++){
		        r.push(this.stringify(o[i]));
		    }
		    r="["+r.join()+"]";
		}else{
			for(var i in o){
			   r.push('"'+i+'":'+this.stringify(o[i]));
		    }
		    r="{"+r.join()+"}";
		}
		return r;
	};
	
	A.register('JSON', JSON);
})();
