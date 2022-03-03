(()=>{
	function couponHelper(){
		this.isRun = function(){
			var urls=["detail.tmall.com", "item.taobao.com", "item.jd.com", "item.yiyaojd.com", "npcitem.jd.hk", "detail.tmall.hk"];
			for(var i=0; i<urls.length;i++){
				if(window.location.host.indexOf(urls[i])!=-1){
					return true;
				}
			}
			return false;
		};
		this.getPlatform = function(){
			let host = window.location.host;
			let platform = "";
			if(host.indexOf("detail.tmall")!=-1){
				platform = "tmall";
			}else if(host.indexOf("item.taobao.com")!=-1){
				platform = "taobao";
			}else if(host.indexOf("jd.com")!=-1 || host.indexOf("npcitem.jd.hk")!=-1){
				platform = "jd";
			}
			return platform;
		};
		this.filterStr = function(str){
			if(!str) return "";
			str = str.replace(/\t/g,"");
			str = str.replace(/\r/g,"");
			str = str.replace(/\n/g,"");
			str = str.replace(/\+/g,"%2B");//"+"
			str = str.replace(/\&/g,"%26");//"&"
			str = str.replace(/\#/g,"%23");//"#"
			return encodeURIComponent(str)
		};
		this.getParamterQueryUrl = function(tag) { //查询GET请求url中的参数
			var t = new RegExp("(^|&)" + tag + "=([^&]*)(&|$)");
			var a = window.location.search.substr(1).match(t);
			if (a != null){
				return a[2];
			}
			return "";
		};
		this.getEndIdByUrl = function(url) { //获得以html结束的ID
			if(url.indexOf("?")!=-1){
				url = url.split("?")[0]
			}
			if(url.indexOf("#")!=-1){
				url = url.split("#")[0]
			}
			var splitText = url.split("/");
			var idText = splitText[splitText.length-1];
			idText = idText.replace(".html","");
			return idText;
		};
		this.getGoodsData = function(platform){ //获得ID和商品标题
			var goodsId = "", goodsName = "", href = window.location.href;
			if(platform=="taobao"){
				goodsId = this.getParamterQueryUrl("id");
				goodsName=document.querySelector(".tb-main-title").innerText;
		
			}else if(platform=="tmall"){
				goodsId = this.getParamterQueryUrl("id");
				goodsName=document.querySelector(".tb-detail-hd").innerText;
		
			}else if(platform=="jd"){
				goodsName=document.querySelector("div.sku-name").innerText;
				goodsId = this.getEndIdByUrl(href);
		
			}
			var data={"goodsId":goodsId, "goodsName":this.filterStr(goodsName)}
			return data;
		};
		this.randomSpmValue=function(){
			document.querySelectorAll("meta[name='data-spm").forEach((ele)=>{
				var max = 5000;
				var min = 1000;
				var randomValue = Math.floor(Math.random() * (max - min + 1) ) + min;
				var randomLetter = String.fromCharCode(Math.floor( Math.random() * 26) + "a".charCodeAt(0));
				ele.setAttribute("content", randomValue+randomLetter);
			});
			document.querySelectorAll("meta[name='spm-id']").forEach((ele)=>{
				var max = 5000;
				var min = 1000;
				var randomValue = Math.floor(Math.random() * (max - min + 1) ) + min;
				var randomLetter = String.fromCharCode(Math.floor( Math.random() * 26) + "a".charCodeAt(0));
				ele.setAttribute("content", randomValue+randomLetter);
			});
		};
		this.runAliDeceptionSpm=function() {
			if(window.location.host.indexOf("aliyun.com")!=-1 || window.location.host.indexOf("taobao.com")!=-1 || window.location.host.indexOf("tmall.com")!=-1){
				this.randomSpmValue();
				setInterval(()=>{
					this.randomSpmValue();
				}, 4000);
			}
		};
		this.request = function(url){
			return new Promise(function(resolve, reject) {
				var XHR = new XMLHttpRequest();
				XHR.open('GET', url, true);
				XHR.send();
				XHR.onreadystatechange = function() {
					if (XHR.readyState == 4) {
						if (XHR.status == 200) {
							resolve({"result":"success", "json":XHR.responseText});
						} else {
							reject({"result":"error", "json":null});
						}
					}
				}
			});
		};
		this.createCouponHtml = function(platform, goodsId, goodsName){
			if(!platform || !goodsId) return;
			const goodsCouponUrl = "https://t.mimixiaoke.com/api/plugin/hit/v2?script=10000&v=1.0.2&platform="+platform+"&id="+goodsId+"&q="+goodsName;
			const goodsPrivateUrl = "https://t.mimixiaoke.com/api/private/change/coupon?script=10000&v=1.0.2&platform="+platform+"&id=";
			this.request(goodsCouponUrl).then((resutData)=>{
				if(resutData.result!=="success" || !resutData.json){
					return;
				}
				var data = JSON.parse(resutData.json).data;
				if(!data || data==="null" || !data.css || !data.html || !data.handler){
					return;
				}
				var cssText = data.css, htmlText = data.html, handler = data.handler, templateId = data.templateId;
				if(!cssText || !htmlText || !handler || !templateId){
					return;
				}
				
				//添加css
				var createStyleEle = document.createElement("style");
				createStyleEle.innerHTML = cssText;
				document.getElementsByTagName('head')[0].appendChild(createStyleEle)
				
				//插入HTML
				var handlers = handler.split("@");
				for(var i=0; i<handlers.length; i++){
					var handler = handlers[i];
					if(!handler) continue;
					var $handler = document.querySelector(handler);
					if(!$handler) continue;
					if(platform=="taobao"){
						$handler.parentNode.insertAdjacentHTML("afterend", htmlText);
					}else if(platform=="tmall"){
						$handler.parentNode.insertAdjacentHTML("afterend", htmlText);
					}else if(platform=="jd"){
						$handler.insertAdjacentHTML("afterend", htmlText);
					}
				}
				var templateObject = document.getElementById(templateId);
				if(!templateObject){
					return;
				}
				var couponId = templateObject.getAttribute("data-id");
				if(!couponId){
					return;
				}
				//淘宝、天猫需要画二维码
				var canvasObject = document.getElementById("ca"+templateId);
				if(canvasObject){
					this.request(goodsPrivateUrl+couponId).then((resutData2)=>{
						if(resutData2.result==="success" && !!resutData2.json){
							let img = JSON.parse(resutData2.json).img;
							if(!!img){
								var canvasElement = document.getElementById("ca"+templateId);
								var cxt = canvasElement.getContext("2d");
								var imgData = new Image();
								imgData.src = img;
								imgData.onload=function(){
									cxt.drawImage(imgData, 0, 0, imgData.width, imgData.height);
								}
							}
						}
					});
				}
				//京东是点击跳转
				let couponElementA = templateObject.querySelector("a[name='cpShUrl']");
				if(couponElementA){
					couponElementA.addEventListener("click", ()=>{
						this.request(goodsPrivateUrl+couponId).then((resutData2)=>{
							if(resutData2.result==="success" && !!resutData2.json){
								let url = JSON.parse(resutData2.json).url;
								var tempwindow = window.open('_blank'); // 先打开页面
								tempwindow.location = url; // 后更改页面地址

							}
						});
					});
				}
			});
		}
		this.start = function(){
			if(this.isRun()){
				var platform = this.getPlatform();
				if(!platform){
					return;
				}
				var goodsData = this.getGoodsData(platform);
				this.createCouponHtml(platform, goodsData.goodsId, goodsData.goodsName);
			}
			this.runAliDeceptionSpm();
		};
	}
	try{
		(new couponHelper()).start();
	}catch(e){}
})();
