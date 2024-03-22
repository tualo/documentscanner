Ext.define('Tualo.Documentscanner.field.Input', {
    extend: 'Ext.panel.Panel',
    requires: [
        'Tualo.Documentscanner.field.Canvas',
        'Tualo.Documentscanner.field.Video'
    ],
    alias: 'widget.tualo_documentscanner',
    /*
    renderTpl: [
        '<canvas id="result"></canvas>',
        '<video id="video"></video>',
        '<canvas id="canvas"></canvas>',
    ],
    */
    border: true,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [
        /*
        {
            xtype: 'panel',
            height: 100,
            border: true,
            html: 'test'
        },
        */
       

        {
            xtype: 'tualo_canvas',
            
            height: 100,
            itemId: 'canvas'
        },

        {
            xtype: 'tualo_video',
            height: 100,
            itemId: 'video'
        },
        {
            border: true,
            flex: 1,
            xtype: 'tualo_canvas',
            itemId: 'result'
        },
       
    ],
    initComponent: function () {
        this.callParent();

        
        this.on('render', function () {
            this.getDevices();
            this.initVideo();

        });
        
       //this.testScaling();
    },
    testScaling: function (src) {
        let me = this;
        this.on('render', function () {

            console.log('testScaling', me.getComponent('result') );
            console.log('testScaling', me.getComponent('result').id);
            console.log('testScaling', document.getElementById(me.getComponent('result').id));
            var canvas=  document.getElementById(me.getComponent('result').id) ;
            canvas.width = 1000; 
            canvas.height = 1000;
            console.log('testScaling', canvas.width, canvas.height);
            var ctx=canvas.getContext("2d");
            ctx.lineWidth=2;
            ctx.beginPath();
            ctx.moveTo(100,100);
            ctx.lineTo(300,300);
            ctx.moveTo(500,500);
            ctx.lineTo(700,700);
            ctx.stroke();

        });
    },
    getDevices: async function () {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices);
        this.fireEvent('devices', devices);
    },

    streaming: false,
    _video_height: 0,
    _video_width: 0,
    stream: null,
    src: null,
    dstC1: null,
    dstC3: null,
    dstC4: null,
    stream: null,
    vc: null,
    controls: {
        //filter: 'dft',
        //filter: 'equalizeHist',
        filter: 'highlightPaper',
        cannyThreshold1: 100,
        cannyThreshold2: 200,
        cannyApertureSize: 3,
        cannyL2Gradient: false,
        laplacianSize: 3,
        sobelSize: 3,
        gaussianBlurSize: 5,
        //dilationBorderType: cv.MORPH_ELLIPSE,
        dilationSize: 13,
        erosionSize: 13,
        //erosionBorderType: cv.MORPH_ELLIPSE
    },
    resolution: { width: { exact: 640 }, height: { exact: 480 } },


    startCamera: function () {
        if (this.streaming) return;
        const me = this,
        video = document.getElementById(me.getComponent('video').id),
        canvas = document.getElementById(me.getComponent('video').id),
        tualo_canvas = document.getElementById(me.getComponent('canvas').id);
        tualo_result = document.getElementById(me.getComponent('result').id);


        tualo_canvas.width = 3840; 
        tualo_canvas.height = 2160;

        tualo_result.width = 3840; 
        tualo_result.height = 2160;

        canvas.width = 3840; 
        canvas.height = 2160;

        me.scanner = new jscanify();

        window.x = this; //3840 × 2160 
        navigator.mediaDevices.getUserMedia({ video: { width: { exact: 3840 } } , audio: false })
            .then((s) => {
                this.stream = s;
                video.srcObject = s;
                video.play();
            }).catch(function (err) {
                console.log("An error occured! " + err);
            });

        video.addEventListener("canplay", function (ev) {
            if (!this.streaming) {
                console.log('video started',video.videoWidth, video.videoHeight);
                video.setAttribute("width", this._video_width);
                video.setAttribute("height", this._video_height);
                this.streaming = true;

                /*
                
                console.log('video started', this.vc);
                */
                this._video_height = video.videoHeight;
                this._video_width = video.videoWidth;
                console.log('video started',video.videoWidth, video.videoHeight);
                
                this.vc = new cv.VideoCapture(video);
            }
            this.process();
            //this.startVideoProcessing();
        }.bind(this), false);
    },

    process: function () {
        requestAnimationFrame(this.highlightPaperX.bind(this));
    },

    findPaperContour(img) {
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
  
        const maxContour = contours.get(maxContourIndex);
  
        imgGray.delete();
        imgBlur.delete();
        imgThresh.delete();
        contours.delete();
        hierarchy.delete();
        return maxContour;
    },

    highlightPaperX: function ( ) {
        let me = this;
        
        let video = document.getElementById(me.getComponent('video').id);
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        console.log('video played',video.videoWidth, video.videoHeight);
        let src = new cv.Mat(video.videoHeight,video.videoWidth, cv.CV_8UC4);
        this.vc.read(src);
        let contours = me.findPaperContour(src);
        console.log(contours);
        src.delete();

       // this.process();

        if(true){
            let video = document.getElementById(me.getComponent('video').id);
            let canvas = document.getElementById(me.getComponent('canvas').id);
            let ctx = canvas.getContext("2d",{willReadFrequently:true});
            ctx.drawImage(video, 0, 0); //, this.width, this.height);


            //let result = document.getElementById(me.getComponent('result').id);
            let h = 21/2.54 *200
            let w = 29.7 /2.54 *200

            let res = me.scanner.extractPaper(canvas, w, h);
            //let ctx_result = result.getContext("2d",{willReadFrequently:true});
            //ctx_result.drawImage(res, 0, 0); //, this.width, this.height);

        //console.log('result', result.width,result.height,w,h);
            this.process();
        }
        /*
        let me = this;
        let canvas = document.getElementById(me.getComponent('canvas').id);
        
        cv.imshow(me.getComponent('canvas').id, src);

        let h = 21/2.54 *200
        let w = 29.7 /2.54 *200

        let res = me.scanner.extractPaper(canvas, w, h);
        //const resultCanvas2 = scanner.extractPaper(canvas, w, h);
//        const resultCanvas = scanner.highlightPaper(canvas);
        //let res =  cv.imread(resultCanvas2);

        //let res =  cv.imread(resultCanvas);
        //src.delete();
        return cv.imread(res);
        */
    },


    startVideoProcessing: function () {
        if (!this.streaming) { console.warn("Please startup your webcam"); return; }
        this.stopVideoProcessing();
        this.src = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC4);
        this.dstC1 = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC1);
        this.dstC3 = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC3);
        this.dstC4 = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC4);
        requestAnimationFrame(this.processVideo.bind(this));
    },

    processVideo: function () {
        //stats.begin();
        if (!this.streaming) { console.warn("Please startup your webcam"); return; }
        let controls = this.controls,
            src = this.src;
        this.vc.read(this.src);
        let result;
        switch (controls.filter) {
            case 'passThrough': result = this.passThrough(src); break;
            case 'gray': result = this.gray(src); break;
            case 'hsv': result = this.hsv(src); break;
            case 'canny': result = this.canny(src); break;
            case 'inRange': result = this.inRange(src); break;
            case 'threshold': result = this.threshold(src); break;
            case 'adaptiveThreshold': result = this.adaptiveThreshold(src); break;
            case 'gaussianBlur': result = this.gaussianBlur(src); break;
            case 'bilateralFilter': result = this.bilateralFilter(src); break;
            case 'medianBlur': result = this.medianBlur(src); break;
            case 'sobel': result = this.sobel(src); break;
            case 'scharr': result = this.scharr(src); break;
            case 'laplacian': result = this.laplacian(src); break;
            case 'contours': result = this.contours(src); break;
            case 'calcHist': result = this.calcHist(src); break;
            case 'equalizeHist': result = this.equalizeHist(src); break;
            case 'backprojection': result = this.backprojection(src); break;
            case 'erosion': result = this.erosion(src); break;
            case 'dilation': result = this.dilation(src); break;
            case 'morphology': result = this.morphology(src); break;
            case 'dft': result = this.dft(src); break;
            case 'highlightPaper': result = this.highlightPaper(src); break;
            default: result = this.passThrough(src);
        }


        
        cv.imshow(this.getComponent('result').id, result);
        lastFilter = controls.filter;
        requestAnimationFrame(this.processVideo.bind(this));
        //stats.end();
    },

    highlightPaper: function (src) {
        let me = this;
        let canvas = document.getElementById(me.getComponent('canvas').id);
        
        cv.imshow(me.getComponent('canvas').id, src);

        let h = 21/2.54 *200
        let w = 29.7 /2.54 *200

        let res = me.scanner.extractPaper(canvas, w, h);
        //const resultCanvas2 = scanner.extractPaper(canvas, w, h);
//        const resultCanvas = scanner.highlightPaper(canvas);
        //let res =  cv.imread(resultCanvas2);

        //let res =  cv.imread(resultCanvas);
        //src.delete();
        return cv.imread(res);
        
    },
    equalizeHist: function (src) {
        cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY, 0);
        cv.equalizeHist(this.dstC1, this.dstC1);
        return this.dstC1;
    },

    gaussianBlur: function (src) {
        this.getSharpness(src);
        cv.GaussianBlur(src, this.dstC4, { width: this.controls.gaussianBlurSize, height: this.controls.gaussianBlurSize }, 0, 0, cv.BORDER_DEFAULT);
        return this.dstC4;
    },

    dft: function (input) {
        let src = input.clone();
        

        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

        // get optimal size of DFT
        let optimalRows = cv.getOptimalDFTSize(src.rows);
        let optimalCols = cv.getOptimalDFTSize(src.cols);
        let s0 = cv.Scalar.all(0);
        let padded = new cv.Mat();
        cv.copyMakeBorder(src, padded, 0, optimalRows - src.rows, 0,
            optimalCols - src.cols, cv.BORDER_CONSTANT, s0);

        // use cv.MatVector to distribute space for real part and imaginary part
        let plane0 = new cv.Mat();
        padded.convertTo(plane0, cv.CV_32F);
        let planes = new cv.MatVector();
        let complexI = new cv.Mat();
        let plane1 = new cv.Mat.zeros(padded.rows, padded.cols, cv.CV_32F);
        planes.push_back(plane0);
        planes.push_back(plane1);
        cv.merge(planes, complexI);

        // in-place dft transform
        cv.dft(complexI, complexI);

        // compute log(1 + sqrt(Re(DFT(img))**2 + Im(DFT(img))**2))
        cv.split(complexI, planes);
        cv.magnitude(planes.get(0), planes.get(1), planes.get(0));
        let mag = planes.get(0);
        let m1 = new cv.Mat.ones(mag.rows, mag.cols, mag.type());
        cv.add(mag, m1, mag);
        cv.log(mag, mag);

        // crop the spectrum, if it has an odd number of rows or columns
        let rect = new cv.Rect(0, 0, mag.cols & -2, mag.rows & -2);
        mag = mag.roi(rect);

        // rearrange the quadrants of Fourier image
        // so that the origin is at the image center
        let cx = mag.cols / 2;
        let cy = mag.rows / 2;
        let tmp = new cv.Mat();

        let rect0 = new cv.Rect(0, 0, cx, cy);
        let rect1 = new cv.Rect(cx, 0, cx, cy);
        let rect2 = new cv.Rect(0, cy, cx, cy);
        let rect3 = new cv.Rect(cx, cy, cx, cy);

        let q0 = mag.roi(rect0);
        let q1 = mag.roi(rect1);
        let q2 = mag.roi(rect2);
        let q3 = mag.roi(rect3);

        // exchange 1 and 4 quadrants
        q0.copyTo(tmp);
        q3.copyTo(q0);
        tmp.copyTo(q3);

        // exchange 2 and 3 quadrants
        q1.copyTo(tmp);
        q2.copyTo(q1);
        tmp.copyTo(q2);

        // The pixel value of cv.CV_32S type image ranges from 0 to 1.
        cv.normalize(mag, mag, 0, 1, cv.NORM_MINMAX);

        //cv.imshow('canvasOutput', mag);
        src.delete();
        padded.delete();
        planes.delete();
        complexI.delete();
        plane1.delete();
        m1.delete();
        tmp.delete();
        plane0.delete();

        //, {width: this.controls.gaussianBlurSize, height: this.controls.gaussianBlurSize}, 0, 0, cv.BORDER_DEFAULT);
        return mag;
    },

    scharr: function (src) {
        var mat = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC1);
        cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
        cv.Scharr(mat, this.dstC1, cv.CV_8U, 1, 0, 1, 0, cv.BORDER_DEFAULT);
        mat.delete();
        return this.dstC1;
    },

    sobel: function (src) {
        var mat = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC1);
        cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
        cv.Sobel(mat, this.dstC1, cv.CV_8U, 1, 0, this.controls.sobelSize, 1, 0, cv.BORDER_DEFAULT);
        mat.delete();
        return this.dstC1;
    },


    dilation: function (src) {
        let kernelSize = this.controls.dilationSize;
        let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
        let color = new cv.Scalar();
        cv.dilate(src, this.dstC4, kernel, { x: -1, y: -1 }, 1, Number(this.controls.dilationBorderType), color);
        kernel.delete();
        return this.dstC4;
    },

    passThrough: function (src) {
        return src;
    },

    stopVideoProcessing: function () {
        if (this.src != null && !this.src.isDeleted()) this.src.delete();
        if (this.dstC1 != null && !this.dstC1.isDeleted()) this.dstC1.delete();
        if (this.dstC3 != null && !this.dstC3.isDeleted()) this.dstC3.delete();
        if (this.dstC4 != null && !this.dstC4.isDeleted()) this.dstC4.delete();
    },

    gray: function (src) {
        cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
        return this.dstC1;
    },

    hsv: function (src) {
        cv.cvtColor(src, this.dstC3, cv.COLOR_RGBA2RGB);
        cv.cvtColor(this.dstC3, this.dstC3, cv.COLOR_RGB2HSV);
        return this.dstC3;
    },

    canny: function (src) {
        cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
        cv.Canny(this.dstC1, this.dstC1, this.controls.cannyThreshold1,
            this.controls.cannyThreshold2, this.controls.cannyApertureSize,
            this.controls.cannyL2Gradient);
        return this.dstC1;
    },

    erosion: function (src) {
        let kernelSize = this.controls.erosionSize;
        let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
        let color = new cv.Scalar();
        cv.erode(src, this.dstC4, kernel, { x: -1, y: -1 }, 1, Number(this.controls.erosionBorderType), color);
        kernel.delete();
        return this.dstC4;
    },

    stopCamera: function () {
        const me = this,
            video = document.getElementById(me.getComponent('video').id);

        if (!this.streaming) return;
        this.stopVideoProcessing();
        this.streaming = false;

        video.pause();
        video.srcObject = null;
        this.stream.getTracks().forEach(function (track) {
            track.stop();
        });
        document.getElementById(this.getComponent('result').id).getContext("2d",{willReadFrequently:true}).clearRect(0, 0, this._video_width, this._video_height);

        //this.stream.getVideoTracks()[0].stop();
    },

    laplacian: function (src) {
        var mat = new cv.Mat(this._video_height, this._video_width, cv.CV_8UC1);
        cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY);
        cv.Laplacian(mat, this.dstC1, cv.CV_8U, this.controls.laplacianSize, 1, 0, cv.BORDER_DEFAULT);
        mat.delete();
        return this.dstC1;
    },

    getSharpness: function (img) {
        let src = img,
            src_gray = new cv.Mat(),
            dst = new cv.Mat();

        //console.log('getSharpness', img);
        cv.GaussianBlur(this.src, this.dstC4, { width: this.controls.gaussianBlurSize, height: this.controls.gaussianBlurSize }, 0, 0, cv.BORDER_DEFAULT);
        cv.cvtColor(this.dstC4, src_gray, cv.COLOR_RGB2GRAY);

        // cv.GaussianBlur( img, src, {width: this.controls.gaussianBlurSize, height: this.controls.gaussianBlurSize}, 0, 0, cv.BORDER_DEFAULT );
        // Convert the image to grayscale


        cv.Laplacian(src_gray, dst, cv.CV_64F);

        let mu = new cv.Scalar(),
            sigma = new cv.Scalar();

        let myMean = new cv.Mat(1, 4, cv.CV_64F);
        let myStddev = new cv.Mat(1, 4, cv.CV_64F);
        cv.meanStdDev(dst, myMean, myStddev);
        console.log('focusMeasure', myStddev);
        let focusMeasure = myStddev.doubleAt(0, 0) * myStddev.doubleAt(0, 0);
        // myStddev.data[0] * myStddev.data[0];
        console.log('focusMeasure', focusMeasure);
        /*
        return focusMeasure;
        */
        /*
        cv.meanStdDev(dst, mu, sigma);
        */
    },

    initVideo: function () {
        window.m = this;
        this.startCamera();
        return;
        const me = this,
            video = document.getElementById(me.getComponent('video').id),
            canvas = document.getElementById(me.getComponent('canvas').id),
            result = document.getElementById(me.getComponent('result').id),

            canvasCtx = canvas.getContext("2d"),
            resultCtx = result.getContext("2d");
        const scanner = new jscanify();
        /*
        const video = document.getElementById("video");
        window.video = video;
        const canvas = document.getElementById("canvas");
        const result = document.getElementById("result");

        const canvasCtx = canvas.getContext("2d");
        const resultCtx = result.getContext("2d");
        */
        console.log('initVideo', video);
        console.log('initVideo', canvas);
        console.log('initVideo', result);

        navigator.mediaDevices.getUserMedia({ video: {
            width: { exact: 2048+1024 },
            deviceId: '895df1044a4bddfa9aab1bafa351b8864cb2b99221bf0613f34aa2363af126a5'
        }}).then((stream) => {
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                console.log('video loaded');
                video.play();


                setInterval(() => {
                    canvasCtx.drawImage(video, 0, 0);
                    const resultCanvas = scanner.highlightPaper(canvas);
                    resultCtx.drawImage(resultCanvas, 0, 0);
                    console.log(resultCanvas);
                }, 100);

                setTimeout(() => {
                    //scanner.capturePaper(canvas).then((image) => {
                    //    console.log(image);
                    //});
                }, 3000);

                setTimeout(() => {
                    video.pause();
                    console.log(this.getSharpness(result));
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    console.log('video stopped');
                }, 60000);
            };
        });
    }
});
