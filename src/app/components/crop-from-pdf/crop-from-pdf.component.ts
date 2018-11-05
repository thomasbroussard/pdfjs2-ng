import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-crop-from-pdf',
  templateUrl: './crop-from-pdf.component.html',
  styleUrls: ['./crop-from-pdf.component.css']
})
export class CropFromPdfComponent implements OnInit {

  url: string;

  constructor() { }

  ngOnInit() {

    // TODO: Les deux urls doivent êtres variablilisées d'une manière ou d'une autre.
    // const pdfUrl = "http://localhost:8080/documents/helloworld.pdf";
    const pdfUrl = 'http://localhost:8080/documents/pdf-sample.pdf';
    const imageServiceUrl = 'http://localhost:8080/images/';

    // Élément HTML portant l'application
    const appElement = document.getElementById('app');
    // Instance pdfviewer
    const pdfViewer = new PdfViewer(appElement);
    // Instance cropCanvas
    const cropCanvas = new CropCanvas(appElement, {
       service: imageServiceUrl
    });
    // Écoute d'événement PdfViewer.EVENT_PAGE émit par l'objet
    // pdfviewer quand une page du document pdf est rendu
    // => Mettre à jour l'objet de gestion du retaillage.
    appElement.addEventListener(PdfViewer.EVENT_PAGE, function () {
      cropCanvas.render();
    });

    // Charger le pdf voulu (affichage de la première page par défaut)
    pdfViewer.load(pdfUrl);

  }

}
