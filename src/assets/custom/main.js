/* global PdfViewer, CropCanvas */
(function () {
    "use strict";

    // TODO: Les deux urls doivent êtres variablilisées d'une manière ou d'une autre.
    // const pdfUrl = "http://localhost:8080/documents/helloworld.pdf";
    const pdfUrl = "data/multipages.pdf";
    const imageServiceUrl = "http://localhost:8080/images/";

    // Élément HTML portant l'application
    const appElement = document.getElementById("app");
    // Instance pdfviewer
    const pdfViewer = new PdfViewer(appElement);
    // Instance cropCanvas
    const cropCanvas = new CropCanvas(appElement, {
        // imageService: imageServiceUrl
    });
    // Écoute d'événement PdfViewer.EVENT_PAGE émit par l'objet
    // pdfviewer quand une page du document pdf est rendu
    // => Mettre à jour l'objet de gestion du retaillage.
    appElement.addEventListener(PdfViewer.EVENT_PAGE, function () {
        cropCanvas.render();
    });

    // Charger le pdf voulu (affichage de la première page par défaut)
    pdfViewer.load(pdfUrl);
}());
