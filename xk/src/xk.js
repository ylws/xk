/*
 * 2017-4-26
 * DDD
 * CFCMXK 类 调用本地视频播放
 * Param:
 * Param @channelnum 频道数量
 * Param @channel 频道地址
 * Param @channeltitle 频道标题
 * Param @id dom id
 * Param @playtype pclive,mobilelive,play （只有ie版本低于ie8或者pc端浏览直播，使用ckplayer播放）
 * Param @widhei 初始化宽高
 * */
class CFCMXK {
	constructor(opt) {
		this.initVal(opt);
	}
	initVal(opt) {
		this.cfg = {};
		let defaultConfig = {
			id: "playerArea",
			fullscreen: false,
			Fscreenid: 'V_fullScreen',
			flashplayer: [],
			channelflag: true
		}
		Object.assign(this.cfg, defaultConfig, opt);
		this.initcommonVal();
	}
	initcommonVal() {
		let cfg = this.cfg;
		//初始化大小计算16/9
		cfg.WH = this.idstyle(cfg.widhei ? cfg.widhei.wid : window.innerWidth, cfg.widhei ? cfg.widhei.hei : window.innerHeight);
		//禁用鼠标右键
		document.oncontextmenu = function() {
			return false
		};
		// dom操作
		this.domDeal();
		//ckplayer填充
		this.setckplayer();
		this.countcreatevideo(cfg.channelnum);
		cfg.fullscreenObj = this.getid(cfg.Fscreenid)
		 
		//键盘事件
		this.keycode();
		//初始化高标清标识以及按钮位置
		this.videoopt()
		// resize事件
	    this.resize();
	}
	setStyle(obj, type, val) {
		obj.style[type] = val;
	}
	setAttr(obj, type, val) {
		obj.setAttribute(type, val)
	}
	platformcheck() {
		var h5video = !!document.createElement('video').canPlayType;
		var navigatorinfo = navigator.userAgent;
		var mobile = (navigatorinfo.match(/(iPhone|Android|iPad|Mobile|uc)/i));
		var isie11 = navigatorinfo.match(/.(clr)*[rv:]([11.]+)/) != null;
		var isie = navigatorinfo.match(/.(msie)/gi) != null;
		var ischrome = navigatorinfo.match(/.(chrome)/gi) != null;
		var isfirefox = navigatorinfo.match(/.(firefox)/gi) != null;
		let checkres;
		if(mobile) {
			checkres = 'mobile';
		} else if(h5video && !mobile) {
			checkres = 'pch5'
		}
		return {
			ie11: isie11,
			ie: isie,
			checkres:checkres,
			h5video:h5video,
			mobile:mobile,
			firefox:isfirefox,
			chrome:ischrome
		}
	}
	/*
	 * @F11 执行全屏事件 
	 * 
	 * */
	keycode() {
		let _this = this;
		let cfg = this.cfg;
		document.onkeydown = function(e) {
			var ev = e || window.event;
			if(ev.keyCode == "122") { //f11 /esc|| ev.keyCode == "27"
				if(cfg.lock){//锁定时间标识，如果时间锁定，一秒后才可以生效
					if(!cfg.f11count){
						cfg.f11count = setTimeout(function(){
							delete cfg.f11secondtime;
							delete cfg.f11time;
							delete cfg.lock;
							clearTimeout(cfg.f11count);
							delete cfg.f11count;
						},1000)
					}
					if(ev.preventDefault) {
						ev.preventDefault();
						ev.stopPropagation()
					} else {
						ev.cancelBubble = true;
						ev.returnValue  = true;
					}
					return false;
				}else{
					if(cfg.f11time){
						cfg.f11secondtime = new Date().getTime();
						console.log(cfg.f11secondtime - cfg.f11time)
						if((cfg.f11secondtime - cfg.f11time)<=1000){
							console.log('您的操作太频繁，请稍后再试!');
							cfg.lock = true;
						}
					}else{
						cfg.f11time = new Date().getTime();
					}
					if(cfg.fullscreen) {
						cfg.fullscreen = false;
					} else {
						cfg.fullscreen = true;
					}
					if(_this.platformcheck().ie11 || _this.platformcheck().ie) {
						//ie下除了ie11,没有全屏事件，为了统一处理，ie下全屏处理为f11全屏
					} else {
						if(ev.preventDefault) {
							ev.preventDefault();
						} else {
							ev.cancelBubble = true;
						}
						cfg.fullscreenObj.click();
					}
				}
			}
		}
	}
	/*
	 * @resize 执行一次resize
	 * 
	 */
	resize() {
		var _this = this;
		let cfg = this.cfg;
		if(window.addEventListener) {
			window.onresize = function() {
				if(!(_this.platformcheck().ie11 || _this.platformcheck().ie)) {
					if(!cfg.fullscreen && _this.platformcheck().chrome) {
						return;
					}
				}

				var resizePlayer = null;
				if(resizePlayer) {
					clearTimeout(resizePlayer);
				}
				resizePlayer = setTimeout(function() {
					_this.resizeplayer(_this);
					
				}, 50);
			}
		}
	}
	/*
	 * @FN resizeplayer resize具体执行操作
	 * @WH 重新计算比例，并修改大小
	 * @FN countcreatevideo :重新计算各个元素大小并赋值
	 * @FN slideRefrash : 重新初始化播放进度条的位置以及控制数据
	 * @FN addknowledge : 重新初始化知识点数据
	 * @FN voiceRefrash : 重新初始化音量条数据及操作
	 */
	resizeplayer(_this) {
		let cfg = _this.cfg;
//		cfg.flashplayer = [];
		if(cfg.WH.wid == screen.width || cfg.WH.hei == screen.height) {
			cfg.fullscreen = false;
		}
		if(cfg.fullscreen) {
			//需要全屏
			cfg.WH = _this.idstyle(screen.width, screen.height);
		} else {
			cfg.fullscreen = false;
			cfg.WH = _this.idstyle(cfg.widhei ? cfg.widhei.wid : window.innerWidth, cfg.widhei ? cfg.widhei.hei : window.innerHeight);
		}
		_this.setAttr(_this.getid(cfg.id), "style", 'width:' + cfg.WH.wid + 'px;height:' + cfg.WH.hei + 'px');

		_this.countcreatevideo(cfg.channelnum);
	}
	/*
	 * @FN domDeal 初始化dom操作，控制条，并计算元素大小
	 * @Param num : 分屏模式
	 * @FN createvideo ： 创建视频节点，并插入
	 * @FN countcreatevideo : 重新计算各个元素大小并赋值
	 * 
	 */
	domDeal() {
		let cfg = this.cfg;
		cfg.showObj = this.getid(cfg.id);
		this.setAttr(cfg.showObj, "style", 'width:' + cfg.WH.wid + 'px;height:' + cfg.WH.hei + 'px');
		cfg.showObj.innerHTML = this.createvideo(cfg.channelnum);
	}
	/*
	 * @Param cfg.fullscreenObj : 全屏按钮
	 */
	videoopt() { // ckobj.changeVolume(0);
		var _this = this;
		let cfg = this.cfg;
		cfg.fullscreenObj.onclick = function() {
			if(_this.platformcheck().ie11 || _this.platformcheck().ie) {
				return false;
			}
			let flag = this.getAttribute('class');
			if(flag == 'fullscreen') {
				cfg.fullscreen = true;
				_this.FullScreen(cfg.showObj);
				_this.setAttr(this, "class", 'outfullscreen');
			} else {
				cfg.fullscreen = false;
				_this.CancelFullScreen();
				_this.setAttr(this, "class", 'fullscreen');
				_this.resizeplayer(_this);
			}
		}
		document.addEventListener && (document.addEventListener('webkitfullscreenchange', function() {
				_this.escFullScreen();
			}, false) ||
			document.addEventListener('mozfullscreenchange', function() {
				_this.escFullScreen();
			}, false) ||
			document.addEventListener('fullscreenchange', function() {
				_this.escFullScreen();
			}, false) ||
			document.addEventListener('webkitfullscreenchange', function() {
				_this.escFullScreen();
			}, false));
		document.attachEvent && document.attachEvent('msfullscreenchange', function() {
			_this.escFullScreen();
		});
	}
	/*
	 * @FN getid 
	 */
	getid(id) {
		return document.getElementById(id);
	}
	/*
	 * @FN appendvideo  填充dom
	 */
	appendvideo(html, num) {
		let cfg = this.cfg;
		cfg.flashinfo = [];
		for(var i = 0; i < num; i++) {
			html += '<div class="list"  id=list_' + i + '  ><div class=" channel icon-yulan iconfont" id="channel_'+i+'" style="display:'+ (cfg.channelflag ? 'block' : 'none') +'"></div><div class="mute icon-yinliangguan iconfont" id="mute_'+i+'"></div><div class="title" title="' + cfg.channeltitle[i] + '"><span>' + cfg.channeltitle[i] + '</span></div><div style="width:100%;height:100%"    id=video_' + i + ' ></div></div>';
			cfg.flashinfo.push({
				num: i,
				id: 'video_' + i,
				url: cfg.channel[i]
			})
		}
		return html
	}
	/*
	 * 
	 * 
	 * */
    resetflashinfo (urlarr,titlearr,page,screens,channelinfo,vue) {
      let cfg = this.cfg
      cfg.flashinfo = []
      let temp = []
      let tempchannel = []
      cfg.channelnum = screens
      this.domDeal()
      this.countcreatevideo(cfg.channelnum)
      for (let i = (page-1)*screens; i < ((page-1)*screens +screens); i++){
      	cfg.flashinfo.push({
			num: i-(page-1)*screens,
			id: 'video_' + (i-(page-1)*screens),
			url: urlarr[i]
		})
      	tempchannel.push(channelinfo[i])
      	temp.push(titlearr[i])
      	this.titleevent(i-(page-1)*screens, temp)
      	this.channelevent(i-(page-1)*screens, tempchannel,vue)
      }
      
      this.setckplayer()
    }
	/*
	 * @FN createvideo  填充dom
	 */
	createvideo(num) {
		var html = '';
		switch(num) {
			case 1:
			case 2:
			case 3:
			case 4:
				html = this.appendvideo(html, num);
				break;
			case 5:
			case 6:
				//增加一个补位元素
				var addLostDom = document.createElement("div");
				this.setAttr(addLostDom, "class", "videopartLostDom");
				html = this.appendvideo(html, num);
				if(num == 5) {
					html += '<div class="nosingal"  id=list_' + 5 + '   >NOSINGAL</div>';
				}
				break;
			case 7:
			case 8:
			case 9:
				html = this.appendvideo(html, num);
				if(num == 7) {
					html += '<div class="nosingal" id=list_' + 7 + '   >NOSINGAL</div>';
					html += '<div class="nosingal"  id=list_' + 8 + '  >NOSINGAL</div>';
				}
				if(num == 8) {
					html += '<div id=list_' + 8 + ' class="nosingal" >NOSINGAL</div>';
				}
				break;
		}
		return html;
	}
	/*
	 * @FN countcreatevideo  计算大小
	 */
	countcreatevideo(num) {
		let cfg = this.cfg;
		switch(num) {
			case 1:
				this.setAttr(this.getid('list_0'), "style", 'width:' + (cfg.WH.wid - 2) + 'px;height:' + (cfg.WH.hei - 2) + 'px');
				break;
			case 2:
				var thiswid = parseInt(cfg.WH.wid / 2) - 2;
				var thishei = parseInt(cfg.WH.hei / 2) - 2;
				var border, wid;
				for(var i = 0; i < num; i++) {
					if(i == 0) {
						border = "border-right:none;";
						wid = thiswid + 1;
					} else {
						border = '';
						wid = thiswid;
					}
					this.setAttr(this.getid('list_' + i), "style", border + 'width:' + wid + 'px;height:' + thishei + 'px;top:' + (cfg.WH.hei - thishei) / 2 + 'px');
				}
				break;
			case 3:
				var thiswid = parseInt(cfg.WH.wid / 3);
				var thishei = parseInt(cfg.WH.hei / 2);
				let hei = (cfg.WH.hei - thishei * 2) / 2;
				for(var i = 0; i < num; i++) {
					if(i == 0) {
						this.setAttr(this.getid('list_' + i), "style", 'border-right:none;width:' + (thiswid * 2 - 1) + 'px;height:' + thishei * 2 + 'px;top:' + hei + 'px');
					} else if(i == 1) {
						this.setAttr(this.getid('list_' + i), "style", 'border-bottom:none;width:' + (thiswid - 2) + 'px;height:' + thishei + 'px;top:' + hei + 'px');
					} else {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 2) + 'px;height:' + (thishei - 1) + 'px;top:' + hei + 'px');
					}
				}
				break;
			case 4:
				var thiswid = parseInt(cfg.WH.wid / 2) - 2;
				var thishei = parseInt(cfg.WH.hei / 2) - 2;
				var thiswid1 = thiswid + 1;
				for(i = 0; i < num; i++) {
					var border = '';
					if(i == 0) {
						border = "border-right:none;border-bottom:none;";
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid1 + 'px;height:' + thishei + 'px;');
					} else if(i == 1) {
						border = "border-bottom:none;";
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid + 'px;height:' + thishei + 'px;');
					} else if(i == 2) {
						border = "border-right:none;";
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid1 + 'px;height:' + thishei + 'px;');
					} else {
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid + 'px;height:' + thishei + 'px;');
					}
				}
				break;
			case 5:
			case 6:
				var thiswid = parseInt(cfg.WH.wid / 3);
				var thishei = parseInt(cfg.WH.hei / 3);
				//增加一个补位元素
				var addLostDom = document.createElement("div");
				this.setAttr(addLostDom, "class", "videopartLostDom");
				for(var i = 0; i < num; i++) {
					if(i == 0) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid * 2 - 1) + 'px;height:' + (thishei * 2 - 1) + 'px;border-right:none;border-bottom:none;');
					} else if(i == 1) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 2) + 'px;height:' + (thishei - 1) + 'px;border-bottom:none;');
					} else if(i == 2) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 2) + 'px;height:' + (thishei - 1) + 'px;border-bottom:none;');

					} else if(i == 3) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 2) + 'px;margin-right:' + (cfg.WH.wid - thiswid * 3) + 'px;height:' + (thishei - 1) + 'px;float:right;border-left:none;');

					} else if(i == 4) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 2) + 'px;height:' + (thishei - 1) + 'px;float:right;');

					} else if(i == 5) {
						this.setAttr(this.getid('list_' + i), "style", 'width:' + (thiswid - 1) + 'px;height:' + (thishei - 1) + 'px;border-right:none;');
					}
				}
				if(num == 5) {
					this.setAttr(this.getid('list_' + 5), "style", 'border-right:none;width:' + (thiswid - 1) + 'px;height:' + (thishei - 1) + 'px;line-height:' + thishei + 'px;text-align:center;color:#fff');
				}
				break;
			case 7:
			case 8:
			case 9:
				var thiswid = parseInt(cfg.WH.wid / 3) - 2;
				var thishei = parseInt(cfg.WH.hei / 3) - 1;
				var thiswid1 = thiswid + 1;
				for(var i = 0; i < num; i++) {
					var border;
					if(i == 0 || i == 1 || i == 3 || i == 4 || i == 6 || i == 7) {
						border = "border-right:none;";
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid1 + 'px;height:' + thishei + 'px;');
					} else {
						border = '';
						this.setAttr(this.getid('list_' + i), "style", border + 'width:' + thiswid + 'px;height:' + thishei + 'px;');
					}
				}
				if(num == 7) {
					this.setAttr(this.getid('list_' + 7), "style", 'border-right:none;width:' + thiswid1 + 'px;float:left;height:' + thishei + 'px;line-height:' + thishei + 'px;text-align:center;color:#fff');
					this.setAttr(this.getid('list_' + 8), "style", 'width:' + thiswid + 'px;float:left;height:' + thishei + 'px;line-height:' + thishei + 'px;text-align:center;color:#fff');
				}
				if(num == 8) {
					this.setAttr(this.getid('list_' + 8), "style", 'width:' + thiswid + 'px;float:left;height:' + thishei + 'px;line-height:' + thishei + 'px;text-align:center;color:#fff');
				}
				break;
		}
	}
	muteevent(num){
	  let cfg = this.cfg
	  let obj = CKobject.getObjectById('ckplayer_' + num)
	  this.getid('mute_'+num).className = this.getid('mute_'+num).className.replace(/(icon-yinliangkai)/gi,'icon-yinliangguan')
	  if(obj){
	  	 this.getid('mute_'+num).onclick=function(){
	  	 	if(this.className.indexOf('icon-yinliangguan')>=0){
	  	 		this.className = this.className.replace(/(icon-yinliangguan)/gi,'icon-yinliangkai')
	  	 		CKobject.getObjectById('ckplayer_' + num).changeVolume(100)
	  	 	}else{
	  	 		this.className = this.className.replace(/(icon-yinliangkai)/gi,'icon-yinliangguan')
	  	 		CKobject.getObjectById('ckplayer_' + num).changeVolume(0)
	  	 	}
	  	 }
	  }
	}
	titleevent (num,titelarr) {
		if(titelarr){
			this.getid('mute_'+num).parentNode.querySelector('.title').children[0].textContent = titelarr[num]
		}else{
			this.getid('mute_'+num).parentNode.querySelector('.title').children[0].textContent = ''
		}
	}
	channelevent (num,channelarr,vue) {
	    if(channelarr){
			this.getid('channel_'+num).onclick = function(){
			  console.log('查看多分屏信息,跳转查看页面')
			  vue.$router.push({'name': 'AJloopClasssee', params: {see: 'see', item: channelarr[num]}})
			}
		}else{
			this.getid('channel_'+num).onclick = null
		}
	}
	/*
	 * @FN getStyle  获取样式表属性
	 */
	getStyle(el, name) {　　
		if(window.getComputedStyle) {　　　
			return window.getComputedStyle(el, null)[name];　　
		} else {　　　
			return el.currentStyle[name];　　
		}
	}
	/*
	 * @FN idstyle  计算16/9大小
	 */
	idstyle(wid, hei) {
		var obj = {},
			temp = hei;
		//以宽度为依据,计算比例
		if(wid * 0.5625 > hei) { //以高度逆算宽度
			if(hei / 0.5625 <= wid) {
				obj.hei = hei;
				obj.wid = parseInt(hei / 0.5625);
			} else {
				temp = temp - 10;
				//不作处理throw new error("浏览器当前宽高不适合预览,请重置!")
				this.idstyle(wid, temp);
			}
		} else {
			obj.hei = parseInt(wid * 0.5625);
			obj.wid = wid;
		}
		return obj;
	}
	/*
	 * @FN FullScreen  全屏方法调用
	 */
	FullScreen(element) {
		if(element.requestFullScreen) {
			element.requestFullScreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		} else {
			return true;
		}
	}
	/*
	 * @FN FullScreen  取消全屏方法调用
	 */
	CancelFullScreen() {
		if(document.exitFullscreen) {
			document.exitFullscreen();
		} else if(document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if(document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		} else if(document.msExitFullscreen) {
			document.msExitFullscreen();
		} else {
			return true;
		}
	}
	/*
	 * @FN escFullScreen  esc取消全屏方法调用
	 */
	escFullScreen() {
		let cfg = this.cfg;
		if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
			this.CancelFullScreen();
			this.setAttr(cfg.fullscreenObj, "class", "fullscreen");
		}
	}
	/*
	 * @FN setckplayer  初始化ckplayer
	 */
	setckplayer() {
		let cfg = this.cfg;
		let _this = this;
		for(let i = 0; i < cfg.channelnum; i++) {
			(function(i) {
				if(cfg.flashinfo[i].url){
					_this.getid(cfg.flashinfo[i].id).innerHTML = '';
					_this.ckplayer(cfg.flashinfo[i]);
				}else{
					_this.getid(cfg.flashinfo[i].id).innerHTML = '';
				}
			})(i)
		}
	}
	/*
	 * @FN ckplayer  初始化ckplayer
	 */
	ckplayer(obj) {
		let callback = 'xk_loadedHandler' + obj.num;
		var flashvars = {
			f: obj.url, //视频地址
			a: '', //调用时的参数，只有当s>0的时候有效
			s: '0', //调用方式，0=普通方法（f=视频地址），1=网址形式,2=xml形式，3=swf形式(s>0时f=网址，配合a来完成对地址的组装)
			c: '', //是否读取文本配置,0不是，1是
			x: '', //调用配置文件路径，只有在c=1时使用。默认为空调用的是ckplayer.xml
			i: '', //初始图片地址
			d: '', //暂停时播放的广告，swf/图片,多个用竖线隔开，图片要加链接地址，没有的时候留空就行
			u: '', //暂停时如果是图片的话，加个链接地址
			l: '', //前置广告，swf/图片/视频，多个用竖线隔开，图片和视频要加链接地址
			r: '', //前置广告的链接地址，多个用竖线隔开，没有的留空
			t: '', //视频开始前播放swf/图片时的时间，多个用竖线隔开
			y: '', //这里是使用网址形式调用广告地址时使用，前提是要设置l的值为空
			z: '', //缓冲广告，只能放一个，swf格式
			e: '8', //视频结束后的动作，0是调用js函数，1是循环播放，2是暂停播放并且不调用广告，3是调用视频推荐列表的插件，4是清除视频流并调用js功能和1差不多，5是暂停播放并且调用暂停广告
			v: '', //默认音量，0-100之间
			p: '1', //视频默认0是暂停，1是播放，2是不加载视频
			h: '0', //播放http视频流时采用何种拖动方法，=0不使用任意拖动，=1是使用按关键帧，=2是按时间点，=3是自动判断按什么(如果视频格式是.mp4就按关键帧，.flv就按关键时间)，=4也是自动判断(只要包含字符mp4就按mp4来，只要包含字符flv就按flv来)
			q: '', //视频流拖动时参考函数，默认是start
			m: '', //让该参数为一个链接地址时，单击播放器将跳转到该地址
			o: '', //当p=2时，可以设置视频的时间，单位，秒
			w: '', //当p=2时，可以设置视频的总字节数
			g: '', //视频直接g秒开始播放
			j: '', //跳过片尾功能，j>0则从播放多少时间后跳到结束，<0则总总时间-该值的绝对值时跳到结束
			k: '', //提示点时间，如 30|60鼠标经过进度栏30秒，60秒会提示n指定的相应的文字
			n: '', //提示点文字，跟k配合使用，如 提示点1|提示点2
			wh: '16:9', //宽高比，可以自己定义视频的宽高或宽高比如：wh:'4:3',或wh:'1080:720'
			lv: '0', //是否是直播流，=1则锁定进度栏
			er: '加载失败',
			loaded: callback + '', //当播放器加载完成后发送该js函数loaded
			//调用播放器的所有参数列表结束
			//以下为自定义的播放器参数用来在插件里引用的
			my_title: '',
			my_url: encodeURIComponent(window.location.href) //本页面地址
			//调用自定义播放器参数结束
		};
		var params = {
			wmode: 'transparent',
			allowFullScreen: true,
			allowScriptAccess: 'always'
		}; //这里定义播放器的其它参数如背景色（跟flashvars中的b不同），是否支持全屏，是否支持交互
		CKobject.embedSWF('/static/cklive/src/ckplayer/ckplayer.swf', obj.id, 'ckplayer_' + obj.num, '100%', '100%',flashvars,params);
		this.muteevent(obj.num)
	}
}
function xk_loadedHandler0(){
	CKobject.getObjectById('ckplayer_' + 0).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 0).changeStatus(0)
}
function xk_loadedHandler1(){
	CKobject.getObjectById('ckplayer_' + 1).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 1).changeStatus(0)
}
function xk_loadedHandler2(){
	CKobject.getObjectById('ckplayer_' + 2).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 2).changeStatus(0)
}
function xk_loadedHandler3(){
	CKobject.getObjectById('ckplayer_' + 3).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 3).changeStatus(0)
}

function xk_loadedHandler4(){
	CKobject.getObjectById('ckplayer_' + 4).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 4).changeStatus(0)
}
function xk_loadedHandler5(){
	CKobject.getObjectById('ckplayer_' + 5).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 5).changeStatus(0)
}
function xk_loadedHandler6(){
	CKobject.getObjectById('ckplayer_' + 6).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 6).changeStatus(0)
}
function xk_loadedHandler7(){
	CKobject.getObjectById('ckplayer_' + 7).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 7).changeStatus(0)
}
function xk_loadedHandler8(){
	CKobject.getObjectById('ckplayer_' + 8).changeVolume(0)
	CKobject.getObjectById('ckplayer_' + 8).changeStatus(0)
}
