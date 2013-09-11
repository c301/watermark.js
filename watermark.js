/* 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * watermark.js - Create watermarked images with Canvas and JS
 *
 * Version: 1 (2011-04-04)
 * Copyright (c) 2011	Patrick Wied ( http://www.patrick-wied.at )
 * This code is licensed under the terms of the MIT LICENSE
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 */


(function(w){
	function decode(base64) {
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var bufferLength = base64.length * 0.75,
		len = base64.length, i, p = 0,
		encoded1, encoded2, encoded3, encoded4;

		if (base64[base64.length - 1] === "=") {
				bufferLength--;
			if (base64[base64.length - 2] === "=") {
				bufferLength--;
			}
		}

		var arraybuffer = new ArrayBuffer(bufferLength),
			bytes = new Uint8Array(arraybuffer);

		for (i = 0; i < len; i+=4) {
			encoded1 = chars.indexOf(base64[i]);
			encoded2 = chars.indexOf(base64[i+1]);
			encoded3 = chars.indexOf(base64[i+2]);
			encoded4 = chars.indexOf(base64[i+3]);

			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}

		return arraybuffer;
	};
	function upload( resourceUrl, callback ){
	    console.log('Upload ' + resourceUrl + '...');
	    var self = this, d = new Deferred();
	    
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', resourceUrl, true);

	    // Response type arraybuffer - XMLHttpRequest 2
	    xhr.responseType = 'arraybuffer';
	    xhr.onload = function(e) {
	        if (xhr.status == 200) {
	        	console.log('uploading done');
	        	if( callback ){
	        		callback( xhr.response, d );
	        	}else{
	            	d.resolve( xhr.response );
	        	}
	        }
	    };
	    xhr.send();
	    return d;
	}
	var wm = (function(w){
		var doc = w.document,
		gcanvas = {},
		gctx = {},
		imgQueue = [],
		className = "watermark",
		arrayBuffer = false,
		watermark = false,
		images = [],
		watermarkPosition = "bottom-right",
		watermarkPath = "watermark.png?"+(+(new Date())),
		opacity = (255/(100/50)), // 50%
		initCanvas = function(){
			gcanvas = doc.createElement("canvas");
			gcanvas.style.cssText = "display:none;";
			gctx = gcanvas.getContext("2d");
			doc.body.appendChild(gcanvas);
		},
		initWatermark = function(){
			watermark = document.createElement('img');
			watermark.src = "";
			watermark.src = watermarkPath;
			var res, d = new Deferred();
			if(opacity != 255){
				if(!watermark.complete)
					watermark.onload = function(){	
						applyTransparency();
						d.resolve();
					}
				else{
					applyTransparency();
					d.resolve();
				}
			}else{
				d.resolve(new Error('opacity == 255'));
			}

			return d;
		},
		// function for applying transparency to the watermark
		applyTransparency = function(){
			var w = watermark.width || watermark.offsetWidth,
			h = watermark.height || watermark.offsetHeight;
			setCanvasSize(w, h);
			gctx.drawImage(watermark, 0, 0);
					
			var image = gctx.getImageData(0, 0, w, h);
			var imageData = image.data,
			length = imageData.length;
			for(var i=3; i < length; i+=4){  
				imageData[i] = (imageData[i]<opacity)?imageData[i]:opacity;
			}
			image.data = imageData;
			gctx.putImageData(image, 0, 0);
			watermark.onload = null;
			watermark.src = "";
			watermark.src = gcanvas.toDataURL();
			// assign img attributes to the transparent watermark
			// because browsers recalculation doesn't work as fast as needed
			watermark.width = w;
			watermark.height = h;
		},
		configure = function(config){
			if(config["arrayBuffer"])
				arrayBuffer = config["arrayBuffer"];
			if(config["images"])
				images = config["images"];
			if(config["watermark"])
				watermark = config["watermark"];
			if(config["path"])
				watermarkPath = config["path"];
			if(config["position"])
				watermarkPosition = config["position"];
			if(config["opacity"])
				opacity = (255/(100/config["opacity"]));
			if(config["className"])
				className = config["className"];
			
			initCanvas();
			return initWatermark();
		}
		setCanvasSize = function(w, h){
			gcanvas.width = w;
			gcanvas.height = h;
		},
		applyWatermark = function(img){
			gcanvas.width = img.width || img.offsetWidth;
			gcanvas.height = img.height || img.offsetHeight;
			gctx.drawImage(img, 0, 0);
			var position = watermarkPosition,
			x = 0,
			y = 0;
			if(position.indexOf("top")!=-1)
				y = 10;
			else
				y = gcanvas.height-watermark.height-10;
			
			if(position.indexOf("left")!=-1)
				x = 10;
			else
				x = gcanvas.width-watermark.width-10;


			gctx.drawImage(watermark, x, y);
			img.onload = null;
	
			img.src = gcanvas.toDataURL();
			
			if( arrayBuffer ){
				img = decode( img.src.split(',')[1] );
			}
			return img;
		};
		
		return {
			init: function(config){
				return configure(config);
			},
			print: function( image ){
				return upload( image , function( res, d ){
					var blob = new Blob([res], {type: "image/jpeg"});
					var img = document.createElement('img');
					img.src = URL.createObjectURL(blob);

					if(!img.complete){
						img.onload = function(){
							d.resolve(applyWatermark(this));
						};
					}else{
						d.resolve(applyWatermark(img));
					}
				})
			}
		};
	})(w);
	w.wmark = wm;
})(window);