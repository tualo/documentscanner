Ext.define('Tualo.Documentscanner.field.Camera', {
    extend: 'Ext.form.field.Display',
    alias: ['widget.tualo_camera'],
    requires: [
        'Ext.Glyph'
    ],
    currentStream: null,

    initComponent: function () {
        this.callParent();
        this.on('render', this.onInitComponentRendered, this);
    },
    onInitComponentRendered: function(){
       this.getStream();
       const f = async () => {
        const devices = await this.getDevices();
        devices.forEach((device) => {
            console.log( device );
            if (device.getCapabilities)
            console.log( device.getCapabilities());
        });
        
    }
    f();
    },
    startStream: async function(){
        this.getStream();
        
    }, 
    getDevices: async function() {
        return navigator.mediaDevices.enumerateDevices();
    },
    getStream: function() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
            track.stop();
          });
        }
        // const audioSource = audioSelect.value;
        const videoSource = '2cffe41e2c7c4670e490693e44be8c49c4cc840247882bbba0fc7c6d552850c0'; //null; //videoSelect.value;
        const constraints = {
          // audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
          //  video: {deviceId: videoSource ? {exact: videoSource} : undefined}
            video: { width: { exact: 3840 } }
        };
        return navigator.mediaDevices.getUserMedia(constraints).then(this.gotStream.bind(this)).catch(this.handleError.bind(this));
    },
    
    gotStream: function(stream) {
        this.currentStream = stream; // make stream available to console
        window.stream = stream;
        // audioSelect.selectedIndex = [...audioSelect.options].
        //  findIndex(option => option.text === stream.getAudioTracks()[0].label);
        //videoSelect.selectedIndex = [...videoSelect.options].findIndex(option => option.text === stream.getVideoTracks()[0].label);
        const video = this.getVideoElement();
        video.srcObject = stream;

        video.addEventListener("canplay", function (ev) {
            
            video.setAttribute("width", video.videoWidth);
            video.setAttribute("height", video.videoHeight);
            
            video.style.display = 'none';
            this.dstC1 = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
            this.vc = new cv.VideoCapture(this.getVideoElement());
            setTimeout(this.handleImage.bind(this), 1000);
    
        }.bind(this), false);

        video.play();
    },
    getVideoElement: function(){
        return this.el.dom.querySelector('video');
    },
    getCanvasElement: function(){
        return this.el.dom.querySelector('canvas');
    },
    handleError: function(error) {
        console.error('Error: ', error);
        this.testData();
    },

    equalizeHist: function (src) {
        let s = src.clone();
        let dst = new cv.Mat(s.rows,s.cols, s.type);
        cv.cvtColor(s, dst, cv.COLOR_RGBA2GRAY, 0);
        cv.equalizeHist(dst, dst);
        return dst;
    },

    _avgImages: [],
    avgImages: function(extractPaper){

        //let dst = new cv.Mat(extractPaper.rows,extractPaper.cols, extractPaper.type);

        /*
        this._avgImages.push(extractPaper.clone());
        if (this._avgImages.length>10){
           let x = this._avgImages.shift();
              x.delete();
        }
        let dst = this._avgImages[0].clone();
        let i = 0;
        this._avgImages.forEach((image_data)=>{
            if(i==0){
            }else{
                let alpha = 1.0/(i + 1)
                let beta = 1.0 - alpha
                dst.addWeighted(dst, alpha, image_data, beta, 0.0)
                i++;
            }
        });
        */
        let dst = new cv.Mat(extractPaper.rows,extractPaper.cols, cv.CV_8UC1 );
        cv.cvtColor(extractPaper, dst, cv.COLOR_RGBA2GRAY, 0);
        //cv.threshold(dst, dst, 100, 255, cv.THRESH_OTSU);
        //let dst = this.equalizeHist(extractPaper);
        /*
        */
        this.showMat(dst);
        /*Tesseract.recognize(this.getCanvasElement(), 'deu').then(({ data: { text } }) => {
            console.log(text);
        });
        */
        dst.delete();
    },

    testData: function(){
        // http://localhost/server/tualocms/page/img/muster-cnn.png
        let img = new Image();
        img.src = 'http://localhost/server/tualocms/page/img/muster-cnn.png';
        img.onload = function() {
            let canvas = this.getCanvasElement();
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            console.log('canvas',canvas);
            Tesseract.recognize(canvas, 'deu',{
                workerPath: './tesseract.js/lib/dist/worker.min.js',
                langPath: './tesseract.js/lib/tessdata/4.0.0/',
                corePath: './tesseract.js/lib/core/',
    
            }).then(({ data: { text } }) => {
                console.log(text);
            });
        }.bind(this);
    },

    handleImage: function() {
        let video = this.getVideoElement();
        const canvas = document.createElement("canvas");
        // console.log('video played',video.videoWidth, video.videoHeight);
        // video.style.display = 'none';
        
        //this.getVideoElement().width = video.videoWidth;
        //this.getVideoElement().height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let src = new cv.Mat(video.videoHeight,video.videoWidth, cv.CV_8UC4);
        this.vc.read(src);

        // M = cv2.getRotationMatrix2D((cX, cY), -90, 1.0)
        // rotated = cv2.warpAffine(image, M, (w, h))

        try{
          //this.showMat(src);
          let contours = this.findPaperContour(src);
          // console.log(contours);
          //this.drawContour({color: 'green', thickness: 20}, contours,src);

          let h = 21/2.54 *200
          let w = 29.7 /2.54 *200
          extractPaper = this.extractPaper(src, contours, w, h);

          // this.showMat(src);
          
          cv.rotate(extractPaper, extractPaper,  cv.ROTATE_90_COUNTERCLOCKWISE);
          // cv.rotate(extractPaper, extractPaper,  cv.ROTATE_90_CLOCKWISE);

          this.avgImages(extractPaper);

          src.delete();
          extractPaper.delete();
        }catch(e){
          console.log(e);
        }
        setTimeout(this.handleImage.bind(this), 10);
    },

    equalizeHist: function (src) {
        
        cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY, 0);
        cv.equalizeHist(this.dstC1, this.dstC1);
        return this.dstC1;
    },

    showMat: function(mat){
        let canvas = this.getCanvasElement();
        cv.imshow(canvas, mat);

        if (!this.tesseract_is_working){
          this.tesseract_is_working = true;
          Tesseract.recognize(canvas, 'deu',{
            workerPath: './tesseract.js/lib/dist/worker.min.js',
            langPath: './tesseract.js/lib/tessdata/4.0.0/',
            corePath: './tesseract.js/lib/core/',
  
        }).then(({ data: { text } }) => {
            console.log(text);
            this.tesseract_is_working = false;
        });
        }
    
    },

    getCornerPoints(contour) {
        let rect = cv.minAreaRect(contour);
        const center = rect.center;
  
        let topLeftCorner;
        let topLeftCornerDist = 0;
  
        let topRightCorner;
        let topRightCornerDist = 0;
  
        let bottomLeftCorner;
        let bottomLeftCornerDist = 0;
  
        let bottomRightCorner;
        let bottomRightCornerDist = 0;
  
        for (let i = 0; i < contour.data32S.length; i += 2) {
          const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };

         

          const dist =  Math.hypot(point.x - center.x, point.y - center.y);
          if (point.x < center.x && point.y < center.y) {
            // top left
            if (dist > topLeftCornerDist) {
              topLeftCorner = point;
              topLeftCornerDist = dist;
            }
          } else if (point.x > center.x && point.y < center.y) {
            // top right
            if (dist > topRightCornerDist) {
              topRightCorner = point;
              topRightCornerDist = dist;
            }
          } else if (point.x < center.x && point.y > center.y) {
            // bottom left
            if (dist > bottomLeftCornerDist) {
              bottomLeftCorner = point;
              bottomLeftCornerDist = dist;
            }
          } else if (point.x > center.x && point.y > center.y) {
            // bottom right
            if (dist > bottomRightCornerDist) {
              bottomRightCorner = point;
              bottomRightCornerDist = dist;
            }
          }
        }
  
        return {
          topLeftCorner,
          topRightCorner,
          bottomLeftCorner,
          bottomRightCorner,
        };
      },
    drawContour: function(options, contour, img){

        const canvas =this.getCanvasElement();
        const ctx = canvas.getContext("2d")

        if (contour) {
            const {
              topLeftCorner,
              topRightCorner,
              bottomLeftCorner,
              bottomRightCorner,
            } = this.getCornerPoints(contour, img);
    
            if (
              topLeftCorner &&
              topRightCorner &&
              bottomLeftCorner &&
              bottomRightCorner
            ) {
              ctx.strokeStyle = options.color;
              ctx.lineWidth = options.thickness;
              ctx.beginPath();
              ctx.moveTo(...Object.values(topLeftCorner));
              ctx.lineTo(...Object.values(topRightCorner));
              ctx.lineTo(...Object.values(bottomRightCorner));
              ctx.lineTo(...Object.values(bottomLeftCorner));
              ctx.lineTo(...Object.values(topLeftCorner));
              ctx.stroke();
            }
          }
        },


        extractPaper: function(img,maxContour, resultWidth, resultHeight, cornerPoints) {


      
            const {
              topLeftCorner,
              topRightCorner,
              bottomLeftCorner,
              bottomRightCorner,
            } = cornerPoints || this.getCornerPoints(maxContour, img);
            let warpedDst = new cv.Mat();
     
            if (
              
              topLeftCorner && 
              topRightCorner && 
              bottomLeftCorner && 
              bottomRightCorner
              
              ){
                let dsize = new cv.Size(resultWidth, resultHeight);
                let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                topLeftCorner.x,
                topLeftCorner.y,
                topRightCorner.x,
                topRightCorner.y,
                bottomLeftCorner.x,
                bottomLeftCorner.y,
                bottomRightCorner.x,
                bottomRightCorner.y,
                ]);
        
                let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0,
                0,
                resultWidth,
                0,
                0,
                resultHeight,
                resultWidth,
                resultHeight,
                ]);
        
                let M = cv.getPerspectiveTransform(srcTri, dstTri);
                cv.warpPerspective(
                img,
                warpedDst,
                M,
                dsize,
                cv.INTER_LINEAR,
                cv.BORDER_CONSTANT,
                new cv.Scalar()
                );
            }
            //cv.imshow(canvas, warpedDst);
      
            //img.delete()
            //warpedDst.delete()
            return warpedDst;
          },
    findPaperContour: function(img) {
        const imgGray = new cv.Mat();
        cv.cvtColor(img, imgGray, cv.COLOR_RGBA2GRAY);
  
        const imgBlur = new cv.Mat();
        cv.GaussianBlur(
          imgGray,
          imgBlur,
          new cv.Size(5, 5),
          0,
          0,
          cv.BORDER_DEFAULT
        );
  
        

        const imgThresh = new cv.Mat();
        cv.threshold(
          imgBlur,
          imgThresh,
          0,
          255,
          cv.THRESH_BINARY + cv.THRESH_OTSU
        );
  
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
  
        
        cv.findContours(
          imgThresh,
          contours,
          hierarchy,
          cv.RETR_CCOMP,
          cv.CHAIN_APPROX_SIMPLE
        );
        let maxArea = 0;
        let maxContourIndex = -1;
        for (let i = 0; i < contours.size(); ++i) {
          let contourArea = cv.contourArea(contours.get(i));
          if (contourArea > maxArea) {
            maxArea = contourArea;
            maxContourIndex = i;
          }
        }
        if (maxContourIndex === -1) {
            imgGray.delete();
            imgBlur.delete();
            imgThresh.delete();
            contours.delete();
            hierarchy.delete();
            return null;
        }
        const maxContour = contours.get(maxContourIndex);
  
        imgGray.delete();
        imgBlur.delete();
        imgThresh.delete();
        contours.delete();
        hierarchy.delete();
        return maxContour;
    },
    
    
    fieldLabel: null,
    fieldSubTpl: [
        '<div id="{id}" data-ref="inputEl" role="textbox" aria-readonly="true"',
        ' aria-labelledby="{cmpId}-labelEl" {inputAttrTpl}',
        ' tabindex="<tpl if="tabIdx != null">{tabIdx}<tpl else>-1</tpl>"',
        '<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
        ' class="{fieldCls} {fieldCls}-{ui}">',
            '<div style="width: 100%; height: 100%;">',
                '<video id="{id}-video"', 'width="100px" height="100px" style=" width:100px; height:100px;object-fit:contain;object-position: center center;"',  ' ></video>',
                //'<div style="position:absolute;bottom:0px;left:0px;width: 100%; height: 100%;color:white;z-index: 999"></div>',
                '<canvas id="{id}-canvas" style="position:absolute; top:0px;left:0px; border: 2px solid blue;width: 100%; height: 100%;object-fit:contain;object-position: center center;"></canvas>',

            '</div>',
        ,'</div>',
        {
            compiled: true,
            disableFormats: true
        }
    ]
});

