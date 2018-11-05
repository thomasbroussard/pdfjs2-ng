/* global pdfjsLib */
(function () {
    "use strict";

    pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js";

    const QUERY_CANVAS = ".pdfviewer-canvas";
    const QUERY_BTN_PREV = ".pdfviewer-prev";
    const QUERY_BTN_NEXT = ".pdfviewer-next";

    /**
     * Outil de visualisation de pdf à l'aide de Pdf.js
     * 
     * @example
     * 
     *  <div id="my-viewer">
     *      <canvas class="pdfviewer-canvas"></canvas>
     *  </div>
     *  <script>
     *      let myViewer = new CropCanvas(document.getElementById("my-viewer"));
     *      myViewer.load("/path/to/my/pdf/");
     *  </script>
     * 
     * @param {HTMLElement} [element] Élément définissant la visionneuse. Cet élément doit
     * contenir un canvas portant la classe "pdfviewer-canvas" et qui servira à visualiser
     * le document et éventuellement des boutons portant les classes "pdfviewer-prev" et
     * "pdfviewer-next" pour naviguer entre les pages du document. Si l'élément n'est pas 
     * fournit, le body de la page est considéré comme l'élément définissant la visionneuse.
     */
    const PdfViewer = function (element) {

        /**
         * @private
         * @type {HTMLElement}
         */
        this.element = element || document.body;

        /**
         * @private
         * @type {HTMLCanvasElement}
         */
        this.canvas = this.element.querySelector(QUERY_CANVAS);

        /**
         * Si la taille du canvas a été adapté au pdf.
         * 
         * @private
         * @type {Boolean}
         */
        this.sizeInitialized = false;

        /**
         * Écouteur de chargement de page
         * 
         * @private
         * @type {Function}
         */
        this.pageCallback = this.onPage.bind(this);

        /**
         * Écouteur de rendu de page
         * 
         * @private
         * @type {Function}
         */
        this.renderCallback = this.onRender.bind(this);

        /**
         * Numéro de la page affichée
         * 
         * @private
         * @type {Number}
         */
        this.pageNum = 0;

        /**
         * Nombre de pages dans le pdf
         * 
         * @private
         * @type {Number}
         */
        this.pagesCount = 0;

        /**
         * Flag indiquant si un processus de rendu est en cours (chargement du document ou
         * rendu d'une page).
         * 
         * @private
         * @type {Boolean}
         */
        this.rendering = false;

        /**
         * Numéro de page qui doit être rendu quand le processus en cours sera terminé
         * 
         * @private
         * @type {Number}
         */
        this.pageNumPending = null;

        let prev = this.element.querySelector(QUERY_BTN_PREV);
        if (prev) {
            prev.addEventListener("click", this.prev.bind(this), false);
        }

        let next = this.element.querySelector(QUERY_BTN_NEXT);
        if (next) {
            next.addEventListener("click", this.next.bind(this), false);
        }
    };

    /**
     * Type d'événement émis lorsqu'une page de pdf est rendu.
     * L'éveneùent est émis sur l'élément HTML qui constitue la visionneuse 
     * (voir le constructueur).
     * 
     * @type {String}
     */
    PdfViewer.EVENT_PAGE = "pdfviewer-page";

    PdfViewer.prototype = {
        constructor: PdfViewer,
        /**
         * Charger un pdf. La première page du pdf sera rendu par défaut et un événement
         * PdfViewer.EVENT_PAGE sera alors émis sur l'élément HTML de la visionneuse.
         * 
         * @param {String} url Url du pdf
         */
        load: function (url) {
            this.pageNum = 0;
            this.pagesCount = 0;
            this.rendering = true;
            this.pageNumPending = null;
            this.url = url;
            pdfjsLib.getDocument(this.url).then(this.onLoad.bind(this));
        },

        /**
         * Afficher une page spécifique
         * @param {Number} num Page à afficher
         */
        show: function (num) {
            this.queue(num);
        },

        /**
         * Afficher la page précédente
         */
        prev: function () {
            this.queue(this.pageNum - 1);
        },

        /**
         * Afficher la page suivante
         */
        next: function () {
            this.queue(this.pageNum + 1);
        },

        /**
         * Rendre une page du pdf. Un événement PdfViewer.EVENT_PAGE sera émis en fin de rendu.
         * Si le numéro de page demandé est incorrect, rine ne se passera.
         * 
         * @private
         * @param {Number} num Numéro de la page à rendre
         */
        renderPage: function (num) {
            if (num !== this.pageNum && num > 0 && num <= this.pagesCount) {
                this.rendering = true;
                this.pageNum = num;
                this.pdf.getPage(num).then(this.pageCallback);
            }
        },

        /**
         * Mettre en queue les demandes d'affichage de page
         * 
         * @private
         * @param {Number} num Numéro de la page
         */
        queue: function (num) {
            if (this.rendering) {
                this.pageNumPending = num;
            } else {
                this.renderPage(num);
            }
        },

        /**
         * Méthode appelée lors du chargement du document pdf.
         * 
         * @protected
         * @param {PDFDocumentProxy} pdf Document pdf chargé
         */
        onLoad: function (pdf) {
            this.pdf = pdf;
            this.pagesCount = this.pdf.numPages;
            this.renderPage(this.pageNumPending || 1);
        },

        /**
         * Méthode appelée lorsque'une page du pdf est chargée
         * 
         * @protected
         * @param {PDFPageProxy} page Page du pdf.
         */
        onPage: function (page) {
            let viewport = page.getViewport(1);
            if (!this.sizeInitialized) {
                // On part du principe que toutes les pages du document on la même taille.
                // A faire évoluer si nécessaire
                this.canvas.height = viewport.height;
                this.canvas.width = viewport.width;
                this.element.style.width = viewport.width + "px";
                this.sizeInitialized = true;
            }
            // Render PDF page into canvas context
            page.render({
                canvasContext: this.canvas.getContext("2d"),
                viewport: viewport
            }).promise.then(this.renderCallback);
        },

        /**
         * Écouteur appelé lors du rendu d'une page. Il émet l'événement PdfViewer.EVENT_PAGE
         * sur l'élément HTML constituant la visionneuse.
         * 
         * @protected
         */
        onRender: function () {
            this.rendering = false;
            if (this.pageNumPending !== null) {
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            } else {
                this.element.dispatchEvent(new Event(PdfViewer.EVENT_PAGE, {detail: this}));
            }
        }
    };

    // export
    window.PdfViewer = PdfViewer;
}());
