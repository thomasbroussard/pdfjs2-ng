/* global fabric */
(function () {
    "use strict";

    const QUERY_CANVAS = ".cropcanvas-canvas";
    const QUERY_CROPPER = ".cropcanvas-cropper";
    const QUERY_SHADOW = ".cropcanvas-shadow";
    const QUERY_VIEWER = ".cropcanvas-viewer";
    const QUERY_SAVE = ".cropcanvas-save";

    /**
     * bla bla bla
     * 
     * @example
     * 
     *  <div id="my-crop">
     *      <canvas class="cropcanvas-canvas"></canvas>
     *      <canvas class="cropcanvas-cropper"></canvas>
     *      <canvas class="cropcanvas-shadow"></canvas>
     *      <button class="cropcanvas-save" type="button">Enregistrer</button>
     *      <img src="" class="cropcanvas-viewer">
     *  </div>
     *  <script>
     *      let myCrop = new CropCanvas(document.getElementById("my-crop"));
     *      myCrop.render();
     *  </script>
     * 
     * @param {HTMLElement} [element] Élément HTML dans lequel travailler. Il doit contenir
     * un canvas portant la classe "cropcanvas-canvas" où le document est affiché, un canvas
     * portant la classe "cropcanvas-cropper" qui servira à déssiner la zone de retaillage,
     * un canvas .
     * @param {Object} [options] Configuration
     * @param {String} [options.service] Url du service vers lequel envoyer l'image. Si elle
     * n'est pas définie, l'image sera simplement affichée.
     */
    const CropCanvas = function (element, options) {

        this.element = element || document.body;

        /**
         * Canvas sur lequel travailler
         * @private
         * @type {HTMLCanvasElement}
         */
        this.canvas = element.querySelector(QUERY_CANVAS);

        /**
         * Élément image pour visualiser la zone extraite du canvas source
         * @private
         * @type {HTMLImageElement}
         */
        this.viewer = element.querySelector(QUERY_VIEWER);

        this.saveButton = element.querySelector(QUERY_SAVE);

        this.options = options || {};
        
        /**
         * Canvas fabriqué par fabricjs et placé au-dessus du canvas source.
         * Permet de dessiner la zone de retaillage.
         * @private
         * @type {fabric.Canvas}
         */
        this.cropCanvas = new fabric.Canvas(this.element.querySelector(QUERY_CROPPER));

        /**
         * @type {fabric.Canvas}
         */
        this.shadowCanvas = new fabric.Canvas(this.element.querySelector(QUERY_SHADOW));

        /**
         * @type {fabric.Image}
         */
        this.shadowImage = null;

        /**
         * Objet permettant de délimiter la zone de retaillage.
         * @private
         * @type {fabric.Rect}
         */
        this.cropZone = null;

        /**
         * Flag indiquant si l'objet a été initialisé
         * @private
         * @type {Boolean}
         */
        this.initialized = false;

        /**
         * Url de l'image générée à partir de l'extrait de canvas
         * @private
         * @type {String}
         */
        this.url = "";

        /**
         * Écouteur d'évémenent success lorsque l'on envoit les données de l'image au serveur.
         * @type {Function}
         */
        this.postSuccessListener = this.onSuccess.bind(this);

        /**
         * Écouteur d'évémenent error lorsque l'on envoit les données de l'image au serveur.
         * @type {Function}
         */
        this.postErrorListener = this.onError.bind(this);

        this.imageBuiltListener = this.onImageBuilt.bind(this);
    };
    
    CropCanvas.prototype = {

        constructor: CropCanvas,

        render: function () {
            if (!this.initialized) {
                this.init();
            }
            fabric.Image.fromURL(this.canvas.toDataURL(), this.imageBuiltListener);
        },

        /**
         * @private
         */
        init: function () {
            this.initialized = true;
            this.cropCanvas.setWidth(this.canvas.width);
            this.cropCanvas.setHeight(this.canvas.height);
            let delta = 50;
            this.cropZone = new fabric.Rect({
                left: delta,
                top: delta,
                originX: "left",
                originY: "top",
                width: this.cropCanvas.getWidth() - 2 * delta,
                height: this.cropCanvas.getHeight() - 2 * delta,
                angle: 0,
                fill: "rgba(0,0,0,0.1)",
                transparentCorners: false,
                hasControls: true,
                hasBorders: true,
                hasRotatingPoint: false,
                lockRotation: true,
                selectable: true,
                evented: true
            });
            this.cropCanvas.add(this.cropZone).setActiveObject(this.cropZone);
            this.cropCanvas.on("object:moving", this.onObjectMoving.bind(this));
            if (this.saveButton) {
                this.saveButton.addEventListener("click", this.onSaveClick.bind(this), false);
            }
        },

        /**
         * Appliquer le retaillage en générant une image (url:data) corrspondant.
         */
        crop: function () {
            if (this.cropZone) {
                this.url = this.shadowCanvas.toDataURL({
                    top: this.cropZone.getTop(),
                    left: this.cropZone.getLeft(),
                    width: this.cropZone.getWidth(),
                    height: this.cropZone.getHeight()
                });
            } else {
                console.log("CropCanvas.crop() : no cropZone"); // eslint-disable-line
            }
        },

        /**
         * Afficher la zone découpée.
         * 
         * @param {String} url Url de l'image à afficher
         */
        show: function (url) {
            this.viewer.src = url;
        },

        /**
         * Envoyer au serveur l'url (data url) de l'image générée à partir de la zone découpée.
         * 
         * @param {String} data Données à envoyer
         */
        send: function (data) {
            console.log('test')
            let xhr = new XMLHttpRequest();
            xhr.open("POST", this.options.service, true);
            xhr.responseType = "text";
            xhr.addEventListener("load", this.postSuccessListener, false);
            xhr.addEventListener("abort", this.postErrorListener, false);
            xhr.addEventListener("error", this.postErrorListener, false);
            xhr.send(data);
        },

        /**
         * @private
         * @param {fabric.Image} img Image sur laquelle le retaillage sera appliquée. Elle
         * doit être le rendu du canvas de travail.
         */
        onImageBuilt: function (img) {
            if (this.shadowImage !== null) {
                this.shadowCanvas.remove(this.shadowImage);
            }
            this.shadowCanvas.add(img);
            this.shadowCanvas.setWidth(img.getWidth());
            this.shadowCanvas.setHeight(img.getHeight());
            this.shadowCanvas.centerObject(img);
            this.shadowImage = img;
        },

        /**
         * Écoute de mouvement de la zone de crop pour lui interdir de sortir de la zone du
         * canvas.
         * 
         * @param {Event} e Event emit by fabricjs
         */
        onObjectMoving: function (e) {
            if (e.target === this.cropZone) {
                let x = this.cropZone.getLeft(), 
                    y = this.cropZone.getTop(),
                    w = this.cropZone.getWidth(), 
                    h = this.cropZone.getHeight(),
                    maxX = this.cropCanvas.getWidth() - w,
                    maxY = this.cropCanvas.getHeight() - h;
                if (x < 0) {
                    this.cropZone.set("left", 0);
                }
                if (y < 0) {
                    this.cropZone.set("top", 0);
                }
                if (x > maxX) {
                    this.cropZone.set("left", maxX);
                }
                if (y > maxY) {
                    this.cropZone.set("top", maxY);
                }
            }
        },

        onSaveClick: function () {
          console.log(this.options.service);
            this.crop();
            if (this.options.service) {
              this.send(this.url);
            } else {
              this.show(this.url);
            }


        },

        onSuccess: function (e) {
            let loc = e.target.getResponseHeader("Location");
            if (loc) {
                this.show(loc);
            } else {
                // TODO
            }
        },

        onError: function (e) {
            console.warn("Erreur en récupérant l'image"); // eslint-disable-line
            console.log(e); // eslint-disable-line
        }
    };

    // export
    window.CropCanvas = CropCanvas;
}());
